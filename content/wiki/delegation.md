---
title: 委托 (Delegation)
wiki: ["委托", "Delegation Pattern"]
aliases: 0bfd22e8-bc36-472a-a147-d7eb8227dbf7
date: 2026-03-02 17:08:50
card: true
order:
tags:
  - wiki
  - oop
  - design-pattern
---

## 定义

**委托 (Delegation)** 是一种设计模式，指一个对象将某个请求的处理责任转交给另一个对象执行，而不是自己直接处理或通过继承实现。

在严格的定义中，委托与简单的“转发”不同，委托通常意味着受托者在执行时能够访问委托者的上下文（即 `this` 或 `self` 指向委托者），从而实现类似于继承的行为复用，但具有更高的运行时灵活性。

## 直观理解

想象你是一个项目经理（委托者），遇到了一个技术难题。你不需要自己去学这门技术（继承），而是直接把任务交给组里的技术专家（受托者）去解决。对客户来说，任务是你完成的，但实际干活的是专家。

## 关键点

- **替代继承**: 委托是实现“组合优于继承”的关键机制，它允许对象动态地组合行为。
- **动态性**: 继承关系在编译时确定，而委托关系可以在运行时改变（例如切换不同的受托者）。
- **显式 vs 隐式**: 许多语言（如 Kotlin, Ruby）提供语法级的隐式委托支持，而在其他语言（如 Java, C++）中通常通过显式调用实现。

## 参考资料

- [Delegation (object-oriented programming) - Wikipedia](https://en.wikipedia.org/wiki/Delegation_(object-oriented_programming))
