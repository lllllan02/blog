---
title: 链表
aliases: d0dc9d2b-70ba-4578-8a5b-08a4b8970587
date: 2026-02-28 11:30:34
tags:
  - 算法
  - 数据结构
  - C
order: 2
---

链表（Linked List）是一种线性数据结构，由一系列节点（Node）组成。每个节点包含数据和指向下一个节点的指针。与数组不同，链表在内存中不必连续存储，这使得它在插入和删除操作上具有优势，但在随机访问上效率较低。

## 实现要求与特性

在手写实现链表时，我们需要关注以下核心特性：

- **节点结构**：包含数据域（Value）和指针域（Next）。
- **内存管理**：节点动态分配，内存不连续。
- **头尾指针**：通常维护 `head` 和 `tail` 指针以优化尾部操作。
- **边界处理**：注意空链表、单节点链表的操作，防止空指针解引用。

### 复杂度分析

| 操作 | 时间复杂度 | 说明 |
| :--- | :--- | :--- |
| **随机访问** | $O(n)$ | 不支持下标直接访问，需从头遍历 |
| **头部插入/删除** | $O(1)$ | 仅需修改 `head` 指针 |
| **尾部插入/删除** | $O(1)$ | 维护 `tail` 指针时为 $O(1)$ |
| **中间插入/删除** | $O(n)$ | 需要遍历找到操作位置 |
| **空间复杂度** | $O(n)$ | 每个节点额外存储指针开销 |

## 代码实现

:::tabgroup
=== 定义
```c
typedef struct Node {
    int data;
    struct Node *next;
} Node;

typedef struct List {
    int size;
    Node *head, *tail;
} List;
```

=== 初始化与销毁
```c
const char* ERROR_UNABLE_ALLOCATE_MEMORY = "Unable to allocate memory.";

static void exit_with_error(const char *msg) {
    printf("%s\n", msg);
    exit(EXIT_FAILURE);
}

static Node *new_node(List *list, int value) {
    // 申请地址并初始化
    Node *node = (Node *) malloc(sizeof(Node));
    if (node == NULL) {
        destory_list(list);
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }
    node->data = value;
    node->next = NULL;

    return node;
}

List *new_list() {
    // 申请地址
    List *list = (List *) malloc(sizeof(List));
    if (list == NULL) {
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }

    // 初始化
    list->size = 0;
    list->head = list->tail = NULL;
    return list;
}

void destory_list(List *list) {
    // 逐个释放节点
    Node *node = list->head;
    for (; node != NULL;) {
        Node *next = node->next;
        free(node);
        node = next;
    }

    // 释放列表
    free(list);
}
```

=== 状态查询
```c
const char* ERROR_OUT_OF_BOUNDS = "Index out of bounds.";

static void validate_index(List *list, int index) {
    if (index < 0 || index >= list->size) {
        destory_list(list);
        exit_with_error(ERROR_OUT_OF_BOUNDS);
    }
}

int size(List *list) { return list->size; }

bool is_empty(List *list) { return list->size == 0; }

int value_at(List *list, int index) {
    // 检查索引是否合法
    validate_index(list, index);

    // 遍历到索引处
    Node *current = list->head;
    for (; index > 0; index--) {
        current = current->next;
    }
    return current->data;
}
```

=== 元素添加
```c
void push_front(List *list, int value) {
    // 申请地址并初始化
    Node *new_head = new_node(list, value);

    // 更新列表头部
    list->size++;
    list->head = new_head;
    if (list->tail == NULL) {
        list->tail = new_head;
    }
}

void push_back(List *list, int value) {
    // 申请地址并初始化
    Node *node = new_node(list, value);

    // 更新列表尾部
    list->size++;
    if (list->tail == NULL) {
        list->head = list->tail = node;
    } else {
        list->tail->next = node;
        list->tail = node;
    }
}

void insert(List *list, int index, int value) {
    // 检查索引是否合法
    if (index < 0 || index > list->size) {
        destory_list(list);
        exit_with_error(ERROR_OUT_OF_BOUNDS);
    }

    // 申请地址并初始化
    Node *node = new_node(list, value);

    list->size++;

    // 如果索引为零，将节点添加到头部
    if (index == 0) {
        node->next = list->head;
        list->head = node;
        if (list->tail == NULL) {
            list->tail = list->head;
        }
        return;
    }

    // 遍历列表找到索引处的前一个节点
    Node *current = list->head;
    for (; index > 1; index--) {
        current = current->next;
    }
    // 插入新节点
    node->next = current->next;
    current->next = node;

    if (node->next == NULL) {
        list->tail = node;
    }
}
```

