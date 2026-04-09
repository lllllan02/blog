---
title: 面试题与知识点总览
aliases: 11a3aeb2-8ea2-4ad3-961a-ea92ec3e1645
date: 2026-04-09 16:15:48
card: false
order:
tags: 
  - interview
  - golang
  - backend
---

# 后端与 Golang 面试专题总览

为了更好地系统性复习，我们将面试知识点划分为以下几大核心专题。每个专题下包含具体的面试题与解析。

## 面试专题

- [[0ef1f46b-c498-4adb-9e8a-f78bb863a344|Golang 面试题库]]
  - 基础语法、数据结构（Slice、Map、Channel 等）
  - 并发编程（Goroutine、GMP 模型、Context 等）
  - 内存管理（逃逸分析、垃圾回收 GC）
- [[68f54767-f53c-4233-8014-7225fd3c647b|数据库 (MySQL) 面试题库]]
  - MySQL 索引、事务、锁机制、MVCC
  - SQL 优化、分库分表
- [[55ce804a-9361-450a-9431-f4c5bc6ba825|缓存 (Redis) 面试题库]]
  - Redis 数据结构与底层原理
  - 缓存穿透、击穿、雪崩
  - 持久化（RDB/AOF）、高可用架构（哨兵、集群）
- [[cd05d7eb-692a-49ce-85f0-d2d600723dca|计算机网络面试题库]]
  - TCP/IP 协议（三次握手、四次挥手、拥塞控制）
  - HTTP/HTTPS、WebSocket
- [[dd44de47-0ddd-4e0d-a43e-be670a012f65|操作系统与 Linux 面试题库]]
  - 进程与线程、死锁、内存管理
  - Linux 常用命令、I/O 多路复用（Epoll）
- [[4c70c6c7-3e63-49c2-9895-51a56d573e4e|消息队列 (MQ) 面试题库]]
  - Kafka、RabbitMQ、RocketMQ
  - 消息丢失、重复消费、顺序消费问题
- [[0688333e-caa9-410f-b517-3c2ab2b26243|系统设计与架构面试题库]]
  - 分布式理论（CAP、BASE）、分布式锁、分布式事务
  - 高并发架构设计（秒杀系统、Feed 流等）
  - 微服务架构
- [[fb33ca19-6721-4ae5-a5c7-c1322e658aa0|算法与数据结构面试题库]]
  - 常见排序算法、树、图
  - 动态规划、贪心算法、回溯算法

## 优质开源面试资源库

如果你需要寻找更多的题库和系统性资料，以下是整理的顶级开源资源：

### Golang 专属面试库

1. **[iswbm/golang-interview](https://github.com/iswbm/golang-interview)**
   - **简介**：Go 语言面试宝典，系统性强，分为基础篇、进阶篇、原理篇。
2. **[xiaobaiTech/golangFamily](https://github.com/xiaobaiTech/golangFamily)**
   - **简介**：超全 Golang 面试题合集（近 7k Stars），对标大厂资深后端开发水平。
3. **[metrue/interview-go](https://github.com/metrue/interview-go)**
   - **简介**：Golang 常见面试题集合，包含 GMP 调度器等核心考点。
4. **[Seekload/go-interview](https://github.com/Seekload/go-interview)**
   - **简介**：以“每天 15 分钟，掌握 Go 语言”为主题的面试题集。
5. **[menggggggg/go-interview](https://github.com/menggggggg/go-interview)**
   - **简介**：Golang 面试资料汇总，涵盖调度器、并发模型等深度内容。

### 后端通用与架构设计

1. **[0voice/interview_internal_reference](https://github.com/0voice/interview_internal_reference)**
   - **简介**：大厂面试内部参考资料（3.7w+ Stars），涵盖 20 个后端核心专题。
2. **[yongxinz/back-end-interview](https://github.com/yongxinz/back-end-interview)**
   - **简介**：持续维护的后端面试题库，包含秒杀系统、短链服务等经典系统设计案例。
3. **[liyupi/mianshiya-public](https://github.com/liyupi/mianshiya-public)**
   - **简介**：面试鸭 - 开源刷题网站（5k+ Stars），涵盖 9000+ 高频面试题。
4. **[gaufung/Backend-Interview](https://github.com/gaufung/Backend-Interview)**
   - **简介**：系统化的后端面试指南，覆盖 15 个后端开发主题。
5. **[KrisCheng/500-interview-question-for-programmers](https://github.com/KrisCheng/500-interview-question-for-programmers)**
   - **简介**：程序员 500 道面试题，基于大公司实际面试题整理。

### 优质在线网站与博客

- **[Go 语言设计与实现](https://draveness.me/golang/)**：深入理解 Go 语言底层的必读在线书籍，进阶必备。
- **[小林 coding](https://xiaolincoding.com/)**：图解网络、图解系统、图解 MySQL、图解 Redis，后端基础八股文神器。
- **[System Design Primer](https://github.com/donnemartin/system-design-primer)**：系统设计入门与面试必备（全球最火的系统设计开源仓库之一）。