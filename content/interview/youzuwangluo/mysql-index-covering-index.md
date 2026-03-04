---
title: 7. MySQL 索引，索引覆盖
aliases: FA1EC0BB-7867-4FB9-9918-683250A6139F
date: 2026-03-04 16:21:01
tags: [interview, mysql, database, index]
card: true
order: 7
---

## 问题分析

这道题考察的是 MySQL 数据库的核心性能优化机制。面试官通常希望了解：
1.  **索引的数据结构**：为什么用 B+ 树？
2.  **聚簇索引与非聚簇索引的区别**：数据存在哪里？
3.  **什么是“回表”**：这是理解索引覆盖的前提。
4.  **索引覆盖 (Covering Index)**：如何利用它避免回表，从而提升查询性能。

## 核心解答

### 口语回答

**关于 MySQL 索引**：
MySQL 的 InnoDB 引擎默认使用 **B+ 树**作为索引结构。
它的特点是：非叶子节点只存索引键，叶子节点存数据（或主键），并且叶子节点之间有双向指针连接，适合范围查询。

**关于索引覆盖**：
要解释索引覆盖，先得说“**回表**”。
在 InnoDB 中，如果我们通过普通索引（二级索引）查询数据，通常需要先在二级索引树上找到主键 ID，然后再拿着 ID 去主键索引树（聚簇索引）上找完整的行数据，这个过程叫“回表”。

**索引覆盖**就是指：**查询的所有列，都能在索引树上直接找到，不需要再去回表查数据**。
比如，我有一个联合索引 `(age, name)`。如果我执行 `select name from user where age = 20`，因为 `name` 就在索引树上，引擎直接返回结果就行，不用回表，速度非常快。

### Core Key Takeaways

#### 1. 索引类型 (InnoDB)

*   **聚簇索引 (Clustered Index)**:
    *   通常是主键 (Primary Key)。
    *   叶子节点存储**完整的行数据**。
    *   一张表只能有一个。
*   **二级索引 (Secondary Index)**:
    *   普通索引、唯一索引、联合索引。
    *   叶子节点存储 **索引列 + 主键 ID**。
    *   通常需要**回表 (Lookback)** 才能拿到完整数据。

#### 2. 索引覆盖 (Covering Index)

*   **定义**: SQL 查询的所有列（`SELECT` + `WHERE`）都包含在同一个索引中。
*   **优势**: 避免回表，减少 I/O 操作，极大提升性能。
*   **Extra**: `EXPLAIN` 结果中 `Extra` 字段显示 `Using index`。

## 详细解析

### 1. B+ 树结构简述

MySQL 选用 B+ 树而不是 Hash 或二叉树，是因为：
*   **磁盘 I/O 优化**: 树高通常只有 3 层，意味着只需 3 次 I/O 就能找到数据。
*   **范围查询**: 叶子节点通过链表连接，`WHERE age > 10` 这种查询非常高效。

### 2. 回表 vs 索引覆盖

假设有一张表 `users`：
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(20),
  age INT,
  city VARCHAR(20),
  INDEX idx_age_name (age, name)  -- 联合索引
) ENGINE=InnoDB;
```

#### 场景 A：需要回表
```sql
SELECT city FROM users WHERE age = 20;
```
1.  **搜索 `idx_age_name`**: 找到 `age=20` 的节点，拿到主键 `id`。
2.  **检查**: 索引里只有 `age` 和 `name`，没有 `city`。
3.  **回表**: 拿着 `id` 去主键索引树查找，获取 `city`。

#### 场景 B：索引覆盖 (Covering Index)
```sql
SELECT name, id FROM users WHERE age = 20;
```
1.  **搜索 `idx_age_name`**: 找到 `age=20` 的节点。
2.  **检查**: 我们要找 `name` 和 `id`。
    *   `name`: 在联合索引中。
    *   `id`: 二级索引叶子节点天然包含主键。
3.  **直接返回**: 不需要去主键树了。
    *   **EXPLAIN 输出**: `Extra: Using index`。

### 3. 最佳实践

*   **避免 `SELECT *`**: `SELECT *` 几乎一定会导致回表（除非你的索引包含了所有列，这不现实）。只查需要的列，增加命中索引覆盖的几率。
*   **合理设计联合索引**: 将频繁作为查询条件 (`WHERE`) 和查询结果 (`SELECT`) 的列建立联合索引。
    *   例如：经常按 `create_time` 排序并查询 `order_id`，可以建 `(create_time, order_id)` 索引。

## 扩展知识

### 最左前缀原则 (Leftmost Prefix Rule)
对于联合索引 `(a, b, c)`：
*   `WHERE a=1 AND b=2`: **走索引**。
*   `WHERE a=1`: **走索引**。
*   `WHERE b=2`: **不走索引** (跳过了 a)。
*   `WHERE a=1 AND c=3`: **a 走索引**，c 不走（中间断了）。

### 索引下推 (Index Condition Pushdown - ICP)
MySQL 5.6+ 的优化。
*   **以前**: 存储引擎遍历索引，把数据拿出来给 Server 层，Server 层再过滤 `WHERE` 条件。
*   **ICP**: 存储引擎在遍历索引时，如果索引包含 `WHERE` 条件中的列，就直接过滤掉不满足条件的记录，减少回表次数。
