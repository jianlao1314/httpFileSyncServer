const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 从主进程获取上传目录
let uploadDir = process.env.UPLOAD_DIR || path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
const PORT = 3333;

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = {
    local: `localhost:${PORT}`,
    network: []
  };

  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((interface) => {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.network.push(`${interface.address}:${PORT}`);
      }
    });
  });

  return addresses;
}

function startServer() {
  const app = express();
  
  // 配置 multer 存储
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        // 从请求头中获取目标目录并解码
        const targetDir = decodeURIComponent(req.headers['x-target-dir'] || '');
        const uploadPath = path.join(uploadDir, targetDir);
        
        // 确保目标目录存在
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        console.log('上传目标目录:', uploadPath);
        console.log('当前上传目录:', uploadDir);
        console.log('目标子目录:', targetDir);
        console.log('请求头:', req.headers);
        console.log('文件信息:', file);
        cb(null, uploadPath);
      } catch (error) {
        console.error('设置上传目录失败:', error);
        cb(error);
      }
    },
    filename: function (req, file, cb) {
      try {
        // 处理中文文件名
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        console.log('原始文件名:', originalName);
        cb(null, originalName);
      } catch (error) {
        console.error('处理文件名失败:', error);
        cb(error);
      }
    }
  });
  
  const upload = multer({ 
    storage: storage
  });

  // 设置静态文件目录为当前目录
  app.use(express.static(__dirname));

  // API 路由
  app.get('/api/network-addresses', (req, res) => {
    res.json(getNetworkAddresses());
  });

  app.get('/api/files', (req, res) => {
    const currentPath = req.query.path || '';
    const fullPath = path.join(uploadDir, currentPath);

    // 安全检查：确保请求的路径在 uploadDir 内
    if (!fullPath.startsWith(uploadDir)) {
      return res.status(403).json({ error: '访问被拒绝' });
    }

    // 确保目录存在
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: '目录不存在' });
    }

    // 确保是目录
    if (!fs.statSync(fullPath).isDirectory()) {
      return res.status(400).json({ error: '请求的路径不是目录' });
    }

    try {
      const files = fs.readdirSync(fullPath);
      const fileList = files.map(file => {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: path.join(currentPath, file),
          size: stats.size,
          modified: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      });

      // 按目录在前，文件在后排序
      fileList.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      res.json({
        files: fileList,
        currentPath: currentPath,
        parentPath: path.dirname(currentPath)
      });
    } catch (error) {
      console.error('读取目录失败:', error);
      res.status(500).json({ error: '读取目录失败' });
    }
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        console.error('没有接收到文件');
        return res.status(400).json({ error: '没有接收到文件' });
      }

      // 从请求头中获取目标目录并解码
      const targetDir = decodeURIComponent(req.headers['x-target-dir'] || '');
      console.log('从请求头获取的目标目录:', targetDir);

      // 获取相对路径
      const relativePath = path.relative(uploadDir, req.file.path);
      console.log('文件上传成功:', {
        filename: req.file.filename,
        path: req.file.path,
        relativePath: relativePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
        targetDir: targetDir
      });

      res.json({ 
        message: '文件上传成功',
        filename: req.file.filename,
        path: relativePath
      });
    } catch (error) {
      console.error('文件上传失败:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/download/:path(*)', (req, res) => {
    const filePath = path.join(uploadDir, req.params.path);
    
    // 安全检查：确保请求的路径在 uploadDir 内
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ error: '访问被拒绝' });
    }

    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  });

  app.post('/api/set-upload-dir', express.json(), (req, res) => {
    const newDir = req.body.dir;
    if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
      uploadDir = newDir;
      res.json({ message: '上传目录已更新' });
    } else {
      res.status(400).json({ error: '无效的目录' });
    }
  });

  // 处理所有其他路由，返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });

  return server;
}

module.exports = { startServer }; 