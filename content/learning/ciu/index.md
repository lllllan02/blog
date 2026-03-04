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

- [x] [Harvard CS50 - 渐进符号（视频）](https://www.youtube.com/watch?v=iOq5kSKqeR4) (2026-01-28)
- [x] [Derek Banas - 大 O 符号（视频）](https://www.youtube.com/watch?v=V6mKVRU1evU) (2026-01-28)
- [ ] [MIT 6.046J - 大 O 符号（以及Ω和Θ）（视频）](https://www.youtube.com/watch?v=ei-A_wy5Yxw&index=2&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN)
- [ ] [Steven Skiena - 算法分析（视频）](https://www.youtube.com/watch?v=z1mkCe3kVUA)
- [ ] [UC Berkeley CS61B - 大 O 符号（视频）](https://archive.org/details/ucberkeley_webcast_VIS4YDpuP98)
- [x] [MIT 6.046J - 摊还分析（视频）](https://www.youtube.com/watch?v=B3SpQZaAZP4&index=10&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN) (2026-01-29)
- [ ] [TopCoder - 计算复杂性：第 1 部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20one) + [第 2 部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20two)（包括递归关系和主定理）
- [x] [Michael Sambol - 18 分钟分析算法（视频）](https://www.youtube.com/playlist?list=PL9xmBV_5YoZMxejjIyFHWa-4nKg6sdoIv) (2026-01-29)
- [ ] [Big-O 速查表](http://bigocheatsheet.com/)

## 数据结构

### 数组（Arrays）

- [x] [Harvard CS50 - 数组（视频）](https://www.youtube.com/watch?v=tI_tIZFyKBw&t=3009s) (2026-01-29)
- [ ] [UC San Diego - 数组（视频）](https://www.coursera.org/lecture/data-structures/arrays-OsBSF)
- [ ] [UC San Diego - 动态数组（视频）](https://www.coursera.org/lecture/data-structures/dynamic-arrays-EwbnV)
- [ ] [UC Berkeley CS61B - 线性和多维数组（视频）](https://archive.org/details/ucberkeley_webcast_Wp8oiO_CZZE)（从 15 分 32 秒开始）
- [ ] [Python - 嵌套列表（视频）](https://www.youtube.com/watch?v=1jtrQqYpt7g)
- [x] [[d862f96e-ba2c-43be-a499-b0a716c51f7d|实现一个动态数组（可自动调整大小的可变数组）]] (2026-02-01)


### 链表（Linked Lists）
- [x] [Harvard CS50 - 链表（视频）](https://www.youtube.com/watch?v=2T-A_GFuoTo&t=650s) (2026-02-07)
- [ ] [UC Berkeley CS61B - 链表 1（视频）](https://archive.org/details/ucberkeley_webcast_htzJdKoEmO0)
- [ ] [UC Berkeley CS61B - 链表 2（视频）](https://archive.org/details/ucberkeley_webcast_-c4I3gFYe3w)
- [x] [Michael Sambol - 4 分钟了解链表（视频）](https://youtu.be/F8AbOfQwl1c) (2026-02-28)
- [x] [MyCodeSchool - 链表 C 语言实现（视频）](https://www.youtube.com/watch?v=QN6FPiD0Gzo) 不是整个视频，只是关于 Node 结构和内存分配的部分。(2026-02-28)
- [x] [Steve Summit - 指向指针的指针（文章）](https://www.eskimo.com/~scs/cclass/int/sx8.html) 的确：你需要关于“指向指针的指针”的相关知识：（因为当你传递一个指针到一个函数时，该函数可能会改变指针所指向的地址）该页只是为了让你了解“指向指针的指针”这一概念。但我并不推荐这种链式遍历的风格。因为，这种风格的代码，其可读性和可维护性太低。(2026-02-28)
- [x] [[d0dc9d2b-70ba-4578-8a5b-08a4b8970587|实现单向链表]] (2026-02-28)
- [ ] [UC San Diego - 单链表（视频）](https://www.coursera.org/lecture/data-structures/singly-linked-lists-kHhgK)
- [ ] [UC San Diego - 链表 vs 数组：核心差异（视频）](https://www.coursera.org/lecture/data-structures-optimizing-performance/core-linked-lists-vs-arrays-rjBs9)
- [ ] [UC San Diego - 链表 vs 数组：现实世界应用（视频）](https://www.coursera.org/lecture/data-structures-optimizing-performance/in-the-real-world-lists-vs-arrays-QUaUd)
- [ ] [UC San Diego - 双向链表介绍（视频）](https://www.coursera.org/learn/data-structures/lecture/jpGKD/doubly-linked-lists) 并不需要实现。

### 堆栈（Stack）

- [x] [Michael Sambol - Stacks in 3 minutes](https://youtu.be/KcT3aVgrrpU) (2026-03-01)
- [ ] [UC San Diego - 堆栈](https://www.coursera.org/learn/data-structures/lecture/UdKzQ/stacks)

可以不实现，因为使用数组来实现是微不足道的事

### 队列（Queue）
- [x] [Michael Sambol - Queues in 3 minutes](https://youtu.be/D6gu-_tmEpQ) (2026-03-01)
- [ ] [圆形队列](https://en.wikipedia.org/wiki/Circular_buffer)
- [ ] [UC San Diego - 队列](https://www.coursera.org/learn/data-structures/lecture/EShpq/queue)
- [x] [[6D3CA959-D86D-4858-A53C-0B3983A685A0|实现队列]] (2026-03-04)

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
