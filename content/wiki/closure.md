---
title: 闭包 (Closure)
wiki: ["闭包", "Closure"]
aliases: DC0CB46A-FAC1-415B-BF0F-7C0212FED5BD
date: 2026-02-26 00:00:00
card: true
tags:
  - wiki
  - programming
---

## 定义

> **闭包（Closure）** 是指一个函数以及其捆绑的周边环境状态（lexical environment，词法环境）的引用的组合。

如果这句定义太抽象，可以试着这样记忆：

**闭包 = 函数 + 该函数定义时的环境**

通常情况下，函数执行完毕后，其内部变量会被销毁。但在闭包中，内部函数引用了外部函数的变量，导致这些变量**无法被销毁**，而是随着内部函数一起存在。

就像一个**背包**：函数不仅带走了代码逻辑，还把定义时周围需要用到的数据打包带走了。

## 核心直觉

闭包最核心的作用是**延长变量的生命周期**和**实现数据私有化**。

想象一个带有“记忆”的函数：

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

在这个例子中，`createCounter` 执行完后 `count` 本该销毁，但因为返回的函数引用了它，所以它被保留了下来，且只能被该函数访问。

## 参考

- [MDN Web Docs: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
