---
title: go-mysql 库介绍与 Binlog 解析
aliases: ff463839-d614-4a9e-a8bc-236f45794a4b
date: 2026-03-19 10:32:33
card: false
order:
tags:
  - mysql
  - golang
  - binlog
---

在开发将 MySQL Binlog 转换为 SQL 的工具时，[go-mysql-org/go-mysql](https://github.com/go-mysql-org/go-mysql) 是一个非常核心且强大的底层库。它是一个纯 Go 语言编写的 MySQL 工具集，能够处理 MySQL 网络协议和复制（Replication）功能。

## 核心功能

`go-mysql` 提供了丰富的模块，主要包括：

1. **Replication (复制)**：处理 MySQL 复制协议，可伪装成从库同步 Binlog 流，或离线解析本地 Binlog 文件。
2. **Canal**：基于 Replication 封装，用于将 MySQL 数据增量同步到其他系统（如 Redis、ES）。
3. **Client / Server / Driver**：提供 MySQL 客户端驱动、伪造的服务端框架（用于开发 Proxy 等），以及兼容 `database/sql` 的驱动。

## 典型应用场景与知名开源项目

由于 `go-mysql` 提供了对 MySQL 协议和 Binlog 的底层封装，它在数据库生态中有着广泛的应用：

### 1. 数据同步与 CDC (Change Data Capture)

- **用途**：实时监听 Binlog 事件，将数据变更准实时同步到 Elasticsearch、Redis、Kafka 等异构存储中。
- **知名项目**：
  - **[go-mysql-elasticsearch](https://github.com/go-mysql-org/go-mysql-elasticsearch)**：自动将 MySQL 数据同步到 Elasticsearch。
  - **dtle**：爱可生（ActionTech）开源的分布式 MySQL 数据传输组件。

### 2. 数据恢复与 Binlog 离线分析 (Flashback)

- **用途**：解析在线或离线的 Binlog 文件，生成**回滚 SQL**以恢复误删数据，或进行数据库变更审计。
- **知名项目**：
  - **[my2sql](https://github.com/liuhr/my2sql)**：高性能的 Binlog 解析和闪回工具，支持纯离线解析。
  - **[bingo2sql](https://github.com/hanchuanchuan/bingo2sql)**：Go 语言重写的 binlog2sql，用于快速生成回滚 SQL。

### 3. 数据库中间件与 Proxy (代理)

- **用途**：利用 `server` 包快速搭建兼容 MySQL 协议的服务端，常用于开发分库分表中间件、SQL 审计防火墙、读写分离网关等。
- **关联应用**：很多定制化的数据库代理网关在需要解析 MySQL 协议时，会直接引用 `go-mysql/server` 作为底层网络框架。
