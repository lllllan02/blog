---
title: 插入过程（mapassign）
aliases: a54e00b1-2467-468e-bdc9-5de3b2fcb3f1
date: 2026-04-11 15:00:00
card: false
order: 6
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

在 Go 语言中，当我们执行 `m[k] = v` 向 map 中插入或更新元素时，底层实际调用的是 `runtime.mapassign` 函数。

观察这个函数的签名，你会发现一个有趣的细节：

```go
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer
```

`mapassign` **并没有接收 value 作为参数**。它的核心职责是**寻址**：在 map 中找到（或分配）一个用于存储该 key 的槽位，将 key 写入，并**返回用于存储 value 的内存地址指针**。至于将实际的 `v` 写入该地址，则是由编译器在调用 `mapassign` 之后生成的额外指令来完成的。

接下来，我们将顺着 Go 1.21 的源码，梳理 `mapassign` 是如何一步步完成这个寻址与插入任务的。

## 插入流程解析

### 1. 前置检查与并发控制

在执行实质性的插入操作前，`mapassign` 需要先确保当前环境的安全：

```go
if h == nil {
    panic(plainError("assignment to entry in nil map"))
}

if h.flags&hashWriting != 0 {
    fatal("concurrent map writes")
}
```

- **Nil Map 检查**：向一个 `nil` map 赋值会直接触发 panic。这与读取 `nil` map 时安全返回零值的行为不同。
- **并发写检测**：Go 的原生 map 不是并发安全的。如果通过 `h.flags&hashWriting` 检测到有其他 goroutine 正在写入，程序会直接抛出 `fatal` 错误。

确认安全后，当前 goroutine 会将 `hashWriting` 标志位设置上，声明自己正在占用写状态。

### 2. 计算哈希与锁定状态

有了安全的写入环境，下一步是获取寻址所需的哈希值：

```go
hash := t.Hasher(key, uintptr(h.hash0))
h.flags ^= hashWriting // 标记当前正在写入
```

利用类型元数据中的哈希函数，结合 map 初始化时的随机种子 `hash0`，计算出 key 的哈希值。

### 3. 延迟初始化（Lazy Initialization）

如果 map 是通过 `make(map[k]v)` 创建且没有指定容量，它的内部结构并不会立刻分配内存。Go 将这部分开销推迟到了第一次真正插入数据时：

```go
if h.buckets == nil {
    h.buckets = newobject(t.Bucket) // 分配第 1 个 bucket
}
```

### 4. 定位 Bucket 与协助扩容

拿到哈希值和 buckets 数组后，我们需要定位具体的 bucket：

```go
again:
    bucket := hash & bucketMask(h.B)
    if h.growing() {
        growWork(t, h, bucket)
    }
    b := (*bmap)(add(h.buckets, bucket*uintptr(t.BucketSize)))
    top := tophash(hash)
```

通过哈希值的**低位**，我们定位到了目标 bucket。

此时需要注意 map 的状态：如果 map 恰好处于扩容阶段（`h.growing()` 为 true），Go 的渐进式扩容机制会要求当前执行写入的 goroutine 协助搬迁数据。它会调用 `growWork` 将当前 bucket 及其对应的旧 bucket 数据迁移到新数组中，然后再继续执行插入。

### 5. 遍历查找与记录空槽位

定位到 bucket 后，程序会在当前 bucket 及其挂载的溢出桶（overflow buckets）中进行遍历。

在遍历过程中，`mapassign` 需要同时兼顾两个目标：
1. **查找是否存在相同的 key**（如果是，则为更新操作）。
2. **记录遇到的第一个空槽位**（如果遍历完未找到 key，则将新 key 插入此槽位）。

