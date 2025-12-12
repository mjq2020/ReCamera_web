import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from '../base/Toast';
import './RecordPage.css';
import { RecordAPI } from '../../contexts/API';

const RecordStorage = () => {
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quotaLimit, setQuotaLimit] = useState(0);
  const [inUse, setInUse] = useState('');
  const [currentDataDir, setCurrentDataDir] = useState('');

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
      const response = await RecordAPI.getStorageStatus();
      setStorageStatus(response.data);
      //设置显示的存储路径
      if (response.data.sCurrentEnabledSlotDevPath) {
        setCurrentDataDir('');
        for (const slot of response.data.lSlots) {
          if (slot.sDevPath === response.data.sCurrentEnabledSlotDevPath) {
            setCurrentDataDir(slot.sMountPath + "/" + response.data.sDataDirName);
            break;
          }
        }
      } else {
        setCurrentDataDir('');
      }
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
    // 每5秒刷新一次状态
    const interval = setInterval(() => {
      fetchStorageStatus();
    }, 1000);


    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStorageStatus]);

  // useEffect(() => {
  //   setInUse(storageStatus.sTargetEnabledSlotDevPath === slot.sDevPath &&
  //     storageStatus.sCurrentEnabledSlotDevPath !== storageStatus.sTargetEnabledSlotDevPath);

  // }, [storageStatus])

  // 存储控制，发送执行命令到后端
  const handleStorageControl = async (action, slotName, slotConfig = null) => {
    try {
      const payload = {
        sAction: action,
        sSlotDevPath: slotName
      };

      if (slotConfig) {
        payload.dSlotConfig = slotConfig;
      }
      if (action === 'free_up') {
        const result = await toast.confirm('确定要删除所有录制数据吗?');
        if (!result) {
          return;
        }
      }
      if (action === 'eject') {
        const result = await toast.confirm('确定要弹出此设备吗?');
        if (!result) {
          return;
        }
      }

      await RecordAPI.setStorageControl(payload);

      toast.success(`操作 ${action} 成功`);

      // 刷新状态
      setTimeout(() => {
        fetchStorageStatus();
      }, 1000);
    } catch (error) { }
  };

  const formatBytes = (bytes) => {
    if (bytes === null) return '未知';
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
    setQuotaLimit(parseInt(slot.iQuotaLimitBytes / 1024 / 1024));
    setSelectedSlot({
      ...slot,
      iQuotaLimitBytes: slot.iQuotaLimitBytes || 0,
      bQuotaRotate: slot.bQuotaRotate !== undefined ? slot.bQuotaRotate : true
    });
  };


  // 保存空间限制配置
  const handleSaveSlotConfig = () => {
    if (!selectedSlot) return;

    handleStorageControl('config', selectedSlot.sDevPath, {
      iQuotaLimitBytes: selectedSlot.iQuotaLimitBytes,
      bQuotaRotate: selectedSlot.bQuotaRotate
    });

    setSelectedSlot(null);
  };

  const handleEnableSlot = async (slotName) => {
    setInUse(slotName);
    try {
      await RecordAPI.setStorageConfig({
        sTargetEnabledSlotDevPath: slotName
      });
      toast.success('存储设备启用成功');
      setInUse('');
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
                  <label>数据目录:</label>
                  <span>{currentDataDir}</span>
                </div>
                <div className="info-item">
                  <label>已启用设备:</label>
                  <span className="enabled-device">
                    {storageStatus.sCurrentEnabledSlotDevPath || '无'}
                  </span>
                </div>
              </div>

              {/* 存储设备列表 */}
              <div className="storage-slots">
                <h4>存储设备列表 ({storageStatus.lSlots?.length || 0})</h4>
                {storageStatus.lSlots && storageStatus.lSlots.length > 0 ? (
                  <div className="slots-grid">
                    {storageStatus.lSlots.map((slot, index) => {
                      const state = slotStateMap[slot.eState] || { label: '未知', color: '#6b7280' };
                      const usagePercent = getUsagePercentage(
                        slot.iStatsSizeBytes - slot.iStatsFreeBytes,
                        slot.iStatsSizeBytes
                      );
                      const quotaPercent = slot.iQuotaLimitBytes > 0
                        ? getUsagePercentage(slot.iQuotaUsedBytes, slot.iQuotaLimitBytes)
                        : 0;

                      const isEnabled = storageStatus.sTargetEnabledSlotDevPath === slot.sDevPath &&
                        storageStatus.sCurrentEnabledSlotDevPath === storageStatus.sTargetEnabledSlotDevPath;
                      const useing = storageStatus.sTargetEnabledSlotDevPath === slot.sDevPath &&
                        storageStatus.sCurrentEnabledSlotDevPath != storageStatus.sTargetEnabledSlotDevPath


                      return (
                        <div key={index} className={`storage-slot ${isEnabled ? 'enabled' : ''}`}>
                          <div className="slot-header">
                            <div className="slot-title">
                              <span className="slot-icon">
                                {slot.bInternal ? '🗄️' : '💾'}
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

                          <div className="storage-usage">
                            <div className="usage-label">
                              <span>配额使用</span>
                              <span>
                                {formatBytes(slot.iQuotaUsedBytes)} / {slot.iQuotaLimitBytes ?
                                  formatBytes(slot.iQuotaLimitBytes) : formatBytes(slot.iStatsSizeBytes)}</span>
                            </div>
                            {slot.eState === 5 && inUse === slot.sDevPath && (
                              <div className="storage-usage-tip">
                                <span className="tip-icon">ℹ️</span>
                                <span className="tip-text">首次使用将自动分配全部空间用于录制，可使用存储配置按钮配置使用空间</span>
                              </div>
                            )}
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

                          {/* 操作按钮 */}
                          <div className="slot-actions">
                            {!isEnabled && slot.eState >= 5 && !useing && (
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
                            {useing && !isEnabled && (
                              <span className="enabled-badge"> 启用中...</span>
                            )}
                            <button
                              className="btn btn-small"
                              onClick={() => handleConfigSlot(slot)}
                              disabled={slot.eState < 5}
                            >
                              存储配置
                            </button>
                            {slot.eState === 2 && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleStorageControl('format', slot.sDevPath)}
                              >
                                格式化
                              </button>
                            )}
                            {slot.eState >= 5 && (
                              <>
                                <button
                                  className="btn btn-small btn-danger"
                                  onClick={() => handleStorageControl('free_up', slot.sDevPath)}
                                >
                                  删除所有录制数据
                                </button>
                              </>
                            )}
                            {!slot.bInternal && slot.eState >= 5 && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => {
                                  handleStorageControl('eject', slot.sDevPath);

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
                <label>配额限制 (MB)</label>
                <input
                  type="number"
                  className="input-field"
                  value={quotaLimit}
                  max={parseInt(selectedSlot.iStatsSizeBytes / 1024 / 1024)}
                  onChange={(e) => {
                    setQuotaLimit(e.target.value);
                    setSelectedSlot({
                      ...selectedSlot,
                      iQuotaLimitBytes: parseInt(e.target.value) * 1024 * 1024 || 0
                    })
                  }}
                />
                <small className="form-hint">
                  当前值: {quotaLimit} MB (0 表示无限制),最大值:{parseInt(selectedSlot.iStatsSizeBytes / 1024 / 1024)} MB
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

