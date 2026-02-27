---
title: 切片截取导致的内存泄露风险
aliases: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
date: 2026-02-12 09:07:44
card: true
order: 6
tags:
  - golang
  - slice
  - go1.21
  - source-reading
---

在大切片上截取小切片时，若只保留小切片而丢弃大切片，可能导致内存无法及时释放。

## 为什么会泄露

[[b3ea3dce-e697-48c5-b39b-0cd56941489a|重新切片]]并不会复制底层数组。整个数组会一直保存在内存中，直到不再被引用为止。有时，这会导致程序将所有数据都保存在内存中，而实际上只需要其中的一小部分。

因此：

- 小切片 `t` 仍然持有整个底层数组的引用
- GC 无法回收该数组，直到没有任何切片引用它
- 典型场景：大文件读入 `[]byte`，用正则找到一小段并返回，返回的切片会「拖住」整个文件在内存中

### [官方示例: FindDigits](https://go.dev/blog/slices-intro#a-possible-gotcha)

例如， FindDigits 函数将文件加载到内存中，并在其中搜索第一组连续的数字，并将它们作为新的切片返回。

```go
func FindDigits(filename string) []byte {
    b, _ := ioutil.ReadFile(filename)
    return regexp.MustCompile("[0-9]+").Find(b)
}
```

这段代码的行为符合预期，但返回的 []byte 指向的是一个包含整个文件的数组。由于切片引用的是原始数组，只要切片存在，垃圾回收器就无法释放该数组；文件中仅有的几个有用字节会将整个文件内容一直占用在内存中。

## 指针切片更危险

当切片元素为指针类型时，问题更严重：

- 对切片做 `s = s[:n]` 等原地截断后，`s[n:cap(s)]` 内的元素仍保留在底层数组中
- 若这些元素是指针，GC 会认为它们仍被引用，指向的对象无法回收
- 即使业务上已「不用」这些元素，内存仍会长期占用

`slices` 包在 `Delete`、`DeleteFunc`、`Compact` 等函数的注释中明确提醒了这一点。

## 源码中的提示

### [slices/slices.go Delete](https://github.com/golang/go/blob/release-branch.go1.21/src/slices/slices.go#L218)

Delete 可能不会修改 `s [len(s)-(j-i):len(s)]` 这些元素。如果这些元素包含指针，你可能需要考虑将这些元素清零，以便它们所引用的对象可以被垃圾回收。

```go
// Delete removes the elements s[i:j] from s, returning the modified slice.
// Delete panics if s[i:j] is not a valid slice of s.
// Delete is O(len(s)-j), so if many items must be deleted, it is better to
// make a single call deleting them all together than to delete one at a time.
// Delete might not modify the elements s[len(s)-(j-i):len(s)]. If those
// elements contain pointers you might consider zeroing those elements so that
// objects they reference can be garbage collected.
func Delete[S ~[]E, E any](s S, i, j int) S
```

### [slices/slices.go Clone](https://github.com/golang/go/blob/release-branch.go1.21/src/slices/slices.go#L338)

Clone 的做法其实就是将切片 append 到另一个空切片当中，回顾一下[[8c6749b6-458a-4aed-9ac1-bf582271a7fd|Slice 扩容机制]]你就会明白。

append 函数往一个切片中添加元素，当容量不足时会调用 growslice 进行扩容。而 growslice 最终会申请一块新的底层数组，并将旧数组的数据复制到新数组中。

因此 `append(S([]E{}), s...)` 的写法就是交由 growslice 来帮你做底层数组的复制。

```go
// Clone returns a copy of the slice.
// The elements are copied using assignment, so this is a shallow clone.
func Clone[S ~[]E, E any](s S) S {
	// Preserve nil in case it matters.
	if s == nil {
		return nil
	}
	return append(S([]E{}), s...)
}
```

## 避坑指南

错误示范

```go
func slicing(arr []int, start, end int) []int {
    return arr[start:end]
}
```

正确示范

:::tabgroup
=== copy
```go
func copySlice(arr []int, start, end int) []int {
    newArr := make([]int, end-start)
    copy(newArr, arr[start:end])
    return newArr
}
```
=== append
```go
func appendSlice(arr []int, start, end int) []int {
    return append([]int{}, arr[start:end]...)
}
```
=== slices.Clone
```go
func cloneSlice(arr []int, start, end int) []int {
    return slices.Clone(arr[start:end])
}
```
=== 指针切片删除后清零
```go
copy(s[i:], s[j:])
for k := len(s) - (j - i); k < len(s); k++ {
    s[k] = nil
}
s = s[:len(s)-(j-i)]
```
:::

## 小结

一句话：截取不拷贝底层数组，小切片会拖住大块内存。要解耦就用 `copy` 或 `slices.Clone`；指针切片删除后记得清零。
