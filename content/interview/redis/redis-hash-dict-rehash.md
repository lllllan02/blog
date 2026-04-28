---
title: Redis Hash 字典的底层实现和渐进式 rehash
aliases: 653edb98-7548-4e9f-8c5e-6f91ce1af6d3
date: 2026-04-28 16:02:00
card: true
order:
tags:
  - interview
  - redis
  - cache
---

> **面试官**：Hash 字典的底层实现是什么？Redis 的渐进式 rehash 是怎么做的？

## 面试回答

Redis 里的字典 `dict` 是很多结构的底层基础，不只服务于 `Hash` 类型，也用于全局键空间、过期字典、`Set`、`Zset` 里的 member 查找等场景。它的核心实现是哈希表，底层由数组加链表组成：数组保存桶，桶里挂着 `dictEntry` 链表，用来解决哈希冲突。

Redis 字典里比较关键的一点是，它内部有两个哈希表 `ht[0]` 和 `ht[1]`。正常情况下只使用 `ht[0]`；当需要扩容或缩容时，Redis 会给 `ht[1]` 分配新表，然后进入 rehash 状态。所谓渐进式 rehash，就是不一次性把旧表所有数据迁移到新表，而是把迁移过程分摊到后续的增删改查操作中，每次迁移一小部分桶。

在 rehash 期间，查询会同时查 `ht[0]` 和 `ht[1]`，新增数据只写入 `ht[1]`，删除和更新也要兼顾两张表。随着 `rehashidx` 不断向后推进，旧表的数据逐步迁移完，最后释放 `ht[0]`，把 `ht[1]` 变成新的 `ht[0]`。这样做的核心目的，是避免大字典一次性 rehash 阻塞 Redis 主线程，降低单次操作的延迟尖刺。

## 系统讲解

### 字典结构

Redis 字典的核心结构可以简化理解为三层：

| 结构 | 作用 |
| --- | --- |
| `dict` | 字典对象本身，保存两个哈希表和 rehash 进度 |
| `dictht` | 一个具体哈希表，包含桶数组、表大小、已用节点数 |
| `dictEntry` | 哈希表节点，保存键值对和冲突链表的下一个节点 |

简化后的结构大致如下：

```c
typedef struct dictEntry {
    void *key;
    void *val;
    struct dictEntry *next;
} dictEntry;

typedef struct dictht {
    dictEntry **table;
    unsigned long size;
    unsigned long used;
} dictht;

typedef struct dict {
    dictht ht[2];
    long rehashidx;
} dict;
```

真实 Redis 源码会更复杂，例如 `dictEntry` 的值支持不同类型，`dict` 里还有类型函数、私有数据、迭代器计数等字段。但面试时抓住主干即可：`dict` 用两个哈希表承载渐进式 rehash，`dictht` 管理桶数组，`dictEntry` 保存键值对并通过 `next` 解决冲突。

### 哈希冲突怎么处理

Redis 字典使用链地址法处理哈希冲突。多个 key 如果映射到同一个桶，就会形成一个 `dictEntry` 链表。插入时通常把新节点放到链表头部，这样不需要遍历到链表尾部。

查找一个 key 时，Redis 先根据哈希值和表大小计算桶下标，然后沿着桶里的链表逐个比较 key。理想情况下，哈希分布均匀，链表很短，查找接近 O(1)。如果哈希冲突过多，链表变长，查找会退化，所以 Redis 需要在负载因子变高时扩容。

### 什么时候触发 rehash

字典是否需要扩容，主要看负载因子，也就是 `used / size`。当哈希表里元素越来越多，而桶数组太小时，冲突概率会上升，Redis 就需要扩容并重新分布元素。

常见规则可以概括为：

- 没有执行后台持久化任务时，负载因子大于等于 `1`，通常可以扩容。
- 正在执行 `BGSAVE` 或 `BGREWRITEAOF` 时，Redis 会更谨慎，通常等负载因子更高才扩容，避免触发大量写时复制。
- 当元素数量明显少于桶数量时，Redis 也可能触发缩容，减少内存浪费。

扩容后的表大小通常会选择大于等于目标元素数的 `2` 的幂。这样计算桶下标可以使用位运算，代替相对更慢的取模运算。

### 渐进式迁移过程

如果一次性把几百万个键从旧表搬到新表，Redis 主线程会长时间停在 rehash 上，其他客户端请求就会被阻塞。渐进式 rehash 的设计就是把这件事拆散。

整个过程可以分成四步：

1. 为 `ht[1]` 分配新哈希表。
2. 将 `rehashidx` 设为 `0`，表示 rehash 开始。
3. 后续每次执行字典操作时，从 `ht[0]` 的 `rehashidx` 位置开始，迁移若干个非空桶到 `ht[1]`，然后推进 `rehashidx`。
4. 当 `ht[0].used` 变为 `0`，释放旧表，将 `ht[1]` 变成新的 `ht[0]`，并把 `rehashidx` 设回 `-1`。

