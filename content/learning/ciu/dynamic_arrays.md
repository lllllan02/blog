---
title: 动态数组
aliases: d862f96e-ba2c-43be-a499-b0a716c51f7d
date: 2026-02-01 00:02:17
tags:
  - 算法
  - 数据结构
  - C
order: 1
---

动态数组（Dynamic Array）是一种可以自动调整大小的数组。它在内存中占据连续的空间，支持 $O(1)$ 的随机访问，并通过 **平摊分析（Amortized Analysis）** 在末尾添加元素时保持高效。

## 实现要求与特性

在手写实现动态数组时，我们需要关注以下核心特性：

- **内存布局**：使用原生指针管理连续内存块。
- **自动扩缩容**：
    - **扩容**：当数组满时，容量翻倍（$2n$）。
    - **缩容**：当元素减少至容量的 $1/4$ 时，容量减半（$n/2$），以避免频繁抖动。
- **指针操作**：练习通过指针算术（Pointer Arithmetic）而非下标索引来访问内存。

### 复杂度分析

| 操作 | 时间复杂度 | 说明 |
| :--- | :--- | :--- |
| **随机访问** | $O(1)$ | 通过指针偏移直接定位 |
| **末尾插入/删除** | $O(1)$ | 平摊复杂度，涉及扩容时为 $O(n)$ |
| **中间插入/删除** | $O(n)$ | 需要移动后续所有元素 |
| **空间复杂度** | $O(n)$ | 额外预留空间通常不超过 $2n$ |

## 代码实现

:::tabgroup
=== 定义
```c
typedef struct {
    int *data;    // 指向连续内存块的指针
    int size;     // 当前存储的元素个数
    int capacity; // 当前数组的总容量
} DynamicArray;
```

=== 私有辅助函数
::: [!abstract]- 为什么缩容阈值是 1/4 而不是 1/2？
如果缩容阈值设为 $1/2$，在数组刚好处于容量边缘时，连续的 `push` 和 `pop` 操作会导致频繁的内存分配与释放（抖动），使得平摊复杂度退化。设为 $1/4$ 可以保证在缩容后，数组仍有 $1/2$ 的空余空间，从而平衡空间利用率与性能。
:::

```c
// 初始容量
const int INITIAL_CAPACITY = 16;

// 调整数组容量
static void resize(DynamicArray *arr, int new_capacity) {
    int *new_data = realloc(arr->data, new_capacity * sizeof(int));
    if (new_data == NULL) {
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    arr->data = new_data;
    arr->capacity = new_capacity;
}

// 确保数组容量足够（包含扩容与缩容逻辑）
static void ensure_capacity(DynamicArray *arr) {
    if (arr->size == arr->capacity) {
        resize(arr, arr->capacity * 2);
    } else if (arr->capacity > INITIAL_CAPACITY && arr->size <= arr->capacity / 4) {
        resize(arr, arr->capacity / 2);
    }
}

// 验证索引是否合法
static void validate_index(DynamicArray *arr, int index, bool size_is_inclusive) {
    // size_is_inclusive 为 true 时检查访问（0 到 size-1）
    // 为 false 时检查插入位置（0 到 size）
    if (index < 0 || (size_is_inclusive ? index >= arr->size : index > arr->size)) {
        fprintf(stderr, "IndexOutOfBoundsException: Index %d, Size %d\n", index,  arr->size);
        exit(EXIT_FAILURE);
    }
}
```

=== 初始化与销毁
```c
// 初始化数组，从容量 16 开始
DynamicArray *create_array() {
    DynamicArray *arr = malloc(sizeof(DynamicArray));
    if (arr == NULL) {
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    arr->size = 0;
    arr->capacity = INITIAL_CAPACITY;
    arr->data = malloc(arr->capacity * sizeof(int));
    if (arr->data == NULL) {
        free(arr);
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    return arr;
}

// 销毁数组，释放内存
void destroy_array(DynamicArray *arr) {
    if (arr) {
        free(arr->data);
        free(arr);
    }
}
```

=== 状态查询
```c
// 返回数组元素个数
int size(DynamicArray *arr) {
    assert(arr != NULL);
    return arr->size;
}

// 返回当前容量
int capacity(DynamicArray *arr) {
    assert(arr != NULL);
    return arr->capacity;
}

// 判断是否为空
bool is_empty(DynamicArray *arr) {
    assert(arr != NULL);
    return arr->size == 0;
}

// 获取指定索引处的元素
int at(DynamicArray *arr, int index) {
    assert(arr != NULL);
    validate_index(arr, index, true);
    // 练习：使用指针算术访问
    return *(arr->data + index);
}
```

