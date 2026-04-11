---
title: 哈希冲突 (Hash Collision)
aliases: c7a949d6-55a5-4f44-b8d7-c2be0c626f98
date: 2026-04-11 15:35:42
card: true
order:
tags: [wiki]
wiki: [哈希冲突, Hash Collision]
---

## 定义

**哈希冲突 (Hash Collision)** 是指在哈希表中，两个或多个不同的键（Key）被哈希函数映射到了同一个哈希值（即同一个数组索引位置）的现象。

## 核心直觉

根据“抽屉原理”（鸽巢原理），如果你有 11 只鸽子，但只有 10 个鸽巢，那么必然至少有一个鸽巢里有两只或以上的鸽子。因为哈希函数的输入空间（无限的字符串或对象）远大于输出空间（有限的数组长度），所以冲突是不可避免的。

## 关键点

- **解决方案**：主流的冲突解决策略包括**链地址法 (Separate Chaining)**（在冲突位置挂载链表或红黑树）和**开放寻址法 (Open Addressing)**（在数组中寻找下一个空闲位置）。
- **性能影响**：严重的哈希冲突会导致哈希表的操作时间复杂度从理想的 $O(1)$ 退化为 $O(n)$。
- **安全性**：在密码学中，攻击者可以利用哈希冲突（如生日攻击）来伪造数据或发起拒绝服务攻击（Hash DoS）。

## 参考资料

- [Wikipedia: Hash collision](https://en.wikipedia.org/wiki/Hash_collision)