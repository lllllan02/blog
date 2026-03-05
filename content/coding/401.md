---
title: 401. 二进制手表
aliases: e6a54e5b-f828-41ea-aac4-0d9835214013
date: 2026-02-17 13:06:15
card: true
order: 401
tags: 二进制
---

> [401. 二进制手表](https://leetcode.cn/problems/binary-watch/description/)


![[Pasted image 20260217130758.png]]

```go fold
func readBinaryWatch(turnedOn int) (ans []string) {
    for h := range 12 {
        for m := range 60 {
            if bits.OnesCount8(uint8(h))+bits.OnesCount8(uint8(m)) == turnedOn {
                ans = append(ans, fmt.Sprintf("%d:%02d", h, m))
            }
        }
    }
    return
}
```