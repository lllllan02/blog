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

## Service 层

Service 层是 Repo 层的上层，通常会依赖 Repo 层进行数据获取和操作，并做业务逻辑的处理。

```go
func (s *defaultAuthService) Login(c *gin.Context, req *dto.AuthLoginRequest) (res *dto.AuthLoginResponse, err error) {
	res = &dto.AuthLoginResponse{}

	// 通过用户名获取用户信息
	user, err := s.repo.User().GetUserByUsername(c, req.Username)
	if err != nil {
		return nil, err
	}

	// 验证密码
	if !user.ComparePassword(req.Password) {
		return nil, cerrors.WithCode(ecodes.IAM_PASSWORD_ERROR, "password error")
	}

	// 生成 token
	if res.Token, err = utils.GenerateToken(user.Id, user.Username); err != nil {
		return nil, cerrors.Wrap(err, "generate token")
	}

	return res, nil
}
```

**明确测试点：假设 repo 层的代码是完好无缺的，只需要检验 service 的业务逻辑是否正确。**

因此对于 Service 层，为了能够让测试尽量的简单和独立，需要对 Repo 层进行隔离：

1. 专注于 service 逻辑：
   - service 层通常包含业务逻辑的处理和协调。通过隔离 repo 层，能够专注于测试 service 自身的业务规则、流程和逻辑，而不受底层数据存储和获取的细节干扰。
   - 例如，测试一个用户注册的 service 方法，重点在于验证注册逻辑的正确性，如用户名唯一性检查、密码强度要求等，而不是关注数据库操作的细节。
2. 独立验证 service 行为：
   - 确保 service 层的功能在不同的数据库状态或 repo 层的响应情况下都能正确工作。
   - 假设 repo 层返回不同的用户查找结果，测试 service 对这些结果的处理是否符合预期。
3. 提高测试的可维护性：
   - 如果 service 测试直接依赖真实的 repo 层，当 repo 层发生变化（例如数据库结构调整、数据访问方式改变）时，可能会导致大量的 service 测试失败，增加维护成本。
   - 使用 mock 可以将 service 测试与 repo 层的变化解耦，使测试更具稳定性和可维护性。
4. 加快测试执行速度：
   - 与真实的数据库或其他数据存储进行交互通常会引入较大的时间开销。mock repo 层可以避免这些耗时的操作，显著提高测试的执行效率。特别是在大量的单元测试场景中，快速的测试反馈对于开发效率至关重要。
5. 便于模拟异常情况：
   - 可以轻松模拟 repo 层出现的错误、异常情况，如数据库连接失败、数据读取错误等，以验证 service 层对这些异常的处理和容错能力。
   - 比如，模拟数据库查询返回空结果或抛出异常，检查 service 是否能正确处理并给出合适的响应。

综上所述，隔离并 mock repo 层有助于更高效、更准确地对 service 层进行单元测试，保障代码质量和开发的稳定性。

### 怎么 mock

在 Go 语言中，可以使用 `mockgen` 工具生成 mock 对象。

首先，需要安装 `mockgen` 工具：

```bash
go install github.com/golang/mock/mockgen@latest
```

在 `mockgen` 工具中，可以通过 `-source` 参数指定要生成 mock 的源代码文件，通过 `-destination` 参数指定生成的 mock 文件的位置，通过 `-package` 参数指定生成的 mock 文件所在的包名：

在我们的示例中，可以通过 `mockgen` 工具生成一个名为 `UserRepoMock` 的 mock 对象，用于模拟 `UserRepo` 接口的行为：

```bash
mockgen -source=internal/repo/user.go -destination=test/repo/user_mock.go -package=repo
```

有以下几点需要注意：

1. Repo 层中务必精心设计接口，直接的类型是没办法 mock 的。接口应具备清晰的职责划分、合理的方法命名和明确的参数与返回值定义。比如数据获取接口，应清晰区分是获取单个数据项还是多个数据项。
2. `mockgen` 生成的 mock 对象是静态的，接口若有变更，比如新增方法、修改参数或返回值类型，必须重新生成。
3. 生成的 mock 对象要契合实际业务逻辑，防止模拟结果偏离预期。比如模拟数据存储操作时，要考虑异常情况的处理。
4. 注意 mock 对象的使用范围，只在必要的测试场景中运用，避免影响代码的可理解性。
5. 对于复杂的接口，生成的 mock 代码可能较繁杂，要保证其可维护性。
6. 定期检查 mock 对象是否与最新的接口定义同步，以防测试结果出现偏差。

使用 mock，比如在 service 层需要调用 repo 层的 GetUserByUsername 方法。你只需要设定好预期结果，然后调用 mock 对象的方法即可。

