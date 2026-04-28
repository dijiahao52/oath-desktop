# Oath Desktop

`heyoath.com` 的 Electron 桌面客户端。

## 开发

```bash
npm install
npm start          # 启动桌面 app（加载 https://heyoath.com）

# 临时指向本地前端
OATH_URL=http://localhost:3000 npm start
```

## 打包

```bash
npm run dist:mac   # 输出 release/Oath-*.dmg
npm run dist:win   # 输出 release/Oath Setup *.exe
npm run dist:all   # 三端全打
```

输出在 `release/` 目录。

## 图标

放到 `build/`：
- `build/icon.icns` (macOS, 1024x1024)
- `build/icon.ico`  (Windows)
- `build/icon.png`  (Linux, 512x512)
