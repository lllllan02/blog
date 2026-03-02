---
title: 多态 (Polymorphism)
aliases: 7d89883c-b999-46bf-bc22-996c1d38f65f
date: 2026-03-02 14:47:43
card: true
wiki: [多态, Polymorphism]
tags: [OOP, Programming]
---

**多态 (Polymorphism)** 是指不同类型的实体响应相同消息（方法调用）时产生不同行为的能力。它是面向对象编程 (OOP) 的三大支柱之一（封装、继承、多态）。

## 核心直觉

**“一个接口，多种形态” (One Interface, Multiple Forms)**

想象一个通用遥控器上的“播放”按钮：
- 对着电视按：播放电影。
- 对着音响按：播放音乐。
- 对着空调按：无响应（或报错）。

虽然你发出的指令（按下“播放”）是完全相同的，但接收者（对象）根据自身的类型做出了不同的反应。你不需要知道具体的设备型号，只需要知道它能响应“播放”即可。

## 关键类型

1.  **特设多态 (Ad hoc Polymorphism)**: 函数重载 (Overloading)。同名函数根据参数类型/数量不同而表现不同（如 `print(int)` vs `print(string)`）。
2.  **参数多态 (Parametric Polymorphism)**: 泛型 (Generics)。代码对多种类型通用，不依赖具体类型（如 `List<T>`）。
3.  **子类型多态 (Subtype Polymorphism)**: 继承/接口实现。子类重写父类方法，运行时根据实际对象类型调用对应方法（最常见的 OOP 多态）。

## 参考

- [Polymorphism (computer science) - Wikipedia](https://en.wikipedia.org/wiki/Polymorphism_(computer_science))
