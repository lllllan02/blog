---
title: Jwasham's Coding Interview University
aliases: 502d7f84-161b-458a-ab7d-956d6d949cf0
date: 2026-01-28 21:24:36
order:
tags:
---

> https://github.com/jwasham/coding-interview-university

## 算法复杂度 / Big-O

- [x] [哈佛大学CS50 - 渐进符号（视频）](https://www.youtube.com/watch?v=iOq5kSKqeR4) (2026-01-28)
- [x] [大O符号（通用快速教程）（视频）](https://www.youtube.com/watch?v=V6mKVRU1evU)
- [ ] [大O符号（以及Ω和Θ）- 最佳数学解释（视频）](https://www.youtube.com/watch?v=ei-A_wy5Yxw&index=2&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN)
- [ ] [Skiena（视频）](https://www.youtube.com/watch?v=z1mkCe3kVUA)
- [ ] [加州大学伯克利分校关于大O符号（视频）](https://archive.org/details/ucberkeley_webcast_VIS4YDpuP98)
- [x] [摊还分析（视频）](https://www.youtube.com/watch?v=B3SpQZaAZP4&index=10&list=PL1BaGV1cIH4UhkL8a9bJGG356covJ76qN) (2026-01-29)
- [ ] TopCoder（包括递归关系和主定理）：
    - [计算复杂性：第1部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20one)
    - [计算复杂性：第2部分](https://www.topcoder.com/thrive/articles/Computational%20Complexity%20part%20two)
- [ ] [速查表](http://bigocheatsheet.com/)
- [x] [[回顾] 在 18 分钟内分析算法（播放列表）（视频）](https://www.youtube.com/playlist?list=PL9xmBV_5YoZMxejjIyFHWa-4nKg6sdoIv) (2026-01-29)

## 数据结构

### 数组（Arrays）
> 介绍：
- [x] [数组 CS50 哈佛大学](https://www.youtube.com/watch?v=tI_tIZFyKBw&t=3009s) (2026-01-29)
- [ ] [数组（视频）](https://www.coursera.org/lecture/data-structures/arrays-OsBSF)
- [ ] [加州大学伯克利分校CS61B - 线性和多维数组（视频）](https://archive.org/details/ucberkeley_webcast_Wp8oiO_CZZE)（从15分32秒开始）
- [ ] [动态数组（视频）](https://www.coursera.org/lecture/data-structures/dynamic-arrays-EwbnV)
- [ ] [嵌套数组（视频）](https://www.youtube.com/watch?v=1jtrQqYpt7g)

> 实现一个动态数组（可自动调整大小的可变数组）：
- [ ] 练习使用数组和指针去编码，并且指针是通过计算去跳转而不是使用索引
- [ ] 通过分配内存来新建一个原生数据型数组
    - 可以使用 int 类型的数组，但不能使用其语法特性
    - 从大小为16或更大的数（使用2的倍数 —— 16、32、64、128）开始编写
- [ ] size() —— 数组元素的个数
- [ ] capacity() —— 可容纳元素的个数
- [ ] is_empty()
- [ ] at(index) —— 返回对应索引的元素，且若索引越界则愤然报错
- [ ] push(item)
- [ ] insert(index, item) —— 在指定索引中插入元素，并把后面的元素依次后移
- [ ] prepend(item) —— 可以使用上面的 insert 函数，传参 index 为 0
- [ ] pop() —— 删除在数组末端的元素，并返回其值
- [ ] delete(index) —— 删除指定索引的元素，并把后面的元素依次前移
- [ ] remove(item) —— 删除指定值的元素，并返回其索引（即使有多个元素）
- [ ] find(item) —— 寻找指定值的元素并返回其中第一个出现的元素其索引，若未找到则返回 -1
- [ ] resize(new_capacity) // 私有函数
    - 若数组的大小到达其容积，则变大一倍
    - 获取元素后，若数组大小为其容积的1/4，则缩小一半

> 时间复杂度
- [ ] 在数组末端增加/删除、定位、更新元素，只允许占 O(1) 的时间复杂度（平摊（amortized）去分配内存以获取更多空间）
- [ ] 在数组任何地方插入/移除元素，只允许 O(n) 的时间复杂度

> 空间复杂度
- [ ] 因为在内存中分配的空间邻近，所以有助于提高性能
- [ ] 空间需求 = （大于或等于 n 的数组容积）* 元素的大小。即便空间需求为 2n，其空间复杂度仍然是 O(n)