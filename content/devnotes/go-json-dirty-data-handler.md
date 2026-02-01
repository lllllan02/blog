---
title: Go 处理 JSON 脏数据：泛型 Flexible 类型实现自动转换
aliases: 7d8e9f2a-1b3c-4d5e-8a9b-c0d1e2f3a4b5
date: 2026-01-29 11:45:00
order: 10
tags:
    - golang
    - json
---

在解析外部 API 返回的 JSON 时，经常会遇到类型不匹配的情况（例如：本该是 `int` 的字段返回了 `"123"` 字符串，或者本该是数组的字段返回了单值）。

通过结合 **Go 泛型** 和 **`github.com/spf13/cast`** 库，我们可以实现一个通用的 `Flexible[T]` 类型，自动处理这些常见的类型转换问题。

## 核心实现

定义一个泛型结构体 `Flexible[T]`，并实现 `json.Unmarshaler` 接口。在解析失败时，利用 `cast` 包将原始数据转换为目标类型。

```go fold="Flexible 实现"
package utils

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/spf13/cast"
)

// Flexible 能够处理 JSON 类型不匹配的情况，利用 cast 包进行通用转换。
type Flexible[T any] struct {
	value T
}

func (f Flexible[T]) String() string {
	return fmt.Sprint(f.value)
}

func (f *Flexible[T]) Value() T {
	return f.value
}

func (f *Flexible[T]) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		return nil
	}

	// 1. 尝试直接解析为目标类型 T
	if err := json.Unmarshal(data, &f.value); err == nil {
		return nil
	}

	// 2. 如果失败，解析为 any 以便使用 cast 进行转换
	var raw any
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	// 3. 根据 T 的类型，利用 cast 进行智能转换
	switch any(f.value).(type) {
	case string:
		f.value = any(cast.ToString(raw)).(T)
	case int:
		f.value = any(cast.ToInt(raw)).(T)
	case int8:
		f.value = any(cast.ToInt8(raw)).(T)
	case int16:
		f.value = any(cast.ToInt16(raw)).(T)
	case int32:
		f.value = any(cast.ToInt32(raw)).(T)
	case int64:
		f.value = any(cast.ToInt64(raw)).(T)
	case uint:
		f.value = any(cast.ToUint(raw)).(T)
	case uint8:
		f.value = any(cast.ToUint8(raw)).(T)
	case uint16:
		f.value = any(cast.ToUint16(raw)).(T)
	case uint32:
		f.value = any(cast.ToUint32(raw)).(T)
	case uint64:
		f.value = any(cast.ToUint64(raw)).(T)
	case float32:
		f.value = any(cast.ToFloat32(raw)).(T)
	case float64:
		f.value = any(cast.ToFloat64(raw)).(T)
	case bool:
		f.value = any(cast.ToBool(raw)).(T)
	case time.Time:
		f.value = any(cast.ToTime(raw)).(T)
	case []string:
		f.value = any(cast.ToStringSlice(raw)).(T)
	case []int:
		f.value = any(cast.ToIntSlice(raw)).(T)
	case []int64:
		// 手动处理 int64 切片转换
		slice := cast.ToStringSlice(raw)
		res := make([]int64, len(slice))
		for i, v := range slice {
			res[i] = cast.ToInt64(v)
		}
		f.value = any(res).(T)
	case map[string]any:
		f.value = any(cast.ToStringMap(raw)).(T)
	}

	return nil
}

func (f *Flexible[T]) MarshalJSON() ([]byte, error) {
	return json.Marshal(f.value)
}
```

## 使用示例

在定义 API 响应结构体时，将可能存在脏数据的字段声明为 `utils.Flexible[T]` 类型：

```go
type UserResponse struct {
    ID   utils.Flexible[int64]  `json:"id"`   	// 兼容 "123" 或 123
    Tags utils.Flexible[[]string] `json:"tags"` // 兼容 "tag1" 或 ["tag1", "tag2"]
}

func main() {
    var resp UserResponse
    // ... unmarshal 逻辑 ...
    fmt.Println(resp.ID.Value()) // 获取原始 int64 类型
}
```

::: [!tip] 
**为什么使用 Flexible？**
- **通用性**：一个泛型类型覆盖所有基础类型和常用切片。
- **健壮性**：利用 `cast` 包强大的转换能力，极大增强了程序对上游 API 变更的容忍度。
- **透明性**：实现了 `MarshalJSON`，确保序列化回 JSON 时依然保持原始值。
:::
