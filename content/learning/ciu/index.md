---
title: Jwasham's Coding Interview University
aliases: 502d7f84-161b-458a-ab7d-956d6d949cf0
date: 2026-01-28 21:24:36
order: 1
tags:
  - algorithm
  - data structure
---

> https://github.com/jwasham/coding-interview-university

## 算法复杂度 / Big-O

- [x] [哈佛大学 CS50 - 渐进符号（视频）](https://www.youtube.com/watch?v=iOq5kSKqeR4) (2026-01-28)
- [x] [大 O 符号（通用快速教程）（视频）](https://www.youtube.com/watch?v=V6mKVRU1evU) (2026-01-28)
- [ ] [大 O 符号（以及Ω和Θ）- 最佳数学解释（视频）](https://www.youtube.com/watch?v=ei-A_wy5Yxw&index=2&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN)
- [ ] [Skiena（视频）](https://www.youtube.com/watch?v=z1mkCe3kVUA)
- [ ] [加州大学伯克利分校关于大 O 符号（视频）](https://archive.org/details/ucberkeley_webcast_VIS4YDpuP98)
- [x] [摊还分析（视频）](https://www.youtube.com/watch?v=B3SpQZaAZP4&index=10&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN) (2026-01-29)
- [ ] [TopCoder 计算复杂性：第 1 部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20one) + [第 2 部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20two)（包括递归关系和主定理）
- [ ] [速查表](http://bigocheatsheet.com/)
- [x] [[回顾] 在 18 分钟内分析算法（播放列表）（视频）](https://www.youtube.com/playlist?list=PL9xmBV_5YoZMxejjIyFHWa-4nKg6sdoIv) (2026-01-29)

## 数据结构

### 数组（Arrays）

- [x] [数组 CS50 哈佛大学](https://www.youtube.com/watch?v=tI_tIZFyKBw&t=3009s) (2026-01-29)
- [ ] [数组（视频）](https://www.coursera.org/lecture/data-structures/arrays-OsBSF)
- [ ] [加州大学伯克利分校 CS61B - 线性和多维数组（视频）](https://archive.org/details/ucberkeley_webcast_Wp8oiO_CZZE)（从 15 分 32 秒开始）
- [ ] [动态数组（视频）](https://www.coursera.org/lecture/data-structures/dynamic-arrays-EwbnV)
- [ ] [嵌套数组（视频）](https://www.youtube.com/watch?v=1jtrQqYpt7g)
- [x] [[d862f96e-ba2c-43be-a499-b0a716c51f7d|实现一个动态数组（可自动调整大小的可变数组）]] (2026-02-01)


### 链表（Linked Lists）
- [ ] 介绍：
    - [x] [链表 CS50 哈佛大学](https://www.youtube.com/watch?v=2T-A_GFuoTo&t=650s) (2026-02-07)
    - [ ] [单链表（视频）](https://www.coursera.org/lecture/data-structures/singly-linked-lists-kHhgK)
    - [ ] [CS 61B - 链表 1（视频）](https://archive.org/details/ucberkeley_webcast_htzJdKoEmO0)
    - [ ] [CS 61B - 链表 2（视频）](https://archive.org/details/ucberkeley_webcast_-c4I3gFYe3w)
    - [ ] [[复习] 4 分钟了解链表（视频）](https://youtu.be/F8AbOfQwl1c)
- [ ] [C 代码（视频）](https://www.youtube.com/watch?v=QN6FPiD0Gzo)
        - 不是整个视频，只是关于 Node 结构和内存分配的部分。
- [ ] 链表 vs 数组：
    - [核心链表与数组（视频）](https://www.coursera.org/lecture/data-structures-optimizing-performance/core-linked-lists-vs-arrays-rjBs9)
    - [在现实世界中，链表与数组的比较（视频）](https://www.coursera.org/lecture/data-structures-optimizing-performance/in-the-real-world-lists-vs-arrays-QUaUd)
- [ ] [为什么你需要避免使用链表（视频）](https://www.youtube.com/watch?v=YQs6IC-vgmo)
- [ ] 的确：你需要关于“指向指针的指针”的相关知识：（因为当你传递一个指针到一个函数时，
  该函数可能会改变指针所指向的地址）该页只是为了让你了解“指向指针的指针”这一概念。
  但我并不推荐这种链式遍历的风格。因为，这种风格的代码，其可读性和可维护性太低。
    - [指向指针的指针](https://www.eskimo.com/~scs/cclass/int/sx8.html)
- [ ] 实现（我实现了使用尾指针以及没有使用尾指针这两种情况）：
    - [ ] size() —— 返回链表中数据元素的个数
    - [ ] empty() —— 若链表为空则返回一个布尔值 true
    - [ ] value_at(index) —— 返回第 n 个元素的值（从 0 开始计算）
    - [ ] push_front(value) —— 添加元素到链表的首部
    - [ ] pop_front() —— 删除首部元素并返回其值
    - [ ] push_back(value) —— 添加元素到链表的尾部
    - [ ] pop_back() —— 删除尾部元素并返回其值
    - [ ] front() —— 返回首部元素的值
    - [ ] back() —— 返回尾部元素的值
    - [ ] insert(index, value) —— 插入值到指定的索引，并把当前索引的元素指向到新的元素
    - [ ] erase(index) —— 删除指定索引的节点
    - [ ] value_n_from_end(n) —— 返回倒数第 n 个节点的值
    - [ ] reverse() —— 逆序链表
    - [ ] remove_value(value) —— 删除链表中指定值的第一个元素
- [ ] 双向链表
    - [介绍（视频）](https://www.coursera.org/learn/data-structures/lecture/jpGKD/doubly-linked-lists)
    - 并不需要实现

### 堆栈（Stack）
- [ ] [堆栈（视频）](https://www.coursera.org/learn/data-structures/lecture/UdKzQ/stacks)
- [ ] [[Review] Stacks in 3 minutes (video)](https://youtu.be/KcT3aVgrrpU)
- [ ] 可以不实现，因为使用数组来实现是微不足道的事

### 队列（Queue）
- [ ] [队列（视频）](https://www.coursera.org/learn/data-structures/lecture/EShpq/queue)
- [ ] [原型队列/先进先出（FIFO）](https://en.wikipedia.org/wiki/Circular_buffer)
- [ ] [[Review] Queues in 3 minutes (video)](https://youtu.be/D6gu-_tmEpQ)
- [ ] 使用含有尾部指针的链表来实现:
    - enqueue(value) —— 在尾部添加值
    - dequeue() —— 删除最早添加的元素并返回其值（首部元素）
    - empty()
- [ ] 使用固定大小的数组实现：
    - enqueue(value) —— 在可容的情况下添加元素到尾部
    - dequeue() —— 删除最早添加的元素并返回其值
    - empty()
    - full()
- [ ] 花销：
    - 在糟糕的实现情况下，使用链表所实现的队列，其入列和出列的时间复杂度将会是 O(n)。
    因为，你需要找到下一个元素，以致循环整个队列
    - enqueue：O(1)（平摊（amortized）、链表和数组 [探测（probing）]）
    - dequeue：O(1)（链表和数组）
    - empty：O(1)（链表和数组）

### 哈希表（Hash table）
- [ ] 视频：
    - [ ] [链式哈希表（视频）](https://www.youtube.com/watch?v=0M_kIqhwbFo&list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb&index=8)
    - [ ] [Table Doubling 和 Karp-Rabin（视频）](https://www.youtube.com/watch?v=BRO7mVIFt08&index=9&list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb)
    - [ ] [Open Addressing 和密码型哈希（Cryptographic Hashing）（视频）](https://www.youtube.com/watch?v=rvdJDijO2Ro&index=10&list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb)
    - [ ] [PyCon 2010：强大的字典（视频）](https://www.youtube.com/watch?v=C4Kc8xzcA68)
    - [ ] [PyCon 2017：字典更强大（视频）](https://www.youtube.com/watch?v=66P5FMkWoVU)
    - [ ] [(高级) 随机化：通用和完美哈希（视频）](https://www.youtube.com/watch?v=z0lJ2k0sl1g&list=PLUl4u3cNGP6317WaSNfmCvGym2ucw3oGp&index=11)
    - [ ] [(进阶)完美哈希（Perfect hashing）（视频）](https://www.youtube.com/watch?v=N0COwN14gt0&list=PL2B4EEwhKD-NbwZ4ezj7gyc_3yNrojKM9&index=4)
    - [ ] [[复习]4 分钟了解哈希表（视频）](https://youtu.be/knV86FlSXJ8)

- [ ] 在线课程：
    - [ ] [核心哈希表（视频）](https://www.coursera.org/lecture/data-structures-optimizing-performance/core-hash-tables-m7UuP)
    - [ ] [数据结构（视频）](https://www.coursera.org/learn/data-structures/home/week/4)
    - [ ] [电话簿问题（视频）](https://www.coursera.org/lecture/data-structures/phone-book-problem-NYZZP)
    - [ ] 分布式哈希表：
        - [Dropbox 中的即时上传和存储优化（视频）](https://www.coursera.org/lecture/data-structures/instant-uploads-and-storage-optimization-in-dropbox-DvaIb)
        - [分布式哈希表（视频）](https://www.coursera.org/lecture/data-structures/distributed-hash-tables-tvH8H)

- [ ] 使用线性探测法的数组实现
    - hash(k, m) - m 是哈希表的大小
    - add(key, value) - 如果键已存在，则更新值
    - exists(key) - 检查键是否存在
    - get(key) - 获取给定键的值
    - remove(key) - 删除给定键的值
