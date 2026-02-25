---
title: 文件描述符 (File Descriptor)
wiki: ["文件描述符", "FD"]
aliases: abcb8ebf-4a34-40cd-9cee-d5c779afb992
date: 2026-02-25 10:00:00
card: true
tags:
  - wiki
  - os
---

## 定义

> **文件描述符 (File Descriptor, FD) 是操作系统内核用于标识进程已打开文件或 I/O 资源（如管道、套接字）的一个非负整数索引。**

它是进程与内核交互的句柄：当程序打开一个文件时，内核返回一个文件描述符，后续的读写操作都通过这个数字进行，从而屏蔽了底层资源的具体细节。

-   **进程隔离**：文件描述符只在当前进程内有效，不同进程的相同 FD 可能指向不同的文件。
-   **标准流**：默认情况下，0 (stdin)、1 (stdout)、2 (stderr) 是预留的标准输入输出描述符。
-   **一切皆文件**：在 Unix/Linux 系统中，不仅普通文件，网络连接、管道等都被抽象为文件描述符进行操作。

## 参考

- [File descriptor - Wikipedia](https://en.wikipedia.org/wiki/File_descriptor)
