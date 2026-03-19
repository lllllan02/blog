---
title: 数据回滚：离线解析 Binlog 生成 SQL
aliases: 923dfac2-5e88-460c-8dd0-913c7b439d01
date: 2026-03-19 10:11:32
card: false
order:
tags:
  - mysql
  - golang
  - binlog
---

在日常开发或运维中，如果遇到误操作导致数据被删除或修改，通常需要通过解析 MySQL 的 Binlog 来生成回滚 SQL，从而恢复数据。

为了方便在各种环境（尤其是隔离的离线环境）下快速操作，使用 Golang 编写的工具是最佳选择。因为 Go 可以直接编译成一个独立的二进制可执行文件，开箱即用，无需像 Python 工具（如 `binlog2sql`）那样安装繁杂的依赖环境。

## 推荐工具

以下是两个基于 Golang 编写的优秀 Binlog 解析工具，后续开发或数据恢复时可作为首选参考：

### 1. liuhr/my2sql (强烈推荐)

- **仓库地址**：[https://github.com/liuhr/my2sql](https://github.com/liuhr/my2sql)
- **特点**：
  - **性能极高**：解析速度远超传统的 Python 工具（1GB binlog 约 1.5 分钟）。
  - **纯离线支持**：原生支持 `-work-type file` 模式，直接读取本地 binlog 文件，无需连接存活的 MySQL 实例。
  - **功能全面**：支持生成正向 SQL、**回滚 SQL**（用于闪回恢复），以及去除主键的 INSERT SQL。
  - **附加功能**：支持生成 DML 统计信息和大事务分析信息。

### 2. hanchuanchuan/bingo2sql (备选参考)

- **仓库地址**：[https://github.com/hanchuanchuan/bingo2sql](https://github.com/hanchuanchuan/bingo2sql)
- **特点**：
  - 同样是 Go 语言编写的 MySQL Binlog 解析工具。
  - 借鉴了 Python 版 `binlog2sql` 的设计，提供二进制文件。
  - 社区活跃度和功能丰富度略逊于 `my2sql`，但代码结构可作为开发参考。

### 3. go-mysql-org/go-mysql (底层库参考)

- **仓库地址**：[https://github.com/go-mysql-org/go-mysql](https://github.com/go-mysql-org/go-mysql)
- **特点**：
  - 这是一个非常强大且底层的纯 Go 语言 MySQL 工具集，拥有近 5k 的 Star。
  - 它不仅能处理 MySQL 网络协议，还包含了完整的 `replication`（复制）包，能够像从库一样同步和解析 binlog 流。
  - 很多上层的 binlog 解析工具（包括数据同步工具如 Canal）底层都是基于它或借鉴了它的代码。
  - 如果你需要**从零开发**一个深度定制的 binlog 解析工具，或者需要处理复杂的 MySQL 协议，这个库是必看的底层参考。

## 使用示例 (my2sql)

获取 `my2sql` 的可执行文件后，可以通过以下命令直接对离线的 binlog 文件进行解析，生成用于恢复数据的回滚 SQL：

```bash
# 离线解析生成回滚 SQL
./my2sql -work-type rollback \
  -local-binlog-file ./mysql-bin.000001 \
  -output-dir ./out_dir
```

如果只需要针对特定的数据库、表或时间段进行精准恢复，可以添加过滤参数：

```bash
./my2sql -work-type rollback \
  -local-binlog-file ./mysql-bin.000001 \
  -databases my_db \
  -tables my_table \
  -start-datetime "2026-03-19 10:00:00" \
  -stop-datetime "2026-03-19 11:00:00" \
  -output-dir ./out_dir
```
