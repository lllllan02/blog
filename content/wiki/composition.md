---
title: 组合 (Composition)
wiki: ["组合", "Object Composition"]
aliases: 46b5bfcc-b194-412e-85a0-a27091527fca
date: 2026-03-02 17:06:35
card: true
order:
tags:
  - wiki
  - oop
---

## 定义

**组合 (Composition)** 是一种通过将对象作为另一个对象的属性来构建复杂结构的设计原则，它建立的是 “Has-a” 关系。

## 直观理解

相比于继承（Inheritance）所建立的 "Is-a"（是）关系，组合允许通过组装独立的组件（如：汽车**有**引擎，而不是汽车**是**引擎）来构建对象。这种方式降低了代码的耦合度，避免了脆弱的继承层级，并支持在运行时动态改变对象的行为，因此在现代软件设计中通常被优先推荐（Composition over Inheritance）。

## 关键点

- **Has-a 关系**：明确表达整体由部分组成，例如 `Computer` 拥有 `CPU`。
- **黑盒复用**：内部对象的细节对外部不可见，仅通过定义的接口进行交互。
- **灵活性**：可以在运行时动态替换组件，而继承关系在编译时就已确定。

## 参考资料

- [Object composition - Wikipedia](https://en.wikipedia.org/wiki/Object_composition)
