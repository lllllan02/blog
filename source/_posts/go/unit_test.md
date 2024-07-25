---
title: Web 项目怎么做单元测试
categories:
  - golang
date: 2024-07-25 15:23:43
tags:
  - 单元测试
index_img:
banner_img:
---

单元测试能有效提升项目代码质量、增强项目的可维护性和稳定性。但问题是，Web 项目怎么做单元测试？

对于一个 golang 的 web 项目，可能的层级有 `middleware`, `handler`, `service`, `repo` 等，至少这里列举的每一层都有单元测试的必要：

- middleware：测试登陆校验、权限校验、日志等中间件功能是否正常。
- handler：测试路由、请求参数、响应是否正确。
- service：测试核心的业务逻辑是否正确。
- repo：测试数据交互是否正确。
- ...

接下来就从 `repo` 层开始，一层层往上介绍每一层都应该怎么做单元测试。

## Repo 层

Repo 层（Repository 层）通常是负责数据存储和获取操作的抽象层，用于统一管理数据访问逻辑。几乎是项目中除了对象定义的最底层了，没有下层调用的顾及，可以非常简单的进行测试。唯一要注意的重点就是：最好能有专门的测试数据库，并且保证每次测试的独立性。


假设有一个拥有唯一索引 `username` 的 users 表，和一个待测试方法 `GetUserByUsername`，阅读这个方法，我们可以认为有以下测试点：

1. 用户名存在时，是否能正确查询到目标数据。
2. 用户名不存在时，是否能返回 `IAM_USERNAME_NOT_FOUND` 的错误码。

```go
// GetUserByUsername 通过用户名获取用户
func (r *defaultUserRepo) GetUserByUsername(c context.Context, username string) (user *model.User, err error) {
	u := dao.User

	if user, err = u.WithContext(c).Where(u.Username.Eq(username)).First(); err != nil {
		// ErrRecordNotFound 查询不到记录即用户名不存在
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, cerrors.WithCode(ecodes.IAM_USERNAME_NOT_FOUND, "username %s not found", username)
		}

		return nil, cerrors.Wrap(err, "failed to get user by username")
	}

	return
}
```

要验证一个数据库操作是否正确，需要先准备测试数据，然后执行操作，最后验证结果是否符合预期。因此需要准备一个专门用于测试的数据库，以及一套专门的测试数据。在每次测试开始时，都能保证测试数据库是干净的，并且测试结束后，可以恢复测试数据库的状态。

{% note default %}
这时候可能就要问了，如果是一个插入语句的方法，要怎么测试呢？

对于插入数据的操作，主要的测试点是输入各种边界值或特殊值来测试是否能够正确插入或返回应有的报错。因此大部分时候对于非常基本的 `db.Create()` 方法，只要验证返回的 `err` 是否为 nil 即可；如果有边界值的限制需求，则需要增加边界值的测试用例来确保是否能够返回准确的错误。
{% endnote %}

对于上面方法的测试，首先需要连接对应的测试环境，并创建测试数据：

> 在 Go 语言测试中，TestMain 函数用于在测试用例执行前后进行初始化设置和清理汇总等工作。

```go
var (
  testUser = model.User{Username: "test_user"} 
)

func TestMain(m *testing.M) {
  // 连接数据库
  db = ...

  // 清空数据库
  {
    // 获取所有表名
    tables := []string{}
    db.Raw("SHOW TABLES").Scan(&tables)

    // 循环使用 TRUNCATE TABLE 重置自增 ID 并清除数据
    for _, table := range tables {
      db.Exec("TRUNCATE TABLE " + table)
    }
  }

  // 填充测试数据
  {
    db.Create(&testUser)
  }

  m.Run()
}
```

在这些测试数据的基础上，调用的 `GetUserByUsername` 方法，并验证返回的结果是否符合预期：

```go
func TestUserRepo_GetUserByUsername(t *testing.T) {
	repo := r.User()
	ctx := context.Background()

	// 测试存在用户的情况
	user, err := repo.GetUserByUsername(ctx, testUser.Username)
	assert.NoError(t, err)
	assert.NotNil(t, user)

	// 测试不存在用户的情况
	user, err = repo.GetUserByUsername(ctx, "non_existent_user")
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Equal(t, ecodes.IAM_USERNAME_NOT_FOUND, cerrors.Code(err))
}
```

> 因为这里的示例是非常简单的方法，所以看上去显得非常的愚蠢和没有必要。这里是举例说明 repo 层的测试需要的步骤和内容。