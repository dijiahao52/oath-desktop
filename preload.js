/**
 * preload.js
 * 暴露最小 API；目前只用于标识 Desktop 环境，让前端可以选择性渲染。
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("oathDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
