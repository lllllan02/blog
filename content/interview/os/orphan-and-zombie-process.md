---
title: 什么是孤儿进程和僵尸进程？
aliases: 883d45cc-ba3d-4ac2-8d44-73a8e9c322a0
date: 2026-04-28 10:42:27
card: true
order:
tags:
  - OS
  - 进程管理
---

> **面试官**：什么是孤儿进程和僵尸进程？如何解决僵尸进程？

## 面试回答

“孤儿进程是指父进程已经退出，但子进程还在运行的进程。孤儿进程会被 `init` 进程（PID 为 1）收养，并由 `init` 进程对它们完成状态收集工作，因此孤儿进程不会对系统造成危害。

僵尸进程是指子进程已经退出，但父进程还没有调用 `wait()` 或 `waitpid()` 来获取子进程的状态信息，导致子进程的进程描述符仍然保存在系统中。如果系统中存在大量的僵尸进程，会占用大量的进程号（PID），导致无法创建新的进程。

解决僵尸进程的方法主要有三种：
第一，父进程通过调用 `wait()` 或 `waitpid()` 等待子进程结束，但这会阻塞父进程。
第二，父进程通过注册 `SIGCHLD` 信号处理函数，在信号处理函数中调用 `waitpid()` 来异步回收子进程。
第三，如果父进程不关心子进程的退出状态，可以干脆把父进程杀掉，这样僵尸子进程就会变成孤儿进程，由 `init` 进程接管并自动回收。”

## 系统讲解

### 核心概念对比

| 特性 | 孤儿进程 (Orphan Process) | 僵尸进程 (Zombie Process) |
| --- | --- | --- |
| **定义** | 父进程先于子进程退出，子进程仍在运行 | 子进程先于父进程退出，父进程未回收其状态 |
| **当前状态** | 正在运行 | 已经终止，仅保留进程描述符 (PCB) |
| **系统危害** | 无危害，会被 `init` 进程接管并正常回收 | 有危害，占用 PID 资源，过多会导致无法创建新进程 |
| **处理方式** | 自动由 `init` (PID=1) 接管 | 需要父进程显式调用 `wait`/`waitpid` 或由系统清理 |

### 僵尸进程的产生原因

在 Linux/Unix 系统中，当一个进程终止时，它并不会立即从系统中完全消失。内核会为该进程保留一定的信息（如进程号 PID、退出状态、运行时间等），直到其父进程通过 `wait()` 或 `waitpid()` 系统调用来读取这些信息。

如果父进程没有调用这些函数，子进程的进程控制块（PCB）就会一直驻留在内存中，这种状态的进程就被称为**僵尸进程**。在 `top` 或 `ps` 命令中，僵尸进程的状态通常显示为 `Z` (Zombie) 或 `<defunct>`。

### 解决僵尸进程的方法

#### 1. 父进程调用 `wait()` 或 `waitpid()`

这是最直接的方法。父进程主动等待子进程结束并回收其资源。
- `wait()`：阻塞调用，直到有任意一个子进程退出。
- `waitpid()`：可以非阻塞地轮询特定子进程的状态（使用 `WNOHANG` 选项）。

#### 2. 捕获 `SIGCHLD` 信号 (推荐)

当子进程退出时，内核会向父进程发送 `SIGCHLD` 信号。父进程可以注册一个信号处理函数，在收到信号时异步调用 `waitpid()` 来回收子进程。这种方式不会阻塞父进程的主逻辑。

```c
#include <sys/wait.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void sigchld_handler(int sig) {
    // 使用 WNOHANG 非阻塞地循环回收所有已退出的子进程
    while (waitpid(-1, NULL, WNOHANG) > 0) {
        // 回收成功
    }
}

int main() {
    // 注册 SIGCHLD 信号处理函数
    signal(SIGCHLD, sigchld_handler);
    
    pid_t pid = fork();
    if (pid == 0) {
        // 子进程逻辑
        printf("Child process exiting.\n");
        exit(0);
    } else if (pid > 0) {
        // 父进程逻辑
        printf("Parent process doing other work.\n");
        sleep(10); // 模拟父进程干其他事情
    }
    return 0;
}
```

#### 3. 忽略 `SIGCHLD` 信号

在某些系统（如 Linux）中，如果父进程显式地将 `SIGCHLD` 信号的处理方式设置为 `SIG_IGN`（忽略），内核会自动回收退出的子进程，不会产生僵尸进程。

```c
signal(SIGCHLD, SIG_IGN);
```

#### 4. 杀死父进程 (Kill the Parent)

如果僵尸进程已经产生且父进程无法修改代码，可以通过 `kill` 命令杀死父进程。父进程死后，其所有的僵尸子进程都会变成孤儿进程，随后被 `init` 进程（PID 1）接管。`init` 进程会定期调用 `wait()` 来清理这些僵尸进程。

### 亮点与深度

#### `waitpid` 为什么要放在 `while` 循环中？

在 `SIGCHLD` 信号处理函数中，通常会看到 `while (waitpid(-1, NULL, WNOHANG) > 0)` 这样的循环。这是因为标准的 UNIX 信号是不排队的。如果多个子进程同时退出，父进程可能只会收到一个 `SIGCHLD` 信号。如果不使用循环，就会漏掉部分子进程的回收，导致它们变成僵尸进程。

#### 孤儿进程的接管者真的是 PID 1 吗？

在传统的 SysV init 或 Upstart 系统中，孤儿进程确实由 PID 为 1 的 `init` 进程接管。但在现代的 systemd 系统中，或者在使用容器（如 Docker）时，孤儿进程可能会被其他配置了 `PR_SET_CHILD_SUBREAPER` 属性的进程（如 systemd 的用户实例或容器的 entrypoint）接管，而不一定是全局的 PID 1。
