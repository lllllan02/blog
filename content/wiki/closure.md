---
title: 闭包 (Closure)
wiki: ["闭包", "Closure"]
aliases: DC0CB46A-FAC1-415B-BF0F-7C0212FED5BD
date: 2026-02-26 00:00:00
card: true
order:
tags:
  - wiki
  - programming
---

## 定义

**闭包 (Closure)** 是指一个函数以及它所引用的词法环境的组合。

## 直观理解

可以把闭包记成：**函数 + 该函数定义时的环境**。普通函数执行完后，内部变量通常会被销毁；但如果内部函数仍然引用这些变量，它们就会随着函数一起被保留下来。

## 示例

闭包可以让函数保留一份只能由它访问的状态：

```javascript
function createCounter() {
  let count = 0; // 这个变量被“封闭”在函数内部
  return function() {
    count++; // 内部函数引用了外部变量
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 输出 1
console.log(counter()); // 输出 2
// 外部无法直接访问 count，只能通过 counter() 操作
```

在这个例子中，`createCounter` 执行完后 `count` 本该销毁，但返回的函数引用了它，所以它被保留了下来。

## 关键点

- **延长变量生命周期**：被闭包引用的变量不会随外层函数返回而立即销毁。
- **实现数据私有化**：外部无法直接访问 `count`，只能通过返回的函数间接操作。

## 参考资料

- [MDN Web Docs: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
