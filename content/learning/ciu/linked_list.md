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
    int value;
    struct Node *next;
} Node;

typedef struct LinkedList {
    int size;
    Node *head;
    Node *tail; // 维护尾指针以支持 O(1) 的 push_back
} LinkedList;
```

=== 初始化与销毁
```c
// 创建节点
Node* create_node(int value) {
    Node* node = malloc(sizeof(Node));
    if (node == NULL) {
        fprintf(stderr, "MemoryAllocationException\n");
        exit(EXIT_FAILURE);
    }
    node->value = value;
    node->next = NULL;
    return node;
}

// 创建链表
LinkedList* create_linked_list() {
    LinkedList* list = malloc(sizeof(LinkedList));
    if (list == NULL) {
        fprintf(stderr, "MemoryAllocationException\n");
        exit(EXIT_FAILURE);
    }
    list->size = 0;
    list->head = NULL;
    list->tail = NULL;
    return list;
}

// 销毁链表
void destroy_list(LinkedList *list) {
    if (list == NULL) return;
    Node *current = list->head;
    while (current != NULL) {
        Node *next = current->next;
        free(current);
        current = next;
    }
    free(list);
}
```

=== 状态查询
```c
// 返回链表大小
int size(LinkedList *list) {
    return list->size;
}

// 判断链表是否为空
bool empty(LinkedList *list) {
    return list->size == 0;
}

// 返回索引处的值
int value_at(LinkedList *list, int index) {
    if (index < 0 || index >= list->size) {
        fprintf(stderr, "IndexOutOfBoundsException\n");
        exit(EXIT_FAILURE);
    }
    Node *current = list->head;
    for (int i = 0; i < index; i++) {
        current = current->next;
    }
    return current->value;
}

// 返回倒数第 n 个值
int value_n_from_end(LinkedList *list, int n) {
    if (n < 1 || n > list->size) {
        fprintf(stderr, "IndexOutOfBoundsException\n");
        exit(EXIT_FAILURE);
    }
    Node *current = list->head;
    for (int i = 0; i < list->size - n; i++) {
        current = current->next;
    }
    return current->value;
}
```

=== 元素添加
```c
// 头部插入
void push_front(LinkedList *list, int value) {
    Node *node = create_node(value);
    node->next = list->head;
    list->head = node;
    if (list->tail == NULL) {
        list->tail = node;
    }
    list->size++;
}

// 尾部插入
void push_back(LinkedList *list, int value) {
    Node *node = create_node(value);
    if (list->head == NULL) {
        list->head = node;
        list->tail = node;
    } else {
        list->tail->next = node;
        list->tail = node;
    }
    list->size++;
}

// 指定索引插入
void insert(LinkedList *list, int index, int value) {
    if (index < 0 || index > list->size) {
        fprintf(stderr, "IndexOutOfBoundsException\n");
        exit(EXIT_FAILURE);
    }
    if (index == 0) {
        push_front(list, value);
    } else if (index == list->size) {
        push_back(list, value);
    } else {
        Node *new_node = create_node(value);
        Node *current = list->head;
        for (int i = 0; i < index - 1; i++) {
            current = current->next;   
        }
        new_node->next = current->next;
        current->next = new_node;
        list->size++;
    }
}
```

=== 元素删除
```c
// 头部删除
void pop_front(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException\n");
        exit(EXIT_FAILURE);
    }
    Node *temp = list->head;
    list->head = temp->next;
    if (list->head == NULL) {
        list->tail = NULL;
    }
    free(temp);
    list->size--;
}

// 尾部删除
int pop_back(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException\n");
        exit(EXIT_FAILURE);
    }
    if (list->head == list->tail) {
        int value = list->head->value;
        free(list->head);
        list->head = NULL;
        list->tail = NULL;
        list->size--;
        return value;
    }
    Node *current = list->head;
    while (current->next != list->tail) {
        current = current->next;
    }
    int value = list->tail->value;
    free(list->tail);
    list->tail = current;
    list->tail->next = NULL;
    list->size--;
    return value;
}

