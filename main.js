/**
 * main.js — Oath Desktop
 *
 * 加载 https://heyoath.com 的桌面壳子。
 * 体验对齐 Claude Desktop:
 *  - macOS 经典 hiddenInset 标题栏
 *  - 1200×800 默认窗口、记住上次大小/位置
 *  - 外链在系统浏览器打开
 *  - 标准应用菜单 + 快捷键
 */

const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");
const fs = require("fs");
const { buildMenu } = require("./menu");

const APP_URL = process.env.OATH_URL || "https://heyoath.com/build";

// ── 简易窗口状态持久化 ─────────────────────────────────────────────
// stateFile 必须懒求值: app.getPath() 在 app.whenReady() 之前不可用
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return { width: 1200, height: 800 };
  }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getNormalBounds();
  try {
    fs.writeFileSync(stateFile(), JSON.stringify(bounds));
  } catch {
    /* ignore */
  }
}

// ── 主窗口 ─────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width || 1200,
    height: state.height || 800,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // 外链跳系统浏览器，避免 app 内套娃
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // 站外导航也丢给系统浏览器
  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      const target = new URL(url);
      const allowed = new URL(APP_URL);
      if (target.host !== allowed.host) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      /* ignore */
    }
  });

  ["resize", "move", "close"].forEach((evt) =>
    mainWindow.on(evt, () => saveWindowState(mainWindow))
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── 应用生命周期 ───────────────────────────────────────────────────
app.whenReady().then(() => {
  // 较紧的安全策略：不允许加载未知协议
  session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));

  createWindow();
  buildMenu({ getWindow: () => mainWindow, appUrl: APP_URL });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 防止多开
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
