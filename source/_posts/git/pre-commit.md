---
title: 在 pre-commit 中加入代码测试
categories:
  - git
date: 2024-07-25 14:40:12
tags:
  - 测试
index_img:
banner_img:
---

在 `.git/hooks/pre-commit` 中加入以下内容，用于在提交前执行测试（golang 项目）。

```sh
#!/bin/sh

go test ./...
TEST_STATUS=$?

if [ $TEST_STATUS -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi
```

如果修改了仓库内容，在测试不通过的情况下试图 commit，将会失败：

![commit aborted](pre-commit/commit_aborted.png)