// 删除指定索引
void erase(LinkedList *list, int index) {
    if (index < 0 || index >= list->size) {
        fprintf(stderr, "IndexOutOfBoundsException\n");
        exit(EXIT_FAILURE);
    }
    if (index == 0) {
        pop_front(list);
    } else if (index == list->size - 1) {
        pop_back(list);
    } else {
        Node *current = list->head;
        for (int i = 0; i < index - 1; i++) {
            current = current->next;
        }
        Node *temp = current->next;
        current->next = temp->next;
        free(temp);
        list->size--;
    }
}

// 删除指定值
void remove_value(LinkedList *list, int value) {
    Node *current = list->head;
    Node *prev = NULL;
    while (current != NULL) {
        if (current->value == value) {
            Node *next = current->next;
            free(current);
            list->size--;
            if (prev == NULL) {
                list->head = next;
                if (list->head == NULL) list->tail = NULL;
            } else {
                prev->next = next;
                if (next == NULL) list->tail = prev;
            }
            return;
        }
        prev = current;
        current = current->next;
    }
}
```

=== 其他操作
```c
// 反转链表
void reverse(LinkedList *list) {
    Node *prev = NULL;
    Node *current = list->head;
    Node *next = NULL;
    list->tail = list->head;
    while (current != NULL) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    list->head = prev;
}

// 返回头部值
int front(LinkedList *list) {
    if (empty(list)) exit(EXIT_FAILURE);
    return list->head->value;
}

// 返回尾部值
int back(LinkedList *list) {
    if (empty(list)) exit(EXIT_FAILURE);
    return list->tail->value;
}
```
:::

```c fold="完整代码"
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

// 创建节点
Node* create_node(int value) {
    Node* node = malloc(sizeof(Node));
    if (node == NULL) {
        fprintf(stderr, "create_node: Memory allocation failed\n");
        exit(EXIT_FAILURE);
    }

    node->value = value;
    node->next = NULL;
    return node;
}

// 创建链表
typedef struct LinkedList {
    int size;
    Node *head, *tail;
} LinkedList;

LinkedList* create_linked_list() {
    LinkedList* list = malloc(sizeof(LinkedList));
    if (list == NULL) {
        fprintf(stderr, "create_linked_list: Memory allocation failed\n");
        exit(EXIT_FAILURE);
    }

    list->size = 0;
    list->head = NULL;
    list->tail = NULL;
    return list;
}

// 销毁链表
void destroy_list(LinkedList *list) {
    if (list == NULL) return;
    Node *current = list->head;
    while (current != NULL) {
        Node *next = current->next;
        free(current);
        current = next;
    }
    free(list);
}

// 返回链表大小
int size(LinkedList *list) {
    return list->size;
}

// 判断链表是否为空
bool empty(LinkedList *list) {
    return list->size == 0;
}

// 返回索引处的值
int value_at(LinkedList *list, int index) {
    if (index < 0 || index >= list->size) {
        fprintf(stderr, "IndexOutOfBoundsException: Index %d is out of bounds\n", index);
        exit(EXIT_FAILURE);
    }

    Node *current = list->head;
    for (int i = 0; i < index; i++) {
        current = current->next;
    }
    return current->value;
}

// 在链表开头插入值
void push_front(LinkedList *list, int value) {
    Node *node = create_node(value);
    node->next = list->head;
    list->head = node;
    if (list->tail == NULL) {
        list->tail = node;
    }
    list->size++;
}

// 删除链表开头值
void pop_front(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException: List is empty\n");
        exit(EXIT_FAILURE);
    }

    Node *temp = list->head;
    list->head = temp->next;
    if (list->head == NULL) {
        list->tail = NULL;
    }
    free(temp);
    list->size--;
}

// 在链表末尾插入值
void push_back(LinkedList *list, int value) {
    Node *node = create_node(value);
    if (list->head == NULL) {
        list->head = node;
        list->tail = node;
    } else {
        list->tail->next = node;
        list->tail = node;
    }
    list->size++;
}

