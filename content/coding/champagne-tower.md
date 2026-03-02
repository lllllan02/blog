---
title: 799. 香槟塔
aliases: a040796c-d678-4c40-adb6-fb6a99966bbb
date: 2026-02-14 10:21:32
card: true
order: 799
tags: dp
---

> [799. 香槟塔](https://leetcode.cn/problems/champagne-tower/description/)

![[Pasted image 20260214102215.png]]

```go fold
func champagneTower(poured int, query_row int, query_glass int) float64 {
    dp := make([]float64, max(query_row, query_glass) + 1)

    up := func(index int) float64 {
        if index < 0 {
            return 0
        }
        return max(dp[index] - 1, 0) / 2
    }

    dp[0] = float64(poured)
    for i := 1; i <= query_row; i++ {
        for j := i; j >= 0; j-- {
            dp[j] = up(j) + up(j - 1)
        }
    }

    if dp[query_glass] > 1 {
        return 1
    }
    return dp[query_glass]
}
```