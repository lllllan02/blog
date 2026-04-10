---
title: 什么是回表？什么是覆盖索引？
aliases: feb8b016-6c15-41bf-ae98-f5d403bc1b29
date: 2026-04-10 11:52:19
card: true
order:
tags: 
  - interview
  - database
  - mysql
---

> **面试官**：请问在 MySQL 中，什么是回表？什么是覆盖索引？

## 面试回答

“在 MySQL 的 InnoDB 引擎中，**回表**是指当我们通过二级索引（非聚簇索引）查询数据时，因为二级索引的叶子节点只存储了索引列的值和主键值，如果我们查询的列不完全包含在二级索引中，数据库就需要拿着查到的主键值，再回到主键索引（聚簇索引）的 B+ 树中去查一次，获取完整的行记录。这个‘回到主键索引查数据’的过程就叫回表。回表会增加一次 B+ 树的搜索，带来额外的磁盘 I/O 开销。

为了避免回表，我们可以使用**覆盖索引**。覆盖索引并不是一种新的索引结构，而是一种查询优化手段。如果一个查询语句中，所需要查询的所有列（包括 `SELECT` 的列和 `WHERE`、`ORDER BY` 等条件列）都已经被包含在一个二级索引中，那么 InnoDB 就可以直接从这个二级索引的叶子节点中获取所需数据，而不需要再去查主键索引。这就叫覆盖索引。使用覆盖索引能大大减少磁盘 I/O，是 SQL 性能优化的常用手段。”

## 系统讲解

### 核心对比

| 概念 | 含义 | 性能影响 | 触发条件 |
| --- | --- | --- | --- |
| **回表 (Lookup)** | 通过二级索引找到主键值后，再回到主键索引查询完整行记录的过程。 | 增加了一次 B+ 树查询，导致额外的磁盘 I/O，性能较差。 | 查询的列未被二级索引完全包含。 |
| **覆盖索引 (Covering Index)** | 查询所需的所有列都可以直接从二级索引中获取，无需回表。 | 避免了回表操作，大幅减少磁盘 I/O，性能极高。 | 查询的列完全被二级索引包含。 |

### 代码示例与原理解析

假设我们有一张用户表 `user`，包含 `id` (主键), `name` (二级索引), `age` 三个字段。

```sql
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB;
```

#### 1. 回表查询示例

```sql
SELECT id, name, age FROM user WHERE name = 'Alice';
```

**执行过程**：
1. 在 `idx_name` 二级索引树上，找到 `name = 'Alice'` 的记录，取得对应的主键 `id`。
2. 拿着这个 `id`，回到主键索引树（聚簇索引）上查找，获取完整的行记录（包含 `age` 字段）。
3. 这个第 2 步就是**回表**。

#### 2. 覆盖索引示例

```sql
SELECT id, name FROM user WHERE name = 'Alice';
```

**执行过程**：
1. 在 `idx_name` 二级索引树上，找到 `name = 'Alice'` 的记录，取得对应的主键 `id`。
2. 因为查询只需要 `id` 和 `name` 字段，而这两个字段在 `idx_name` 索引树的叶子节点中已经存在了，所以直接返回结果。
3. 不需要回到主键索引树查询，这就是**覆盖索引**。

可以通过 `EXPLAIN` 命令查看执行计划，如果 `Extra` 字段显示 `Using index`，就说明使用了覆盖索引。

```sql
EXPLAIN SELECT id, name FROM user WHERE name = 'Alice';
-- Extra 列会显示: Using index
```

### 亮点与深度

#### 联合索引与覆盖索引的结合

在实际开发中，我们经常通过建立**联合索引**来实现覆盖索引优化。例如，如果经常需要根据 `name` 查询 `age`，我们可以建立联合索引 `idx_name_age(name, age)`。

```sql
ALTER TABLE user ADD INDEX idx_name_age(name, age);
```

此时再执行 `SELECT age FROM user WHERE name = 'Alice'`，由于 `name` 和 `age` 都在联合索引中，就能直接走覆盖索引，避免回表。

#### 常见追问

**追问：如何判断一条 SQL 是否发生了回表？**

可以通过 `EXPLAIN` 命令查看执行计划。如果通过索引查询，但 `Extra` 列没有显示 `Using index`，通常意味着发生了回表（可能显示为 `NULL` 或 `Using index condition` 等，具体视情况而定）。只有当 `Extra` 显示 `Using index` 时，才表示真正实现了覆盖索引，没有回表。