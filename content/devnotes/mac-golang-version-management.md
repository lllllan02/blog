---
title: MacOS 使用 Homebrew 管理 Golang 版本
aliases: 0cacc111-8794-4027-a275-24626916ca6a
date: 2026-01-29 10:57:09
order:
tags:
    - mac
    - golang
---

## 安装

> 直接安装 `go` 即可获得最新的稳定版本：

```bash
brew install go
```

> 安装指定版本（例如 1.21）

```bash
brew install go@1.21
```

## 切换版本

当系统中安装了多个版本的 Go 时，可以通过 `link` 和 `unlink` 命令进行切换：

> 解绑当前版本

```bash
brew unlink go
```

> 强制链接指定版本

```bash
brew link go@1.21
```

## 查看版本

> 查看当前使用的版本：

```bash
go version
```
