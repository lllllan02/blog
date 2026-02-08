---
title: 调试 Go 源代码
aliases: 3f44eb8b-83f0-4b56-9ec4-1d04f294e2c9
date: 2026-02-08 11:12:12
card: false
order: 1
tags:
  - golang
  - source-reading
  - debug
---

> 来自[1.1 调试源代码｜Go 语言设计与实现](https://draven.co/golang/docs/part1-prerequisite/ch01-prepare/golang-debug/)

读懂代码和验证猜想最快、最直接的方式，就是在关键位置加一句 `fmt.Println` 打印中间结果，阅读源码也不例外。因此开启源码阅读计划的第一步是：掌握如何修改标准库源码，并通过添加打印来调试。

## 选择版本

选版本时，我们既希望读到尽量新的实现（往往更完善），又希望相对稳定，避免被频繁的版本更新打断。

**1.21** 是一个折中的选择。若你使用 macOS 且当前不是该版本，可参考 [[0cacc111-8794-4027-a275-24626916ca6a|管理 Go 版本]]，在阅读与调试前切换到 1.21。

## 开启调试

无论你是通过 Homebrew、官方安装包安装，还是本地已有多版本 Go，都可以用下面命令找到**当前生效版本**的源码目录：

```bash
go env GOROOT
```

进入该目录后，打开 `src/fmt/print.go`，找到 `func Println(a ...any) (n int, err error)`，在函数体内加一行你想输出的内容，例如：

```go {2}
func Println(a ...any) (n int, err error) {
	println("hello world")
	return Fprintln(os.Stdout, a...)
}
```

**关键步骤**：每次改完标准库后，需要进入 `src` 目录执行脚本重新编译工具链：

```bash
cd $GOROOT/src
./make.bash
```

Windows 下请使用 `make.bat`。

编译完成后，在你自己的代码里调用 `fmt.Println` 即可验证修改。后续读源码时，任何想确认的变量或分支，都可以用这种「加打印」的方式快速验证。

::: [!tip] 调试结束后务必恢复对 print.go 的修改并重新执行 make.bash
否则当前 Go 安装会被永久改写，影响所有使用该版本的项目。
:::