=== 元素删除
```c
const char* ERROR_EMPTY_LIST = "Cannot get elem from empty list.";

int pop_front(List *list) {
    // 检查列表头部不为空
    if (list->head == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    // 暂存头部和返回值
    Node *head = list->head;
    int value = head->data;

    // 更新列表头部
    list->size--;
    list->head = head->next;
    if (list->size == 0) {
        list->tail = NULL;
    }

    // 释放旧头部并返回
    free(head);
    return value;
}

int pop_back(List *list) {
    // 检查列表尾部不为空
    if (list->tail == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }
    
    int value = list->tail->data;
    
    // 如果只有一个节点
    if (list->head == list->tail) {
        free(list->head);
        list->head = list->tail = NULL;
        list->size = 0;
        return value;
    }
    
    // 遍历找到尾部的前一个节点
    Node *current = list->head;
    while (current->next != list->tail) {
        current = current->next;
    }

    // 更新列表尾部
    free(list->tail);
    list->tail = current;
    list->tail->next = NULL;
    list->size--;
    
    return value;
}

void remove_at(List *list, int index) {
    // 检查索引是否合法
    validate_index(list, index);

    list->size--;

    // 如果索引为零，直接删除头部
    if (index == 0) {
        Node *node = list->head;
        list->head = node->next;
        if (list->head == NULL) {
            list->tail = NULL;
        }
        free(node);
        return;
    }
    
    // 遍历列表找到索引处的前一个节点
    Node *current = list->head;
    for (; index > 1; index--) {
        current = current->next;
    }

    // 删除并释放节点
    Node *next = current->next;
    if (list->tail == next) {
        list->tail = current;
    }
    current->next = next->next;
    free(next);
}

void remove_value(List *list, int value) {
    Node *current = list->head;
    Node *prev = NULL;

    while (current) {
        Node *next = current->next;

        if (current->data == value) {
            list->size--;

            if (prev) {
                prev->next = next;
                if (list->tail == current) {
                    list->tail = prev;
                }
            } else {
                list->head = next;
                if (list->tail == current) {
                    list->tail = NULL;
                }
            }

            free(current);
            current = next;
        } else {
            prev = current;
            current = next;
        }
    }
}
```

=== 其他操作
```c
void reverse(List *list) {
    Node *prev = NULL;
    Node *current = list->head;
    Node *next = NULL;

    list->tail = list->head;

    while (current) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }

    list->head = prev;
}

int front(List *list) {
    // 检查列表头部不为空
    if (list->head == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    return list->head->data;
}

int back(List *list) {
    // 检查列表尾部不为空
    if (list->tail == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    return list->tail->data;
}
```
:::

```c fold="linked_list.h"
#ifndef PROJECT_LINKED_LIST_H
#define PROJECT_LINKED_LIST_H

#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

typedef struct List {
    int size;
    Node *head, *tail;
} List;

// 创建一个链表
List *new_list();

// 释放链表
void destory_list(List *list);

// 返回链表中的节点数量
int size(List *list);

// 如果链表为空，返回 true
bool is_empty(List *list);

// 添加元素到列表前端
void push_front(List *list, int value);

// 添加元素到列表后段
void push_back(List *list, int value);

// 返回列表前端的元素
int front(List *list);

// 返回列表后段的元素
int back(List *list);

// 返回并删除列表前端的元素
int pop_front(List *list);

// 返回并删除列表后段的元素
int pop_back(List *list);

// 在索引出添加元素
void insert(List *list, int index, int value);

// 返回索引处的元素
int value_at(List *list, int index);

// 删除索引处的元素
void remove_at(List *list, int index);

// 删除链表中所有值为 value 的元素
void remove_value(List *list, int value);

// 翻转链表
void reverse(List *list);

#endif
```