```go
    var inserti *uint8          // 记录空闲槽位的 tophash 指针
    var insertk unsafe.Pointer  // 记录空闲槽位的 key 地址
    var elem unsafe.Pointer     // 记录空闲槽位的 value 地址

bucketloop:
    for {
        for i := uintptr(0); i < bucketCnt; i++ {
            if b.tophash[i] != top {
                // 如果遇到空槽位，且之前尚未记录过，则保存该位置信息
                if isEmpty(b.tophash[i]) && inserti == nil {
                    inserti = &b.tophash[i]
                    insertk = add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
                    elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
                }
                if b.tophash[i] == emptyRest {
                    break bucketloop // 后续全为空，提前结束遍历
                }
                continue
            }
            
            // tophash 匹配，进一步比较完整的 key 是否相等
            k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
            if t.IndirectKey() {
                k = *((*unsafe.Pointer)(k))
            }
            if !t.Key.Equal(key, k) {
                continue
            }
            
            // 确认 key 相同，执行更新逻辑
            if t.NeedKeyUpdate() {
                typedmemmove(t.Key, k, key) // 更新 key
            }
            elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
            goto done // 直接跳转到结束，返回 elem 地址
        }
        // 当前桶遍历完毕，继续查找下一个溢出桶
        ovf := b.overflow(t)
        if ovf == nil {
            break
        }
        b = ovf
    }
```

### 6. 处理 Bucket 满载情况（核心逻辑）

如果遍历完了所有的常规桶和溢出桶，都没有找到目标 key，说明这是一次**插入新元素**的操作。此时，程序会尝试使用刚才记录的空槽位（`inserti`）。

**但是，如果当前 bucket 及其溢出桶已经全部满载（没有遇到任何空槽位），`inserti` 将保持为 `nil`。此时该如何处理？**

源码中的处理逻辑如下：

```go
// 1. 检查是否需要触发全局扩容
if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
    hashGrow(t, h)
    goto again // 扩容会改变 bucket 的映射关系，必须从头重新定位和查找
}

// 2. 如果不需要全局扩容，但当前桶已满，则分配新的溢出桶
if inserti == nil {
    // 为当前 bucket 分配一个新的溢出桶，并链接到末尾
    newb := h.newoverflow(t, b)
    inserti = &newb.tophash[0]
    insertk = add(unsafe.Pointer(newb), dataOffset)
    elem = add(insertk, bucketCnt*uintptr(t.KeySize))
}
```

面对满载的 bucket，Go 会依次进行两步判断：

1. **评估全局健康度（是否需要扩容）**： 
   检查 map 的装载因子是否过高（平均每个 bucket 超过 6.5 个元素），或者溢出桶数量是否过多。如果达到阈值，说明 map 的整体性能正在下降，此时会调用 `hashGrow` 触发全局扩容。**注意**：触发扩容后，原有的 bucket 映射关系失效，程序必须通过 `goto again` 跳转回开头重新计算和定位。
2. **处理局部冲突（分配溢出桶）**：
   如果整体装载因子正常，仅仅是当前 bucket 因为哈希冲突严重而满载，Go 不会盲目进行全局扩容。它会调用 `h.newoverflow(t, b)` 专门为这个 bucket 分配一个新的溢出桶，并将新元素安排在新桶的第一个槽位中。

### 7. 写入数据与状态清理

当成功找到合适的槽位（无论是原有的空槽位，还是新分配的溢出桶槽位）后，最后一步就是将数据写入并清理状态：

```go
    // 写入 key 并更新 tophash
    typedmemmove(t.Key, insertk, key)
    *inserti = top
    h.count++ // 元素总数加 1

done:
	if h.flags&hashWriting == 0 {
		fatal("concurrent map writes")
	}
	h.flags &^= hashWriting // 清除写入标志位
	if t.IndirectElem() {
		elem = *((*unsafe.Pointer)(elem))
	}
	return elem // 返回 value 的内存地址
```

程序会将 key 拷贝到目标内存，更新 `tophash` 数组，并增加 map 的元素计数 `count`。最后，清除 `hashWriting` 标志位，将计算好的 value 内存地址 `elem` 返回给编译器生成的代码，由其完成最终的赋值操作。

