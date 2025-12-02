import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from '../base/Toast';
import './RecordPage.css';

const RecordPreview = () => {
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [relayDirectory, setRelayDirectory] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const videoRef = useRef(null);

  const fetchStorageStatus = useCallback(async () => {
    try {
      const response = await axios.get('/cgi-bin/entry.cgi/vigil/storage/status', {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });
      setStorageStatus(response.data);
      
      // 自动选择已启用的存储设备
      const enabledSlot = response.data.dSlots?.find(slot => slot.bEnabled);
      if (enabledSlot) {
        setSelectedSlot(enabledSlot);
        // 如果已有中继,使用现有的
        if (enabledSlot.dRelayStatus?.sRelayDirectory) {
          setRelayDirectory(enabledSlot.dRelayStatus.sRelayDirectory);
        }
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('获取存储状态失败: ' + error.message);
      setLoading(false);
    }
  }, []);

  const fetchFiles = useCallback(async (path) => {
    if (!relayDirectory || !storageStatus) return;

    try {
      const dataDir = storageStatus?.sDataDirName || 'DCIM';
      const fullPath = path ? `${dataDir}/${path}` : dataDir;
      
      // 注意: 这里需要根据实际的nginx配置来访问文件列表
      // 如果nginx没有提供目录列表功能,可能需要后端提供文件列表API
      const response = await axios.get(`/cgi-bin/entry.cgi/vigil/files/${relayDirectory}/${fullPath}`, {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });

      // 假设返回的是HTML目录列表,需要解析
      // 实际项目中可能需要后端提供专门的文件列表API
      parseFileList(response.data);
    } catch (error) {
      // 如果获取失败,使用模拟数据
      console.error('获取文件列表失败:', error);
      loadMockFiles(path);
    }
  }, [relayDirectory, storageStatus]);

  useEffect(() => {
    fetchStorageStatus();
  }, [fetchStorageStatus]);

  useEffect(() => {
    if (selectedSlot && relayDirectory) {
      fetchFiles(currentPath);
    }
  }, [selectedSlot, relayDirectory, currentPath, fetchFiles]);

  const handleStartRelay = async (slotName) => {
    try {
      await axios.post('/cgi-bin/entry.cgi/vigil/storage/control', {
        sAction: 'relay',
        sSlotName: slotName
      }, {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });

      // 刷新状态获取relay目录
      setTimeout(async () => {
        const response = await axios.get('/cgi-bin/entry.cgi/vigil/storage/status', {
          baseURL: 'http://192.168.1.66:8000',
          withCredentials: true
        });
        const slot = response.data.dSlots?.find(s => s.sDevPath === slotName);
        if (slot?.dRelayStatus?.sRelayDirectory) {
          setRelayDirectory(slot.dRelayStatus.sRelayDirectory);
          toast.success('中继启动成功');
        }
      }, 1000);
    } catch (error) {
      toast.error('启动中继失败: ' + error.message);
    }
  };

  const loadMockFiles = (path) => {
    // 模拟文件数据
    const mockFiles = [];
    
    if (!path) {
      // 根目录显示日期文件夹
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        mockFiles.push({
          name: dateStr,
          type: 'directory',
          path: dateStr,
          size: 0,
          modifiedTime: date.toISOString()
        });
      }
    } else {
      // 日期文件夹内显示文件
      for (let i = 0; i < 10; i++) {
        const isVideo = i % 3 === 0;
        mockFiles.push({
          name: `record_${path}_${String(i).padStart(3, '0')}.${isVideo ? 'mp4' : 'jpg'}`,
          type: isVideo ? 'video' : 'image',
          path: `${path}/record_${path}_${String(i).padStart(3, '0')}.${isVideo ? 'mp4' : 'jpg'}`,
          size: isVideo ? 12345678 : 234567,
          modifiedTime: new Date().toISOString()
        });
      }
    }
    
    setFiles(mockFiles);
  };

  const parseFileList = (html) => {
    // 简单的HTML解析,实际项目中应该由后端提供JSON格式的文件列表
    // 这里只是示例
    const files = [];
    // TODO: 解析HTML或使用专门的文件列表API
    setFiles(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const handleFileClick = (file) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      setSelectedFile(file);
      const url = getFileUrl(file.path);
      setPreviewUrl(url);
    }
  };

  const handleBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const getFileUrl = (filePath) => {
    if (!relayDirectory) return null;
    const dataDir = storageStatus?.sDataDirName || 'DCIM';
    return `http://192.168.1.66:8000/cgi-bin/entry.cgi/vigil/files/${relayDirectory}/${dataDir}/${filePath}`;
  };

  const handleDownload = (file) => {
    const url = getFileUrl(file.path);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    toast.success(`开始下载 ${file.name}`);
  };

  const closePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'directory':
        return '📁';
      case 'video':
        return '🎬';
      case 'image':
        return '🖼️';
      default:
        return '📄';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!selectedSlot) {
    return (
      <div className="card content-card">
        <div className="card-header">
          <h3>文件预览</h3>
        </div>
        <div className="card-body">
          <div className="no-storage">
            <p>未检测到已启用的存储设备</p>
            <p>请先在存储管理中配置和启用存储设备</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="record-preview">
      <div className="card content-card">
        <div className="card-header">
          <h3>文件预览 - {selectedSlot.sLabel || selectedSlot.sDevPath}</h3>
          <div className="preview-controls">
            <button
              className={`btn btn-small ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              网格
            </button>
            <button
              className={`btn btn-small ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
            {!relayDirectory && (
              <button
                className="btn btn-primary btn-small"
                onClick={() => handleStartRelay(selectedSlot.sDevPath)}
              >
                启动文件访问
              </button>
            )}
            {relayDirectory && (
              <span className="relay-active">✓ 文件访问已启用</span>
            )}
          </div>
        </div>
        <div className="card-body">
          {relayDirectory ? (
            <>
              {/* 面包屑导航 */}
              <div className="breadcrumb">
                <button className="breadcrumb-item" onClick={() => setCurrentPath('')}>
                  根目录
                </button>
                {currentPath && currentPath.split('/').map((part, index, arr) => (
                  <React.Fragment key={index}>
                    <span className="breadcrumb-separator">/</span>
                    <button
                      className="breadcrumb-item"
                      onClick={() => setCurrentPath(arr.slice(0, index + 1).join('/'))}
                    >
                      {part}
                    </button>
                  </React.Fragment>
                ))}
                {currentPath && (
                  <button className="btn btn-small" onClick={handleBack} style={{ marginLeft: '12px' }}>
                    ← 返回上级
                  </button>
                )}
              </div>

              {/* 文件列表 */}
              {files.length > 0 ? (
                <div className={`file-${viewMode}`}>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="file-item"
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="file-icon">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="file-info">
                        <div className="file-name" title={file.name}>
                          {file.name}
                        </div>
                        {viewMode === 'list' && (
                          <div className="file-details">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.modifiedTime)}</span>
                          </div>
                        )}
                      </div>
                      {file.type !== 'directory' && (
                        <div className="file-actions">
                          <button
                            className="btn btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick(file);
                            }}
                          >
                            预览
                          </button>
                          <button
                            className="btn btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            下载
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-files">
                  <p>此目录为空</p>
                </div>
              )}
            </>
          ) : (
            <div className="no-relay">
              <p>请点击"启动文件访问"以开始浏览文件</p>
            </div>
          )}
        </div>
      </div>

      {/* 文件预览对话框 */}
      {selectedFile && previewUrl && (
        <div className="modal-overlay preview-modal" onClick={closePreview}>
          <div className="modal-content preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedFile.name}</h3>
              <button className="modal-close" onClick={closePreview}>✕</button>
            </div>
            <div className="modal-body preview-body">
              {selectedFile.type === 'video' ? (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  autoPlay
                  className="preview-video"
                >
                  您的浏览器不支持视频播放
                </video>
              ) : selectedFile.type === 'image' ? (
                <img
                  src={previewUrl}
                  alt={selectedFile.name}
                  className="preview-image"
                />
              ) : (
                <div className="preview-unsupported">
                  <p>不支持预览此文件类型</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="file-info-detail">
                <span>大小: {formatFileSize(selectedFile.size)}</span>
                <span>修改时间: {formatDate(selectedFile.modifiedTime)}</span>
              </div>
              <div className="preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(selectedFile)}
                >
                  下载文件
                </button>
                <button className="btn btn-secondary" onClick={closePreview}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordPreview;

