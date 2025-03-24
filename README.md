# 文件服务 (File Service)

[English](README-EN.md) | 中文

一个基于 Node.js 和 Electron 的简单文件服务应用，支持文件上传、下载和管理。本项目旨在提供一个简单易用的文件同步服务，支持局域网内的文件共享和同步。

## 功能特点

- 文件上传和下载
- 文件目录浏览
- 支持中文文件名
- 实时显示上传速度
- 多语言支持（中文/英文）
- 移动端适配
- 支持自定义上传目录
- 局域网文件共享

## 安装要求

- Node.js >= 14.0.0
- npm >= 6.0.0

## 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/jianlao1314/httpFileSyncServer.git
cd httpFileSyncServer
```

2. 安装依赖：
```bash
npm install
```

3. 启动应用：
```bash
npm start
```

## 使用方法

1. 启动应用后，会自动打开浏览器访问 `http://localhost:3333`
2. 点击"选择文件"按钮选择要上传的文件
3. 点击"上传"按钮开始上传
4. 上传过程中可以查看实时上传速度
5. 上传完成后可以在文件列表中查看和管理文件

## 配置说明

在设置页面中可以：
- 修改上传目录
- 切换界面语言
- 查看网络访问地址

## 许可证

本项目采用 GNU Affero General Public License v3.0 (AGPL-3.0) 许可证。详见 [LICENSE](LICENSE) 文件。

## 作者

[封晨落宇](https://github.com/jianlao1314)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 免责声明

本软件按"原样"提供，不提供任何形式的明示或暗示的保证。使用本软件的风险由使用者自行承担。 