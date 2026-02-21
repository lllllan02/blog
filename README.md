# lllllan's Knowledge Base

> “One who works with the door open gets all kinds of interruptions, but they also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

这是我的个人知识库与数字花园，基于 [Quartz v4](https://quartz.jzhao.xyz/) 构建。这里记录了我关于后端开发、计算机基础、算法面试以及日常开发的思考与总结。

🌐 **在线访问**: [blog.lllllan.cn](https://blog.lllllan.cn)

---

## 📚 核心内容

这个知识库主要涵盖以下领域：

- **🐹 Go 语言进阶**: 深入探索 Go 源码（slice, sync, runtime 等），基于 Go 1.21+。
- **🖥️ 计算机基础**: 操作系统（OSTEP 读书笔记）、网络 I/O、并发模型等。
- **💡 算法与面试**: 字节跳动等大厂面试真题解析、LeetCode 题解（DP, 最短路等）。
- **🛠️ 开发笔记**: 日常开发中的坑位记录、工具配置（Mac Golang 版本管理等）。
- **📖 学习资源**: 整理自 CS50, MIT Missing Semester 等优质课程。

## ✨ 特色功能

- **🗂️ 闪卡系统**: 文档支持 `card: true` 参与闪卡复习，内置多维度权重随机算法。
- **📝 排版优化**: 集成 Pangu 插件自动处理中英文空格，使用 **霞鹜文楷 (LXGW WenKai)** 字体提升阅读体验。
- **🧩 自定义组件**: 支持代码块折叠 (`CodeManager`)、选项卡分组 (`TabGroup`) 等增强展示效果。
- **🤖 自动化流程**: 每日自动更新 LeetCode 统计图，支持中英文空格自动格式化。

## 🚀 本地开发

如果你想在本地运行或贡献内容：

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **本地预览**:
   ```bash
   npm run docs
   # 或者使用 quartz 直接预览
   npx quartz build --serve
   ```

3. **格式化文档**:
   ```bash
   # 运行中英文空格格式化脚本
   npm run pangu
   ```

## 🛠️ 技术栈

- **框架**: [Quartz v4](https://quartz.jzhao.xyz/)
- **运行环境**: Node.js >= 22
- **字体**: 霞鹜文楷 (LXGW WenKai TC)
- **部署**: GitHub Pages + GitHub Actions

---

Copyright © 2024-present [lllllan](https://github.com/lllllan02)
