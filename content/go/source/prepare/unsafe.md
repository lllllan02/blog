---
title: unsafe
aliases: 7517423e-1418-4355-9e27-d81c814c89c8
date: 2026-02-08 12:56:38
card: false
order: 2
tags:
---

## [unsafe](https://pkg.go.dev/unsafe@go1.21.13)

`unsafe` 是标准库中用于“绕过类型安全”的包，常见于运行时、反射、与 C 互操作等场景。它只暴露少量 API：`Pointer` 类型，以及 `Sizeof`、`Offsetof`、`Alignof` 等与内存布局相关的函数。

:::tabgroup
=== unsafe
```go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
Package unsafe 提供绕过 Go 程序类型安全的操作。

导入 unsafe 的包可能不具备可移植性，且不受 Go 1 兼容性准则保护。
*/
package unsafe

// ArbitraryType 仅用于文档说明，并非 unsafe 包的实际组成部分。它表示任意 Go 表达式的类型。
type ArbitraryType int

// IntegerType 仅用于文档说明，并非 unsafe 包的实际组成部分。它表示任意整数类型。
type IntegerType int
```

=== Sizeof
```go
func Sizeof(x ArbitraryType) uintptr
```

Sizeof 接受任意类型的表达式 x，返回若声明 var v = x 则变量 v 的字节大小。

<u>该大小不包含 x 可能引用的任何内存</u>。例如若 x 是 slice，Sizeof 返回的是 slice 描述符的大小，而非 slice 所引用内存的大小。对结构体而言，大小包含由字段对齐引入的填充。

若实参 x 的类型不具有可变大小，则 Sizeof 的返回值是 Go 常量。（若类型为类型参数，或为元素具有可变大小的数组/结构体，则该类型具有可变大小。）

```go fold
package main

import (
	"fmt"
	"unsafe"
)

type Struct struct {
	i   int
	i64 int64
	f64 float64
	arr [3]int
	sli []int
	str string
}

func main() {
	s := Struct{sli: make([]int, 100)}

	fmt.Printf("size of int: %v\n", unsafe.Sizeof(s.i))
	fmt.Printf("size of int64: %v\n", unsafe.Sizeof(s.i64))
	fmt.Printf("size of float64: %v\n", unsafe.Sizeof(s.f64))
	fmt.Printf("size of [3]int: %v\n", unsafe.Sizeof(s.arr))
	fmt.Printf("size of []int: %v\n", unsafe.Sizeof(s.sli))
	fmt.Printf("size of string: %v\n", unsafe.Sizeof(s.str))
	fmt.Printf("Struct size: %v\n", unsafe.Sizeof(s))
}
```

```text
size of int: 8
size of int64: 8
size of float64: 8
size of [3]int: 24
size of []int: 24
size of string: 16
Struct size: 88
```

=== Offsetof
```go
func Offsetof(x ArbitraryType) uintptr
```

Offsetof 返回 x 所表示字段在结构体内的偏移，x 必须为 structValue.field 形式。

换言之，它返回结构体起始与该字段起始之间的字节数。若实参 x 的类型不具有可变大小，则 Offsetof 的返回值是 Go 常量。（可变大小类型的定义见 [Sizeof] 的说明。）

```go fold
package main

import (
	"fmt"
	"unsafe"
)

type Struct struct {
	i   int
	i64 int64
	f64 float64
	arr [3]int
	sli []int
	str string
}

func main() {
	s := Struct{sli: make([]int, 100)}

	fmt.Printf("offset of int: %v\n", unsafe.Offsetof(s.i))
	fmt.Printf("offset of int64: %v\n", unsafe.Offsetof(s.i64))
	fmt.Printf("offset of float64: %v\n", unsafe.Offsetof(s.f64))
	fmt.Printf("offset of [3]int: %v\n", unsafe.Offsetof(s.arr))
	fmt.Printf("offset of []int: %v\n", unsafe.Offsetof(s.sli))
	fmt.Printf("offset of string: %v\n", unsafe.Offsetof(s.str))
}
```

