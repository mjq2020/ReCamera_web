import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from '../base/Toast';
import './RecordPage.css';

const RecordStorage = () => {
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState(null);
  const [storageConfig, setStorageConfig] = useState({ sEnabledSlotName: '' });
  const [selectedSlot, setSelectedSlot] = useState(null);

  const slotStateMap = {
    1: { label: '错误', color: '#ef4444' },
    2: { label: '未格式化/格式不支持', color: '#f59e0b' },
    3: { label: '格式化中', color: '#3b82f6' },
    4: { label: '未挂载', color: '#6b7280' },
    5: { label: '已挂载', color: '#10b981' },
    6: { label: '已配置', color: '#10b981' },
    7: { label: '索引中', color: '#3b82f6' },
    8: { label: '就绪', color: '#10b981' }
  };

  const fetchStorageStatus = useCallback(async () => {
    try {
      const response = await axios.get('/cgi-bin/entry.cgi/vigil/storage/status', {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });
      setStorageStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取存储状态失败:', error);
      if (loading) {
        toast.error('获取存储状态失败: ' + error.message);
        setLoading(false);
      }
    }
  }, [loading]);

  useEffect(() => {
    fetchStorageStatus();
    fetchStorageConfig();

    // 每5秒刷新一次状态
    const interval = setInterval(() => {
      fetchStorageStatus();
    }, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStorageStatus]);

  const fetchStorageConfig = async () => {
    try {
      const response = await axios.get('/cgi-bin/entry.cgi/vigil/storage/config', {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });
      setStorageConfig(response.data);
    } catch (error) {
      console.error('获取存储配置失败:', error);
    }
  };

  const handleStorageControl = async (action, slotName, slotConfig = null) => {
    try {
      const payload = {
        sAction: action,
        sSlotName: slotName
      };
      
      if (slotConfig) {
        payload.dSlotConfig = slotConfig;
      }

      await axios.post('/cgi-bin/entry.cgi/vigil/storage/control', payload, {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });

      toast.success(`操作 ${action} 成功`);
      
      // 刷新状态
      setTimeout(() => {
        fetchStorageStatus();
        fetchStorageConfig();
      }, 1000);
    } catch (error) {
      toast.error('操作失败: ' + error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getUsagePercentage = (used, total) => {
    if (total === 0) return 0;
    return ((used / total) * 100).toFixed(1);
  };

  const handleConfigSlot = (slot) => {
    setSelectedSlot({
      ...slot,
      iQuotaLimitBytes: slot.iQuotaLimitBytes || 0,
      bQuotaRotate: slot.bQuotaRotate !== undefined ? slot.bQuotaRotate : true
    });
  };

  const handleSaveSlotConfig = () => {
    if (!selectedSlot) return;

    handleStorageControl('config', selectedSlot.sDevPath, {
      iQuotaLimitBytes: selectedSlot.iQuotaLimitBytes,
      bQuotaRotate: selectedSlot.bQuotaRotate
    });
    
    setSelectedSlot(null);
  };

  const handleEnableSlot = async (slotName) => {
    try {
      await axios.post('/cgi-bin/entry.cgi/vigil/storage/config', {
        sEnabledSlotName: slotName
      }, {
        baseURL: 'http://192.168.1.66:8000',
        withCredentials: true
      });
      
      toast.success('存储设备启用成功');
      fetchStorageConfig();
    } catch (error) {
      toast.error('启用失败: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="record-storage">
      <div className="card content-card">
        <div className="card-header">
          <h3>存储设备管理</h3>
          <button className="btn btn-secondary btn-small" onClick={fetchStorageStatus}>
            🔄 刷新状态
          </button>
        </div>
        <div className="card-body">
          {storageStatus && (
            <>
              <div className="storage-info">
                <div className="info-item">
                  <label>配置版本:</label>
                  <span>{storageStatus.iRevision}</span>
                </div>
                <div className="info-item">
                  <label>数据目录:</label>
                  <span>{storageStatus.sDataDirName}</span>
                </div>
                <div className="info-item">
                  <label>已启用设备:</label>
                  <span className="enabled-device">
                    {storageConfig.sEnabledSlotName || '无'}
                  </span>
                </div>
              </div>

              {/* 存储设备列表 */}
              <div className="storage-slots">
                <h4>存储设备列表 ({storageStatus.dSlots?.length || 0})</h4>
                {storageStatus.dSlots && storageStatus.dSlots.length > 0 ? (
                  <div className="slots-grid">
                    {storageStatus.dSlots.map((slot, index) => {
                      const state = slotStateMap[slot.eState] || { label: '未知', color: '#6b7280' };
                      const usagePercent = getUsagePercentage(
                        slot.iStatsSizeBytes - slot.iStatsFreeBytes,
                        slot.iStatsSizeBytes
                      );
                      const quotaPercent = slot.iQuotaLimitBytes > 0
                        ? getUsagePercentage(slot.iQuotaUsedBytes, slot.iQuotaLimitBytes)
                        : 0;

                      const isEnabled = storageConfig.sEnabledSlotName === slot.sDevPath;

                      return (
                        <div key={index} className={`storage-slot ${isEnabled ? 'enabled' : ''}`}>
                          <div className="slot-header">
                            <div className="slot-title">
                              <span className="slot-icon">
                                {slot.bRemovable ? '💾' : '🗄️'}
                              </span>
                              <div>
                                <div className="slot-name">{slot.sLabel || slot.sDevPath}</div>
                                <div className="slot-path">{slot.sDevPath}</div>
                              </div>
                            </div>
                            <div className="slot-status" style={{ color: state.color }}>
                              <div className="status-badge" style={{ backgroundColor: state.color }}>
                                {state.label}
                              </div>
                            </div>
                          </div>

                          <div className="slot-details">
                            <div className="detail-row">
                              <span className="detail-label">类型:</span>
                              <span>{slot.sType}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">UUID:</span>
                              <span className="detail-value-small">{slot.sUUID}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">挂载点:</span>
                              <span>{slot.sMountPath || '-'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">可移动:</span>
                              <span>{slot.bRemovable ? '是' : '否'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">写入中:</span>
                              <span>{slot.bWriting ? '是' : '否'}</span>
                            </div>
                          </div>

                          {/* 存储空间使用情况 */}
                          <div className="storage-usage">
                            <div className="usage-label">
                              <span>存储空间</span>
                              <span>{formatBytes(slot.iStatsSizeBytes - slot.iStatsFreeBytes)} / {formatBytes(slot.iStatsSizeBytes)}</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${usagePercent}%` }}
                              >
                                {usagePercent}%
                              </div>
                            </div>
                          </div>

                          {/* 配额使用情况 */}
                          {slot.iQuotaLimitBytes > 0 && (
                            <div className="storage-usage">
                              <div className="usage-label">
                                <span>配额使用</span>
                                <span>{formatBytes(slot.iQuotaUsedBytes)} / {formatBytes(slot.iQuotaLimitBytes)}</span>
                              </div>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ 
                                    width: `${quotaPercent}%`,
                                    backgroundColor: quotaPercent > 90 ? '#ef4444' : '#3b82f6'
                                  }}
                                >
                                  {quotaPercent}%
                                </div>
                              </div>
                              <div className="quota-info">
                                <span>循环覆盖: {slot.bQuotaRotate ? '启用' : '禁用'}</span>
                              </div>
                            </div>
                          )}

                          {/* 中继状态 */}
                          {slot.dRelayStatus && slot.dRelayStatus.sRelayDirectory && (
                            <div className="relay-status">
                              <div className="relay-info">
                                <span>🔗 中继活动中</span>
                                <span>剩余时间: {slot.dRelayStatus.iRelayTimeoutRemain}s</span>
                              </div>
                              <div className="relay-directory">
                                目录: {slot.dRelayStatus.sRelayDirectory}
                              </div>
                            </div>
                          )}

                          {/* 操作按钮 */}
                          <div className="slot-actions">
                            {!isEnabled && slot.eState >= 5 && (
                              <button
                                className="btn btn-small btn-primary"
                                onClick={() => handleEnableSlot(slot.sDevPath)}
                              >
                                启用
                              </button>
                            )}
                            {isEnabled && (
                              <span className="enabled-badge">✓ 已启用</span>
                            )}
                            <button
                              className="btn btn-small"
                              onClick={() => handleConfigSlot(slot)}
                              disabled={slot.eState < 5}
                            >
                              配置
                            </button>
                            {slot.eState === 2 && (
                              <button
                                className="btn btn-small"
                                onClick={() => handleStorageControl('format', slot.sDevPath)}
                              >
                                格式化
                              </button>
                            )}
                            {slot.eState >= 5 && (
                              <>
                                <button
                                  className="btn btn-small"
                                  onClick={() => handleStorageControl('free_up', slot.sDevPath)}
                                >
                                  释放空间
                                </button>
                                {!slot.dRelayStatus?.sRelayDirectory && (
                                  <button
                                    className="btn btn-small"
                                    onClick={() => handleStorageControl('relay', slot.sDevPath)}
                                  >
                                    中继
                                  </button>
                                )}
                                {slot.dRelayStatus?.sRelayDirectory && (
                                  <button
                                    className="btn btn-small"
                                    onClick={() => handleStorageControl('unrelay', slot.sDevPath)}
                                  >
                                    取消中继
                                  </button>
                                )}
                              </>
                            )}
                            {slot.bRemovable && slot.eState >= 5 && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => {
                                  if (window.confirm('确定要弹出此设备吗?')) {
                                    handleStorageControl('eject', slot.sDevPath);
                                  }
                                }}
                              >
                                弹出
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-devices">
                    <p>未检测到存储设备</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 配置对话框 */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>配置存储设备</h3>
              <button className="modal-close" onClick={() => setSelectedSlot(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>设备路径</label>
                <input
                  type="text"
                  className="input-field"
                  value={selectedSlot.sDevPath}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>配额限制 (字节)</label>
                <input
                  type="number"
                  className="input-field"
                  value={selectedSlot.iQuotaLimitBytes}
                  onChange={(e) => setSelectedSlot({
                    ...selectedSlot,
                    iQuotaLimitBytes: parseInt(e.target.value) || 0
                  })}
                />
                <small className="form-hint">
                  当前值: {formatBytes(selectedSlot.iQuotaLimitBytes)} (0 表示无限制)
                </small>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSlot.bQuotaRotate}
                    onChange={(e) => setSelectedSlot({
                      ...selectedSlot,
                      bQuotaRotate: e.target.checked
                    })}
                  />
                  <span>启用循环覆盖 (空间不足时自动删除旧文件)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveSlotConfig}>
                保存配置
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedSlot(null)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordStorage;