=== 元素添加
```c
// 添加元素到末尾
void push(DynamicArray *arr, int item) {
    assert(arr != NULL);
    *(arr->data + arr->size) = item;
    arr->size++;
    ensure_capacity(arr);
}

// 在指定索引处插入
void insert(DynamicArray *arr, int index, int item) {
    assert(arr != NULL);
    validate_index(arr, index, false);

    // 将 index 之后的元素后移
    for (int i = arr->size; i > index; i--) {
        *(arr->data + i) = *(arr->data + i - 1);
    }
    *(arr->data + index) = item;
    arr->size++;

    ensure_capacity(arr);
}

// 在开头插入
void prepend(DynamicArray *arr, int item) {
    insert(arr, 0, item);
}
```

=== 元素删除与查找
```c
// 删除并返回末尾元素
int pop(DynamicArray *arr) {
    assert(arr != NULL);
    if (is_empty(arr)) {
        fprintf(stderr, "NoSuchElementException: Array is empty\n");
        exit(EXIT_FAILURE);
    }

    arr->size--;
    int item = *(arr->data + arr->size);
    ensure_capacity(arr);
    return item;
}

// 删除指定索引处的元素
void remove_index(DynamicArray *arr, int index) {
    assert(arr != NULL);
    validate_index(arr, index, true);

    for (int i = index; i < arr->size - 1; i++) {
        *(arr->data + i) = *(arr->data + i + 1);
    }
    arr->size--;
    ensure_capacity(arr);
}

// 查找第一个出现的元素索引，未找到返回 -1
int find(DynamicArray *arr, int item) {
    assert(arr != NULL);
    for (int i = 0; i < arr->size; i++) {
        if (*(arr->data + i) == item) {
            return i;
        }
    }
    return -1;
}
```
:::


