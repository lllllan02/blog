---
title: hexo 使用 Markdown 嵌入图片
categories:
  - hexo
date: 2024-04-20 03:15:58
tags:
  - markdown
  - 图片
  - 插件
---

# 背景

资源（Asset）代表 `source` 文件夹中除了文章以外的所有文件，例如图片、CSS、JS 文件等。比方说，如果你的 Hexo 项目中只有少量图片，那最简单的方法就是将它们放在 `source/images` 文件夹中。然后通过类似于 `![](/images/image.jpg)` 的方法访问它们。

对于那些想要更有规律地提供图片和其他资源以及想要将他们的资源分布在各个文章上的人来说，Hexo 也提供了更组织化的方式来管理资源。你可以为文章在同级目录下创建一个同名文件夹，将所有的图片保存在该目录中，并直接以文件名调用。如下文件目录，`hello.md` 可以直接以 `![](image.png)` 引入图片。

```bash
.
├── root_folder
│   ├── hello
|   |   ├── image.png
|   ├── hello.md
```

# 方法

> [官方文档 / 资源文件夹 / 使用 Markdown 嵌入图片](https://hexo.io/zh-cn/docs/asset-folders#%E4%BD%BF%E7%94%A8-Markdown-%E5%B5%8C%E5%85%A5%E5%9B%BE%E7%89%87)


[hexo-renderer-marked 3.1.0](https://github.com/hexojs/hexo-renderer-marked) 引入了一个新的选项，其允许你无需使用 `asset_img` 标签插件就可以在 markdown 中嵌入图片

如需启用：

```bash
$ npm install hexo-renderer-marked --save
```

`_config.yaml` 修改如下：
```yaml
post_asset_folder: true
marked:
  prependRoot: false
```

启用后，资源图片将会被自动解析为其对应文章的路径。
