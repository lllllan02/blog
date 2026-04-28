---
title: Redis 有序集合的底层实现和跳表原理
aliases: c959467a-dd3e-4bce-ac2f-58b635a1e24e
date: 2026-04-28 15:57:00
card: true
order:
tags:
  - interview
  - redis
  - cache
---

> **面试官**：Zset（有序集合）的底层实现是什么？详细讲讲跳表（Skip List）的原理。

## 面试回答

Redis 的 `Zset` 是一个有序、去重的数据结构，每个 member 绑定一个 score，Redis 会按照 score 排序。它的底层实现不是固定一种结构，而是会根据数据规模和元素大小选择不同编码。

当元素数量比较少、元素也比较短时，Redis 会使用 `listpack` 这种紧凑结构来节省内存。旧版本 Redis 使用的是 `ziplist`，新版本已经逐步换成 `listpack`。当数据量变大后，`Zset` 会转成 `skiplist + dict` 的组合：`dict` 用来根据 member 快速查 score，时间复杂度接近 O(1)；`skiplist` 用来按 score 维护有序性，支持范围查询、排名查询和插入删除，平均时间复杂度是 O(log N)。

跳表可以理解为“带多级索引的有序链表”。最底层链表保存所有节点，并且按 score 从小到大排列；上层链表是抽样出来的索引层，可以让查找过程跳过大量节点。查找时从最高层开始，如果下一个节点的 score 还没超过目标，就继续往右走；如果超过了，就下降一层。这样逐层逼近目标，平均可以把查找复杂度从普通链表的 O(N) 降到 O(log N)。

所以面试中可以总结为：`Zset` 小数据用紧凑编码省内存，大数据用 `dict + skiplist` 兼顾按 member 快速定位和按 score 有序范围查询。跳表的核心价值是用随机层数构建多级索引，以较低实现复杂度获得接近平衡树的平均性能。

## 系统讲解

### 底层编码

`Zset` 的逻辑模型是 `member -> score`，但它需要同时满足两个访问路径：

- 通过 member 判断是否存在、读取或更新 score。
- 通过 score 排序，支持范围查询、排名查询和 Top N 查询。

单一结构很难同时把这两类操作都做好，所以 Redis 在数据量变大后使用两种结构配合：

| 结构 | 作用 | 典型复杂度 |
| --- | --- | --- |
| `dict` | 保存 member 到 score 的映射，用于快速查找、去重和更新 | O(1) |
| `skiplist` | 按 score 和 member 排序，用于范围查询、排名和有序遍历 | 平均 O(log N) |

对于小 `Zset`，Redis 会优先使用 `listpack`。`listpack` 把 member 和 score 紧凑地连续存放，内存占用低，但查找需要顺序扫描，适合元素数量不多的场景。默认情况下，当元素数量超过配置阈值，或者单个元素长度超过阈值时，Redis 会把它转换成跳表编码。常见配置项是 `zset-max-listpack-entries` 和 `zset-max-listpack-value`。

### 跳表的数据结构

跳表由多层有序链表组成。最底层包含全部节点，越往上的层节点越少，像是在普通链表上加了多级索引。

Redis 跳表节点里最关键的信息包括：

- `score`：排序分数。
- `ele`：成员值。
- `backward`：后退指针，方便反向遍历。
- `level[]`：多层索引，每一层都有前进指针 `forward` 和跨度 `span`。

`span` 是 Redis 跳表里很重要的字段，它记录当前节点到下一节点之间跨过了多少个底层节点。借助 `span`，Redis 可以高效计算排名，比如 `ZRANK`、`ZREVRANK` 这类命令。

### 查找过程

假设要查找 score 为 `70` 的节点，跳表不会从底层链表头部一个个扫，而是从最高层开始向右走。

如果当前层的下一个节点 score 小于目标，就继续向右；如果下一个节点 score 大于目标，就下降一层。这个过程不断重复，直到到达最底层并定位目标位置。

可以用一段伪代码理解：

```text
x = header
for level from top to bottom:
    while x.forward[level] != null and x.forward[level].score < target:
        x = x.forward[level]

return x.forward[0]
```

真实 Redis 还要处理 score 相同的情况。`Zset` 的排序规则是先按 score 排序，如果 score 相同，再按 member 的字典序排序。这样即使多个 member 分数相同，也能得到稳定的全序关系。

### 插入过程