```c fold="完整代码"
#include <assert.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int *data;    // 数据指针
    int size;     // 元素个数
    int capacity; // 容量
} DynamicArray;

// 初始容量
const int INITIAL_CAPACITY = 16;

// 调整数组容量
static void resize(DynamicArray *arr, int new_capacity) {
    int *new_data = realloc(arr->data, new_capacity * sizeof(int));
    if (new_data == NULL) {
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    arr->data = new_data;
    arr->capacity = new_capacity;
}

// 确保数组容量足够
static void ensure_capacity(DynamicArray *arr) {
    if (arr->size == arr->capacity) {
        resize(arr, arr->capacity * 2);
    } else if (arr->capacity > INITIAL_CAPACITY && arr->size == arr->capacity / 4) {
        resize(arr, arr->capacity / 2);
    }
}

// 验证索引是否合法
static void validate_index(DynamicArray *arr, int index, bool size_is_inclusive) {
    if (index < 0 || (size_is_inclusive ? index >= arr->size : index > arr->size)) {
        fprintf(stderr, "IndexOutOfBoundsException: Index %d, Size %d\n", index,  arr->size);
        exit(EXIT_FAILURE);
    }
}

// 初始化数组，从容量 16 开始
DynamicArray *create_array() {
    DynamicArray *arr = malloc(sizeof(DynamicArray));
    if (arr == NULL) {
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    arr->size = 0;
    arr->capacity = INITIAL_CAPACITY;
    arr->data = malloc(arr->capacity * sizeof(int));
    if (arr->data == NULL) {
        free(arr);
        fprintf(stderr, "MemoryAllocationException: Failed to allocate memory\n");
        exit(EXIT_FAILURE);
    }

    return arr;
}

// 销毁数组
void destroy_array(DynamicArray *arr) {
    if (arr) {
        free(arr->data);
        free(arr);
    }
}

// 返回数组大小
int size(DynamicArray *arr) {
    assert(arr != NULL);

    return arr->size;
}

// 返回数组容量
int capacity(DynamicArray *arr) {
    assert(arr != NULL);

    return arr->capacity;
}

// 添加元素到数组末尾
void push(DynamicArray *arr, int item) {
    assert(arr != NULL);

    *(arr->data + arr->size) = item;
    arr->size++;

    ensure_capacity(arr);
}

// 在指定索引处插入元素
void insert(DynamicArray *arr, int index, int item) {
    assert(arr != NULL);

    validate_index(arr, index, false);

    for (int i = arr->size; i > index; i--) {
        *(arr->data + i) = *(arr->data + i - 1);
    }
    *(arr->data + index) = item;
    arr->size++;

    ensure_capacity(arr);
}

// 在数组开头插入元素
void prepend(DynamicArray *arr, int item) {
    assert(arr != NULL);

    insert(arr, 0, item);
}

// 判断数组是否为空
bool is_empty(DynamicArray *arr) {
    assert(arr != NULL);

    return arr->size == 0;
}

// 返回索引处的元素
int at(DynamicArray *arr, int index) {
    assert(arr != NULL);

    validate_index(arr, index, true);

    return *(arr->data + index);
}


// 查找第一个出现的元素下标
int find(DynamicArray *arr, int item) {
    assert(arr != NULL);

    for (int i = 0; i < arr->size; i++) {
        if (*(arr->data + i) == item) {
            return i;
        }
    }

    return -1;
}

// 删除数组末尾元素
int pop(DynamicArray *arr) {
    assert(arr != NULL);

    if (is_empty(arr)) {
        fprintf(stderr, "NoSuchElementException: Array is empty\n");
        exit(EXIT_FAILURE);
    }

    arr->size--;
    int item = *(arr->data + arr->size);

    ensure_capacity(arr);
    return item;
}

// 删除指定索引处的元素
void remove_index(DynamicArray *arr, int index) {
    assert(arr != NULL);

    validate_index(arr, index, true);

    for (int i = index; i < arr->size; i++) {
        *(arr->data + i) = *(arr->data + i + 1);
    }
    arr->size--;

    ensure_capacity(arr);
}

// 删除第一个出现的元素
int remove_first(DynamicArray *arr, int item) {
    assert(arr != NULL);

    int index = -1;
    for (int i = 0; i < arr->size; i++) {
        if (*(arr->data + i) == item) {
            index = i;
            remove_index(arr, index);
            break;
        }
    }

    return index;
}

// 删除所有出现的元素
void remove_all(DynamicArray *arr, int item) {
    assert(arr != NULL);

    int new_size = 0;
    for (int i = 0; i < arr->size; i++) {
        if (*(arr->data + i) != item) {
            *(arr->data + new_size) = *(arr->data + i);
            new_size++;
        }
    }
    arr->size = new_size;

    ensure_capacity(arr);
}

int main() {
    // 1. 创建动态数组
    DynamicArray *arr = create_array();
    printf("--- 初始化数组 ---\n");
    printf("Size: %d, Capacity: %d\n", size(arr), capacity(arr));

    // 2. 添加元素 (push)
    printf("\n--- 添加元素 (push) ---\n");
    for (int i = 1; i <= 5; i++) {
        push(arr, i * 10);
        printf("Pushed: %d, Size: %d, Capacity: %d\n", i * 10, size(arr), capacity(arr));
    }

    // 3. 在开头和中间插入元素 (prepend, insert)
    printf("\n--- 插入元素 ---\n");
    prepend(arr, 5);
    printf("Prepended 5, Size: %d\n", size(arr));
    insert(arr, 3, 25);
    printf("Inserted 25 at index 3, Size: %d\n", size(arr));

    // 4. 遍历并打印数组 (at)
    printf("\n--- 当前数组内容 ---\n");
    for (int i = 0; i < size(arr); i++) {
        printf("Index %d: %d\n", i, at(arr, i));
    }

    // 5. 查找元素 (find)
    int target = 30;
    int found_index = find(arr, target);
    printf("\n--- 查找元素 ---\n");
    if (found_index != -1) {
        printf("Found %d at index: %d\n", target, found_index);
    } else {
        printf("%d not found in array\n", target);
    }

    // 6. 删除元素 (pop, remove_index, remove_first)
    printf("\n--- 删除元素 ---\n");
    int popped = pop(arr);
    printf("Popped: %d, New Size: %d\n", popped, size(arr));

    remove_index(arr, 0);
    printf("Removed index 0, New Size: %d\n", size(arr));

    int removed_val = 20;
    int removed_idx = remove_first(arr, removed_val);
    if (removed_idx != -1) {
        printf("Removed first occurrence of %d at index %d\n", removed_val, removed_idx);
    }

    // 7. 打印最终数组状态
    printf("\n--- 最终数组内容 ---\n");
    for (int i = 0; i < size(arr); i++) {
        printf("Index %d: %d\n", i, at(arr, i));
    }
    printf("Final Size: %d, Final Capacity: %d\n", size(arr), capacity(arr));

    // 8. 测试扩容 (Upsize)
    printf("\n--- 测试扩容 (Upsize) ---\n");
    printf("Current Capacity: %d\n", capacity(arr));
    int items_to_add = 20;
    printf("Adding %d more items...\n", items_to_add);
    for (int i = 0; i < items_to_add; i++) {
        push(arr, i + 100);
    }
    printf("After pushing, Size: %d, Capacity: %d\n", size(arr), capacity(arr));

    // 9. 测试缩容 (Downsize)
    printf("\n--- 测试缩容 (Downsize) ---\n");
    printf("Popping items until capacity decreases...\n");
    int initial_cap = capacity(arr);
    while (capacity(arr) == initial_cap && !is_empty(arr)) {
    pop(arr);
    }
    printf("Capacity decreased! Current Size: %d, New Capacity: %d\n", size(arr), capacity(arr));

    // 继续缩容到初始容量
    while (capacity(arr) > INITIAL_CAPACITY) {
        pop(arr);
    }
    printf("Back to initial capacity. Size: %d, Capacity: %d\n", size(arr), capacity(arr));

    // 10. 销毁数组
    destroy_array(arr);
    printf("\n数组已销毁。\n");

    return 0;
}
```