可以用伪代码理解这个过程：

```c
int dictRehash(dict *d, int n) {
    while (n-- && d->ht[0].used != 0) {
        while (d->ht[0].table[d->rehashidx] == NULL) {
            d->rehashidx++;
        }

        dictEntry *entry = d->ht[0].table[d->rehashidx];
        while (entry != NULL) {
            dictEntry *next = entry->next;
            moveEntryToNewTable(d, entry);
            entry = next;
        }

        d->ht[0].table[d->rehashidx] = NULL;
        d->rehashidx++;
    }

    return d->ht[0].used == 0;
}
```

这段代码省略了很多源码细节，但表达了关键思路：每次只迁移有限数量的桶，迁移完一个桶再推进 `rehashidx`。

### rehash 期间怎么读写

渐进式 rehash 期间，字典同时存在旧表和新表，所以读写规则要稍微调整。

查询时，Redis 会先查 `ht[0]`，没找到再查 `ht[1]`。因为一部分旧数据还没有迁移完，单查新表会漏数据。

新增时，Redis 会直接写入 `ht[1]`。这样可以保证新数据不会继续堆到旧表里，让旧表只减不增，最终能够完成迁移。

删除和更新时，Redis 需要在两张表里查找目标 key。目标可能还在旧表，也可能已经迁移到新表。这个规则保证了 rehash 对上层命令基本透明。

### 和 Hash 类型的关系

面试题里说的 `Hash` 容易产生歧义：如果问的是 Redis 的哈希表实现，重点就是 `dict` 和渐进式 rehash；如果问的是 Redis `Hash` 数据类型，还要补充编码转换。

Redis `Hash` 类型在字段较少、字段和值都较短时，底层通常使用 `listpack` 这类紧凑编码，节省内存。数据规模变大后，才会转换为哈希表编码，也就是使用 `dict` 来保存 field 到 value 的映射。相关阈值通常由 `hash-max-listpack-entries` 和 `hash-max-listpack-value` 控制。

所以更完整的回答是：Redis `Hash` 类型小数据用 `listpack`，大数据用 `dict`；而 `dict` 本身通过哈希表、链地址法和渐进式 rehash 来兼顾查询性能与主线程延迟。

### 常见追问

**追问：为什么 Redis 不一次性完成 rehash？**

因为 Redis 命令主要由主线程执行，一次性迁移大哈希表会阻塞事件循环，导致请求延迟突然升高。渐进式 rehash 把迁移成本分摊到多次操作里，牺牲一段时间内的少量额外查找成本，换取更平滑的延迟。

**追问：rehash 期间查询为什么要查两张表？**

因为迁移不是瞬间完成的，同一时刻有些 key 还在旧表，有些 key 已经在新表。只查一张表会出现误判，所以 Redis 在 rehash 期间会同时检查 `ht[0]` 和 `ht[1]`。

**追问：渐进式 rehash 会不会一直迁移不完？**

正常不会。新增 key 只进入 `ht[1]`，旧表不会继续增长；同时 Redis 会在字典操作中推进迁移，并且也有周期性任务帮助推进 rehash。只要 Redis 还在处理请求或执行周期任务，旧表最终会被迁移完。

**追问：负载因子越低越好吗？**

不是。负载因子低可以减少冲突，但会占用更多桶数组内存。Redis 需要在查询效率和内存占用之间取平衡，所以才会根据负载因子、后台持久化状态和表大小决定是否扩容或缩容。

## 参考资料

### 官方资料

> [Redis Hashes](https://redis.io/docs/latest/develop/data-types/hashes/) (Redis Documentation, 访问于 2026-04-28)

这篇官方文档介绍 `Hash` 类型的使用模型和常见命令，适合先从 field-value 结构理解它的业务语义。

> [Redis configuration file](https://github.com/redis/redis/blob/unstable/redis.conf) (Redis, 访问于 2026-04-28)

配置文件中可以看到 `hash-max-listpack-entries`、`hash-max-listpack-value` 等阈值，适合理解 `Hash` 类型为什么会在紧凑编码和哈希表编码之间转换。

### 源码资料

> [Redis dict.c](https://github.com/redis/redis/blob/unstable/src/dict.c) (Redis, 访问于 2026-04-28)

`dict.c` 是理解 Redis 字典实现的核心入口，包含哈希表初始化、扩容、渐进式 rehash、查找、插入和删除逻辑。

> [Redis dict.h](https://github.com/redis/redis/blob/unstable/src/dict.h) (Redis, 访问于 2026-04-28)

`dict.h` 定义了 `dict`、`dictht` 和 `dictEntry` 等关键结构，适合和 `dict.c` 对照阅读。
