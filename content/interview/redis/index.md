---
title: 缓存 (Redis) 面试题库
aliases: 55ce804a-9361-450a-9431-f4c5bc6ba825
date: 2026-04-09 16:32:12
card: false
tags:
  - interview
  - redis
  - cache
---

这里记录了 Redis 及缓存架构相关的核心面试题：

## 数据结构与底层原理
- [x] [[f3b70409-86bc-4e2c-a404-a5d4d6e8dda3|Redis 常用数据类型及应用场景]]
- [x] [[85efc7eb-0a44-4b2a-9988-052e4a63bf3c|Redis 字符串的底层实现 SDS]]
- [x] [[c959467a-dd3e-4bce-ac2f-58b635a1e24e|Redis 有序集合的底层实现和跳表原理]]
- [x] [[653edb98-7548-4e9f-8c5e-6f91ce1af6d3|Redis Hash 字典的底层实现和渐进式 rehash]]
- [x] [[41d82f71-a80f-483e-aeb7-41925a793096|Redis 单线程高性能的原因]]
- [x] [[fb485302-7c6e-484d-ac7f-fa4c6280a4a6|Redis 引入多线程的原因]]

## 持久化与内存管理
- [ ] Redis 的持久化机制 RDB 和 AOF 有什么区别？各自的优缺点？
- [ ] 什么是 AOF 重写（bgrewriteaof）？
- [ ] Redis 的过期键删除策略有哪些（定时、定期、惰性）？
- [ ] Redis 的内存淘汰机制有哪些（LRU、LFU 等）？
- [ ] 讲讲 Redis 中的近似 LRU 算法是如何实现的？

## 缓存高并发问题
- [ ] 什么是缓存穿透？如何解决（布隆过滤器、空对象缓存）？
- [ ] 什么是缓存击穿？如何解决（互斥锁、逻辑过期）？
- [ ] 什么是缓存雪崩？如何解决（随机过期时间、高可用架构）？
- [ ] 如何保证数据库与缓存的双写一致性（Cache Aside Pattern、延迟双删等）？

## 分布式与高可用架构
- [ ] Redis 如何实现分布式锁？有哪些坑？
- [ ] 什么是 Redlock 算法？Redisson 是如何实现可重入锁和看门狗机制的？
- [ ] Redis 主从复制的原理是什么？什么是全量同步和增量同步？
- [ ] Redis 哨兵（Sentinel）模式的原理？它是如何进行故障转移的？
- [ ] Redis Cluster 集群模式的原理？什么是 Hash 槽（Hash Slot）？
- [ ] Redis 集群中节点之间是如何通信的（Gossip 协议）？