> 其实就是前面字段的 sizeof 和

```text
offset of int: 0
offset of int64: 8
offset of float64: 16
offset of [3]int: 24
offset of []int: 48
offset of string: 72
```

=== Alignof
```go
func Alignof(x ArbitraryType) uintptr
```

Alignof 接受任意类型的表达式 x，返回若声明 var v = x 则变量 v 所需的对齐值。

它是满足 v 的地址恒为 0 mod m 的最大值 m。与 `reflect.TypeOf(x).Align()` 的返回值相同。

特殊地，若变量 s 为结构体类型且 f 为该结构体内的字段，则 Alignof(s.f) 返回该类型在结构体内作为字段时所需的对齐，与 `reflect.TypeOf(s.f).FieldAlign()` 的返回值相同。

若实参类型不具有可变大小，则 Alignof 的返回值是 Go 常量。（可变大小类型的定义见 [Sizeof] 的说明。）

```go fold
package main

import (
	"fmt"
	"unsafe"
)

type Struct struct {
	i   int
	i64 int64
	f64 float64
	arr [3]int
	sli []int
	str string
}

func main() {
	s := Struct{sli: make([]int, 100)}

	fmt.Printf("align of int: %v\n", unsafe.Alignof(s.i))
	fmt.Printf("align of int64: %v\n", unsafe.Alignof(s.i64))
	fmt.Printf("align of float64: %v\n", unsafe.Alignof(s.f64))
	fmt.Printf("align of [3]int: %v\n", unsafe.Alignof(s.arr))
	fmt.Printf("align of []int: %v\n", unsafe.Alignof(s.sli))
	fmt.Printf("align of string: %v\n", unsafe.Alignof(s.str))
}
```

```text
align of int: 8
align of int64: 8
align of float64: 8
align of [3]int: 8
align of []int: 8
align of string: 8
```

=== Add
```go
func Add(ptr Pointer, len IntegerType) Pointer
```

Add 将 len 与 ptr 相加，返回更新后的指针 `Pointer(uintptr(ptr) + uintptr(len))`。

实参 len 必须为整数类型或无类型常量。常量 len 必须能表示为 int 类型的值；若为无类型常量则赋予类型 int。Pointer 的合法使用规则仍然适用。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	arr := [3]int{1, 2, 3}
	pointer := unsafe.Pointer(&arr[0])
	newPointer := unsafe.Add(pointer, unsafe.Sizeof(int(0)))
	fmt.Printf("arr[1]: %v\n", *(*int)(newPointer))
}
```

```text
arr[1]: 2
```

=== Slice
```go
func Slice(ptr *ArbitraryType, len IntegerType) []ArbitraryType
```

Slice 返回一个 slice，其底层数组从 ptr 开始，长度和容量均为 len。

Slice(ptr, len) 等价于 `(*[len]ArbitraryType)(unsafe.Pointer(ptr))[:]`

特殊地，若 ptr 为 nil 且 len 为 0，Slice 返回 nil。

实参 len 必须为整数类型或无类型常量。常量 len 必须非负且能表示为 int 类型的值；若为无类型常量则赋予类型 int。运行时若 len 为负，或 ptr 为 nil 且 len 非零，会发生 panic。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	arr := [3]int{1, 2, 3}

	slice := unsafe.Slice(&arr[0], 3)
	slice = append(slice, 4)
	fmt.Printf("slice: %v\n", slice)
}
```

简单理解就是把一个数组(固定长度)升级成了切片(可变长度)。

=== SliceData
```go
func SliceData(slice []ArbitraryType) *ArbitraryType
```

SliceData 返回实参 slice 的底层数组的指针。

