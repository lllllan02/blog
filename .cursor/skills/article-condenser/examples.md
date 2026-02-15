# Article Condenser Examples

## Example 1: Technical Article

**Input**: A long article about "React Hooks Best Practices".

**Output**:

```markdown
---
title: "React Hooks 最佳实践指南"
aliases: a1b2c3d4-e5f6-7890-1234-567890abcdef
date: 2023-10-27 10:00:00
card: false
order:
tags:
  - React
  - Frontend
---

> [React Hooks Best Practices](https://example.com/react-hooks)

本文总结了 React Hooks 开发中的核心原则与常见陷阱。

## 核心原则

::: [!tip] 依赖数组是关键
`useEffect` 和 `useMemo` 的依赖数组必须诚实（Exhaustive Deps）。欺骗 React 会导致闭包陷阱。
:::

### 1. useState vs useReducer

当状态逻辑复杂（多个子值、下一个状态依赖前一个状态）时，优先使用 `useReducer`。

### 2. 自定义 Hooks

将可复用的逻辑提取为自定义 Hooks。

::: [!example]- 示例：useWindowSize
```typescript
function useWindowSize() {
  // ... implementation
}
```
:::

## 常见陷阱

1.  **闭包陷阱**：在 `useEffect` 中引用了旧的 state。
2.  **无限循环**：依赖数组中包含了每次渲染都变的对象。

::: [!warning] 对象引用稳定性
确保依赖项中的对象是稳定的（使用 `useMemo` 创建），否则会导致 Effect 频繁触发。
:::
```
