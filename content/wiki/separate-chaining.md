---
title: 链地址法 (Separate Chaining)
aliases: 9a93d02d-641e-4fac-968a-f996aa5970d3
date: 2026-04-11 15:33:28
card: true
order:
tags: [wiki]
wiki: [链地址法, Separate Chaining]
---

## 定义

**链地址法 (Separate Chaining)** 是一种用于解决哈希冲突的策略。它将所有哈希值（Hash Value）相同的元素，存储在同一个哈希桶（Bucket）所关联的链表（或其他数据结构）中。

## 核心直觉

就像酒店的房间（哈希桶），如果同一个房间被分配了多位客人（哈希冲突），酒店不是让他们去别的房间找空位（开放寻址法），而是在这个房间里加几张床（链表），让大家都住下。

## 关键点

- **动态扩展**：利用链表天然的动态性，无需提前分配固定空间，删除操作也很高效。
- **性能退化**：当冲突严重时，链表过长会导致查询时间复杂度从 $O(1)$ 退化为 $O(n)$（现代语言如 Java/Go 通常会在链表过长时将其优化为红黑树等结构）。

## 参考资料

- [Wikipedia: Hash table - Separate chaining](https://en.wikipedia.org/wiki/Hash_table#Separate_chaining)
