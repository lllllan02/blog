---
title: 1382. 将二叉搜索树变平衡
aliases: b9ad884d-88ba-4581-8e18-de7d287d6e1f
date: 2026-02-09 21:16:31
card: true
order: 3
tags:
---

> [1382. 将二叉搜索树变平衡](https://leetcode.cn/problems/balance-a-binary-search-tree/description/)

![[Pasted image 20260209211729.png]]

```go fold="二叉树 -> 数组 -> 平衡二叉树"
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func balanceBST(root *TreeNode) *TreeNode {
    slice := toSlice(root)
    return toTree(slice)
}

func toSlice(root *TreeNode) []int {
    if root == nil {
        return nil
    }
    left := append(toSlice(root.Left), root.Val)
    return append(left, toSlice(root.Right)...)
}

func toTree(slice []int) *TreeNode {
    if len(slice) == 0 {
        return nil
    }

    mid := len(slice) / 2
    return &TreeNode {
        Val: slice[mid],
        Left: toTree(slice[:mid]),
        Right: toTree(slice[mid + 1:]),
    }
}
```