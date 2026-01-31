---
title: 744. 寻找比目标字母大的最小字母
aliases: b6ccc12c-58cb-4606-97a0-635f93177e32
date: 2026-01-31 10:17:15
card: true
order: 2
tags: [数组, 线性查找, 二分查找]
---

> [744. 寻找比目标字母大的最小字母](https://leetcode.cn/problems/find-smallest-letter-greater-than-target/description/)

![[Pasted image 20260131101912.png]]

```go
func nextGreatestLetter(letters []byte, target byte) byte {
    left, right := 0, len(letters) - 1

    if target >= letters[right] {
        return letters[0]
    }

    for ; left < right; {
        mid := (right - left) / 2 + left
        if letters[mid] > target {
            right = mid
        } else {
            left = mid + 1
        }
    }

    return letters[left]
}
```