插入节点时，Redis 先像查找一样找到每一层的前驱节点，然后为新节点随机生成一个层数。层数越高，概率越低。Redis 中跳表层数的生成近似遵循概率分布，默认提升概率是 `0.25`，最大层数是 `32`。

简化后的随机层数逻辑可以写成：

```c
int randomLevel(void) {
    int level = 1;

    while (random() < 0.25 && level < 32) {
        level++;
    }

    return level;
}
```

这意味着大部分节点只在底层出现，少量节点会出现在更高层，极少数节点能成为高层索引。跳表不需要像红黑树那样通过旋转维持严格平衡，而是依靠随机化让整体高度保持在 O(log N) 的期望范围内。

### 为什么不用普通链表或平衡树

普通链表实现有序集合很直观，但查找插入位置和范围起点都需要 O(N)，数据量上来后性能不够。

平衡树也能实现 O(log N) 的查找、插入和删除，但实现复杂度更高。Redis 选择跳表，主要是因为跳表在范围查询上非常自然：找到范围起点后，沿底层链表顺序向后遍历即可。同时，跳表实现和调试成本较低，配合 `span` 也能高效支持排名。

这不是说跳表一定优于平衡树，而是它很适合 Redis `Zset` 的操作模型：大量范围查询、排名查询和顺序遍历，同时需要相对简单、可维护的实现。

### 命令示例

下面这些命令背后都依赖 `Zset` 的去重、有序和范围查询能力：

```redis
# 写入排行榜分数
ZADD rank:weekly 9800 user:42
ZADD rank:weekly 9600 user:18
ZADD rank:weekly 9900 user:7

# 查询 Top 3
ZREVRANGE rank:weekly 0 2 WITHSCORES

# 查询某个用户排名
ZREVRANK rank:weekly user:42

# 查询指定分数区间
ZRANGEBYSCORE rank:weekly 9500 10000 WITHSCORES
```

`dict` 让 Redis 能快速判断 `user:42` 是否已存在，`skiplist` 则让 Redis 能按照分数顺序取 Top N、分数区间和排名。

### 常见追问

**追问：`Zset` 为什么需要同时使用 `dict` 和 `skiplist`？**

因为它们解决的问题不同。`dict` 负责通过 member 快速定位 score，适合判断存在、更新分数和去重；`skiplist` 负责维护 score 的有序关系，适合范围查询和排名。如果只用跳表，通过 member 查找会变慢；如果只用哈希表，就无法高效按 score 排序。

**追问：跳表的时间复杂度是多少？**

跳表查找、插入、删除的平均时间复杂度是 O(log N)，范围查询通常是 O(log N + M)，其中 M 是返回的元素数量。最坏情况下跳表可能退化，但随机层数让这种情况概率很低。

**追问：score 相同的时候怎么排序？**

Redis 会先按 score 排序，score 相同再按 member 的字典序排序。因此 `Zset` 内部仍然能形成稳定的全序关系，这对范围查询和排名计算很重要。

**追问：Redis 小 `Zset` 为什么不用跳表？**

跳表节点需要保存多层指针、后退指针和跨度信息，小数据量下这些元数据开销不划算。`listpack` 连续紧凑存储，虽然查找是顺序扫描，但元素很少时性能足够，并且更省内存。

## 参考资料

### 官方资料

> [Redis Sorted Sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/) (Redis Documentation, 访问于 2026-04-28)

这篇官方文档介绍 `Zset` 的使用模型和典型命令，适合从使用层理解 member、score、范围查询和排名查询。

> [Redis configuration file](https://github.com/redis/redis/blob/unstable/redis.conf) (Redis, 访问于 2026-04-28)

配置文件中可以看到 `zset-max-listpack-entries`、`zset-max-listpack-value` 等阈值，适合理解 `Zset` 为什么会在紧凑编码和跳表编码之间转换。

### 源码资料

> [Redis t_zset.c](https://github.com/redis/redis/blob/unstable/src/t_zset.c) (Redis, 访问于 2026-04-28)

`t_zset.c` 包含 `Zset` 命令、跳表插入删除、范围查询和编码转换逻辑，是理解 `Zset` 底层实现最直接的入口。

> [Redis server.h](https://github.com/redis/redis/blob/unstable/src/server.h) (Redis, 访问于 2026-04-28)

这里定义了跳表相关结构体，例如 `zskiplist`、`zskiplistNode` 和层级节点结构，适合对照理解 `forward`、`span`、`backward` 等字段。
