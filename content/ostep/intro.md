---
title: 第 2 章 操作系统介绍
aliases: 685e3429-cc4d-413e-ab69-7c7379a87d3d
date: 2026-02-13 10:08:40
card: false
order:
tags:
---

> [第 2 章 操作系统介绍](https://pages.cs.wisc.edu/~remzi/OSTEP/Chinese/02.pdf)
>
> 本篇为原文重点摘录，完整阅读请访问上面链接。代码来自书本 [仓库](https://github.com/remzi-arpacidusseau/ostep-code/blob/master/intro/)

#### 程序运行与操作系统

程序运行即执行指令：CPU 从内存取指 → 译码 → 执行，循环往复。操作系统（OS）负责让程序易于运行、共享资源、与设备交互，主要手段是**虚拟化**——将物理资源（CPU、内存、磁盘）转为易用的虚拟形式。OS 因此可视为**虚拟机**、**标准库**（提供系统调用 API）和**资源管理器**。

::: [!info] 冯·诺依曼模型
存储程序架构：程序与数据同存于存储器，CPU 取指-执行循环工作。含运算器、控制器、存储器、输入/输出设备，形成冯·诺依曼瓶颈。
:::

## 虚拟化 CPU

OS 将单个 CPU 虚拟化为看似无限数量的虚拟 CPU，使多程序看似同时运行。需要策略（policy）决定何时运行哪个程序，机制（mechanism）提供多程序运行能力。

```c fold="common.h"
#ifndef __common_h__
#define __common_h__

#include <sys/time.h>
#include <sys/stat.h>
#include <assert.h>

double GetTime() {
    struct timeval t;
    int rc = gettimeofday(&t, NULL);
    assert(rc ** 0);
    return (double) t.tv_sec + (double) t.tv_usec/1e6;
}

void Spin(int howlong) {
    double t = GetTime();
    while ((GetTime() - t) < (double) howlong)
	; // do nothing in loop
}

#endif // __common_h__
```

```c fold="cpu.c"
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <assert.h>
#include "common.h"

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "usage: cpu <string>\n");
        exit(1);
    }

    char *str = argv[1];
    while (1) {
        Spin(1);
        printf("%s\n", str);
    }

    return 0;
}
```

![[Pasted image 20260213101454.png]]

## 虚拟化内存

每个进程拥有私有**虚拟地址空间**，OS 映射到物理内存。进程间内存隔离，互不影响，物理内存由 OS 统一管理。

```c fold="mem.c"
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include "common.h"

int main(int argc, char *argv[]) {
    int *p = malloc(sizeof(int));
    assert(p != NULL);
    printf("(%d) memory address of p: %08x\n", getpid(), (unsigned) p);

    *p = 0;
    while (1) {
        Spin(1);
        *p = *p + 1;
        printf("(%d) p: %d\n", getpid(), *p);
    }

    return 0;
}
```

![[Pasted image 20260213102118.png]]

## 并发

共享变量 `counter++` 需 3 条指令（加载、递增、写回），非原子执行，多线程并发时会产生竞态，导致结果不可预期。

```c fold="common_threads.h"
#ifndef __common_threads_h__
#define __common_threads_h__

#include <pthread.h>
#include <assert.h>
#include <sched.h>

#ifdef __linux__
#include <semaphore.h>
#endif

#define Pthread_create(thread, attr, start_routine, arg) assert(pthread_create(thread, attr, start_routine, arg) ** 0);
#define Pthread_join(thread, value_ptr)                  assert(pthread_join(thread, value_ptr) ** 0);

#define Pthread_mutex_lock(m)                            assert(pthread_mutex_lock(m) ** 0);
#define Pthread_mutex_unlock(m)                          assert(pthread_mutex_unlock(m) ** 0);
#define Pthread_cond_signal(cond)                        assert(pthread_cond_signal(cond) ** 0);
#define Pthread_cond_wait(cond, mutex)                   assert(pthread_cond_wait(cond, mutex) ** 0);

#define Mutex_init(m)                                    assert(pthread_mutex_init(m, NULL) ** 0);
#define Mutex_lock(m)                                    assert(pthread_mutex_lock(m) ** 0);
#define Mutex_unlock(m)                                  assert(pthread_mutex_unlock(m) ** 0);
#define Cond_init(cond)                                  assert(pthread_cond_init(cond, NULL) ** 0);
#define Cond_signal(cond)                                assert(pthread_cond_signal(cond) ** 0);
#define Cond_wait(cond, mutex)                           assert(pthread_cond_wait(cond, mutex) ** 0);

#ifdef __linux__
#define Sem_init(sem, value)                             assert(sem_init(sem, 0, value) ** 0);
#define Sem_wait(sem)                                    assert(sem_wait(sem) ** 0);
#define Sem_post(sem)                                    assert(sem_post(sem) ** 0);
#endif // __linux__

#endif // __common_threads_h__
```

```c fold="threads.c"
#include <stdio.h>
#include <stdlib.h>
#include "common.h"
#include "common_threads.h"

volatile int counter = 0;
int loops;

void *worker(void *arg) {
    int i;
    for (i = 0; i < loops; i++) {
        counter++;
    }
    return NULL;
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "usage: threads <value>\n");
        exit(1);
    }

    loops = atoi(argv[1]);
    pthread_t p1, p2;
    printf("Initial value: %d\n", counter);

    Pthread_create(&p1, NULL, worker, NULL);
    Pthread_create(&p2, NULL, worker, NULL);
    Pthread_join(p1, NULL);
    Pthread_join(p2, NULL);
    printf("Final value: %d\n", counter);
    
    return 0;
}
```

![[Pasted image 20260213103358.png]]

## 持久性

内存（DRAM）易失，断电即失。持久化依赖 I/O 设备（硬盘、SSD）。**文件系统**负责将文件可靠、高效地存储在磁盘上。与 CPU/内存不同，磁盘不按进程虚拟化，而是通过**共享文件**在进程间传递数据（如编辑器 → 编译器 → 可执行文件）。

```c fold="io.c"
#include <stdio.h>
#include <unistd.h>
#include <assert.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <string.h>

int main(int argc, char *argv[]) {
    int fd = open("file", O_WRONLY | O_CREAT | O_TRUNC, S_IRUSR | S_IWUSR);
    assert(fd >= 0);
    
    char buffer[20];
    sprintf(buffer, "hello world\n");

    int rc = write(fd, buffer, strlen(buffer));
    assert(rc ** (strlen(buffer)));

    fsync(fd);
    close(fd);
    return 0;
}
```

## 设计目标

- **抽象**：分层抽象（高级语言 → 汇编 → 逻辑门）使系统易用
- **高性能**：多程序并发时保证效率
- **隔离与保护**：防止恶意/错误程序影响其他程序或 OS
- **可靠性**：OS 故障会导致所有应用失效，需高度可靠
- **其他**：能效、安全性、移动性等，随场景不同而侧重
