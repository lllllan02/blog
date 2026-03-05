---
title: 3542. 将所有元素变为 0 的最少操作次数
aliases: ba81a96d-7c55-4b09-819a-add7941d332a
date: 2026-03-04 20:25:29
card: true
order: 3542
tags: [单调栈]
---

> [3542. 将所有元素变为 0 的最少操作次数](https://leetcode.cn/problems/minimum-operations-to-convert-all-elements-to-zero/description/)

![[Pasted image 20260304202641.png]]

```go
func minOperations(nums []int) (ans int) {
    stack := make([]int, 0, len(nums))
    for _, num := range nums {
        for len(stack) > 0 && stack[len(stack) - 1] > num {
            stack = stack[:len(stack) - 1]
        }
        if num == 0 {
            continue
        }
        if len(stack) == 0 || stack[len(stack) - 1] < num {
            ans++
            stack = append(stack, num)
        }
    }
    return
}
```