- 若 cap(slice) > 0，SliceData 返回 &slice[:1][0]。
- 若 slice == nil，SliceData 返回 nil。
- 否则 SliceData 返回指向未指定内存地址的非 nil 指针。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	slice := make([]int, 3, 5)
	fmt.Printf("slice: %v\n", slice)
	array := unsafe.SliceData(slice)
	for i := 0; i < 5; i++ {
		pointer := unsafe.Pointer(array)
		pointer = unsafe.Add(pointer, uintptr(i)*unsafe.Sizeof(int(0)))
		ptr := (*int)(pointer)
		*ptr = i
	}
	fmt.Printf("slice: %v\n", slice)
}
```

```text
slice: [0 0 0]
slice: [0 1 2]
```

=== String
```go
func String(ptr *byte, len IntegerType) string
```

String 返回一个字符串值，其底层字节从 ptr 开始、长度为 len。

实参 len 必须为整数类型或无类型常量。常量 len 必须非负且能表示为 int 类型的值；若为无类型常量则赋予类型 int。运行时若 len 为负，或 ptr 为 nil 且 len 非零，会发生 panic。

由于 Go 字符串不可变，传给 String 的字节之后不得修改。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	bytes := []byte("hello, world!")
	str := unsafe.String(&bytes[0], len(bytes))
	fmt.Println(str)
}
```

简单理解，就是把一个 []byte 升级了 string 类型。

```text
hello, world!
```

=== StringData
```go
func StringData(str string) *byte
```

StringData 返回 str 的底层字节的指针。对空字符串返回值未指定，可能为 nil。

由于 Go 字符串不可变，StringData 返回的字节不得修改。


```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	str := "hello, world!"
	bytes := unsafe.StringData(str)
	for i := 0; i < len(str); i++ {
		pointer := unsafe.Pointer(bytes)
		pointer = unsafe.Add(pointer, uintptr(i)*unsafe.Sizeof(byte(0)))
		fmt.Printf("%c", *(*byte)(pointer))
	}
	fmt.Println()
}
```

```text
hello, world!
```

:::

## [uintptr](https://github.com/golang/go/blob/release-branch.go1.21/src/builtin/builtin.go#L85)

```go
// uintptr is an integer type that is large enough to hold the bit pattern of
// any pointer.
type uintptr uintptr
```

`uintptr` 是一个无符号整数类型，用来存储指针的数值（即地址），用途是做“指针算术”。

> 它**不是**指针类型：<u>GC 不会把 `uintptr` 当作引用，不会因为某个变量里存了地址就认为该对象仍在使用</u>。

```go
arr := [3]int{1, 2, 3}
fmt.Printf("&arr[0]: %v\n", &arr[0])
fmt.Printf("uintptr: %v\n", uintptr(unsafe.Pointer(&arr[0])))

---
&arr[0]: 0x14000014198
uintptr: 1374389617048
```

### 指针运算

Go 不允许对普通指针加减，因此不能像在 C 中一样直接使用 `arr + 1` 的方式去获取数组上的某一位元素。（其实这里的举例不是很严谨，在 Golang 中数组甚至不是一个指针类型，只是为了方便理解，告诉你在 go 里是不允许直接对一个指针进行加减运算的）

那如果我就是需要进行指针运算怎么办？

`uintptr` 和 `unsafe.Pointer` 就是来完成这件事的，你可以通过 `*T → Pointer → uintptr → 运算 → Pointer → *T` 来获取你想要访问的某个值，比如：

```go
arr := [3]int{1, 2, 3}

pointer := unsafe.Pointer(&arr[0])
newPointer := unsafe.Pointer(uintptr(pointer) + unsafe.Sizeof(int(0)))
fmt.Printf("newPointer: %v\n", *(*int)(newPointer))
```

> 注意：不要长期保存 `uintptr`，转换链要在同一表达式或小范围内完成，否则 GC 可能已回收原对象，再访问会未定义。

## unsafe.Pointer

`unsafe.Pointer` 是一种通用指针类型，可以理解为“任意类型的指针”的统一表示。