## 总结

梳理完整个流程，我们可以清晰地回答关于“插入新 key 时 bucket 已满”的处理策略：

1. **优先检查扩容阈值**：Go 会先评估整个 map 的装载因子和溢出桶数量。如果达到阈值，则触发全局扩容，并重新执行插入流程。
2. **动态挂载溢出桶**：如果未达到全局扩容条件（仅为局部哈希冲突），Go 会为当前 bucket 动态分配一个新的溢出桶，将新元素存入其中，从而巧妙地化解局部满载问题。

## 附：mapassign 完整源码

附上 Go 1.21 中 `mapassign` 的完整源码，供对照参考：

```go fold
// Like mapaccess, but allocates a slot for the key if it is not present in the map.
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if h == nil {
		panic(plainError("assignment to entry in nil map"))
	}
	if raceenabled {
		callerpc := getcallerpc()
		pc := abi.FuncPCABIInternal(mapassign)
		racewritepc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.Key, key, callerpc, pc)
	}
	if msanenabled {
		msanread(key, t.Key.Size_)
	}
	if asanenabled {
		asanread(key, t.Key.Size_)
	}
	if h.flags&hashWriting != 0 {
		fatal("concurrent map writes")
	}
	hash := t.Hasher(key, uintptr(h.hash0))

	// Set hashWriting after calling t.hasher, since t.hasher may panic,
	// in which case we have not actually done a write.
	h.flags ^= hashWriting

	if h.buckets == nil {
		h.buckets = newobject(t.Bucket) // newarray(t.Bucket, 1)
	}

again:
	bucket := hash & bucketMask(h.B)
	if h.growing() {
		growWork(t, h, bucket)
	}
	b := (*bmap)(add(h.buckets, bucket*uintptr(t.BucketSize)))
	top := tophash(hash)

	var inserti *uint8
	var insertk unsafe.Pointer
	var elem unsafe.Pointer
bucketloop:
	for {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if isEmpty(b.tophash[i]) && inserti == nil {
					inserti = &b.tophash[i]
					insertk = add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
					elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
				}
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
			if t.IndirectKey() {
				k = *((*unsafe.Pointer)(k))
			}
			if !t.Key.Equal(key, k) {
				continue
			}
			// already have a mapping for key. Update it.
			if t.NeedKeyUpdate() {
				typedmemmove(t.Key, k, key)
			}
			elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.KeySize)+i*uintptr(t.ValueSize))
			goto done
		}
		ovf := b.overflow(t)
		if ovf == nil {
			break
		}
		b = ovf
	}

	// Did not find mapping for key. Allocate new cell & add entry.

	// If we hit the max load factor or we have too many overflow buckets,
	// and we're not already in the middle of growing, start growing.
	if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
		hashGrow(t, h)
		goto again // Growing the table invalidates everything, so try again
	}

	if inserti == nil {
		// The current bucket and all the overflow buckets connected to it are full, allocate a new one.
		newb := h.newoverflow(t, b)
		inserti = &newb.tophash[0]
		insertk = add(unsafe.Pointer(newb), dataOffset)
		elem = add(insertk, bucketCnt*uintptr(t.KeySize))
	}

	// store new key/elem at insert position
	if t.IndirectKey() {
		kmem := newobject(t.Key)
		*(*unsafe.Pointer)(insertk) = kmem
		insertk = kmem
	}
	if t.IndirectElem() {
		vmem := newobject(t.Elem)
		*(*unsafe.Pointer)(elem) = vmem
	}
	typedmemmove(t.Key, insertk, key)
	*inserti = top
	h.count++

done:
	if h.flags&hashWriting == 0 {
		fatal("concurrent map writes")
	}
	h.flags &^= hashWriting
	if t.IndirectElem() {
		elem = *((*unsafe.Pointer)(elem))
	}
	return elem
}
```