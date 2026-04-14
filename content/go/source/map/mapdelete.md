---
title: 删除过程（mapdelete）
aliases: e14018a1-cd6f-4e89-bfdf-eb628f3314c6
date: 2026-04-13 21:02:59
card: false
order:
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

> 本文假设你已经了解了 Go map 的基础结构（`hmap` 与 `bmap`）以及查找（`mapaccess`）和插入（`mapassign`）的基本流程。

在 Go 语言中，执行 `delete(m, key)` 时，底层实际调用的是 `runtime.mapdelete` 函数。乍看之下，删除操作似乎只是查找元素的逆过程：找到它，然后把它清空。

但如果我们深入思考：**清空一个元素后，它所在的槽位（slot）状态应该如何标记？如果这个 map 刚刚经历了大规模的删除，它占用的内存会还给操作系统吗？**

带着这些问题，我们来拆解 `mapdelete` 的核心逻辑。

## 核心流程拆解

`mapdelete` 的整体执行路径与查找、插入高度一致，主要分为以下几个阶段：

### 1. 并发写检测与状态锁定

Go 的原生 map 并非并发安全。在执行任何写操作（包括删除）前，必须先进行并发检测。

观察源码，`mapdelete` 首先检查 `h.flags` 是否带有 `hashWriting` 标志位。如果存在，说明当前有其他 goroutine 正在对 map 进行写操作，直接抛出 `concurrent map writes` 致命错误。

确认安全后，当前 goroutine 会通过异或操作（`^=`）为 map 加上 `hashWriting` 标志位，宣示对该 map 的写锁定。

```go
if h.flags&hashWriting != 0 {
    fatal("concurrent map writes")
}
// 锁定 map 的写状态
h.flags ^= hashWriting
```

### 2. 计算哈希与定位 Bucket

接下来，根据传入的 `key` 和 map 实例的哈希种子 `hash0` 计算出哈希值。通过位运算（使用哈希值的低位）定位到目标键值对可能存在的 bucket。

```go
hash := t.Hasher(key, uintptr(h.hash0))
// 锁定状态（源码中实际在此处锁定）
h.flags ^= hashWriting

// 定位目标 bucket
bucket := hash & bucketMask(h.B)
```

### 3. 处理渐进式扩容

如果当前 map 正处于扩容阶段（`h.growing()` 返回 true），直接在旧 bucket 中删除数据是不安全的。

为了保证数据一致性，`mapdelete` 会调用 `growWork` 触发一次渐进式搬迁任务（通常搬迁 1~2 个 bucket）。确保当前目标 bucket 的数据已经被安全迁移到新数组后，再继续执行后续的查找与删除逻辑。

```go
if h.growing() {
    growWork(t, h, bucket)
}
```

### 4. 遍历查找目标 Key

定位到具体的 bucket 后，逻辑进入我们熟悉的查找环节。

提取哈希值的高 8 位作为 `tophash`，然后遍历当前 bucket 及其挂载的所有溢出桶（overflow bucket）。

查找过程遵循“先比较 tophash，再比较实际 key”的原则，以最大化性能：
1.  如果 `tophash` 不匹配，直接跳过。
2.  如果遇到 `emptyRest` 状态，说明当前槽位及后续所有槽位均为空，直接终止整个查找循环（`break search`）。
3.  如果 `tophash` 匹配，则进一步对比实际的 key 内存是否完全一致。

```go
    top := tophash(hash)
search:
    for ; b != nil; b = b.overflow(t) {
        for i := uintptr(0); i < bucketCnt; i++ {
            if b.tophash[i] != top {
                // 遇到 emptyRest，后续全为空，提前终止搜索
                if b.tophash[i] == emptyRest {
                    break search
                }
                continue
            }
            
            // tophash 匹配，获取 key 的指针并比较实际内容
            k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.KeySize))
            if t.IndirectKey() {
                k = *((*unsafe.Pointer)(k))
            }
            if !t.key.Equal(key, k) {
                continue
            }
            
            // 成功找到目标 key，跳出查找逻辑，准备执行删除
            // ...
        }
    }
```

### 5. 清除内存与状态的“向前传播”