官方允许的转换只有：任意 `*T` ↔ `Pointer`，以及 `Pointer` ↔ `uintptr`。普通 Go 指针不能直接做算术或跨类型转换，必须通过 `unsafe.Pointer` 作为中介。

| 对比项     | unsafe.Pointer              | uintptr                          |
| ---------- | ---------------------------- | -------------------------------- |
| 类型本质   | 指针类型                     | 无符号整数类型                   |
| GC 是否追踪 | 是，视为引用                 | 否，不视为引用                   |
| 算术运算   | 不支持                       | 支持（用于偏移计算）             |
| 主要用途   | 类型转换的中介、与 uintptr 互转 | 存地址数值、做指针算术           |
| 是否可长期保存 | 可以                         | 不宜，转换链应紧凑完成           |

```go title="Pointer"
// Pointer 表示指向任意类型的指针。Pointer 类型有四种特殊操作，其他类型不具备：
//   - 任意类型的指针值可以转换为 Pointer。
//   - Pointer 可以转换为任意类型的指针值。
//   - uintptr 可以转换为 Pointer。
//   - Pointer 可以转换为 uintptr。
//
// 因此 Pointer 允许程序绕过类型系统读写任意内存，应极其谨慎地使用。
//
type Pointer *ArbitraryType
```

以下涉及 Pointer 的用法是合法的。未使用这些用法的代码可能在当前无效，或在未来变为无效。即使下列合法用法也带有重要注意事项。

运行 `go vet` 有助于发现不符合这些用法的 Pointer 使用，但 `go vet` 未报错并不保证代码合法。

### 1) 将 *T1 转为 Pointer 再转为 *T2。

若 T2 不大于 T1 且两者内存布局等价，该转换允许将一种类型的数据按另一种类型重新解释。例如 math.Float64bits 的实现：

```go
func Float64bits(f float64) uint64 {
	return *(*uint64)(unsafe.Pointer(&f))
}
```

### 2) 将 Pointer 转为 uintptr（但不可再转回 Pointer）

将 Pointer 转为 uintptr 会得到所指向值的地址（整数形式）。此类 uintptr 的常见用途是打印。

<u>一般而言，将 uintptr 再转回 Pointer 是无效的。</u>

uintptr 是整数，不是引用。将 Pointer 转为 uintptr 会得到一个没有指针语义的整数值。即使 uintptr 存有某对象的地址，若该对象被移动，垃圾回收器也不会更新该 uintptr 的值，该 uintptr 也不会阻止对象被回收。

以下模式列举了从 uintptr 到 Pointer 的唯一合法转换。

### 3) 将 Pointer 转为 uintptr、做运算后再转回 Pointer

若 p 指向已分配对象内部，可通过转为 uintptr、加上偏移、再转回 Pointer 在对象内移动：

```go
p = unsafe.Pointer(uintptr(p) + offset)
```

该用法最常见于访问结构体字段或数组元素：

```go
// 等价于 f := unsafe.Pointer(&s.f)
f := unsafe.Pointer(uintptr(unsafe.Pointer(&s)) + unsafe.Offsetof(s.f))
// 等价于 e := unsafe.Pointer(&x[i])
e := unsafe.Pointer(uintptr(unsafe.Pointer(&x[0])) + i*unsafe.Sizeof(x[0]))
```

以这种方式对指针加减偏移都是合法的。使用 &^ 对指针做舍入（通常用于对齐）也合法。所有情况下，结果必须仍指向原始已分配对象内部。

与 C 不同，将指针推进到其原始分配末尾之外是无效的：

```go
// 无效：end 指向分配空间之外。
var s thing
end = unsafe.Pointer(uintptr(unsafe.Pointer(&s)) + unsafe.Sizeof(s))
// 无效：end 指向分配空间之外。
b := make([]byte, n)
end = unsafe.Pointer(uintptr(unsafe.Pointer(&b[0])) + uintptr(n))
```