```c fold="linked_list.c"
#include "linked_list.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

const char* ERROR_UNABLE_ALLOCATE_MEMORY = "Unable to allocate memory.";
const char* ERROR_OUT_OF_BOUNDS = "Index out of bounds.";
const char* ERROR_EMPTY_LIST = "Cannot get elem from empty list.";

static void exit_with_error(const char *msg) {
    printf("%s\n", msg);
    exit(EXIT_FAILURE);
}

static void validate_index(List *list, int index) {
    if (index < 0 || index >= list->size) {
        destory_list(list);
        exit_with_error(ERROR_OUT_OF_BOUNDS);
    }
}

static Node *new_node(List *list, int value) {
    // 申请地址并初始化
    Node *node = (Node *) malloc(sizeof(Node));
    if (node == NULL) {
        destory_list(list);
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }
    node->data = value;
    node->next = NULL;

    return node;
}

List *new_list() {
    // 申请地址
    List *list = (List *) malloc(sizeof(List));
    if (list == NULL) {
        exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
    }

    // 初始化
    list->size = 0;
    list->head = list->tail = NULL;
    return list;
}

void destory_list(List *list) {
    // 逐个释放节点
    Node *node = list->head;
    for (; node != NULL;) {
        Node *next = node->next;
        free(node);
        node = next;
    }

    // 释放列表
    free(list);
}

int size(List *list) { return list->size; }

bool is_empty(List *list) { return list->size == 0; }

void push_front(List *list, int value) {
    // 申请地址并初始化
    Node *new_head = new_node(list, value);

    // 更新列表头部
    list->size++;
    list->head = new_head;
    if (list->tail == NULL) {
        list->tail = new_head;
    }
}

void push_back(List *list, int value) {
    // 申请地址并初始化
    Node *node = new_node(list, value);

    // 更新列表尾部
    list->size++;
    if (list->tail == NULL) {
        list->head = list->tail = node;
    } else {
        list->tail->next = node;
        list->tail = node;
    }
}

int front(List *list) {
    // 检查列表头部不为空
    if (list->head == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    return list->head->data;
}

int back(List *list) {
    // 检查列表尾部不为空
    if (list->tail == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    return list->tail->data;
}

int pop_front(List *list) {
    // 检查列表头部不为空
    if (list->head == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }

    // 暂存头部和返回值
    Node *head = list->head;
    int value = head->data;

    // 更新列表头部
    list->size--;
    list->head = head->next;
    if (list->size == 0) {
        list->tail = NULL;
    }

    // 释放旧头部并返回
    free(head);
    return value;
}

int pop_back(List *list) {
    // 检查列表尾部不为空
    if (list->tail == NULL) {
        exit_with_error(ERROR_EMPTY_LIST);
    }
    
    int value = list->tail->data;
    
    // 如果只有一个节点
    if (list->head == list->tail) {
        free(list->head);
        list->head = list->tail = NULL;
        list->size = 0;
        return value;
    }
    
    // 遍历找到尾部的前一个节点
    Node *current = list->head;
    while (current->next != list->tail) {
        current = current->next;
    }

    // 更新列表尾部
    free(list->tail);
    list->tail = current;
    list->tail->next = NULL;
    list->size--;
    
    return value;
}

void insert(List *list, int index, int value) {
    // 检查索引是否合法
    if (index < 0 || index > list->size) {
        destory_list(list);
        exit_with_error(ERROR_OUT_OF_BOUNDS);
    }

    // 申请地址并初始化
    Node *node = new_node(list, value);

    list->size++;

    // 如果索引为零，将节点添加到头部
    if (index == 0) {
        node->next = list->head;
        list->head = node;
        if (list->tail == NULL) {
            list->tail = list->head;
        }
        return;
    }

    // 遍历列表找到索引处的前一个节点
    Node *current = list->head;
    for (; index > 1; index--) {
        current = current->next;
    }
    // 插入新节点
    node->next = current->next;
    current->next = node;

    if (node->next == NULL) {
        list->tail = node;
    }
}

int value_at(List *list, int index) {
    // 检查索引是否合法
    validate_index(list, index);

    // 遍历到索引处
    Node *current = list->head;
    for (; index > 0; index--) {
        current = current->next;
    }
    return current->data;
}

void remove_at(List *list, int index) {
    // 检查索引是否合法
    validate_index(list, index);

    list->size--;

    // 如果索引为零，直接删除头部
    if (index == 0) {
        Node *node = list->head;
        list->head = node->next;
        if (list->head == NULL) {
            list->tail = NULL;
        }
        free(node);
        return;
    }
    
    // 遍历列表找到索引处的前一个节点
    Node *current = list->head;
    for (; index > 1; index--) {
        current = current->next;
    }

    // 删除并释放节点
    Node *next = current->next;
    if (list->tail == next) {
        list->tail = current;
    }
    current->next = next->next;
    free(next);
}

void remove_value(List *list, int value) {
    Node *current = list->head;
    Node *prev = NULL;

    while (current) {
        Node *next = current->next;

        if (current->data == value) {
            list->size--;

            if (prev) {
                prev->next = next;
                if (list->tail == current) {
                    list->tail = prev;
                }
            } else {
                list->head = next;
                if (list->tail == current) {
                    list->tail = NULL;
                }
            }

            free(current);
            current = next;
        } else {
            prev = current;
            current = next;
        }
    }
}

void reverse(List *list) {
    Node *prev = NULL;
    Node *current = list->head;
    Node *next = NULL;

    list->tail = list->head;

    while (current) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }

    list->head = prev;
}
```