```go
// 模拟找不到用户
mockUserRepo.EXPECT().GetUserByUsername(gomock.Any(), gomock.Any()).Return(nil, cerrors.WithCode(ecodes.IAM_USERNAME_NOT_FOUND, "user not found"))

// 模拟找到了用户
mockUserRepo.EXPECT().GetUserByUsername(gomock.Any(), gomock.Any()).Return(foundUser, nil)
```

### 配合 mock 进行测试

鉴于所有的测试都需要模拟 repo 层，因此可以创建一个公共的方法用于在开始测试前初始化 repo 层：

```go
func setupMock(ctrl *gomock.Controller) {
	conf := config.NewConfig()

	mockRepo = repo.NewMockRepo(ctrl)
	mockUserRepo = repo.NewMockUserRepo(ctrl)

	gin.SetMode(gin.ReleaseMode)
	w := httptest.NewRecorder()
	ctx, _ = gin.CreateTestContext(w)
	srv = service.NewDefaultService(conf, mockRepo)
}
```

正式的测试代码如下：

```go
func TestAuthService_Login(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	setupMock(ctrl)

	password, salt := "123456", "654321"
	hashed, _ := utils.HashPassword(password, salt)
	foundUser := &model.User{Username: "existing_user", Password: hashed, Salt: salt}

	t.Run("测试用户名不存在的情况", func(t *testing.T) {
		mockRepo.EXPECT().User().Return(mockUserRepo)
		mockUserRepo.EXPECT().GetUserByUsername(gomock.Any(), gomock.Any()).Return(nil, cerrors.WithCode(ecodes.IAM_USERNAME_NOT_FOUND, "user not found"))

		req := &dto.AuthLoginRequest{Username: "nonexistent_user", Password: "password"}
		res, err := srv.Auth().Login(ctx, req)

		assert.Nil(t, res)
		assert.Error(t, err)
		assert.Equal(t, ecodes.IAM_USERNAME_NOT_FOUND, cerrors.Code(err))
	})

	t.Run("测试找到用户但密码错误的情况", func(t *testing.T) {
		mockRepo.EXPECT().User().Return(mockUserRepo)
		mockUserRepo.EXPECT().GetUserByUsername(gomock.Any(), gomock.Any()).Return(foundUser, nil)

		req := &dto.AuthLoginRequest{Username: foundUser.Username, Password: "wrong_password"}
		res, err := srv.Auth().Login(ctx, req)

		assert.Nil(t, res)
		assert.Error(t, err)
		assert.Equal(t, ecodes.IAM_PASSWORD_ERROR, cerrors.Code(err))
	})

	t.Run("测试找到用户且密码正确的情况", func(t *testing.T) {
		mockRepo.EXPECT().User().Return(mockUserRepo)
		mockUserRepo.EXPECT().GetUserByUsername(gomock.Any(), gomock.Any()).Return(foundUser, nil)

		req := &dto.AuthLoginRequest{Username: foundUser.Username, Password: password}
		res, err := srv.Auth().Login(ctx, req)

		assert.NotNil(t, res)
		assert.NoError(t, err)
	})
}
```

## Handler 层

Handler 层是负责接收请求、调用 service 层、返回响应的层。同理需要对 service 层进行 mock，然后在测试代码中模拟 service 层的行为。

**明确测试点：假设 service 层的逻辑是正确的，handler 层只需要检验是否能够正确获取参数并如实返回。**

1. 生成 mock 代码:

```bash
mockgen -source=internal/service/auth.go -destination=test/service/auth_mock.go -package=repo
```

2. 公共方法用于初始化:

```go
func setupMock(ctrl *gomock.Controller) {
	mockService = service.NewMockService(ctrl)
	mockAuthService = service.NewMockAuthService(ctrl)

	testUser = &model.User{Id: 1, Username: "test"}

	h = router.NewRouter(config.NewConfig(), handler.NewHandler(mockService))
}
```

3. 使用 mock 进行测试

```go
func TestAuthHandler_Login(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	setupMock(ctrl)

	mockService.EXPECT().Auth().Return(mockAuthService)
	mockAuthService.EXPECT().Login(gomock.Any(), gomock.Any()).Return(&dto.AuthLoginResponse{Token: "mocked_token"}, nil)

	t.Run("测试参数缺失的情况", func(t *testing.T) {
		w := doRequest("GET", "/auth/login?username=admin&password=", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("测试参数拼错的情况", func(t *testing.T) {
		w := doRequest("GET", "/auth/login?Username=admin&Password=123456", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("测试正确填入参数的情况", func(t *testing.T) {
		w := doRequest("GET", "/auth/login?username=admin&password=123456", nil)
		assert.Equal(t, http.StatusOK, w.Code)
	})
}
```
