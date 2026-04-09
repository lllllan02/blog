---
title: 码点 (Code Point)
aliases: 6c153db7-bc4e-4b22-bc56-252036e00ff7
date: 2026-04-09 11:09:13
card: true
order:
tags: [wiki]
wiki: [码点, Code Point]
---

**码点 (Code Point)** 是字符编码系统（如 Unicode）中，分配给某个抽象字符的**唯一数字编号**。

## 核心直觉

如果把 Unicode 想象成一本包含世界上所有字符的超级字典，那么码点就是每个字符在这本字典里的**唯一编号**。它只负责给字符一个逻辑身份，而不关心这个字符在计算机内存中具体如何存储（那是 UTF-8 等编码方式负责的事）。

## 关键点

- **表示方式**: Unicode 中通常以 `U+` 加上十六进制数字表示（如字母 "A" 是 `U+0041`）。
- **容量范围**: Unicode 共有 1,114,112 个码点，范围从 `U+0000` 到 `U+10FFFF`。
- **与编码的区别**: 码点是逻辑编号，编码（Encoding）是物理字节序列。同一个码点在 UTF-8 和 UTF-16 中会被编码成不同的字节。

## 参考资料

- [Code point - Wikipedia](https://en.wikipedia.org/wiki/Code_point)
- [Code point - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Glossary/code_point)
