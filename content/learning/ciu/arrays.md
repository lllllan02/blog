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

> 最新实现代码已同步至 GitHub 仓库：[lllllan02/coding/coding-interview-university/array](https://github.com/lllllan02/coding/tree/main/coding-interview-university/array)

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
=== 定义 (array.h)
```c
#ifndef PROJECT_ARRAY_H
#define PROJECT_ARRAY_H

#include <stdbool.h>

const int MIN_CAPACITY = 16;    // 最小初始容量 16
const int GROWTH_FACTOR = 2;    // 扩容速度 2
const int SHRINK_FACTOR = 4;    // 缩容

typedef struct Array {
    int *data;
    int size;
    int capacity;
} Array;

// 创建一个新的动态数组，以容纳给定的初始容量。
Array *new_array(int capacity);

// 释放动态数组。
void destroy_array(Array *arr);

// 返回数组中管理的元素数量。
int size(Array *arr);

// 返回该数组实际能够容纳的容量。
int capacity(Array *arr);

// 如果数组为空，则返回 true。
bool is_empty(Array *arr);

// 返回存储在给定索引处的值
int at(Array *arr, int index);

// 返回给定值在数组中首次出现的索引，如果没有返回 -1。
int find(Array *arr, int value);

// 将给定的项追加到数组的末尾。
void push(Array *arr, int item);

// 在给定索引处插入给定值，将当前元素和后续元素向右移动。
void insert(Array *arr, int index, int value);

// 将给定值前置到数组开头，把后续元素向右移动。
void prepend(Array *arr, int value);

// 从数组中移除最后一个元素并返回其值。
int pop(Array *arr);

// 删除存储在给定索引处的元素，并将后续元素向左移动。
void remove_at(Array *arr, int index);

// 从数组中移除给定的值，即使该值出现多次。
void remove_value(Array *arr, int value);

// 出于调试目的，打印有关该数组的公开信息。
void print_array(Array *arr);

#endif
```

=== 核心实现 (array.c)
::: [!abstract]- 为什么缩容阈值是 1/4 而不是 1/2？
如果缩容阈值设为 $1/2$，在数组刚好处于容量边缘时，连续的 `push` 和 `pop` 操作会导致频繁的内存分配与释放（抖动），使得平摊复杂度退化。设为 $1/4$ 可以保证在缩容后，数组仍有 $1/2$ 的空余空间，从而平衡空间利用率与性能。
:::

```c
#include "array.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char* ERROR_UNABLE_ALLOCATE_MEMORY = "Unable to allocate memory.";
const char* ERROR_OUT_OF_BOUNDS = "Index out of bounds.";

// ========== use function ==========

Array *new_array(int capacity) {
	// 申请地址
	Array *arr = malloc(sizeof(Array));
	if (arr == NULL) {
		exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
	}
	
	// 初始化
	arr->size = 0;
	arr->capacity = determine_capacity(capacity);
	arr->data = (int *) malloc(sizeof(int) * arr->capacity);
	if (arr->data == NULL) {
		free(arr);
		exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
	}

	return arr;
}

void destroy_array(Array *arr) {
	free(arr->data);
	free(arr);
}

int size(Array *arr) { return arr->size; }

int capacity(Array *arr) { return arr->capacity; }

bool is_empty(Array *arr) { return arr->size == 0; }

int at(Array *arr, int index) {
	// 检查索引是否合法
	validate_index(arr, index);
	return *(arr->data + index);
}

int find(Array *arr, int value) {
	for (int i = 0; i < arr->size; i++) {
		if (*(arr->data + i) == value) {
			return i;
		}
	}
	return -1;
}

void push(Array *arr, int item) {
	// 检查是否需要扩容
	resize(arr, arr->size + 1);

	*(arr->data + arr->size) = item;
	arr->size++;
}

void insert(Array *arr, int index, int value) {
	// 检查索引是否合法
	validate_index(arr, index);

	// 检查是否需要扩容
	resize(arr, arr->size + 1);

	// 后续元素向右移动
	memmove(arr->data + index + 1, arr->data + index, sizeof(int) * (arr->size - index));

	// 插入元素
	*(arr->data + index) = value;
	arr->size++;
}

void prepend(Array *arr, int value) {
	insert(arr, 0, value);
}

int pop(Array *arr) {
	// 检查是否还有元素
	if (is_empty(arr)) {
		exit_with_error(ERROR_OUT_OF_BOUNDS);
	}

	// 检查是否需要缩容
	resize(arr, arr->size - 1);

	// 缩减 size 并返回最有一个元素
	arr->size--;
	return *(arr->data + arr->size);;
}

void remove_at(Array *arr, int index) {
	// 检查所有是否合法
	validate_index(arr, index);

	// 检查是否需要缩容
	resize(arr, arr->size - 1);

	// 后续元素向左移动
	memmove(arr->data + index, arr->data + index + 1, sizeof(int) * (arr->size - index));
	
	// 缩减 size
	arr->size--;
}

void remove_value(Array *arr, int value) {
	for (int i = 0; i < arr->size; i++) {
		if (*(arr->data + i) == value) {
			remove_at(arr, i);
			i--;
		}
	}
}

void print_array(Array *arr) {
	printf("Size: %d\n", arr->size);
	printf("Capacity: %d\n", arr->capacity);
  
	printf("Items:\n");
	for (int i = 0; i < arr->size; ++i) {
		printf("%d: %d\n", i, *(arr->data + i));
	}
  
	printf("---------\n");  
}

// ========== tool function ==========

static int determine_capacity(int capacity) {
	// 只接受正整数
	if (capacity < 1) {
		exit(EXIT_FAILURE);
	}

	// 预申请容量为最小初始容量 16
	int true_capacity = MIN_CAPACITY;

	// 一直扩容到超过申请容量的两倍
	while (capacity * GROWTH_FACTOR > true_capacity) {
		true_capacity *= GROWTH_FACTOR;
	}

	return true_capacity;
}

static void exit_with_error(const char *msg) {
	printf("%s\n", msg);
	exit(EXIT_FAILURE);
}

static void validate_index(Array *arr, int index) {
	if (index < 0 || index >= arr->size) {
		exit_with_error(ERROR_OUT_OF_BOUNDS);
	}
}

static void resize(Array *arr, int size) {
	int old_capacity = arr->capacity;
	int new_capacity = old_capacity;

	// 检查是否需要调整大小
	if (size > arr->size) {
	// 添加元素并且 size == capacity 时进行扩容
		if (arr->size == arr->capacity) {
			new_capacity = arr->capacity * GROWTH_FACTOR;
		}
	} else if (size < arr->size) {
	// 删除元素并且 size < capacity / 4 时进行缩容
		if (arr->capacity > MIN_CAPACITY && size < arr->capacity / SHRINK_FACTOR) {
			new_capacity = arr->capacity / GROWTH_FACTOR;
		}
	}

	// 执行大小调整
	if (old_capacity != new_capacity) {
		int *new_data = (int *) realloc(arr->data, sizeof(int) * new_capacity);
		if (new_data == NULL) {
			exit_with_error(ERROR_UNABLE_ALLOCATE_MEMORY);
		}

		arr->data = new_data;
		arr->capacity = new_capacity;
	}
}
```

=== 测试 (test.c)
```c#include "test.h"
#include "array.c"
#include "array.h"
#include <assert.h>

void run_all_tests() {
	test_size_init();
	test_append();
	test_empty();
	test_resize();
	test_at();
	test_insert();
	test_prepend();
	test_pop();
	test_remove();
	test_find_exists();
	test_find_not_exists();
}

void test_size_init() {
	Array *arr = new_array(5);

	int initial_size = size(arr);
	assert(initial_size == 0);

	destroy_array(arr);
}

void test_append() {
	Array *arr = new_array(2);
	push(arr, 2);
	push(arr, 12);

	int new_size = size(arr);
	assert(new_size == 2);

	destroy_array(arr);
}

void test_resize() {
	Array *arr = new_array(2);

	int old_capacity = capacity(arr);
	assert(old_capacity == MIN_CAPACITY);

	// 添加元素到扩容
	for (int i = 0; i < 18; ++i) {
		push(arr, i + 1);
	}
	assert(capacity(arr) == 2 * MIN_CAPACITY);

	// 删除元素到缩容
	for (int j = 0; j < 15; ++j) {
		pop(arr);
	}
	assert(capacity(arr) == MIN_CAPACITY);

	destroy_array(arr);
}

void test_empty() {
	Array *arr = new_array(2);
	assert(is_empty(arr));

	push(arr, 1);
	assert(!is_empty(arr));

	destroy_array(arr);
}

void test_at() {
	Array *arr = new_array(12);
	
	for (int i = 0; i < 12; ++i) {
		push(arr, i + 3);
		assert(at(arr, i) == i + 3);
	}
	destroy_array(arr);
}

void test_insert() {
	Array *arr = new_array(5);

	for (int i = 0; i < 5; ++i) {
		push(arr, i + 5);
	}

	insert(arr, 2, 47);
	assert(at(arr, 2) == 47);
	assert(at(arr, 3) == 7);

	destroy_array(arr);
}

void test_prepend() {
	Array *arr = new_array(5);
	for (int i = 0; i < 3; ++i) {
		push(arr, i + 1);
	}

	prepend(arr, 15);
	assert(at(arr, 0) == 15);
	assert(at(arr, 1) == 1);

	destroy_array(arr);
}

void test_pop() {
	Array *arr = new_array(5);
	for (int i = 0; i < 3; ++i) {
		push(arr, i + 1);
	}
	assert(arr->size == 3);

	for (int j = 0; j < 3; ++j) {
		pop(arr);
	}
	assert(is_empty(arr));

	destroy_array(arr);
}

void test_remove() {
	Array *arr = new_array(5);

	push(arr, 12);
	push(arr, 3);
	push(arr, 41);
	push(arr, 12);
	push(arr, 12);
	remove_value(arr, 12);

	assert(size(arr) == 2);
	destroy_array(arr);
}

void test_find_exists() {
	Array *arr = new_array(5);
	push(arr, 1);
	push(arr, 2);
	push(arr, 3);
	push(arr, 4);
	push(arr, 5);
	assert(find(arr, 1) == 0);
	assert(find(arr, 4) == 3);
	assert(find(arr, 5) == 4);
	destroy_array(arr);
}

void test_find_not_exists() {
	Array *arr = new_array(3);
	push(arr, 1);
	push(arr, 2);
	push(arr, 3);

	assert(find(arr, 7) == -1);
	destroy_array(arr);
}
```
:::
