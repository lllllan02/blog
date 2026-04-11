---
title: 查找过程（mapaccess）
aliases: 3dccc618-e0d3-4e42-b407-13c207c3dcab
date: 2026-04-11 14:58:49
card: false
order: 4
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

在 Go 语言中，

- 当我们使用 `v := m[k]` 语法从 map 中读取数据时，编译器在底层会将其转换为对 `runtime.mapaccess1` 函数的调用。

- 如果是 `v, ok := m[k]` 的形式，则会调用 `runtime.mapaccess2`。

两者的核心查找逻辑完全一致，只是返回值不同。

本文将结合 Go 1.21 源码，详细解读 `mapaccess1` 的执行流程，重点解答哈希值是如何被拆分使用的，以及在 map 扩容期间查找逻辑会有哪些特殊处理。

## 哈希值的拆分与使用

在 map 的查找过程中，首先会对传入的 key 计算出一个哈希值（hash value）。这个哈希值在后续的查找中被巧妙地拆分为两部分使用：**低位**和**高位**。

### 1. 低位：定位 Bucket

哈希值的**低位**（Low bits）用于计算当前 key 应该落在哪个 bucket（桶）中。

在 `hmap` 结构体中，有一个字段 `B`，它表示当前 map 拥有 $2^B$ 个 bucket。为了确定 key 所属的 bucket 索引，Go 会取哈希值的低 `B` 位。这通常通过位掩码（bitmask）操作来实现：

```go
// 计算 bucket 掩码，例如 B=5 时，掩码为 11111 (二进制)
m := bucketMask(h.B)
// 取哈希值的低 B 位，定位到具体的 bucket
b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.bucketsize)))
```

通过这种方式，可以快速将 key 映射到对应的 bucket 内存地址上。

### 2. 高位：tophash 快速比较

定位到 bucket 后，我们需要在 bucket 内部寻找具体的 key。一个 bucket 最多可以存放 8 个键值对。为了加速比较过程，Go 并没有直接去比较 key 的完整内容（因为 key 的比较可能非常耗时，比如字符串或结构体），而是引入了 `tophash` 的概念。

哈希值的**高 8 位**（High 8 bits）被提取出来，作为该 key 的 `tophash`：

```go
// 取哈希值的高 8 位
top := tophash(hash)
```

在 bucket 的结构（`bmap`）中，包含一个长度为 8 的 `tophash` 数组，记录了该 bucket 中每个槽位存储的 key 的高 8 位哈希值。

## 遍历 bucket 及其关联的溢出桶

查找时，Go 会通过一个双层循环来遍历 bucket 及其关联的溢出桶（overflow bucket），并在每个 bucket 内部遍历 8 个槽位：

```go
bucketloop:
for ; b != nil; b = b.overflow(t) {
    // 遍历当前 bucket 的 8 个槽位 (bucketCnt = 8)
    for i := uintptr(0); i < bucketCnt; i++ {
        // 1. 快速过滤：比较 tophash
        if b.tophash[i] != top {
            // 优化：如果遇到 emptyRest，说明当前及后续槽位全为空，直接结束整个查找
            if b.tophash[i] == emptyRest {
                break bucketloop
            }
            continue
        }
        
        // 2. 完整比较：tophash 匹配，取出完整 key 进行比较
        // 通过指针运算计算出 key 的实际内存地址
        k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
        if t.indirectkey() {
            k = *((*unsafe.Pointer)(k)) // 如果 key 是指针类型，需要解引用
        }
        
        // 调用类型特定的比较函数进行精确比较
        if t.key.equal(key, k) {
            // 匹配成功，计算 value 的地址并返回
            e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))
            if t.indirectelem() {
                e = *((*unsafe.Pointer)(e))
            }
            return e
        }
    }
}
```

**细节操作解析：**

