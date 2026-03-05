---
title: 程序员必知的 Unicode 和字符集基础
aliases: 68569e18-4d7a-44ae-bb45-c762ed0f034c
date: 2026-03-05 15:22:18
card: false
order:
tags:
  - unicode
  - encoding
  - basics
---

> [The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets (No Excuses!)](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/)

## 历史演变

### ASCII 与扩展 ASCII
*   **ASCII**: 早期计算机仅使用 0-127 (7 bit) 表示字符，涵盖了英文字母、数字和控制符号。
*   **OEM 字符集 / Code Pages**: 为了支持其他语言，利用 128-255 (8 bit) 的空间。不同地区（如以色列、希腊、俄罗斯）有不同的标准（Code Pages），导致同一编码在不同系统上显示乱码（如 `é` 变成希伯来字母 `ג`）。
*   **ANSI 标准**: 试图统一 128 以下的字符，但 128 以上仍由 Code Pages 决定（如 Windows-1252, ISO-8859-1）。无法在同一台机器上同时正确显示希伯来语和希腊语。

### 双字节字符集 (DBCS)
*   为了支持亚洲语言（成千上万个字符），引入了双字节字符集。
*   部分字符用 1 个字节，部分用 2 个字节。
*   处理字符串极其困难（如移动指针需判断字节边界），容易出错。

## Unicode 核心概念

**误区**：Unicode 只是一个 16 位的编码，每个字符占 2 个字节（65,536 个字符）。**这是错误的**。

### 码点
Unicode 将字符映射为**码点 (Code Point)**，这是一个理论上的概念，写作 `U+XXXX`（十六进制）。
*   **A**: `U+0041`
*   **Hello**: `U+0048 U+0065 U+006C U+006C U+006F`

Unicode 定义了字符的“柏拉图式”理想形式（Platonic Ideal），即字符的抽象身份，而非具体存储方式。

## 编码方式

编码是将**码点**映射为**二进制存储**（内存/磁盘）的规则。

### UTF-8
*   **变长编码**：使用 1 到 4 个字节存储一个码点。
*   **ASCII 兼容**：0-127 的字符仅占 1 个字节，与 ASCII 完全一致。
*   **优势**：英文文本体积小，且能兼容旧系统（不会因 null byte 截断字符串）。

**它是如何区分字节数的？**
UTF-8 巧妙地利用了字节的 **高位（前缀）** 来标识长度：

| 字节数 | 格式 (二进制) | 解释 |
| :--- | :--- | :--- |
| **1** | `0xxxxxxx` | 以 `0` 开头，表示单字节（ASCII）。 |
| **2** | `110xxxxx 10xxxxxx` | 以 `110` 开头（两个 1），表示总共 2 字节。 |
| **3** | `1110xxxx 10xxxxxx 10xxxxxx` | 以 `1110` 开头（三个 1），表示总共 3 字节。 |
| **4** | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` | 以 `11110` 开头（四个 1），表示总共 4 字节。 |

*   **单字节**：看第一位，如果是 `0`，那就是它自己。
*   **多字节**：看第一位，如果是 `1`，就数数开头有几个 `1`，就有几个字节。
*   **后续字节**：所有后续字节都以 `10` 开头，作为标记。

### UTF-16 / UCS-2
*   **定长/变长**：早期 UCS-2 为定长 2 字节，后演变为 UTF-16（支持代理对，可变长）。
*   **字节序**：需区分大端 (Big Endian) 和小端 (Little Endian)。
*   **BOM**：字符串开头的 `FE FF` 或 `FF FE` 用于标识字节序。

## 最重要的事实

> **没有所谓的“纯文本” (There Ain't No Such Thing As Plain Text).**

*   **必须知道编码**：如果你不知道一个字符串的编码（是 UTF-8, ASCII 还是 ISO-8859-1），你就无法正确解释或显示它。
*   **乱码根源**：几乎所有乱码问题都源于程序员假设文本是 ASCII 或未指定编码。

## Web 开发中的应用

必须显式告知接收方文本的编码：

1.  **HTTP Header**:
    ```http
    Content-Type: text/plain; charset="UTF-8"
    ```
2.  **HTML Head** (作为备选，浏览器解析到此时会重置编码):
    ```html
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    ```

**最佳实践**：
*   在程序内部（内存中）统一使用 Unicode（如 Java/C# 的 String，C++ 的 `wchar_t`）。
*   在输入/输出（文件、网络、数据库）时，统一转换为标准编码（推荐 **UTF-8**）。
