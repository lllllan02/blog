---
title: 队列
aliases: 6D3CA959-D86D-4858-A53C-0B3983A685A0
date: 2026-03-04 21:51:32
tags:
  - 算法
  - 数据结构
  - C
order: 3
---

队列（Queue）是一种遵循 **先进先出（FIFO, First-In-First-Out）** 原则的线性数据结构。就像排队买票一样，最先进入队列的元素最先被移除。

> 最新实现代码已同步至 GitHub 仓库：
> - 数组实现：[lllllan02/coding/coding-interview-university/array-queue](https://github.com/lllllan02/coding/tree/main/coding-interview-university/array-queue)
> - 链表实现：[lllllan02/coding/coding-interview-university/linked-list-queue](https://github.com/lllllan02/coding/tree/main/coding-interview-university/linked-list-queue)

## 核心概念

队列主要支持两个基本操作：
- **入队 (Enqueue)**：将元素添加到队列的尾部。
- **出队 (Dequeue)**：移除并返回队列头部的元素。

此外，通常还包含 `is_empty`、`is_full`（针对定长队列）等辅助操作。

## 实现方式

队列可以通过 **动态数组（循环缓冲区）** 或 **链表** 来实现。

### 1. 数组实现 (循环队列)

使用数组实现队列时，为了避免元素移动带来的 $O(n)$ 开销，通常采用 **循环缓冲区（Circular Buffer）** 的设计。

- **核心思想**：维护 `head`（队头）和 `tail`（队尾）两个指针（索引）。当指针到达数组末尾时，通过取模运算回到数组开头。
- **判空与判满**：
    - 为了区分空队列和满队列，通常会 **浪费一个空间**。
    - **空**：`head == tail`
    - **满**：`(tail + 1) % capacity == head`

:::tabgroup
=== 定义 (array_queue.h)
```c
#ifndef PROJECT_ARRAY_QUEUE_H
#define PROJECT_ARRAY_QUEUE_H

#include <stdbool.h>

typedef struct Queue {
    int *data;
    int capcity; // 实际容量（包含浪费的一个空间）
    int head;
    int tail;
} Queue;

// 创建队列
Queue *create_queue(int capacity);

// 销毁队列
void destory_queue(Queue *queue);

// 入队
void enqueue(Queue *queue, int value);

// 出队
int dequeue(Queue *queue);

// 判空
bool is_empty(Queue *queue);

// 判满
bool is_full(Queue *queue);

#endif
```

=== 实现 (array_queue.c)
```c
#include "array_queue.h"
#include <stdio.h>
#include <stdlib.h>

const char* ERROR_UNABLE_ALLOCATE_MEMORY = "Unable to allocate memory.";
const char* ERROR_QUEUE_IS_FULL = "Cannot add item to a full queue.";
const char* ERROR_QUEUE_IS_EMPTY = "Queue is empty.";

static void exit_with_error(const char *msg) {
    printf("%s\n", msg);
    exit(EXIT_FAILURE);
}

Queue *create_queue(int capacity) {
    // 申请队列的地址
    Queue *queue = (Queue *) malloc(sizeof(Queue));
    if (queue == NULL) {
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }

    // 申请队列中元素的具体存放地址
    // 注意：实际申请空间比请求容量多 1，用于区分空和满
    int *data = (int *) malloc(sizeof(int) * (capacity + 1));
    if (data == NULL) {
        free(queue);
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }

    // 初始化并返回
    queue->data = data;
    queue->capcity = capacity + 1; 
    queue->head = queue->tail = 0;
    return queue;
}

void destory_queue(Queue *queue) {
    free(queue->data);
    free(queue);
}

void enqueue(Queue *queue, int value) {
    // 检查队列是否已满
    if (is_full(queue)) {
        destory_queue(queue); // 注意：这里销毁队列可能过于激进，视具体需求而定
        exit_with_error(ERROR_QUEUE_IS_FULL);
    }

    // 添加元素到末尾并后移队列的尾部索引
    queue->data[queue->tail] = value;
    queue->tail = (queue->tail + 1) % queue->capcity;
}

int dequeue(Queue *queue) {
    // 检查队列是否为空
    if (is_empty(queue)) {
        destory_queue(queue);
        exit_with_error(ERROR_QUEUE_IS_EMPTY);
    }

    // 后移队列的头部索引
    int value = queue->data[queue->head];
    queue->head = (queue->head + 1) % queue->capcity;
    return value;
}

bool is_empty(Queue *queue) { return queue->head == queue->tail; }

bool is_full(Queue *queue) { 
    return queue->head == (queue->tail + 1) % queue->capcity;
}
```
:::

### 2. 链表实现

使用链表实现队列天然支持动态扩容，且不需要处理循环逻辑。

- **核心思想**：维护 `head` 指向链表头（队头，用于出队），`tail` 指向链表尾（队尾，用于入队）。
- **优势**：不存在“满”的情况（除非内存耗尽），入队出队均为 $O(1)$。

:::tabgroup
=== 定义 (linked_list_queue.h)
```c
#ifndef PROJECT_LINKED_LIST_QUEUE_H
#define PROJECT_LINKED_LIST_QUEUE_H

#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

typedef struct Queue {
    Node *head;
    Node *tail;
} Queue;

// 创建队列
Queue *new_queue();

// 销毁队列
void destory_queue(Queue *queue);

// 入队
void enqueue(Queue *queue, int value);

// 出队
int dequeue(Queue *queue);

// 判空
bool is_empty(Queue *queue);

#endif
```

=== 实现 (linked_list_queue.c)
```c
#include "linked_list_queue.h"
#include <stdio.h>
#include <stdlib.h>

const char* ERROR_UNABLE_ALLOCATE_MEMORY = "Unable to allocate memory.";
const char* ERROR_EMPTY_Queue = "Cannot get elem from empty queue.";

static void exit_with_error(const char *msg) {
    printf("%s\n", msg);
    exit(EXIT_FAILURE);
}

Queue *new_queue() {
    // 申请地址
    Queue *queue = (Queue *) malloc(sizeof(Queue));
    if (queue == NULL) {
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }

    // 初始化
    queue->head = queue->tail = NULL;
    return queue;
}

void destory_queue(Queue *queue) {
    // 逐个释放队列中的节点
    Node *node = queue->head;
    while (node) {
        Node *next = node->next;
        free(node);
        node = next;
    }

    // 释放队列
    free(queue);
}

void enqueue(Queue *queue, int value) {
    // 申请地址并初始化
    Node *node = (Node *) malloc(sizeof(Node));
    if (node == NULL) {
        destory_queue(queue);
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }
    node->data = value;
    node->next = NULL;

    // 添加节点到队列末尾
    if (queue->head == NULL) {
        queue->head = queue->tail = node;
    } else {
        queue->tail->next = node;
        queue->tail = node;
    }
}

int dequeue(Queue *queue) {
    // 检查队列是否为空
    if (queue->head == NULL) {
        destory_queue(queue);
        exit_with_error(ERROR_EMPTY_Queue);
    }

    // 获取队列中的第一个元素
    Node *head = queue->head;
    int value = head->data;

    // 替换队列头部
    queue->head = head->next;
    if (queue->head == NULL) {
        queue->tail = NULL;
    }

    // 释放地址并返回
    free(head);
    return value;
}

bool is_empty(Queue *queue) { return queue->head == NULL; }
```
:::

## 复杂度对比

| 操作 | 数组实现 (循环队列) | 链表实现 | 说明 |
| :--- | :--- | :--- | :--- |
| **入队 (Enqueue)** | $O(1)$ | $O(1)$ | 数组通过索引计算，链表通过尾指针 |
| **出队 (Dequeue)** | $O(1)$ | $O(1)$ | 数组通过索引计算，链表通过头指针 |
| **空间复杂度** | $O(N)$ | $O(N)$ | 数组需预分配空间，链表需额外存储指针 |
| **扩容代价** | 高 | 无 | 数组满时需重新分配内存并复制 |
| **随机访问** | 支持 | 不支持 | 队列通常不需要随机访问 |