```c fold="test.c"
#include "linked_list.h"
#include <stdio.h>
#include <assert.h>

void test_size_init() {
    List *list = new_list();
    assert(size(list) == 0);
    destory_list(list);
}

void test_push_front() {
    List *list = new_list();
    push_front(list, 1);
    push_front(list, 2);
    push_front(list, 3);
    
    assert(size(list) == 3);
    assert(front(list) == 3);
    assert(back(list) == 1);
    
    destory_list(list);
}

void test_push_back() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 3);
    
    assert(size(list) == 3);
    assert(front(list) == 1);
    assert(back(list) == 3);
    
    destory_list(list);
}

void test_empty() {
    List *list = new_list();
    assert(is_empty(list));
    push_back(list, 1);
    assert(!is_empty(list));
    destory_list(list);
}

void test_front_back() {
    List *list = new_list();
    push_back(list, 10);
    assert(front(list) == 10);
    assert(back(list) == 10);
    
    push_back(list, 20);
    assert(front(list) == 10);
    assert(back(list) == 20);
    
    destory_list(list);
}

void test_pop_front() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 3);
    
    assert(pop_front(list) == 1);
    assert(size(list) == 2);
    assert(front(list) == 2);
    
    assert(pop_front(list) == 2);
    assert(size(list) == 1);
    assert(front(list) == 3);
    
    assert(pop_front(list) == 3);
    assert(size(list) == 0);
    assert(is_empty(list));
    
    destory_list(list);
}

void test_pop_back() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 3);
    
    assert(pop_back(list) == 3);
    assert(size(list) == 2);
    assert(back(list) == 2);
    
    assert(pop_back(list) == 2);
    assert(size(list) == 1);
    assert(back(list) == 1);
    
    assert(pop_back(list) == 1);
    assert(size(list) == 0);
    assert(is_empty(list));
    
    destory_list(list);
}

void test_insert() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 3);
    
    insert(list, 1, 2); // Insert 2 at index 1 -> 1, 2, 3
    assert(size(list) == 3);
    assert(value_at(list, 0) == 1);
    assert(value_at(list, 1) == 2);
    assert(value_at(list, 2) == 3);
    
    insert(list, 0, 0); // Insert 0 at index 0 -> 0, 1, 2, 3
    assert(value_at(list, 0) == 0);
    assert(front(list) == 0);
    
    insert(list, 4, 4); // Insert 4 at index 4 -> 0, 1, 2, 3, 4
    assert(value_at(list, 4) == 4);
    assert(back(list) == 4);
    
    destory_list(list);
}

void test_value_at() {
    List *list = new_list();
    push_back(list, 10);
    push_back(list, 20);
    push_back(list, 30);
    
    assert(value_at(list, 0) == 10);
    assert(value_at(list, 1) == 20);
    assert(value_at(list, 2) == 30);
    
    destory_list(list);
}

void test_remove_at() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 3);
    
    remove_at(list, 1); // Remove 2 -> 1, 3
    assert(size(list) == 2);
    assert(value_at(list, 0) == 1);
    assert(value_at(list, 1) == 3);
    
    remove_at(list, 0); // Remove 1 -> 3
    assert(size(list) == 1);
    assert(front(list) == 3);
    
    remove_at(list, 0); // Remove 3 -> empty
    assert(size(list) == 0);
    assert(is_empty(list));
    
    destory_list(list);
}

void test_remove_value() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 2);
    push_back(list, 3);
    
    remove_value(list, 2); // Should remove all 2s -> 1, 3
    
    assert(size(list) == 2);
    assert(value_at(list, 0) == 1);
    assert(value_at(list, 1) == 3);
    
    remove_value(list, 1); // Remove 1 -> 3
    assert(size(list) == 1);
    assert(front(list) == 3);
    
    remove_value(list, 3); // Remove 3 -> empty
    assert(size(list) == 0);
    assert(is_empty(list));
    
    destory_list(list);
}

void test_reverse() {
    List *list = new_list();
    push_back(list, 1);
    push_back(list, 2);
    push_back(list, 3);
    
    reverse(list); // 3, 2, 1
    
    assert(value_at(list, 0) == 3);
    assert(value_at(list, 1) == 2);
    assert(value_at(list, 2) == 1);
    assert(front(list) == 3);
    assert(back(list) == 1);
    
    destory_list(list);
}

int main() {
    printf("Running linked list tests...\n");
    test_size_init();
    test_push_front();
    test_push_back();
    test_empty();
    test_front_back();
    test_pop_front();
    test_pop_back();
    test_insert();
    test_value_at();
    test_remove_at();
    test_remove_value();
    test_reverse();
    printf("All tests passed!\n");
    return 0;
}
```
