---
title: 1461. 检查一个字符串是否包含所有长度为 K 的二进制子串
aliases: 050a0510-c216-410a-b6a9-e71983383526
date: 2026-02-15 15:02:53
card: true
order:
tags: 滑动窗口
---

> [1461. 检查一个字符串是否包含所有长度为 K 的二进制子串](https://leetcode.cn/problems/check-if-a-string-contains-all-binary-codes-of-size-k/description/)

![[Pasted image 20260215150407.png]]

```go fold
func hasAllCodes(s string, k int) bool {
    length := len(s)
    if length < k {
        return false
    }

    seen := make(map[int]struct{})

    num := 0
    for i := 0; i < k; i++ {
        num = num * 2 + int(s[i] - '0')       
    }
    seen[num] = struct{}{}

    for i := k; i < length; i++ {
        left := int(s[i - k] - '0') << (k - 1)
        num = (num - left) * 2 + int(s[i] - '0')
        seen[num] = struct{}{}
        fmt.Println(num)
    }

    return len(seen) == (1 << k)
}
```