1. **`emptyRest` 提前终止优化**：`tophash` 不仅存储哈希高 8 位，还保留了几个特殊的控制标记（如 `emptyRest` = 0，表示此槽位为空，且后续所有槽位也都为空）。这允许查找逻辑在遇到连续空槽时直接 `break bucketloop`，避免无意义的遍历。
2. **指针运算定位内存**：由于 `bmap` 的具体结构（如 key 和 value 的类型）在编译期才能确定，源码中无法直接用结构体字段访问。Go 采用指针偏移的方式：通过 `dataOffset`（数据区相对于 bucket 起始地址的偏移量）加上索引 `i` 乘以 `keysize`，直接计算出对应 key 的内存地址。
3. **间接存储（indirect）处理**：如果 key 或 value 的大小超过 128 字节，Go 会将其退化为指针存储（此时 `t.indirectkey()` 为 true）。因此，取出的 `k` 只是一个指针，需要再进行一次解引用 `*((*unsafe.Pointer)(k))` 才能拿到真正的数据。
4. **精确比较**：最后调用 `t.key.equal(key, k)` 进行值比较。只有当完整 key 也完全相等时，才算真正命中了目标，随后同样通过指针运算计算出 value 的地址并返回。

这种“先比较高位哈希过滤，再通过指针运算取值，最后进行完整比较”的策略，结合 `emptyRest` 的短路优化，极大地提升了查找效率。

## 扩容期间的查找逻辑

Go 的 map 扩容是**渐进式**的。这意味着在扩容期间，map 的数据并没有一次性全部迁移到新的 bucket 中，而是分布在旧的 `oldbuckets` 和新的 `buckets` 中。

因此，如果 map 正在扩容，查找逻辑必须进行特殊处理，以确保能找到尚未迁移的数据。

### 1. 判断是否在扩容

源码中通过检查 `h.oldbuckets` 是否为 nil 来判断 map 是否处于扩容状态：

```go
if h.oldbuckets != nil {
    // 正在扩容中...
}
```

### 2. 去 oldbuckets 中寻找

如果 map 正在扩容，Go 会首先计算当前 key 在**旧的 bucket 数组**中的位置。这里需要区分两种扩容情况：“翻倍扩容”和“等量扩容”（sameSizeGrow）。

1.21 源码中是这样处理的：

```go
if c := h.oldbuckets; c != nil {
    if !h.sameSizeGrow() {
        // 如果是翻倍扩容，旧的 bucket 数量是现在的一半
        // 所以掩码需要右移 1 位（相当于除以 2，即 B-1 的掩码）
        m >>= 1
    }
    // 定位到旧的 bucket
    oldb := (*bmap)(add(c, (hash&m)*uintptr(t.bucketsize)))
    
    // 判断该旧 bucket 是否已经迁移完毕
    if !evacuated(oldb) {
        // 如果还没有迁移，说明数据还在旧 bucket 里，将查找目标指向旧 bucket
        b = oldb
    }
}
```

这里有几个关键点：
- **掩码右移（`m >>= 1`）**：如果是翻倍扩容，旧的 bucket 数量是当前的一半。Go 非常巧妙地直接将当前的掩码 `m` 右移一位（相当于 `bucketMask(h.B - 1)`），从而得到旧 bucket 的掩码，避免了重新计算。
- **等量扩容（sameSizeGrow）**：如果是等量扩容（通常因为溢出桶过多触发），旧的 bucket 数量和新的 bucket 数量是一样的。此时不需要右移掩码，直接使用当前的掩码 `m` 即可。
- **判断是否迁移完成（`!evacuated(oldb)`）**：
  - 如果该旧 bucket **尚未迁移**，那么我们要找的数据肯定还在旧 bucket 中，于是将查找目标 `b` 指向这个旧 bucket。
  - 如果该旧 bucket **已经迁移完毕**，那么数据已经被搬到了新的 `buckets` 中，查找目标 `b` 保持为新的 bucket 不变。

## 总结

`mapaccess1` 的查找过程可以概括为以下几个关键步骤：

1. **计算哈希**：对 key 计算哈希值。
2. **处理扩容**：如果 map 正在扩容，计算 key 在旧 `oldbuckets` 中的位置。如果该旧 bucket 尚未迁移，则去旧 bucket 中查找；否则去新 `buckets` 中查找。
3. **定位 Bucket**：使用哈希值的**低位**定位到具体的 bucket。
4. **遍历查找**：在 bucket 及其溢出桶（overflow buckets）中遍历：
   - 先比较哈希值的**高位**（`tophash`）进行快速过滤。
   - 如果 `tophash` 匹配，再进行完整 key 的精确比较。
