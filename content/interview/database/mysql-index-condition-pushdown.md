---
title: 什么是索引下推（ICP）？
aliases: 6738a193-df2b-40b6-a1c2-4c880227d59c
date: 2026-04-10 15:39:55
card: true
order:
tags: 
  - interview
  - database
  - mysql
---

> **面试官**：请问什么是 MySQL 的索引下推（Index Condition Pushdown, ICP）？它解决了什么问题？

## 面试回答

“索引下推（ICP）是 MySQL 5.6 引入的一项查询优化技术。它的核心思想是**将部分本应在 Server 层判断的条件，下推到存储引擎层去执行**。

在没有索引下推之前，当我们使用联合索引查询数据时，如果只有部分字段能走索引，存储引擎会先通过这部分索引找到主键，然后进行**回表**，把完整的数据行返回给 Server 层，最后由 Server 层再根据剩下的 `WHERE` 条件过滤数据。这会导致大量无效的回表操作。

有了索引下推后，存储引擎在遍历索引树时，会直接利用索引中包含的字段，先对 `WHERE` 条件进行过滤。只有满足条件的索引记录，才会去回表查询完整数据。这样大幅度减少了回表次数，也减少了存储引擎和 Server 层之间的数据传输，从而提升了查询性能。”

## 系统讲解

### 核心对比

假设有一张用户表 `user`，包含联合索引 `(name, age)`。
执行查询：`SELECT * FROM user WHERE name LIKE '张%' AND age = 20;`

根据最左前缀匹配原则，`name LIKE '张%'` 可以走索引，但 `age = 20` 无法走索引。

| 特性 | 没有索引下推（MySQL 5.6 之前） | 有索引下推（MySQL 5.6 及之后） |
| :--- | :--- | :--- |
| **执行流程** | 1. 存储引擎在联合索引树上找到所有 `name` 以“张”开头的记录。<br>2. 对**每一条**记录，通过主键**回表**查询完整数据。<br>3. 将完整数据返回给 Server 层。<br>4. Server 层判断 `age == 20`，丢弃不符合的数据。 | 1. 存储引擎在联合索引树上找到所有 `name` 以“张”开头的记录。<br>2. **直接在索引树上判断** `age == 20` 是否成立。<br>3. 仅对满足条件的记录，通过主键**回表**查询完整数据。<br>4. 将结果返回给 Server 层。 |
| **回表次数** | 多（所有 `name` 匹配的记录都要回表） | 少（仅 `name` 和 `age` 都匹配的记录才回表） |
| **性能瓶颈** | 大量随机 I/O（回表），以及 Server 层与引擎层的交互开销 | 性能大幅提升，减少了无用的磁盘 I/O |

### 代码示例与验证

可以通过 `EXPLAIN` 命令来验证是否使用了索引下推。当 `Extra` 列中出现 `Using index condition` 时，说明触发了索引下推优化。

```sql
-- 创建测试表与联合索引
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `age` int NOT NULL,
  `address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name_age` (`name`,`age`) -- 联合索引
) ENGINE=InnoDB;

-- 插入测试数据
INSERT INTO `user` (`name`, `age`, `address`) VALUES ('张三', 20, '北京'), ('张三丰', 100, '武当'), ('张无忌', 20, '冰火岛');

-- 执行查询并查看执行计划
EXPLAIN SELECT * FROM `user` WHERE name LIKE '张%' AND age = 20;
```

**EXPLAIN 结果关键字段**：
- `type`: `range`（范围扫描）
- `key`: `idx_name_age`（使用了联合索引）
- `Extra`: `Using index condition`（**代表使用了索引下推**）

### 亮点与深度

#### 适用条件与限制

1. **仅适用于二级索引（辅助索引）**：对于 InnoDB 的聚簇索引（主键索引），完整的行记录已经存在于叶子节点中，不需要回表，因此不需要下推。
2. **访问类型限制**：适用于 `range`、`ref`、`eq_ref` 和 `ref_or_null` 类型的查询。
3. **不能包含子查询或存储函数**：下推的条件必须是存储引擎能够独立计算的简单条件。
4. **覆盖索引冲突**：如果查询本身已经是**覆盖索引**（即查询的所有列都在索引中，不需要回表），那么 `Extra` 会显示 `Using index`，此时不需要索引下推（因为根本没有回表操作）。

#### 常见追问

**追问：如何关闭索引下推？**

可以通过修改系统变量 `optimizer_switch` 来控制：

```sql
-- 查看当前优化器开关状态
SELECT @@optimizer_switch;

-- 关闭索引下推（当前会话）
SET optimizer_switch = 'index_condition_pushdown=off';

-- 开启索引下推（当前会话）
SET optimizer_switch = 'index_condition_pushdown=on';
```
