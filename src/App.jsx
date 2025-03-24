import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Download as DownloadIcon, 
  FolderOpen as FolderOpenIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { translations } from './i18n';

const { ipcRenderer } = window.require('electron');

function App() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDir, setCurrentDir] = useState('');
  const [language, setLanguage] = useState('zh');
  const [networkAddresses, setNetworkAddresses] = useState({ local: '', network: [] });
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [copySuccessText, setCopySuccessText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const t = translations[language];

  useEffect(() => {
    fetchFiles();
    fetchNetworkAddresses();
    // 获取当前上传目录
    fetch('/api/files').then(() => {
      setCurrentDir(ipcRenderer.sendSync('get-upload-dir'));
    });
  }, []);

  const fetchNetworkAddresses = async () => {
    try {
      const response = await fetch('/api/network-addresses');
      const data = await response.json();
      setNetworkAddresses(data);
    } catch (error) {
      console.error('获取网络地址失败:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('获取文件列表失败:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        fetchFiles();
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    } catch (error) {
      console.error('上传失败:', error);
    }
  };

  const handleDownload = async (filename) => {
    window.open(`/api/download/${filename}`);
  };

  const handleSelectDirectory = async () => {
    const dir = await ipcRenderer.invoke('select-directory');
    if (dir) {
      try {
        const response = await fetch('/api/set-upload-dir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dir })
        });
        
        if (response.ok) {
          setCurrentDir(dir);
          fetchFiles();
        }
      } catch (error) {
        console.error('设置目录失败:', error);
      }
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(`http://${address}`);
    setCopySuccessText(t.copied);
    setShowCopySuccess(true);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {t.title}
          </Typography>
          <IconButton onClick={() => setShowSettings(!showSettings)}>
            <SettingsIcon />
          </IconButton>
        </Box>

        {showSettings && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t.language}</InputLabel>
              <Select
                value={language}
                label={t.language}
                onChange={handleLanguageChange}
              >
                <MenuItem value="zh">{t.chinese}</MenuItem>
                <MenuItem value="en">{t.english}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t.networkAddress}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{t.localAddress}:</Typography>
              <Typography variant="body2">http://{networkAddresses.local}</Typography>
              <IconButton size="small" onClick={() => handleCopyAddress(networkAddresses.local)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Paper>
            {networkAddresses.network.map((address, index) => (
              <Paper key={index} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{t.networkAddress} {index + 1}:</Typography>
                <Typography variant="body2">http://{address}</Typography>
                <IconButton size="small" onClick={() => handleCopyAddress(address)}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label={t.currentDir}
            value={currentDir}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={handleSelectDirectory}>
                  <FolderOpenIcon />
                </IconButton>
              )
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
            >
              {t.uploadFile}
            </Button>
          </label>
          {uploadProgress > 0 && (
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        <Typography variant="h6" gutterBottom>
          {t.fileList}
        </Typography>
        
        <List>
          {files.map((file) => (
            <ListItem key={file.name}>
              <ListItemText
                primary={file.name}
                secondary={`${t.size}: ${(file.size / 1024).toFixed(2)} KB | ${t.modified}: ${new Date(file.modified).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDownload(file.name)}
                >
                  <DownloadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {copySuccessText}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App; 