---
title: 封装 zap 日志注入 trace id
categories:
  - golang
date: 2024-07-01 14:21:21
tags:
  - golang
  - zap
  - trace
  - gin
index_img:
banner_img:
---

如果想要对每个请求的调用进行跟踪，需要充分利用 context 包，通过 context 来传递一个唯一标识 trace id，从而能够追踪请求的调用链。

## 自定义 Logger 对 *zap.SugaredLogger 进行包装

```go
package logger

import (
	"context"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Logger struct {
	logger *zap.SugaredLogger
}

func NewLogger(logger *zap.SugaredLogger) *Logger {
	return &Logger{logger: logger}
}

const TraceIdKey = "trace_id"

// WithTraceId 为 HTTP 请求绑定 Trace ID。
//
// 本函数用于在 Gin 框架的 HTTP 请求上下文中设置 Trace ID，以便于后续的日志记录和问题追踪。
// 它接受一个 Gin 上下文指针和一个 Trace ID 字符串作为参数，如果上下文不为空，则将 Trace ID 绑定到上下文中。
// 这样做的目的是确保每个 HTTP 请求都可以通过 Trace ID 唯一标识，从而在分布式系统中追踪请求的流程。
//
// 参数:
//
//	c *gin.Context - Gin框架的HTTP请求上下文指针。
//	traceId string - Trace ID 字符串，用于唯一标识一个请求。
func (l *Logger) WithTraceId(c *gin.Context, traceId string) {
	// 检查上下文是否为空，如果为空则直接返回，不进行后续操作。
	if c == nil {
		return
	}

	// 将Trace ID设置到Gin上下文中，以便后续使用。
	c.Set(TraceIdKey, traceId)
}

// WithContext 为日志记录器添加上下文信息。
// 如果上下文中包含跟踪 id，则将其添加到日志中以增强可追踪性。
func (l *Logger) WithContext(c context.Context) *zap.SugaredLogger {
	// 如果上下文为空，直接返回日志记录器，不进行任何修改。
	if c == nil {
		return l.logger
	}

	// 尝试从上下文中获取跟踪ID。
	// 如果能够成功获取到字符串类型的跟踪ID，则为日志记录器添加"trace_id"字段。
	if traceId, ok := c.Value(TraceIdKey).(string); ok {
		return l.logger.With(TraceIdKey, traceId)
	}

	// 如果上下文中没有跟踪ID，或者获取失败，则返回原始日志记录器。
	return l.logger
}
```

## Gin 中间件写入 trace id

```go
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gitlab.turingstar.com.cn/xinyou/e-commerce/pkg/logger"
)

type Tracer struct {
	logger *logger.Logger
}

func NewTracer(logger *logger.Logger) *Tracer {
	return &Tracer{
		logger: logger,
	}
}

// Trace 在HTTP请求处理链中插入跟踪ID。
// 该方法旨在为每个 HTTP 请求分配一个唯一的跟踪 ID，以便于后续的日志跟踪和问题排查。
// 它利用 gin 框架的中间件机制，在请求处理的早期阶段注入跟踪 ID，确保该 ID 在整个请求处理过程中可用。
//
// 参数:
//
//	c *gin.Context: gin框架的上下文对象，用于访问请求信息和向响应中写入数据。
func (t *Tracer) Trace(c *gin.Context) {
	// 从请求头中尝试获取跟踪 ID。
	traceId := c.GetHeader("traceId")

	// 如果请求头中没有跟踪 ID，则生成一个新的跟踪 ID。
	if traceId == "" {
		traceId = uuid.New().String()
	}

	// 使用生成或获取的跟踪 ID 设置日志上下文，以便后续的日志输出中包含该跟踪 ID。
	t.logger.WithTraceId(c, traceId)

	// 继续处理请求，将控制权交给下一个中间件或处理函数。
	c.Next()
}
```

## 逻辑代码中的使用示例：

```go
s.logger.WithContext(c).With("request", req).Error("用户获取历史订单列表失败：", err)
```