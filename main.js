const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('./src/server');

let mainWindow;
let server;
let uploadDir = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载设置页面
  mainWindow.loadFile(path.join(__dirname, 'src/settings.html'));
}

app.whenReady().then(() => {
  // 启动 Express 服务器
  server = express.startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理选择目录的 IPC 消息
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    uploadDir = result.filePaths[0];
    return uploadDir;
  }
  return null;
});

// 处理获取上传目录的 IPC 消息
ipcMain.handle('get-upload-dir', () => {
  return uploadDir;
}); 