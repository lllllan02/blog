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

本文档旨在引导你自主阅读 Go 1.21 的 [map 源码](https://github.com/golang/go/blob/release-branch.go1.21/src/runtime/map.go)。在深入代码细节之前，我们将通过一系列循序渐进的问题与核心概念，为你构建一条清晰的源码探索路径。

## 1. 探索前的准备：设计背景与演进

在直接阅读源码之前，理解官方的设计哲学与内部机制的宏观概念至关重要。这能帮助我们在脑海中建立起 map 的空间想象，明白代码“为什么”这样设计。

建议在开始前，先阅读以下资料以对齐术语与背景知识：
- 官方视角的 map 介绍：[[b1d39be8-c01f-4182-b619-296f32d7f412|Go maps in action]]（理解基础用法与宏观概念）
- 经典的内部结构图解：[Macro View of Map Internals In Go](https://www.ardanlabs.com/blog/2013/12/macro-view-of-map-internals-in-go.html)（帮助建立空间想象）

## 2. 核心结构与基础：Map 的真面目

在开始阅读代码前，请先思考并尝试在源码中找到以下问题的答案：

首先，我们需要了解 map 在底层的真实面貌。map 的控制头 `hmap` 包含哪些关键字段？例如 `count`、`B`、`buckets`、`oldbuckets` 等分别代表什么？同时，桶 `bmap`（bucket）在编译期和运行时的结构有什么不同？一个 bucket 最多能装几个键值对？你可以参考 [[e8f6b0b2-23c3-424d-b657-fc08d752220d|底层结构（hmap 与 bmap）]] 寻找答案。

其次，在日常开发中，我们经常使用不同的方式初始化 map。那么，`var m map[int]int`（nil map）和 `m := make(map[int]int)`（空 map）在底层究竟有什么区别？请参考 [[fb971326-3d55-41f5-99fe-1d6111f10d41|nil map 与空 map 的底层区别]]。当使用 `make(map[k]v, hint)` 预分配容量时，底层又是如何计算所需的 bucket 数量（即字段 `B` 的值）的？详情见 [[5a487929-6cae-4f2c-aa91-16872827dc62|初始化（makemap）]]。

最后，关于哈希冲突的解决。Go 的 map 是如何解决哈希冲突的？是开放寻址法还是链地址法？溢出桶（overflow bucket）的作用是什么，它又是如何与常规桶连接起来的？你可以通过 [[13f10ebe-8826-4821-9eab-565c0c5db2ed|哈希冲突（Hash Collision）]] 来验证你的猜想。

## 3. 重点操作解析：查找、插入、删除与扩容

这是 map 最核心的逻辑，主要集中在 `src/runtime/map.go` 中。阅读这些操作的源码时，请重点关注以下四个维度的设计：

### 3.1 查找过程（mapaccess）
在查找 key 时，哈希值是如何被拆分使用的？低位用来做什么，高位 `tophash` 又用来做什么？如果 map 正在扩容期间，查找逻辑会有什么特殊处理，它是如何去 `oldbuckets` 中寻找数据的？参考 [[3dccc618-e0d3-4e42-b407-13c207c3dcab|查找过程（mapaccess）]]。

### 3.2 插入过程（mapassign）
插入新 key 时，如果当前 bucket 已经满了（8 个槽位都占用了），底层会发生什么操作？参考 [[a54e00b1-2467-468e-bdc9-5de3b2fcb3f1|插入过程（mapassign）]]。

### 3.3 删除过程（mapdelete）
删除元素后，map 占用的内存会立刻归还给操作系统吗？在删除逻辑中，`emptyOne` 和 `emptyRest` 状态有什么区别，状态向前传播是为了解决什么问题？参考 [[e14018a1-cd6f-4e89-bfdf-eb628f3314c6|删除过程（mapdelete）]]。

### 3.4 扩容机制（hashGrow 与 evacuate）
map 的自动扩容是其核心特性之一。触发扩容的两个核心条件是什么？（装载因子 `loadFactor` > 6.5，或者溢出桶太多）。什么是“翻倍扩容”和“等量扩容”（sameSizeGrow），等量扩容是为了解决什么极端场景？另外，为什么 Go 选择在每次插入或删除时渐进式搬迁 1~2 个 bucket，而不是一次性搬迁完？参考 [[54c7d285-4878-4c1e-99eb-57d2f814da07|扩容机制（hashGrow 与 evacuate）]]。

## 4. 进阶思考：工程实践中的陷阱

理解了底层原理后，我们需要将其映射回实际的工程应用中。请结合源码，思考以下几个常见问题：

- **遍历的无序性**：为什么在 Go 中 `for range` 遍历 map 每次的顺序都不一样？尝试在源码中寻找随机数生成的逻辑（`fastrand`），看看它是如何决定遍历的起始 bucket 和槽位偏移量的。参考 [[fb25a1e0-77ce-4982-9a06-371c014adddb|遍历的无序性（mapiterinit）]]。
- **并发安全**：为什么说 Go 的原生 map 不是并发安全的？源码中是如何检测并抛出 `concurrent map read and map write` panic 的？（提示：关注 `hmap.flags` 中的 `hashWriting` 标志位）。参考 [[1e7b9135-2d6a-4952-b91c-81b4f2c9e8d1|并发安全（flags 字段）]]。
- **内存回收与泄露陷阱**：执行 `delete(m, key)` 删除元素后，map 占用的内存会立即归还给操作系统吗？如果一个 map 曾经存了海量数据，后来删除了绝大部分，它的 bucket 数量会缩小吗？如果不会，应该如何优化以释放内存？参考 [[b691201b-fdf6-40d7-8f79-a07583e3d7f5|内存回收与泄露陷阱]]。
- **Key 的类型限制**：什么样的类型可以作为 map 的 key？为什么 slice、map、func 不行？底层是如何比较两个 key 是否相等的？（提示：关注 `alg.equal`）。参考 [[c8f1e2a3-b4d5-4e6f-8a9b-0c1d2e3f4a5b|Key 的类型限制]]。
