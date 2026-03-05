---
title: 1536. 排布二进制网格的最少交换次数
aliases: 01c5b478-7126-4a2a-b3e1-ed8d36c65efb
date: 2026-03-02 19:59:36
card: false
order: 1536
tags: [贪心, 冒泡]
---

> [1536. 排布二进制网格的最少交换次数](https://leetcode.cn/problems/minimum-swaps-to-arrange-a-binary-grid/description/)

![[Pasted image 20260302200045.png]]

```go fold
func minSwaps(grid [][]int) int {
    n, ans := len(grid), 0
    for i := 0; i < n; i++ {
        need := n - i - 1
        found := -1
        for j := i; j < n; j++ {
            if count(grid[j]) >= need {
                found = j
                break
            }
        }
        if found == -1 {
            return -1
        }
        for k := found; k > i; k-- {
            ans++
            grid[k], grid[k - 1] = grid[k - 1], grid[k]
        }
    }
    return ans
}

func count(row []int) int {
    n := len(row)
    for i := n - 1; i > 0; i-- {
        if row[i] == 1 {
            return n - i - 1
        }
    }
    return n
}
```