一旦找到目标 key，就进入了真正的删除环节。这里不仅涉及内存的清理，还包含了一个精妙的状态优化机制。

首先，**清理内存**。如果 key 或 value 包含指针，必须调用 `typedmemclr` 等方法安全地清除内存，以防止内存泄漏；如果是不含指针的标量类型，则直接清零。

```go
// 清除 key 的内存
if t.IndirectKey() {
    *(*unsafe.Pointer)(k) = nil
} else if t.Key.PtrBytes != 0 {
    memclrHasPointers(k, t.Key.Size_)
}

// 清除 value 的内存（逻辑类似，此处省略）
// ...
```

其次，**更新 tophash 状态**。被删除的槽位首先会被标记为 `emptyOne`，表示该位置当前为空，但后续可能还有有效元素（查找操作遇到 `emptyOne` 会继续往后找）。

**关键优化：状态的回溯升级（`emptyOne` -> `emptyRest`）**。
思考一个场景：如果被删除的元素恰好是整个 bucket 链表（包含溢出桶）中的最后一个有效元素，我们仅仅将其标记为 `emptyOne` 是不够高效的。因为后续的查找操作依然会遍历到底。

为了最大化利用 `emptyRest`（遇到即终止搜索）的剪枝特性，Go 会进行一次精妙的回溯：
1. 判断当前清空的槽位之后，是否已经全是 `emptyRest`。
2. 如果是，说明当前槽位也可以安全地标记为 `emptyRest`。
3. 更进一步，它会**反向遍历**前面的槽位，把相连的 `emptyOne` 全部“升级”为 `emptyRest`。

```go
// 基础标记：当前槽位为空
b.tophash[i] = emptyOne

// 判断后续是否还有有效元素
if i == bucketCnt-1 {
    if b.overflow(t) != nil && b.overflow(t).tophash[0] != emptyRest {
        goto notLast
    }
} else {
    if b.tophash[i+1] != emptyRest {
        goto notLast
    }
}

// 回溯：将前面连续的 emptyOne 全部改为 emptyRest
for {
    b.tophash[i] = emptyRest
    if i == 0 {
        // 如果回退到了当前 bucket 的开头，且这是初始 bucket，则结束
        if b == bOrig {
            break 
        }
        // 否则，退回到上一个 bucket 的末尾继续
        // ... (寻找前一个 bucket 的逻辑)
        i = bucketCnt - 1
    } else {
        i--
    }
    if b.tophash[i] != emptyOne {
        break
    }
}
notLast:
h.count--
```

### 6. 重置哈希种子（防 HashDoS 攻击）

在元素计数减一后，源码中隐藏着一个看似不起眼、实则至关重要的防御性设计：当 map 被完全清空时，重置哈希种子 `hash0`。

```go
// 如果 map 被清空了，重置 hash 种子
if h.count == 0 {
    h.hash0 = fastrand()
}
```

**为什么要在清空时重置哈希种子？**
这主要是为了防御**哈希碰撞攻击（HashDoS）**。如果攻击者通过某种方式探测到了当前 map 的哈希规律，并构造了大量哈希冲突的 key 导致 map 性能退化为链表（O(N) 复杂度）。当这个 map 被清空并复用时，如果不更换种子，攻击者依然可以利用原来的碰撞规律继续攻击。

通过在 `count == 0` 时赋予一个新的随机种子，Go 确保了复用的 map 能够重新获得随机分布的特性，彻底切断了持续攻击的可能。

最后，在函数返回前，清除 `hashWriting` 标志位，解除写锁定。

```go
h.flags &^= hashWriting // 解除写锁定
```

## 权衡与局限性：内存回收陷阱

了解了 `mapdelete` 的底层机制后，我们需要直面一个经常被忽视的工程陷阱：**内存泄漏**。

由于 `delete` 操作仅仅是清空了 key 和 value 的内存，并重置了 `tophash` 状态，它**并没有减少 bucket 的数量**。关于这个机制导致的内存“只增不减”问题以及应对策略，请阅读 [[b691201b-fdf6-40d7-8f79-a07583e3d7f5|内存回收与泄露陷阱]]。