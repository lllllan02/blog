---
title: Redis 常用数据类型及应用场景
aliases: f3b70409-86bc-4e2c-a404-a5d4d6e8dda3
date: 2026-04-28 15:35:10
card: true
order:
tags:
  - interview
  - redis
  - cache
---

> **面试官**：Redis 有哪些常用的数据类型？它们分别适合什么应用场景？

## 面试回答

Redis 常用的数据类型主要有 `String`、`List`、`Hash`、`Set` 和 `Zset`。回答这类问题时，不能只背类型名称，更重要的是说明它们解决的是什么数据建模问题。

`String` 是最基础的类型，可以存字符串、整数、二进制数据，常用于缓存对象、计数器、分布式锁里的锁值。`List` 是有序列表，适合做消息队列、任务队列、时间线这类按插入顺序处理的数据。`Hash` 适合存对象的多个字段，比如用户信息、商品信息，字段级读写比把整个对象序列化成字符串更灵活。`Set` 是无序去重集合，适合做标签、共同好友、点赞去重、抽奖去重。`Zset` 是带分数的有序集合，适合排行榜、延迟队列、按时间排序的动态列表。

简单总结，选 Redis 数据类型时看三个维度：是否需要顺序、是否需要去重、是否需要按分数排序。如果只是键值缓存，用 `String`；如果是对象字段，用 `Hash`；如果要保持插入顺序，用 `List`；如果要去重，用 `Set`；如果要排序和范围查询，用 `Zset`。

## 系统讲解

### 核心对比

| 类型 | 数据特征 | 常见命令 | 典型场景 |
| --- | --- | --- | --- |
| `String` | 单个值，最大可存储 512 MB，值可以是字符串、整数或二进制内容 | `SET`、`GET`、`INCR`、`SETNX` | 缓存、计数器、限流计数、分布式锁值 |
| `List` | 按插入顺序排列，可从两端读写 | `LPUSH`、`RPUSH`、`LPOP`、`BRPOP` | 任务队列、消息队列、最新动态列表 |
| `Hash` | 一个键下面有多个字段和值 | `HSET`、`HGET`、`HMGET`、`HINCRBY` | 用户对象、商品对象、购物车 |
| `Set` | 无序、自动去重，支持集合运算 | `SADD`、`SISMEMBER`、`SINTER`、`SUNION` | 标签、共同好友、点赞去重、黑名单 |
| `Zset` | 去重成员加分数，按分数有序 | `ZADD`、`ZRANGE`、`ZREVRANGE`、`ZRANGEBYSCORE` | 排行榜、延迟队列、按时间排序的 Feed |

### 类型选择思路

如果业务只需要通过一个 key 找到一个 value，优先使用 `String`。例如缓存登录态、缓存 JSON 字符串、记录文章阅读数。`String` 还支持原子自增，所以计数器和固定窗口限流也经常用它实现。

如果业务数据本身是一个对象，并且经常只读写其中部分字段，`Hash` 会更合适。例如用户资料有昵称、头像、积分等字段，使用 `Hash` 可以单独更新积分，不必每次读出整个 JSON 再写回。

如果业务关注插入顺序，使用 `List`。典型例子是任务队列：生产者用 `LPUSH` 写入任务，消费者用 `BRPOP` 阻塞读取任务。不过在更严格的消息队列场景里，还要考虑消息确认、重试和消费组，这时 Redis 的 `Stream` 通常比 `List` 更合适。

如果业务核心是去重和集合运算，使用 `Set`。例如判断用户是否点赞、统计共同关注、维护某个活动的参与用户集合。`Set` 的优势不是排序，而是成员唯一和交并差运算。

如果业务既要去重，又要按某个权重排序，使用 `Zset`。排行榜通常把用户 ID 作为 member，把分数作为 score；延迟队列通常把任务 ID 作为 member，把执行时间戳作为 score，然后按 score 范围取出到期任务。

### 代码示例

下面用 Redis 命令展示几个典型建模方式：

```redis
# String：文章阅读数
INCR article:1001:views
GET article:1001:views

# Hash：用户对象字段
HSET user:42 name "Alice" score 100
HINCRBY user:42 score 10
HGETALL user:42

# Set：点赞去重
SADD article:1001:liked_users 42
SISMEMBER article:1001:liked_users 42

# Zset：排行榜
ZADD rank:weekly 9800 user:42
ZREVRANGE rank:weekly 0 9 WITHSCORES
```

### 常见追问

**追问：缓存对象时，应该用 `String` 存 JSON，还是用 `Hash`？**

如果对象经常整体读写，用 `String` 存 JSON 更直接，序列化和反序列化也方便。如果对象字段很多，并且经常只更新某几个字段，用 `Hash` 更合适，因为它支持字段级读写。实际项目里还要考虑一致性和复杂度：`Hash` 字段粒度更细，但如果业务层仍然需要完整对象，过度拆字段可能反而增加维护成本。

**追问：为什么排行榜通常用 `Zset`？**

排行榜需要两个能力：用户不能重复上榜，并且要按分数排序。`Zset` 正好同时满足这两个条件。member 保证唯一，score 用来排序，`ZREVRANGE` 可以取 Top N，`ZRANK` 或 `ZREVRANK` 可以查询某个用户的排名。

**追问：Redis 只有这五种数据类型吗？**

不是。除了这五种基础类型，Redis 还提供 `Bitmap`、`HyperLogLog`、`Geo`、`Stream` 等结构。面试中先讲清楚五种基础类型，再补充这些扩展结构，会显得回答更完整，但不要把它们混在一起背成一串命令列表。