5. **返回结果**：找到则返回对应 value 的指针，否则返回对应类型的零值指针。

## 其他关键细节

结合完整的 `mapaccess1` 源码，还有几个非常重要的细节值得注意：

### 1. Nil 或空 Map 的读取与哈希 Panic

在 `mapaccess1` 的最开始，有这样一段看似简单的处理：

```go
if h == nil || h.count == 0 {
    if t.HashMightPanic() {
        t.Hasher(key, 0) // see issue 23734
    }
    return unsafe.Pointer(&zeroVal[0])
}
```

这段代码处理了两种特殊情况：
- **返回零值**：如果 map 是 `nil` 或者当前没有任何元素（`h.count == 0`），直接返回对应类型的零值指针（`&zeroVal[0]`）。这解释了为什么在 Go 中读取 `nil` map 不会 panic，而是返回零值。
- **哈希 Panic 检查**：即使 map 是空的，如果传入的 key 的哈希函数可能会触发 panic（`t.HashMightPanic()`），Go 依然会强制计算一次哈希（`t.Hasher(key, 0)`）。这是为了严格遵守 Go 语言规范：即使 map 为空，如果 key 本身是不可哈希的（例如一个包含 slice 的 `interface{}`），执行 `m[k]` 也必须引发 panic（详见 [issue 23734](https://github.com/golang/go/issues/23734)）。

### 2. 并发读写检测

Go 语言原生的 map **不是并发安全**的。在 `mapaccess1` 的开头，有这样一段代码：

```go
if h.flags&hashWriting != 0 {
    fatal("concurrent map read and map write")
}
```

`h.flags` 记录了 map 的当前状态。如果 `hashWriting` 标志位被设置（通常是在 `mapassign` 或 `mapdelete` 时设置），说明当前正有其他 goroutine 在对 map 进行写操作。此时，Go 会直接抛出 `fatal` 错误（panic），导致程序崩溃。这种 fail-fast 机制强制开发者在并发场景下必须使用 `sync.RWMutex` 或 `sync.Map` 来保护 map。

### 3. 哈希冲突的处理（链地址法）

当两个不同的 key 计算出的哈希值低位相同（落入同一个 bucket），甚至高位 `tophash` 也相同时，就发生了哈希冲突。

Go 的 map 采用**链地址法**（Chaining）来解决哈希冲突。每个 bucket 最多只能装 8 个键值对（`bucketCnt = 8`）。如果一个 bucket 装满了，Go 会分配一个**溢出桶（overflow bucket）**，并将其链接到当前 bucket 的尾部。

在源码的 `bucketloop` 中，外层循环 `for ; b != nil; b = b.overflow(t)` 正是在遍历这条由常规 bucket 和溢出桶组成的单向链表。只要沿着链表一直找下去，就能遍历完所有发生哈希冲突并落在这个槽位的 key。

## 附：mapaccess1 完整源码

最后，附上 Go 1.21 中 `mapaccess1` 的完整源码，供对照参考：

```go fold
// mapaccess1 returns a pointer to h[key].  Never returns nil, instead
// it will return a reference to the zero object for the elem type if
// the key is not in the map.
// NOTE: The returned pointer may keep the whole map live, so don't
// hold onto it for very long.
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapaccess1)
		racereadpc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled && h != nil {
		msanread(key, t.Key.Size_)
	}
	if asanenabled && h != nil {
		asanread(key, t.Key.Size_)
	}
	if h == nil || h.count == 0 {
		if t.HashMightPanic() {
			t.Hasher(key, 0) // see issue 23734
		}
		return unsafe.Pointer(&zeroVal[0])
	}
	if h.flags&hashWriting != 0 {
		fatal("concurrent map read and map write")
	}
	hash := t.Hasher(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.BucketSize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// There used to be half as many buckets; mask down one more power of two.
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.BucketSize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if t.Key.Equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				if t.IndirectElem() {
					e = *((*unsafe.Pointer)(e))
				}
				return e
			}
		}
	}
	return unsafe.Pointer(&zeroVal[0])
}
```