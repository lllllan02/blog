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

在日常开发中，我们经常需要在大型切片的基础上截取一小部分数据。你是否意识到，如果仅仅保留这个小切片而丢弃原有的切片，可能会引发严重的内存泄漏？

## 为什么会发生泄漏？

这就需要回顾一下切片的底层机制了。正如我们在 [[b3ea3dce-e697-48c5-b39b-0cd56941489a|重新切片]] 中所探讨的，切片截取操作并不会复制底层的数组。相反，新切片会直接引用原数组的内存地址。

这意味着什么呢？整个底层数组会一直驻留在内存中，直到没有任何切片引用它为止。在某些场景下，这会导致程序将海量数据保留在内存中，而实际上业务逻辑只需要其中的极小一部分。

具体来说：

- 截取后的小切片 `t` 依然牢牢持有整个底层数组的引用。
- 垃圾回收器（GC）无法回收这个庞大的数组，因为它仍被“需要”。
- 典型场景：将一个大文件完整读入 `[]byte`，然后使用正则表达式找到一小段关键信息并返回。这个看似无害的返回切片，实际上会像锚一样「拖住」整个文件内容，使其无法从内存中释放。

### [官方示例: FindDigits](https://go.dev/blog/slices-intro#a-possible-gotcha)

为了更直观地说明这个问题，让我们来看看 Go 官方博客提供的一个经典反例：`FindDigits` 函数。它的作用是将文件加载到内存中，搜索第一组连续的数字，并将它们作为新的切片返回。

```go
func FindDigits(filename string) []byte {
    b, _ := ioutil.ReadFile(filename)
    return regexp.MustCompile("[0-9]+").Find(b)
}
```

这段代码的行为完全符合预期，但隐藏着巨大的风险：返回的 `[]byte` 切片指向的是一个包含整个文件内容的庞大数组。由于切片引用了原始数组，只要这个返回的切片还存在于作用域中，垃圾回收器就束手无策。文件中仅仅几个有用的字节，却让整个文件内容长期霸占着宝贵的内存资源。

## 指针切片：潜藏的更大危机

当切片的元素是指针类型时，内存泄漏的问题会变得更加棘手。

- 假设我们对一个指针切片执行了 `s = s[:n]` 这样的原地截断操作。表面上看，切片变短了，但实际上 `s[n:cap(s)]` 范围内的元素依然原封不动地保留在底层数组中。
- 由于这些元素是指针，GC 会认为它们所指向的对象仍然处于被引用的状态，因此无法回收这些对象。
- 即使业务逻辑上已经明确「不再使用」这些元素，它们所占据的内存依然会长期得不到释放。

正是因为这个隐患，`slices` 包在 `Delete`、`DeleteFunc`、`Compact` 等函数的官方注释中，都给出了明确的警告。

## 源码中的善意提醒

### [slices/slices.go Delete](https://github.com/golang/go/blob/release-branch.go1.21/src/slices/slices.go#L218)

在 `Delete` 函数的注释中，官方明确指出：`Delete` 可能不会修改 `s[len(s)-(j-i):len(s)]` 这些被“删除”的元素。如果这些元素包含指针，你可能需要考虑手动将它们清零，以便它们所引用的对象能够被垃圾回收器顺利回收。

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

那么，如何安全地复制一个切片呢？`Clone` 函数提供了一个优雅的解决方案。它的做法其实非常巧妙：将原切片 `append` 到另一个空切片当中。回顾一下 [[8c6749b6-458a-4aed-9ac1-bf582271a7fd|Slice 扩容机制]]，你就会恍然大悟。

`append` 函数在往一个空切片中添加大量元素时，必然会因为容量不足而调用 `growslice` 进行扩容。而 `growslice` 的核心职责之一，就是申请一块全新的底层数组，并将旧数组的数据安全地复制过去。

因此，`append(S([]E{}), s...)` 这种看似奇怪的写法，实际上是巧妙地借助 `growslice` 来帮你完成底层数组的深度复制，从而彻底切断与原数组的联系。

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

## 避坑指南：如何优雅地截取切片？

理解了原理，我们来看看在实际开发中应该如何避免这些陷阱。

错误示范（直接截取，导致底层数组被拖住）：

```go
func slicing(arr []int, start, end int) []int {
    return arr[start:end]
}
```

正确示范（彻底切断联系）：

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

## 总结思考

一言以蔽之：切片的截取操作并不会拷贝底层数组，这使得小切片极易拖住大块内存，引发泄漏。为了实现真正的解耦，我们应当果断使用 `copy` 或 `slices.Clone`；而在处理指针切片的删除操作时，务必记得手动将废弃的元素清零，以释放 GC 的压力。
