# GitHub Workflows（目录索引）

本目录包含本站点用到的 GitHub Actions：

- `deploy.yaml`
  - **用途**：构建 Quartz 并部署到 GitHub Pages
  - **触发**：`push` 到 `main`；或 `update-leetcode-stats.yaml` 成功完成时（每天会部署一次）

- `update-leetcode-stats.yaml`
  - **用途**：更新首页 LeetCode 卡片图片到本地（`content/assets/leetcode-stats.svg`）
  - **触发**：每天北京时间 00:00（`0 16 * * *`，UTC）/ 手动触发
  - **说明**：每次触发都会尝试下载并对比；只有图片内容发生变化才会提交到 `main`。`deploy.yaml` 会在该工作流成功完成后触发一次部署