// 删除链表末尾值
int pop_back(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException: List is empty\n");
        exit(EXIT_FAILURE);
    }

    // 如果链表只有一个节点
    if (list->head == list->tail) {
        int value = list->head->value;
        free(list->head);
        list->head = NULL;
        list->tail = NULL;
        list->size--;
        return value;
    }

    // 如果链表有多个节点
    Node *current = list->head;
    while (current->next != list->tail) {
        current = current->next;
    }
    int value = list->tail->value;
    free(list->tail);
    list->tail = current;
    list->tail->next = NULL;
    list->size--;
    return value;
}

// 返回链表开头值
int front(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException: List is empty\n");
        exit(EXIT_FAILURE);
    }

    return list->head->value;
}

// 返回链表末尾值
int back(LinkedList *list) {
    if (empty(list)) {
        fprintf(stderr, "NoSuchElementException: List is empty\n");
        exit(EXIT_FAILURE);
    }

    return list->tail->value;
}

// 在指定索引处插入值
void insert(LinkedList *list, int index, int value) {
    if (index < 0 || index > list->size) {
        fprintf(stderr, "IndexOutOfBoundsException: Index %d is out of bounds\n", index);
        exit(EXIT_FAILURE);
    }

    if (index == 0) {
        push_front(list, value);
    } else if (index == list->size) {
        push_back(list, value);
    } else {
        Node *new_node = create_node(value);
        Node *current = list->head;
        for (int i = 0; i < index - 1; i++) {
            current = current->next;   
        }
        new_node->next = current->next;
        current->next = new_node;
        list->size++;
    }
}

void erase(LinkedList *list, int index) {
    if (index < 0 || index >= list->size) {
        fprintf(stderr, "IndexOutOfBoundsException: Index %d is out of bounds\n", index);
        exit(EXIT_FAILURE);
    }

    if (index == 0) {
        pop_front(list);
    } else if (index == list->size - 1) {
        pop_back(list);
    } else {
        Node *current = list->head;
        for (int i = 0; i < index - 1; i++) {
            current = current->next;
        }
        Node *temp = current->next;
        current->next = temp->next;
        free(temp);
        list->size--;
    }
}

// 返回倒数第n个值（n从1开始，1表示最后一个元素）
int value_n_from_end(LinkedList *list, int n) {
    if (n < 1 || n > list->size) {
        fprintf(stderr, "IndexOutOfBoundsException: n=%d is out of bounds (1 to %d)\n", n, list->size);
        exit(EXIT_FAILURE);
    }

    Node *current = list->head;
    for (int i = 0; i < list->size - n; i++) {
        current = current->next;
    }
    return current->value;
}

// 反转链表
void reverse(LinkedList *list) {
    Node *prev = NULL;
    Node *current = list->head;
    Node *next = NULL;

    list->tail = list->head;
    while (current != NULL) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    list->head = prev;
}

// 删除指定值（仅删除第一个匹配项）
void remove_value(LinkedList *list, int value) {
    Node *current = list->head;
    Node *prev = NULL;
    while (current != NULL) {
        if (current->value == value) {
            Node *next = current->next;
            free(current);
            list->size--;
            if (prev == NULL) {
                list->head = next;
                if (list->head == NULL) {
                    list->tail = NULL;
                }
            } else {
                prev->next = next;
                if (next == NULL) {
                    list->tail = prev;
                }
            }
            return;
        }
        prev = current;
        current = current->next;
    }
}

// 打印链表（用于调试）
void print_list(LinkedList *list) {
    printf("[");
    Node *current = list->head;
    while (current != NULL) {
        printf("%d", current->value);
        if (current->next != NULL) printf(", ");
        current = current->next;
    }
    printf("] (size=%d)\n", list->size);
}

