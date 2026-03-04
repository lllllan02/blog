---
title: 11. Linux 基本操作命令，如何查看内存，查看磁盘量
aliases: c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f
date: 2026-03-04 16:43:05
tags: [interview, linux, ops, memory, disk]
card: true
order: 11
---

## 问题分析

面试官询问 Linux 基本命令，特别是查看内存和磁盘，通常是为了考察你对服务器资源监控和故障排查的基础能力。除了能说出命令本身，更重要的是你能否读懂命令输出的关键指标（如 buffer/cache 的含义、Load Average 等），以及在磁盘空间不足时如何定位大文件。

## 核心解答

### 口语回答

“查看**内存**使用情况，最常用的是 `free -h` 命令，它可以以人类可读的格式（如 GB, MB）显示物理内存和 Swap 的总量、已用量和空闲量。另外，`top` 或 `htop` 命令也可以实时查看内存占用最高的进程。

查看**磁盘**使用量，我会用 `df -h`，它能显示所有挂载点的磁盘空间使用情况。如果发现某个分区满了，我会配合 `du -sh *` 命令去逐级排查具体是哪个目录或文件占用了大量空间。

除了这两个，排查服务器问题时，我通常还会用 `uptime` 看负载，`dmesg` 看内核日志，`iostat` 看磁盘 I/O。”

### 核心结论 (Key Takeaways)

*   **查看内存**: `free -h`
    *   重点关注 `available` (可用内存) 而不仅仅是 `free`。
    *   理解 `buff/cache` (系统缓存，内存不足时可自动释放)。
*   **查看磁盘容量**: `df -h` (Disk Free)
    *   查看文件系统挂载点及剩余空间。
*   **查看目录/文件大小**: `du -sh <目录>` (Disk Usage)
    *   `-s`: summary (汇总)
    *   `-h`: human-readable (K/M/G)
*   **实时监控**: `top` / `htop`
    *   按 `M` 键按内存排序，按 `P` 键按 CPU 排序。

## 详细解析

### 1. 查看内存: `free`

```bash
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           15Gi       4.5Gi       3.2Gi       1.0Gi       7.8Gi       9.8Gi
Swap:         2.0Gi          0B       2.0Gi
```

*   **total**: 总物理内存。
*   **used**: 已分配给进程使用的内存。
*   **free**: 未被使用的内存。
*   **buff/cache**: 磁盘缓存（Buffer Cache + Page Cache）。Linux 会利用空闲内存做缓存来提升 I/O 性能，这部分内存在应用程序需要时可以**立即释放**。
*   **available**: **最重要指标**。应用程序实际可用的内存估算值（= free + 可回收的 buff/cache）。

### 2. 查看磁盘: `df` vs `du`

#### `df -h` (Disk Free)
查看文件系统的整体磁盘空间使用情况。

```bash
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   25G   25G  50% /
/dev/sdb1       100G   80G   20G  80% /data
```

#### `du -sh` (Disk Usage)
查看特定目录或文件占用的空间大小。

```bash
# 查看当前目录下每个子目录的大小
$ du -sh *
1.2G    logs
500M    app
4.0K    README.md
```

#### 常见坑：`df` 和 `du` 结果不一致
有时候 `df` 显示磁盘满了，但 `du` 统计所有文件大小却没那么多。
*   **原因**: 通常是因为有文件被删除了（`rm`），但仍有进程持有该文件的句柄（Open File Descriptor），导致磁盘空间未释放。
*   **排查**: 使用 `lsof | grep deleted` 查看被删除但未释放的文件，重启相关进程即可释放空间。

### 3. 实时监控: `top`

`top` 命令是 Linux 下的“任务管理器”。

*   **Load Average**: 系统的平均负载（1分钟、5分钟、15分钟）。如果该值超过 CPU 核心数，说明系统负载较高。
*   **%MEM**: 进程占用的物理内存百分比。
*   **VIRT vs RES**:
    *   `VIRT` (Virtual Image): 进程申请的虚拟内存总量（包含未分配的）。
    *   `RES` (Resident Size): 进程实际占用的物理内存（不包含 Swap）。**排查内存泄漏主要看这个**。

## 扩展：其他常用排查命令

| 命令 | 用途 | 场景 |
| :--- | :--- | :--- |
| `ps -ef \| grep <name>` | 查看进程 | 检查进程是否存活、启动参数、PID |
| `netstat -tlnp` / `ss -lntp` | 查看网络端口 | 检查端口占用、服务监听状态 |
| `tail -f <log_file>` | 实时看日志 | 监控应用报错、请求流 |
| `grep "error" <file>` | 搜索文本 | 在日志文件中查找关键词 |
| `chmod` / `chown` | 权限管理 | 修改文件权限（如 `chmod +x`）或所有者 |
