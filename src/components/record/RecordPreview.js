import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '../base/Toast';
import './RecordPage.css';
import { RecordAPI } from '../../contexts/API';

const RecordPreview = () => {
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [relayDirectory, setRelayDirectory] = useState(null);
  const [relayTimeout, setRelayTimeout] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const [firstLoad, setFirstLoad] = useState(true);

  // 批量选择相关状态
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);


  const videoRef = useRef(null);
  const relayTimerRef = useRef(null);

  // 获取存储状态
  const fetchStorageStatus = useCallback(async () => {
    try {
      const response = await RecordAPI.getStorageStatus();
      setStorageStatus(response.data);

      // 自动选择已启用的存储设备
      const enabledSlot = response.data.lSlots?.find(slot => slot.bEnabled);
      if (enabledSlot) {
        setSelectedSlot(enabledSlot);
        // 如果已有中继,使用现有的
        if (enabledSlot.dRelayStatus?.sRelayDirectory) {
          setRelayDirectory(enabledSlot.dRelayStatus.sRelayDirectory);
          setRelayTimeout(enabledSlot.dRelayStatus.iRelayTimeoutRemain);
        }
      }

      setLoading(false);
    } catch (error) {
      toast.error('获取存储状态失败: ' + error.message);
      setLoading(false);
    }
  }, []);

  // 启动中继
  const startRelay = useCallback(async (slotDevPath) => {
    try {
      await RecordAPI.setStorageControl({
        sAction: 'relay',
        sSlotDevPath: slotDevPath
      });

      // 刷新状态获取relay目录
      setTimeout(async () => {
        const response = await RecordAPI.setStorageControl({
          sAction: 'relay',
          sSlotDevPath: slotDevPath
        });
        // const slot = response.data.dRelayStatus?.find(s => s.sDevPath === slotDevPath);
        if (response.data.dRelayStatus?.sRelayDirectory) {
          setRelayDirectory(response.data.dRelayStatus.sRelayDirectory);
          setRelayTimeout(response.data.dRelayStatus.iRelayTimeoutRemain);
          toast.success('中继启动成功');
        }
      }, 100);
    } catch (error) {
      toast.error('启动中继失败: ' + error.message);
    }
  }, []);

  // 刷新中继（心跳包）
  const refreshRelay = useCallback(async () => {
    if (!selectedSlot || !relayDirectory) return;

    try {
      await RecordAPI.setStorageControl({
        sAction: 'relay',
        sSlotDevPath: selectedSlot.sDevPath
      });
    } catch (error) {
      console.error('刷新中继失败:', error);
    }
  }, [selectedSlot, relayDirectory]);

  // 获取文件列表
  const fetchFiles = useCallback(async (path = '') => {
    if (!relayDirectory || !storageStatus) return;

    try {
      const fullPath = path
      console.log("88888", relayDirectory, fullPath)
      const response = await RecordAPI.getFileList(relayDirectory, fullPath);

      // API返回JSON数组格式
      if (Array.isArray(response.data)) {
        const parsedFiles = response.data.map(item => ({
          name: item.name,
          type: item.type === 'directory' ? 'directory' : getFileType(item.name),
          path: path ? `${path}/${item.name}` : item.name,
          size: item.size || 0,
          modifiedTime: item.mtime,
          rawType: item.type
        }));

        setFiles(parsedFiles);
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      toast.error('获取文件列表失败: ' + error.message);
      setFiles([]);
    }
  }, [relayDirectory, storageStatus]);

  // 判断文件类型
  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    return 'file';
  };

  // 获取视频缩略图
  const loadVideoThumbnail = useCallback(async (file) => {
    if (file.type !== 'video' || thumbnails[file.path]) return;

    try {
      const filePath = `${file.path}`;
      // 直接使用完整的文件URL而不是Range请求
      const url = RecordAPI.getFileUrl(relayDirectory, filePath);

      // 创建video元素获取第一帧
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; // 允许跨域（如果需要）
      video.preload = 'metadata'; // 只加载元数据，更快
      video.src = url;
      video.muted = true; // 静音以避免自动播放策略问题

      // 监听元数据加载完成
      video.addEventListener('loadedmetadata', () => {
        // 设置到第一帧
        video.currentTime = 0.1;
      });

      // 监听时间更新（当currentTime设置完成后触发）
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              setThumbnails(prev => ({ ...prev, [file.path]: thumbnailUrl }));
            }
          }, 'image/jpeg', 0.7);
        } catch (err) {
          console.error('绘制缩略图失败:', err);
        }
      });

      // 错误处理
      video.addEventListener('error', (e) => {
        console.error('视频加载失败:', file.name, e);
      });
    } catch (error) {
      console.error('加载视频缩略图失败:', error);
    }
  }, [relayDirectory, thumbnails]);

  // 初始化
  useEffect(() => {
    fetchStorageStatus();
  }, [fetchStorageStatus]);

  // 当选中存储设备变化时
  useEffect(() => {
    if (selectedSlot && relayDirectory) {
      setCurrentPath('');
      // console.log(relayDirectory);
      // fetchFiles(relayDirectory);

      // 启动中继刷新定时器（每60秒刷新一次）
      if (relayTimerRef.current) {
        clearInterval(relayTimerRef.current);
      }
      relayTimerRef.current = setInterval(refreshRelay, 60000);

      return () => {
        if (relayTimerRef.current) {
          clearInterval(relayTimerRef.current);
        }
      };
    }
  }, [selectedSlot, relayDirectory, fetchFiles, refreshRelay]);

  // 当路径变化时获取文件列表
  useEffect(() => {
    if (relayDirectory) {
      fetchFiles(currentPath);
      exitSelectionMode(); // 切换目录时退出选择模式
    }
  }, [currentPath, relayDirectory, fetchFiles]);

  // 点击页面其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // 为视频文件加载缩略图
  useEffect(() => {
    files.forEach(file => {
      if (file.type === 'video') {
        loadVideoThumbnail(file);
      }
    });
  }, [files, loadVideoThumbnail]);

  // 处理分区切换
  const handleSlotChange = async (slot) => {
    setSelectedSlot(slot);
    setRelayDirectory(null);
    setFiles([]);
    setCurrentPath('');
    setThumbnails({});

    // 启动新的中继
    await startRelay(slot.sDevPath);

  };
  useEffect(() => {
    if (storageStatus && firstLoad) {
      const slot = storageStatus.lSlots.find(s => s.sDevPath === selectedSlot.sDevPath);
      if (slot) {
        handleSlotChange(slot);
      }
      setFirstLoad(false);
    }
  }, [selectedSlot]);

  // 进入选择模式
  const enterSelectionMode = () => {
    setSelectionMode(true);
  };

  // 退出选择模式
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedFiles([]);
  };

  // 预览文件（供右键菜单等使用，不受选择模式影响）
  const previewFile = (file) => {
    if (file.type === 'directory') return;

    setSelectedFile(file);
    const filePath = `${file.path}`;
    console.log(99989, relayDirectory, filePath)
    const url = RecordAPI.getFileUrl(relayDirectory, filePath);
    setPreviewUrl(url);
  };

  // 处理文件点击
  const handleFileClick = (file, event) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
      return;
    }

    // 选择模式下：点击 = 选择
    if (selectionMode) {
      const isSelected = selectedFiles.some(f => f.path === file.path);
      if (isSelected) {
        setSelectedFiles(prev => prev.filter(f => f.path !== file.path));
      } else {
        setSelectedFiles(prev => [...prev, file]);
      }
    } else {
      // 非选择模式下：点击 = 预览
      previewFile(file);
    }
  };

  // 处理文件右键菜单
  const handleContextMenu = (event, file) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file: file
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 处理文件选择（Ctrl/Shift点击）- 仅在选择模式下生效
  const handleFileSelect = (file, event) => {
    if (!selectionMode || file.type === 'directory') return;

    if (event.ctrlKey || event.metaKey) {
      // Ctrl点击：切换选择
      event.stopPropagation();
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.path === file.path);
        if (isSelected) {
          return prev.filter(f => f.path !== file.path);
        } else {
          return [...prev, file];
        }
      });
    } else if (event.shiftKey && selectedFiles.length > 0) {
      // Shift点击：范围选择
      event.stopPropagation();
      const lastSelected = selectedFiles[selectedFiles.length - 1];
      const lastIndex = files.findIndex(f => f.path === lastSelected.path);
      const currentIndex = files.findIndex(f => f.path === file.path);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const rangeFiles = files.slice(start, end + 1).filter(f => f.type !== 'directory');
      setSelectedFiles(rangeFiles);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const selectableFiles = files.filter(f => f.type !== 'directory');
    if (selectedFiles.length === selectableFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(selectableFiles);
    }
  };

  // 返回上级
  const handleBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  // 下载文件
  const handleDownload = (file) => {
    const filePath = `${file.path}`;
    const url = RecordAPI.getFileUrl(relayDirectory, filePath);

    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`开始下载 ${file.name}`);
  };

  // 确认删除
  const confirmDelete = (file) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  // 执行删除
  const handleDelete = async () => {
    if (!fileToDelete || !selectedSlot) return;

    try {
      const filePath = `${fileToDelete.path}`;

      const response = await RecordAPI.deleteFiles(
        selectedSlot.sDevPath,
        [filePath]
      );

      if (response.data?.lRemovedFilesOrDirectories?.length > 0) {
        toast.success(`成功删除 ${fileToDelete.name}`);
        // 刷新文件列表
        fetchFiles(currentPath);
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败: ' + error.message);
    } finally {
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  // 批量下载
  const handleBatchDownload = () => {
    if (selectedFiles.length === 0) return;

    selectedFiles.forEach(file => {
      const filePath = `${file.path}`;
      const url = RecordAPI.getFileUrl(relayDirectory, filePath);

      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast.success(`开始下载 ${selectedFiles.length} 个文件`);
    exitSelectionMode(); // 下载完成后退出选择模式
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedFiles.length === 0 || !selectedSlot) return;

    // 使用批量删除对话框
    setFileToDelete({
      name: `${selectedFiles.length} 个文件`,
      isBatch: true,
      files: selectedFiles
    });
    setDeleteModalOpen(true);
  };

  // 修改删除函数以支持批量删除
  const executeBatchDelete = async () => {
    if (!fileToDelete || !selectedSlot) return;

    try {
      let filesToDelete;
      const isBatchDelete = fileToDelete.isBatch;

      if (isBatchDelete) {
        filesToDelete = fileToDelete.files.map(f => f.path);
      } else {
        filesToDelete = [fileToDelete.path];
      }

      const response = await RecordAPI.deleteFiles(
        selectedSlot.sDevPath,
        filesToDelete
      );

      if (response.data?.lRemovedFilesOrDirectories?.length > 0) {
        toast.success(`成功删除 ${response.data.lRemovedFilesOrDirectories.length} 个文件`);

        // 批量删除后退出选择模式
        if (isBatchDelete) {
          exitSelectionMode();
        }

        fetchFiles(currentPath);
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败: ' + error.message);
    } finally {
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  // 关闭预览
  const closePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 获取文件图标
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

  return (
    <div className="record-preview">
      <div className="card content-card">
        <div className="card-header">
          <h3>文件预览</h3>
          <div className="preview-controls">
            {/* 分区选择器 */}
            {storageStatus?.lSlots && storageStatus.lSlots.length > 0 && (
              <select
                className="form-select"
                value={selectedSlot?.sDevPath || ''}
                onChange={(e) => {
                  const slot = storageStatus.lSlots.find(s => s.sDevPath === e.target.value);
                  if (slot) handleSlotChange(slot);
                }}
              >
                {/* <option value="">选择存储设备</option> */}
                {storageStatus.lSlots
                  .filter(slot => slot.eState >= 6)
                  .map(slot => (
                    <option key={slot.sDevPath} value={slot.sDevPath}>
                      {slot.sLabel || slot.sDevPath} ({slot.sState})
                    </option>
                  ))
                }
              </select>
            )}

            {/* 视图模式切换 */}
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

            {/* 选择模式切换按钮 */}
            {!selectionMode ? (
              <button
                className="btn btn-small btn-primary"
                onClick={enterSelectionMode}
              >
                选择
              </button>
            ) : (
              <button
                className="btn btn-small"
                onClick={exitSelectionMode}
              >
                取消选择
              </button>
            )}

            {/* 中继状态显示 */}
            {relayDirectory && (
              <span className="relay-active">
                ✓ 文件访问已启用
                {relayTimeout && ` (${Math.floor(relayTimeout / 60)}分钟)`}
              </span>
            )}
          </div>
        </div>

        <div className="card-body">
          {!selectedSlot ? (
            <div className="no-storage">
              <p>请选择存储设备</p>
            </div>
          ) : !relayDirectory ? (
            <div className="no-relay">
              <p>正在启动文件访问...</p>
            </div>
          ) : (
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

              {/* 批量操作栏 - 仅在选择模式下显示 */}
              {selectionMode && files.filter(f => f.type !== 'directory').length > 0 && (
                <div className="batch-operations">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.filter(f => f.type !== 'directory').length && selectedFiles.length > 0}
                      onChange={toggleSelectAll}
                    />
                    <span>全选</span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <>
                      <span className="selected-count">
                        已选择 {selectedFiles.length} 个文件
                      </span>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={handleBatchDownload}
                      >
                        批量下载
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={handleBatchDelete}
                      >
                        批量删除
                      </button>
                      <button
                        className="btn btn-small"
                        onClick={() => setSelectedFiles([])}
                      >
                        清空选择
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 文件列表 */}
              {files.length > 0 ? (
                <div className={`file-${viewMode}`}>
                  {files.map((file, index) => {
                    const isSelected = selectedFiles.some(f => f.path === file.path);
                    return (
                      <div
                        key={index}
                        className={`file-item ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          handleFileSelect(file, e);
                          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                            handleFileClick(file, e);
                          }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                      >
                        {/* 仅在选择模式下显示checkbox */}
                        {selectionMode && file.type !== 'directory' && (
                          <div className="file-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFiles(prev => [...prev, file]);
                                } else {
                                  setSelectedFiles(prev => prev.filter(f => f.path !== file.path));
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="file-preview">
                          {file.type === 'image' ? (
                            <img
                              src={RecordAPI.getFileUrl(relayDirectory, `${file.path}`)}
                              alt={file.name}
                              className="file-thumbnail"
                              loading="lazy"
                            />
                          ) : file.type === 'video' && thumbnails[file.path] ? (
                            <img
                              src={thumbnails[file.path]}
                              alt={file.name}
                              className="file-thumbnail"
                            />
                          ) : (
                            <div className="file-icon-large">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                        </div>
                        <div className="file-info">
                          <div className="file-name" title={file.name}>
                            {file.name}
                          </div>
                          {viewMode === 'list' && (
                            <div className="file-details">
                              {file.type !== 'directory' && <span>{formatFileSize(file.size)}</span>}
                              <span>{formatDate(file.modifiedTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-files">
                  <p>此目录为空</p>
                </div>
              )}
            </>
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
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    closePreview();
                    confirmDelete(selectedFile);
                  }}
                >
                  删除文件
                </button>
                <button className="btn btn-secondary" onClick={closePreview}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteModalOpen && fileToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setDeleteModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>确定要删除以下文件吗？</p>
              {fileToDelete.isBatch ? (
                <>
                  <p><strong>{fileToDelete.name}</strong></p>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '10px 0' }}>
                    {fileToDelete.files.map((f, i) => (
                      <div key={i} style={{ padding: '4px 0' }}>• {f.name}</div>
                    ))}
                  </div>
                </>
              ) : (
                <p><strong>{fileToDelete.name}</strong></p>
              )}
              <p className="warning-text">此操作无法撤销！</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={executeBatchDelete}>
                确认删除
              </button>
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file.type !== 'directory' && (
            <>
              <div
                className="context-menu-item"
                onClick={() => {
                  previewFile(contextMenu.file);
                  closeContextMenu();
                }}
              >
                预览
              </div>
              <div
                className="context-menu-item"
                onClick={() => {
                  handleDownload(contextMenu.file);
                  closeContextMenu();
                }}
              >
                下载
              </div>
              <div className="context-menu-divider"></div>
              <div
                className="context-menu-item danger"
                onClick={() => {
                  confirmDelete(contextMenu.file);
                  closeContextMenu();
                }}
              >
                删除
              </div>
            </>
          )}
          {contextMenu.file.type === 'directory' && (
            <div
              className="context-menu-item"
              onClick={() => {
                handleFileClick(contextMenu.file);
                closeContextMenu();
              }}
            >
              打开文件夹
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordPreview;
