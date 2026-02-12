#!/usr/bin/env node
/**
 * 修改 LeetCode Stats SVG 中的热力图样式
 *
 * 将「提交次数为零」的格子（ext-heatmap-0）从浅绿色改为灰色，
 * 便于与「提交次数少」的浅绿色格子区分。
 *
 * Usage:
 *   node scripts/stylize-leetcode-heatmap.js [input.svg] [output.svg]
 *
 * 默认：
 *   input:  content/assets/leetcode-stats.svg
 *   output: 同 input（原地修改）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_INPUT = path.join(__dirname, '../content/assets/leetcode-stats.svg');

// 零提交格子的目标颜色（GitHub 风格浅灰）
const ZERO_CONTRIB_COLOR = '#ebedf0';

// 要注入的 CSS 规则：用 !important 覆盖原有样式
const OVERRIDE_CSS = `
/* 零提交格子改为灰色，便于与浅绿色区分 */
rect.ext-heatmap-0 {
  fill: ${ZERO_CONTRIB_COLOR} !important;
  opacity: 1 !important;
}
`;

function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const outputPath = process.argv[3] || inputPath;

  let svg;
  try {
    svg = fs.readFileSync(inputPath, 'utf8');
  } catch (err) {
    console.error(`Error: 无法读取文件 ${inputPath}`);
    process.exit(1);
  }

  if (!svg.includes('<svg')) {
    console.error('Error: 文件不是有效的 SVG');
    process.exit(1);
  }

  if (!svg.includes('ext-heatmap')) {
    console.error('Error: SVG 中未找到热力图（ext-heatmap）');
    process.exit(1);
  }

  // 若已注入过，跳过
  if (svg.includes('rect.ext-heatmap-0') && svg.includes(ZERO_CONTRIB_COLOR)) {
    console.log('已应用过样式，无需重复修改');
    process.exit(0);
  }

  // 在第一个 </style> 前注入我们的 CSS
  const styleEnd = svg.indexOf('</style>');
  if (styleEnd === -1) {
    console.error('Error: 未找到 </style> 标签');
    process.exit(1);
  }

  const before = svg.slice(0, styleEnd);
  const after = svg.slice(styleEnd);
  const newSvg = before + OVERRIDE_CSS + after;

  fs.writeFileSync(outputPath, newSvg, 'utf8');
  console.log(`已修改: ${outputPath}`);
  console.log('零提交格子已改为灰色 (#ebedf0)');
}

main();
