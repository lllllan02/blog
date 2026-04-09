---
title: 消息队列 (MQ) 面试题库
aliases: 4c70c6c7-3e63-49c2-9895-51a56d573e4e
date: 2026-04-09 16:31:16
card: false
tags:
  - interview
  - mq
  - kafka
---

# 消息队列 (MQ) 面试题库

这里记录了分布式消息队列（如 Kafka、RabbitMQ、RocketMQ）相关的核心面试题：

## 基础与架构选型
- [ ] 为什么需要使用消息队列？（核心作用：解耦、异步、削峰）
- [ ] 引入消息队列会带来哪些问题？（系统可用性降低、复杂性提高、一致性问题）
- [ ] Kafka、RabbitMQ、RocketMQ 的优缺点对比与技术选型？
- [ ] 什么是 Push 模式和 Pull 模式？各自的优缺点？

## 消息可靠性与一致性
- [ ] 如何保证消息不丢失？（生产端、Broker端、消费端分别如何处理）
- [ ] 如何处理消息重复消费的问题？（如何保证消息消费的幂等性）
- [ ] 如何保证消息的顺序消费？（全局有序 vs 局部有序）
- [ ] 什么是死信队列（DLQ）和延迟队列？如何实现延迟队列？
- [ ] 消息队列积压了大量消息，应该如何处理和优化？
- [ ] 什么是分布式事务消息？RocketMQ 是如何实现事务消息的？

## Kafka 深度原理
- [ ] Kafka 的整体架构是怎样的（Producer、Broker、Consumer、Topic、Partition、ZooKeeper/KRaft）？
- [ ] Kafka 为什么吞吐量这么高？（顺序读写、零拷贝、PageCache、批量发送）
- [ ] 什么是 Kafka 的 ISR（In-Sync Replicas）机制？
- [ ] Kafka 的 HW（High Watermark）和 LEO（Log End Offset）是什么？
- [ ] Kafka 的消费者组（Consumer Group）和 Rebalance（重平衡）机制是怎样的？
- [ ] Kafka 中的消息是如何存储的（Segment、.log、.index、.timeindex）？
