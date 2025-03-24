const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { startServer } = require('./server');

// 设置上传目录
let uploadDir = path.join(app.getPath('downloads'));

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载设置页面
  mainWindow.loadFile('src/settings.html');
}

// 当 Electron 完成初始化时启动服务器
app.whenReady().then(() => {
  // 设置环境变量
  process.env.UPLOAD_DIR = uploadDir;
  
  // 启动服务器
  startServer();
  
  // 创建窗口
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理选择目录的请求
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    uploadDir = result.filePaths[0];
    // 更新环境变量
    process.env.UPLOAD_DIR = uploadDir;
    return uploadDir;
  }
  return null;
});

// 处理获取上传目录的请求
ipcMain.handle('get-upload-dir', () => {
  return uploadDir;
}); 