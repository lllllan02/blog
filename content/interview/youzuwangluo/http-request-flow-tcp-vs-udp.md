---
title: 6. HTTP 请求流程，TCP 和 UDP 的区别
aliases: 085E7765-F6A7-4217-ACEE-64385B8E4835
date: 2026-03-04 16:18:02
tags: [interview, network, http, tcp, udp]
card: true
order: 6
---

## 问题分析

这道题包含两个经典的计算机网络基础问题：
1.  **HTTP 请求的全过程**：考察对网络协议栈（DNS、TCP、IP、HTTP）的整体理解，以及浏览器渲染的基本概念。
2.  **TCP 和 UDP 的区别**：考察传输层协议的核心特性及适用场景。

面试官希望听到清晰的步骤描述（对于第一问）和结构化的对比（对于第二问）。

## 核心解答

### 口语回答

**关于 HTTP 请求流程**：
当我们在浏览器输入 URL 并回车后，大致会经历以下几个步骤：
1.  **DNS 解析**：浏览器会先查找缓存，如果没有，就向 DNS 服务器查询域名对应的 IP 地址。
2.  **建立 TCP 连接**：拿到 IP 后，浏览器会与服务器进行三次握手，建立可靠的连接。如果是 HTTPS，还需要进行 TLS/SSL 握手。
3.  **发送 HTTP 请求**：连接建立后，浏览器构建 HTTP 请求报文（包含请求行、头、体）发送给服务器。
4.  **服务器处理与响应**：服务器接收请求，处理业务逻辑，然后返回 HTTP 响应报文（包含状态码、响应头、响应体）。
5.  **浏览器解析渲染**：浏览器接收到 HTML、CSS、JS 等资源，解析并渲染页面，最后断开连接（四次挥手）。

**关于 TCP 和 UDP 的区别**：
它们都是传输层协议，主要区别在于：
1.  **连接性**：TCP 是面向连接的，传输前必须建立连接；UDP 是无连接的，想发就发。
2.  **可靠性**：TCP 提供可靠交付，有确认、重传、拥塞控制机制，保证数据不丢、不重、按序到达；UDP 尽最大努力交付，不保证可靠性。
3.  **效率**：TCP 头部开销大（20 字节），传输慢；UDP 头部小（8 字节），传输快，实时性好。
4.  **应用场景**：TCP 适合网页、邮件、文件传输等要求可靠的场景；UDP 适合视频会议、直播、游戏等对实时性要求高、能容忍少量丢包的场景。

### Core Key Takeaways

#### 1. HTTP 请求流程 (The Flow)

1.  **DNS Resolution**: Domain -> IP.
2.  **TCP Handshake**: SYN, SYN-ACK, ACK (3-way).
3.  **TLS Handshake** (if HTTPS): Key exchange.
4.  **Send Request**: GET /index.html.
5.  **Server Processing**: Backend logic.
6.  **Receive Response**: 200 OK + Content.
7.  **Browser Rendering**: DOM Tree, CSSOM, Layout, Paint.
8.  **TCP Teardown**: FIN, ACK (4-way).

#### 2. TCP vs UDP

| 特性 | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **连接** | 面向连接 (Connection-oriented) | 无连接 (Connectionless) |
| **可靠性** | 可靠 (重传、排序、流控) | 不可靠 (丢包不重传) |
| **传输模式** | 面向字节流 (Byte stream) | 面向报文 (Datagram) |
| **速度** | 较慢 (握手、拥塞控制) | 快 (无额外开销) |
| **头部开销** | 20 字节 (最小) | 8 字节 |
| **场景** | Web, Email, File Transfer | Streaming, VoIP, Gaming, DNS |

## 详细解析

### 1. HTTP 请求详细流程

这是一个从应用层下沉到网络层，再回到应用层的过程。

#### 1.1 DNS 解析 (Domain Name System)
浏览器通过递归查询查找 IP：
*   浏览器缓存 -> 操作系统缓存 (hosts) -> 路由器缓存 -> ISP DNS 服务器 -> 根域名服务器 -> 顶级域名服务器 -> 权威域名服务器。

#### 1.2 TCP 连接 (Three-way Handshake)
为了保证数据传输的可靠性，HTTP 依赖 TCP 连接。
*   **SYN**: 客户端发送 SYN 包，进入 SYN_SENT 状态。
*   **SYN+ACK**: 服务器收到 SYN，回复 SYN+ACK，进入 SYN_RCVD 状态。
*   **ACK**: 客户端收到 SYN+ACK，回复 ACK，进入 ESTABLISHED 状态。服务器收到 ACK 后也进入 ESTABLISHED。

#### 1.3 发送与响应
*   **Request**: Method (GET/POST), URI, Protocol Version, Headers (Cookie, User-Agent), Body.
*   **Response**: Status Code (200, 404, 500), Headers (Content-Type, Set-Cookie), Body (HTML/JSON).

### 2. TCP 与 UDP 深度对比

#### 2.1 面向连接 vs 无连接
*   **TCP**: 就像打电话。必须先拨通（握手），确认对方在听，才能说话。通话结束要挂断（挥手）。
*   **UDP**: 就像寄信（或广播）。写好地址直接扔进邮筒，对方收没收到、什么时候收到，寄信人通常不知道。

#### 2.2 可靠性机制 (TCP 独有)
TCP 为了可靠性做了大量工作，这也是它慢的原因：
*   **序列号 (Sequence Numbers)**: 解决乱序和重复问题。
*   **确认应答 (ACK)**: 确保对方收到了数据。
*   **超时重传 (Retransmission)**: 发出去没收到 ACK，隔段时间重发。
*   **流量控制 (Flow Control)**: 滑动窗口机制，防止发太快把对方淹没。
*   **拥塞控制 (Congestion Control)**: 慢启动、拥塞避免、快重传、快恢复，防止把网络堵死。

#### 2.3 面向字节流 vs 面向报文
*   **TCP (流)**: 数据像水流一样，没有边界。发送方发 10 次 10 字节，接收方可能一次收 100 字节。需要应用层处理粘包/拆包（如通过定长、分隔符、长度字段）。
*   **UDP (报文)**: 数据有边界。发 10 次，收就是 10 次。

## 扩展知识

### 1. HTTP/3 与 UDP
虽然 HTTP/1.1 和 HTTP/2 基于 TCP，但最新的 **HTTP/3 (QUIC)** 选择了基于 **UDP**。
*   **原因**: TCP 的队头阻塞 (Head-of-Line Blocking) 问题难以解决。QUIC 在 UDP 之上实现了可靠性、流控和加密，既有 UDP 的速度，又有 TCP 的可靠，还解决了队头阻塞。

### 2. 什么时候选择 UDP？
*   **实时性要求高**: 比如王者荣耀、Zoom 会议。偶尔丢几帧画面没关系，但卡顿（延迟）是无法接受的。
*   **简单的请求/应答**: 如 DNS 查询（通常用 UDP，包小，一次往返）。
*   **广播/多播**: TCP 只能一对一，UDP 支持一对多。