注意：两次转换必须出现在同一表达式中，中间仅允许算术运算：

```go
// 无效：uintptr 不能先存入变量再转回 Pointer。
u := uintptr(p)
p = unsafe.Pointer(u + offset)
```

注意：指针必须指向已分配对象内部，因此不能为 nil。

```go
// 无效：对 nil 指针的转换。
u := unsafe.Pointer(nil)
p := unsafe.Pointer(uintptr(u) + offset)
```

### 4) 在调用 syscall.Syscall 时将 Pointer 转为 uintptr

syscall 包中的 Syscall 函数将 uintptr 参数直接传给操作系统，系统可能根据调用细节

将其中一些重新解释为指针。即系统调用实现会隐式地将某些参数从 uintptr 转回指针。

若指针实参必须转为 uintptr 才能作为实参使用，该转换必须出现在调用表达式本身中：

```go
syscall.Syscall(SYS_READ, uintptr(fd), uintptr(unsafe.Pointer(p)), uintptr(n))
```

编译器对“在汇编实现的函数的实参列表中、将 Pointer 转为 uintptr”的情况做了特殊处理：会保证被引用的已分配对象（若有）在调用完成前不会被移动或释放，尽管单从类型上看该对象在调用期间似乎已不再需要。

为使编译器识别该模式，转换必须出现在实参列表中：

```go
// 无效：uintptr 不能先存入变量，再在系统调用时隐式转回 Pointer。
u := uintptr(unsafe.Pointer(p))
syscall.Syscall(SYS_READ, uintptr(fd), u, uintptr(n))
```

### 5) 将 reflect.Value.Pointer 或 reflect.Value.UnsafeAddr 的返回值从 uintptr 转为 Pointer

reflect 包中名为 Pointer 和 UnsafeAddr 的 Value 方法返回 uintptr 而非 unsafe.Pointer，

是为了防止调用方在未先导入 "unsafe" 的情况下将结果改为任意类型。但这意味着结果是脆弱的，必须在调用后立即在同一表达式中转为 Pointer：

```go
p := (*int)(unsafe.Pointer(reflect.ValueOf(new(int)).Pointer()))
```

与上述情况相同，先将结果存入变量再转换是无效的：

```go
// 无效：uintptr 不能先存入变量再转回 Pointer。
u := reflect.ValueOf(new(int)).Pointer()
p := (*int)(unsafe.Pointer(u))
```

### 6) 将 reflect.SliceHeader 或 reflect.StringHeader 的 Data 字段与 Pointer 相互转换

与上一种情况类似，reflect 的 SliceHeader 和 StringHeader 将 Data 声明为 uintptr，是为了防止调用方在未先导入 "unsafe" 的情况下将结果改为任意类型。但这意味着 SliceHeader 和 StringHeader 仅在解释实际 slice 或 string 值的内容时有效。

```go 
var s string
hdr := (*reflect.StringHeader)(unsafe.Pointer(&s)) // 情况 1
hdr.Data = uintptr(unsafe.Pointer(p))              // 情况 6（本情况）
hdr.Len = n
```

在此用法中，hdr.Data 实际上是引用 string 头中底层指针的另一种方式，而非 uintptr 变量本身。

一般而言，reflect.SliceHeader 和 reflect.StringHeader 应仅作为 *reflect.SliceHeader 和 *reflect.StringHeader 使用，且指向实际的 slice 或 string，切勿作为普通结构体使用。程序不应声明或分配这些结构体类型的变量。

```go
// 无效：直接声明的 header 不会把 Data 当作引用持有。
var hdr reflect.StringHeader
hdr.Data = uintptr(unsafe.Pointer(p))
hdr.Len = n
s := *(*string)(unsafe.Pointer(&hdr)) // p 可能早已失效
```

## 阅读资料

- [unsafe 包文档](https://pkg.go.dev/unsafe@go1.21.13)
- [unsafe 源码](https://go.dev/src/unsafe/unsafe.go)