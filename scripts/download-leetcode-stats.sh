#!/usr/bin/env bash
# 下载 LeetCode Stats SVG 并做基本校验
#
# Usage:
#   ./scripts/download-leetcode-stats.sh [url] [output]
#
# 默认：leetcard heatmap，输出到 content/assets/leetcode-stats.svg

set -euo pipefail

URL="${1:-https://leetcard.jacoblin.cool/friendly-almeidaelk?theme=light&font=Kurale&ext=heatmap&site=cn}"
OUT="${2:-content/assets/leetcode-stats.svg}"
TMP="$(mktemp)"

trap 'rm -f "$TMP"' EXIT

mkdir -p "$(dirname "$OUT")"

curl -L --fail --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
  -H "User-Agent: github-actions" \
  "$URL" \
  -o "$TMP"

# 基本校验，避免提交 HTML 错误页
SIZE="$(wc -c < "$TMP")"
if [ "$SIZE" -lt 500 ]; then
  echo "Downloaded file is too small ($SIZE bytes), aborting."
  exit 1
fi
if ! head -c 200 "$TMP" | tr -d '\n' | grep -qi "<svg"; then
  echo "Downloaded file does not look like SVG, aborting."
  exit 1
fi

mv "$TMP" "$OUT"
echo "Saved to $OUT"
