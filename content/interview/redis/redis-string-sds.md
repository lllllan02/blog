---
title: Redis 字符串的底层实现 SDS
aliases: 85efc7eb-0a44-4b2a-9988-052e4a63bf3c
date: 2026-04-28 15:45:00
card: true
order:
tags:
  - interview
  - redis
  - cache
---

> **面试官**：String 类型的底层实现（SDS）是什么？相比 C 语言字符串有什么优势？

## 面试回答

Redis 的 `String` 类型底层主要使用 SDS，也就是 Simple Dynamic String。它不是直接使用 C 语言以 `\0` 结尾的字符串，而是在字符数组前面增加了一段元信息，用来记录字符串长度、剩余容量和类型。

SDS 的核心优势有四点。第一，获取长度是 O(1)，因为长度已经记录在 `len` 字段里，不需要像 C 字符串一遍遍扫描到 `\0`。第二，它是二进制安全的，字符串内容里可以包含 `\0`，所以 Redis 的 `String` 不仅能存文本，也能存图片、序列化后的对象这类二进制数据。第三，SDS 通过空间预分配减少扩容次数，连续追加内容时不必每次都重新分配内存。第四，它通过惰性空间释放减少频繁缩容带来的内存分配开销。

所以面试时可以总结为：SDS 是 Redis 对 C 字符串的工程化改造，保留了以 `\0` 结尾从而兼容部分 C 字符串函数，同时通过长度字段和容量字段解决了 C 字符串在性能、安全性和动态扩容上的问题。

## 系统讲解

### 底层结构

SDS 的数据区域仍然是一个字符数组，但它不是裸数组。Redis 会在字符数组前面放一个头部结构，记录当前字符串的长度和可用空间。不同长度的字符串会选择不同的头部类型，例如 `sdshdr8`、`sdshdr16`、`sdshdr32`、`sdshdr64`，用更小的元数据承载短字符串，减少内存浪费。

一个简化后的结构可以理解为：

```c
struct sdshdr {
    int len;
    int free;
    char buf[];
};
```

真实 Redis 源码中的 SDS 结构会更精细，会根据字符串长度选择不同位宽的 `len` 和 `alloc` 字段。核心思想不变：`buf` 存放实际内容，头部保存长度和容量信息。

### 和字符串的差异

| 对比点 | C 语言字符串 | SDS |
| --- | --- | --- |
| 长度获取 | 需要扫描到 `\0`，时间复杂度 O(n) | 直接读取 `len` 字段，时间复杂度 O(1) |
| 内容限制 | 以 `\0` 判断结尾，不适合直接保存任意二进制数据 | 以 `len` 判断真实长度，二进制安全 |
| 扩容方式 | 需要调用方自己管理内存，容易溢出 | SDS API 会处理扩容和空间检查 |
| 追加性能 | 频繁追加可能频繁重新分配内存 | 空间预分配减少扩容次数 |
| 缩容策略 | 通常立即释放或由调用方控制 | 惰性释放，减少内存抖动 |

### 为什么能二进制安全

C 字符串依赖 `\0` 判断结束位置。如果字符串中间出现 `\0`，普通字符串函数会认为字符串已经结束。SDS 不依赖 `\0` 判断长度，而是依赖头部的 `len` 字段，所以内容中间即使有 `\0`，也不会影响 Redis 对数据长度的判断。

例如下面这段内容在 SDS 中可以被完整保存：

```text
abc\0def
```

从 C 字符串的角度看，它可能只读到 `abc`；从 SDS 的角度看，只要 `len` 是 7，它就知道完整内容包含后面的 `def`。这也是 Redis 的 `String` 可以保存序列化对象、压缩数据和图片二进制内容的原因。

### 动态扩容策略

SDS 在追加内容时，如果剩余空间不足，会重新分配内存。但 Redis 不希望每次 `APPEND` 都触发一次内存分配，所以 SDS 会做空间预分配。

常见规则可以概括为：

- 如果扩容后的长度小于 1 MB，通常会额外分配同样大小的空闲空间。
- 如果扩容后的长度大于等于 1 MB，通常额外分配 1 MB 空闲空间。

