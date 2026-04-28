#!/usr/bin/env bash
# 把手动下载的 electron zip 解压到 node_modules/electron/dist
# 用法: scripts/install-electron-from-zip.sh [zip 路径]
# 默认从 ~/Downloads 找 electron-v*-darwin-*.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZIP="${1:-}"
if [ -z "$ZIP" ]; then
  ZIP=$(ls -t "$HOME/Downloads"/electron-v*-darwin-*.zip 2>/dev/null | head -1 || true)
fi

if [ -z "$ZIP" ] || [ ! -f "$ZIP" ]; then
  echo "❌ 找不到 electron zip。把它放到 ~/Downloads/，或: $0 <path-to-zip>"
  exit 1
fi

echo "→ 用 zip: $ZIP"

EVER=$(node -p "require('./node_modules/electron/package.json').version")
EXP="electron-v${EVER}-darwin-$(uname -m | sed 's/x86_64/x64/')"
case "$ZIP" in
  *"$EXP"*) ;;
  *) echo "⚠️  zip 名称跟期望版本 $EXP 不匹配，但继续解压" ;;
esac

DEST="node_modules/electron/dist"
rm -rf "$DEST"
mkdir -p "$DEST"
unzip -q "$ZIP" -d "$DEST"

# electron 包用 path.txt 指明二进制位置
echo "Electron.app/Contents/MacOS/Electron" > node_modules/electron/path.txt

echo "✅ 解压完成: $DEST"
ls "$DEST" | head
echo
echo "下一步: npm start 试着启动"
