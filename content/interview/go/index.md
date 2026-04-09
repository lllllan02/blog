---
title: Golang 面试题库
aliases: 0ef1f46b-c498-4adb-9e8a-f78bb863a344
date: 2026-04-09 16:30:50
card: false
tags:
  - interview
  - golang
---

## 基础语法与数据结构
- [x] [[b4da4e26-41f7-4233-9ce4-0b0e6ead3f60|与其他语言相比，使用 Go 有什么好处？]]
- [x] [[f641a219-9938-4c52-ac97-f501065a87ad|数组 (Array) 和 切片 (Slice) 的区别是什么？]]
- [x] [[9dc46105-6a61-469e-95ab-5256d7771460|Slice 的底层结构是怎样的？它的扩容机制是怎样的？]]
- [ ] Map 的底层实现原理是什么？它是并发安全的吗？如何实现并发安全的 Map？
- [ ] Channel 的底层实现原理？有缓冲和无缓冲 Channel 的区别？
- [x] [[6c34d43c-c806-4e65-8b39-911680685106|Channel 会在什么情况下引发 panic？]]
- [x] [[dc4afc79-b611-4aab-8975-c433d6e66bb0|make 和 new 的区别是什么？]]
- [x] [[e7baa7df-51a1-4876-843c-dd3d5a1c6f1f|defer 的执行顺序是怎样的？defer 和 return 的执行顺序？]]
- [x] [[d74dd1ff-f5cc-4e1c-9665-969737649678|Golang 中 init 函数在什么时候执行？]]
- [x] [[f621a8f4-2333-4ae0-8927-a461cd2b68f2|如何高效地拼接字符串？]]
- [ ] `interface` 的底层结构是什么（`iface` 和 `eface`）？
- [x] [[283596f9-b205-4629-beac-dc18d33b04f8|interface 可以比较吗？]]
- [x] [[ef9f19d9-8e0a-4080-ae46-6b2c8fed4069|什么是空结构体 struct{}？它有什么应用场景？]]
- [x] [[e205c1c3-5aaa-4427-bd8b-9c90e7ac6091|rune 类型是什么？它和 byte 有什么区别？]]

## 并发编程
- [x] [[c6d9fcdb-1a1f-4b3b-8370-486d8b99c20d|什么是 Goroutine？协程、线程和进程的区别是什么？]]
- [ ] 详细讲讲 Golang 的 GMP 调度模型？
- [ ] GMP 模型中，如果一个 Goroutine 发生阻塞（如系统调用），会发生什么？
- [ ] 什么是工作窃取（Work Stealing）机制？
- [x] [[2cd2c0b4-c94f-4535-9899-4b09bb116bb9|Context 的作用是什么？有哪些使用场景？]]
- [ ] sync.WaitGroup 的底层原理？
- [ ] sync.Mutex 的底层实现？正常模式和饥饿模式有什么区别？
- [ ] 什么是 sync.Pool？它的底层原理和使用场景？

## 内存管理与底层原理
- [x] [[f1be6b04-6925-4d70-a373-0f13bdd278a3|什么是逃逸分析？如何知道对象分配在栈上还是堆上？]]
- [ ] Golang 的垃圾回收（GC）机制是怎样的？详细说说三色标记法。
- [ ] 什么是混合写屏障（Hybrid Write Barrier）机制？
- [ ] GC 的触发时机有哪些？
- [ ] Golang 中的内存分配机制是怎样的（TCMalloc）？
- [x] [[9343f3b4-93b1-4e54-a0b3-f2802f602eb6|什么是反射（Reflection）？反射的性能问题及应用场景？]]
- [x] [[e4da93aa-006d-4632-bb90-e7ed628a2a42|Go 语言中的函数参数传递是值传递还是引用传递？]]