这样连续追加字符串时，很多写入可以直接使用预留空间，降低 `realloc` 的次数。代价是 SDS 可能会暂时占用比实际内容更多的内存，这是用空间换时间的典型设计。

### 惰性空间释放

当 SDS 缩短字符串时，Redis 不一定立刻把多余内存还给系统，而是把它记录为空闲空间。后续如果再次追加内容，就可以复用这部分空间。

这能减少“缩短、追加、再缩短、再追加”场景下的频繁内存分配。不过这也意味着 SDS 可能保留一部分暂时用不到的内存，所以 Redis 仍然需要配合内存淘汰、主动释放等机制控制整体内存占用。

### 命令示例

从使用者视角看，Redis 的 `String` 支持普通文本、计数器和二进制值。下面这些命令背后都可能使用 SDS 管理字符串内容：

```redis
SET user:1:name "Alice"
GET user:1:name

APPEND article:1:title " - Redis SDS"
STRLEN article:1:title

INCR article:1:views
GET article:1:views
```

这里的 `STRLEN` 能高效返回长度，和 SDS 记录长度这一点直接相关。`APPEND` 能较好地支持连续追加，也和 SDS 的预分配策略有关。

### 常见追问

**追问：SDS 为什么还要保留末尾的 `\0`？**

因为 Redis 是用 C 写的，保留末尾 `\0` 可以在内容本身不包含 `\0` 的情况下复用一部分 C 字符串函数，降低实现成本。但 SDS 的真实长度不靠这个 `\0` 判断，而是靠头部的 `len` 字段。

**追问：Redis 的整数值也是 SDS 吗？**

不一定。Redis 对象层会根据值的特征选择不同编码，例如小整数可能使用整数编码，短字符串也可能使用紧凑编码。SDS 是 Redis 字符串内容的重要底层结构，但 Redis 对象还有一层编码优化，不能把 `String` 类型简单等同于永远使用一种 SDS 表示。

**追问：SDS 的代价是什么？**

SDS 需要额外的头部元数据，也可能因为预分配和惰性释放保留一部分空闲空间。因此它不是“零成本”的优化，而是在 Redis 高频读写、动态扩容和二进制存储场景下，用少量内存开销换取更好的安全性和性能。

## 参考资料

### 官方资料

> [String internals](https://redis.io/docs/latest/operate/oss_and_stack/reference/internals/internals-sds/) (Redis Documentation, 访问于 2026-04-28)

这篇官方文档专门介绍 Redis 字符串内部实现，包含 SDS 的结构定义、内存布局和设计动机。理解 SDS 时优先看这篇。

> [Redis Strings](https://redis.io/docs/latest/develop/data-types/strings/) (Redis Documentation, 访问于 2026-04-28)

这篇官方文档偏使用层，介绍 Redis `String` 类型的能力、限制和常用命令。它适合和 SDS 底层实现放在一起看：一个解释“怎么用”，一个解释“为什么这样实现”。

### 源码资料

> [Simple Dynamic Strings library for C](https://github.com/antirez/sds) (Salvatore Sanfilippo, 访问于 2026-04-28)

这是 Redis 作者维护的独立 SDS 库，适合直接阅读 `sds.h` 和 `sds.c`，理解 SDS API 如何处理长度、扩容和二进制安全。

> [hiredis/sds.c](https://github.com/redis/hiredis/blob/master/sds.c) (Redis, 访问于 2026-04-28)

`hiredis` 是 Redis 官方 C 客户端，这里的 SDS 实现便于对照 Redis 生态中的实际使用方式。

### 延伸阅读

> [How Redis SDS (Simple Dynamic Strings) Works](https://oneuptime.com/blog/post/2026-03-31-redis-sds-simple-dynamic-strings/view) (OneUptime, 2026-03-31)

这篇文章用比较直观的方式解释 SDS 如何解决 C 字符串的长度获取、缓冲区溢出、二进制安全和动态扩容问题，适合作为官方文档之外的补充阅读。
