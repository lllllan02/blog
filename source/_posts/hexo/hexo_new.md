---
title: hexo new
categories:
  - hexo
date: 2024-04-20 01:40:17
tags:
---

> [官方文档 / 指令 / new](https://hexo.io/zh-cn/docs/commands#new)

```bash
$ hexo new [layout] <title>
```

新建一篇文章。如果没有设置 `layout` 的话，默认使用 _config.yml 中的 `default_layout` 参数代替。如果标题包含空格的话，请使用引号括起来。

```bash
$ hexo new "post title with whitespace"
```

| 参数          | 描述                                          |
| :------------ | :-------------------------------------------- |
| -p, --path    | 自定义新文章的路径                            |
| -r, --replace | 如果存在同名文章，将其替换                    |
| -s, --slug    | 文章的 Slug，作为新文章的文件名和发布后的 URL |

默认情况下，Hexo 会使用文章的标题来决定文章文件的路径。对于独立页面来说，Hexo 会创建一个以标题为名字的目录，并在目录中放置一个 `index.md` 文件。你可以使用 `--path` 参数来覆盖上述行为、自行决定文件的目录：

```bash
hexo new page --path about/me "About me"
```

以上命令会创建一个 `source/about/me.md` 文件，同时 Front Matter 中的 title 为 `"About me"`

注意！title 是必须指定的！如果你这么做并不能达到你的目的：

```bash
hexo new page --path about/me
```

此时 Hexo 会创建 `source/_posts/about/me.md`，同时 `me.md` 的 Front Matter 中的 title 为 `"page"`。这是因为在上述命令中，hexo-cli 将 page 视为指定文章的标题、并采用默认的 `layout`。