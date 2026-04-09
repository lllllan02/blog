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

# 缓存 (Redis) 面试题库

这里记录了 Redis 及缓存架构相关的核心面试题：

## 数据结构与底层原理
- [ ] Redis 有哪些常用的数据类型（String、List、Hash、Set、Zset）？它们的应用场景？
- [ ] String 类型的底层实现（SDS）是什么？相比 C 语言字符串有什么优势？
- [ ] Zset（有序集合）的底层实现是什么？详细讲讲跳表（Skip List）的原理。
- [ ] Hash 字典的底层实现？Redis 的渐进式 rehash 是怎么做的？
- [ ] 为什么 Redis 单线程还能保持这么高的性能？
- [ ] Redis 6.0 之后为什么引入了多线程？

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
