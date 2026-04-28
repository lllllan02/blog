---
title: 继承 (Inheritance)
aliases: 0f730366-b2ea-4c6f-8f93-3f13b7bb0c9e
date: 2026-03-02 17:01:25
card: true
order:
wiki: [继承, Inheritance]
tags: [OOP, Programming]
---

## 定义

**继承 (Inheritance)** 是面向对象编程 (OOP) 中，允许一个类（子类/派生类）获取另一个类（父类/基类）的属性和方法的机制。它支持代码重用并建立类之间的层级关系。

## 直观理解

继承表达的是一种 “Is-a” 关系，也就是分类学上的从属关系：
- 猫 (Cat) *是一个* 动物 (Animal)。
- 跑车 (SportsCar) *是一个* 汽车 (Car)。

子类自动拥有父类的所有特征（如“动物”会呼吸），同时可以拥有自己的特殊特征（“猫”会抓老鼠）。这避免了在每个子类中重复编写相同的通用代码。

## 关键点

1.  **Code Reuse (代码重用)**: 将通用逻辑（如 `move()`）放在父类，所有子类自动获得，无需复制粘贴。
2.  **Overriding (重写)**: 子类可以修改父类的默认行为（如“鸟”和“鱼”虽然都是“动物”，但 `move()` 的方式不同：飞 vs 游）。
3.  **Hierarchy (层级)**: 建立从一般到特殊的抽象层级，是多态的基础。

## 参考资料

- [Inheritance (object-oriented programming) - Wikipedia](https://en.wikipedia.org/wiki/Inheritance_(object-oriented_programming))