int main() {
    LinkedList *list = create_linked_list();
    int passed = 0, failed = 0;

#define TEST(cond, msg) do { \
    if (cond) { printf("  ✓ %s\n", msg); passed++; } \
    else { printf("  ✗ %s\n", msg); failed++; } \
} while(0)

    printf("=== 链表测试 ===\n\n");

    // 1. 空链表
    printf("1. 空链表测试:\n");
    TEST(empty(list), "empty() 返回 true");
    TEST(size(list) == 0, "size() 返回 0");
    printf("\n");

    // 2. push_front
    printf("2. push_front 测试:\n");
    push_front(list, 3);
    push_front(list, 2);
    push_front(list, 1);
    TEST(size(list) == 3, "push_front 后 size=3");
    TEST(value_at(list, 0) == 1, "value_at(0)=1");
    TEST(value_at(list, 1) == 2, "value_at(1)=2");
    TEST(value_at(list, 2) == 3, "value_at(2)=3");
    TEST(front(list) == 1, "front()=1");
    TEST(back(list) == 3, "back()=3");
    printf("\n");

    // 3. pop_front
    printf("3. pop_front 测试:\n");
    pop_front(list);
    TEST(size(list) == 2, "pop_front 后 size=2");
    TEST(front(list) == 2, "front()=2");
    pop_front(list);
    pop_front(list);
    TEST(empty(list), "全部 pop_front 后为空");
    printf("\n");

    // 4. push_back
    printf("4. push_back 测试:\n");
    push_back(list, 10);
    push_back(list, 20);
    push_back(list, 30);
    TEST(size(list) == 3, "push_back 后 size=3");
    TEST(value_at(list, 0) == 10, "value_at(0)=10");
    TEST(value_at(list, 2) == 30, "value_at(2)=30");
    TEST(back(list) == 30, "back()=30");
    printf("\n");

    // 5. pop_back
    printf("5. pop_back 测试:\n");
    int v = pop_back(list);
    TEST(v == 30, "pop_back 返回值=30");
    TEST(back(list) == 20, "pop_back 后 back()=20");
    pop_back(list);
    pop_back(list);
    TEST(empty(list), "全部 pop_back 后为空");
    printf("\n");

    // 6. insert
    printf("6. insert 测试:\n");
    push_back(list, 1);
    push_back(list, 3);
    insert(list, 1, 2);
    TEST(size(list) == 3, "insert 后 size=3");
    TEST(value_at(list, 1) == 2, "insert 到索引1正确");
    insert(list, 0, 0);
    insert(list, 4, 4);
    TEST(value_at(list, 0) == 0 && value_at(list, 4) == 4, "头尾 insert 正确");
    printf("\n");

    // 7. erase
    printf("7. erase 测试:\n");
    erase(list, 0);
    TEST(front(list) == 1, "erase(0) 后 front=1");
    erase(list, 2);  // 删除原索引2的值3
    TEST(size(list) == 3, "erase 中间元素后 size=3");
    printf("\n");

    // 8. value_n_from_end
    printf("8. value_n_from_end 测试:\n");
    while (!empty(list)) pop_back(list);
    push_back(list, 10);
    push_back(list, 20);
    push_back(list, 30);
    push_back(list, 40);
    TEST(value_n_from_end(list, 1) == 40, "倒数第1个=40");
    TEST(value_n_from_end(list, 2) == 30, "倒数第2个=30");
    TEST(value_n_from_end(list, 4) == 10, "倒数第4个=10");
    printf("\n");

    // 9. reverse
    printf("9. reverse 测试:\n");
    reverse(list);
    TEST(front(list) == 40, "reverse 后 front=40");
    TEST(back(list) == 10, "reverse 后 back=10");
    TEST(value_at(list, 1) == 30, "reverse 后 value_at(1)=30");
    printf("\n");

    // 10. remove_value
    printf("10. remove_value 测试:\n");
    while (!empty(list)) pop_back(list);
    push_back(list, 5);
    push_back(list, 10);
    push_back(list, 5);
    push_back(list, 15);
    remove_value(list, 5);
    TEST(size(list) == 3, "remove_value(5) 后 size=3");
    TEST(value_at(list, 0) == 10, "删除第一个5后 head=10");
    TEST(value_at(list, 2) == 15, "第二个5保留");
    remove_value(list, 15);
    TEST(back(list) == 5, "remove_value(15) 后 tail=5");
    printf("\n");

    printf("=== 测试结果: %d 通过, %d 失败 ===\n", passed, failed);
    destroy_list(list);
    return failed > 0 ? 1 : 0;
}
```
