---
title: Go 源码阅读：Map
aliases: 73562a73-5f78-48ea-88b9-2c322fddde1a
date: 2026-04-10 20:09:58
card: false
order: 3
tags: 
  - golang
  - source-reading
  - map
  - go1.21
---

> 本文档旨在引导你自主阅读 Go 1.21 的 [map 源码](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/map.go)

把下面内容当作阅读源码前的准备清单与思考题。


## 推荐阅读

- [x] [[b1d39be8-c01f-4182-b619-296f32d7f412|Go maps in action]]：官方视角的 map 介绍，建议先读以理解基础用法与内部机制的宏观概念。
- [ ] [Macro View of Map Internals In Go](https://www.ardanlabs.com/blog/2013/12/macro-view-of-map-internals-in-go.html)（可选）：Ardan Labs 经典的 map 内部结构图解，对建立空间想象很有帮助。

## 核心结构与基础

在开始阅读代码前，请先思考并尝试在源码中找到以下问题的答案：

- [x] [[e8f6b0b2-23c3-424d-b657-fc08d752220d|底层结构（hmap 与 bmap）]]：
    - map 的控制头 `hmap` 包含哪些关键字段？（如 `count`, `B`, `buckets`, `oldbuckets` 等分别代表什么？）
    - 桶 `bmap`（bucket）在编译期和运行时的结构有什么不同？一个 bucket 最多能装几个键值对（K-V）？
- [x] [[fb971326-3d55-41f5-99fe-1d6111f10d41|nil map 与空 map 的底层区别]]：
    - `var m map[int]int`（nil map）和 `m := make(map[int]int)`（空 map）在底层有什么区别？
- [x] [[5a487929-6cae-4f2c-aa91-16872827dc62|初始化（makemap）]]：
    - 当使用 `make(map[k]v, hint)` 预分配容量时，底层是如何计算所需的 bucket 数量（即字段 `B` 的值）的？
- [ ] **哈希冲突（Hash Collision）**：
    - Go 的 map 是如何解决哈希冲突的？（开放寻址法还是链地址法？）
    - 溢出桶（overflow bucket）的作用是什么？它是如何与常规桶连接起来的？

## 重点操作：查找、插入与扩容

这是 map 最核心的逻辑，位于 `src/runtime/map.go`。阅读时请关注：

- [x] [[3dccc618-e0d3-4e42-b407-13c207c3dcab|查找过程（mapaccess）]]：
    - 哈希值是如何被拆分使用的？（**低位**用来做什么？**高位** `tophash` 用来做什么？）
    - 如果 map 正在扩容期间，查找逻辑会有什么特殊处理？（如何去 `oldbuckets` 中找数据？）
- [ ] **插入过程（mapassign）**：
    - 插入新 key 时，如果当前 bucket 已经满了（8个槽位都占用了），会发生什么？
- [ ] **扩容机制（hashGrow 与 evacuate）**：
    - **触发条件**：触发扩容的两个核心条件是什么？（装载因子 `loadFactor` > 6.5，或者溢出桶太多）
    - **扩容类型**：什么是“翻倍扩容”？什么是“等量扩容”（sameSizeGrow）？等量扩容是为了解决什么极端场景？
    - **渐进式迁移（evacuate）**：为什么 Go 选择在每次插入或删除时搬迁 1~2 个 bucket，而不是一次性搬迁完？（思考对性能抖动的影响）

## 进阶思考

- [ ] **遍历的无序性（mapiterinit）**：
    - 为什么在 Go 中 `for range` 遍历 map 每次的顺序都不一样？
    - 尝试在源码中寻找随机数生成的逻辑（`fastrand`），看看它是如何决定遍历的起始 bucket 和槽位偏移量的。
- [ ] **并发安全（flags 字段）**：
    - 为什么说 Go 的原生 map 不是并发安全的？
    - 源码中是如何检测并抛出 `concurrent map read and map write` panic 的？（关注 `hmap.flags` 中的 `hashWriting` 标志位）。
- [ ] **内存回收与泄露陷阱**：
    - 执行 `delete(m, key)` 删除元素后，map 占用的内存会立即归还给操作系统吗？
    - 如果一个 map 曾经存了海量数据，后来删除了绝大部分，它的 bucket 数量会缩小吗？如果不会，应该如何优化以释放内存？
- [ ] **Key 的类型限制**：
    - 什么样的类型可以作为 map 的 key？（为什么 slice、map、func 不行？）
    - 底层是如何比较两个 key 是否相等的？（关注 `alg.equal`）。