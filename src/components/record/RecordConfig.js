import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RecordAPI, SUCCESS_CODE } from '../../contexts/API';
import { toast } from '../base/Toast';
import TimerConfig from './config/TimerConfig';
import GpioConfig from './config/GpioConfig';
import TtyConfig from './config/TtyConfig';
import InferenceConfig from './config/InferenceConfig';
import './RecordPage.css';

const RecordConfig = () => {
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState({
    bRuleEnabled: false,
    dWriterConfig: {
      sFormat: 'mp4',
      iIntervalMs: 0
    }
  });

  // 防抖定时器引用
  const debounceTimerRef = useRef(null);
  const [recordRuleConfig, setRecordRuleConfig] = useState({
    sCurrentSelected: 'InferenceSet',
    lInferenceSet: [],
    dTimer: { iIntervalSeconds: 60 },
    dGPIO: {
      sName: 'GPIO_01',
      sInitialLevel: 'low',
      sSignal: 'high',
      iDebounceDurationMs: 100
    },
    dTTY: {
      sName: 'ttyS0',
      sCommand: 'RECORD'
    }
  });

  // 当前选中的触发类型和配置弹窗状态
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [currentTriggerType, setCurrentTriggerType] = useState(null);
  const [tempRuleConfig, setTempRuleConfig] = useState(null);

  // 触发类型列表
  const triggerTypes = [
    { key: 'InferenceSet', name: 'AI 推理触发', icon: '🤖' },
    { key: 'Timer', name: '定时触发', icon: '⏰' },
    { key: 'GPIO', name: 'GPIO 触发', icon: '🔌' },
    { key: 'TTY', name: '串口触发', icon: '📡' }
  ];

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const [globalRes, recordRes] = await Promise.all([
        RecordAPI.getRuleConfig(),
        RecordAPI.getRecordRuleConfig()
      ]);

      // 确保全局配置有默认值
      setGlobalConfig({
        bRuleEnabled: globalRes.data?.bRuleEnabled ?? false,
        dWriterConfig: {
          sFormat: globalRes.data?.dWriterConfig?.sFormat || 'mp4',
          iIntervalMs: globalRes.data?.dWriterConfig?.iIntervalMs ?? 0
        }
      });

      // 确保录制规则配置有默认值
      setRecordRuleConfig({
        sCurrentSelected: recordRes.data?.sCurrentSelected || 'InferenceSet',
        lInferenceSet: recordRes.data?.lInferenceSet || [],
        dTimer: recordRes.data?.dTimer || { iIntervalSeconds: 60 },
        dGPIO: recordRes.data?.dGPIO || {
          sName: 'GPIO_01',
          sInitialLevel: 'low',
          sSignal: 'high',
          iDebounceDurationMs: 100
        },
        dTTY: recordRes.data?.dTTY || {
          sName: 'ttyS0',
          sCommand: 'RECORD'
        }
      });
    } catch (error) {
      toast.error('获取配置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 修改全局配置
  const saveGlobalConfig = async (field, value) => {
    const newConfig = {
      ...globalConfig,
      dWriterConfig: { ...globalConfig.dWriterConfig, [field]: value }
    };
    try {
      await RecordAPI.setRuleConfig(newConfig);
      toast.success('全局配置保存成功');
    } catch (error) {
      toast.error('保存失败: ' + error);
    }
  };

  // 防抖处理最小捕获间隔的变化
  const handleIntervalChange = (value) => {
    // 立即更新本地状态
    const newConfig = {
      ...globalConfig,
      dWriterConfig: { ...globalConfig.dWriterConfig, iIntervalMs: value }
    };
    setGlobalConfig(newConfig);

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }


    // 设置新的防抖定时器（500ms 后发送请求）
    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (value === 0 || isNaN(value)) {
          toast.error('最小捕获间隔不能为0或NaN');
          return;
        }
        await RecordAPI.setRuleConfig(newConfig);
        toast.success('最小捕获间隔已保存');
      } catch (error) {

      }
    }, 500);
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 打开配置弹窗
  const handleOpenConfig = (triggerType) => {
    setCurrentTriggerType(triggerType);

    // 确保所有配置字段都有默认值
    setTempRuleConfig({
      sCurrentSelected: recordRuleConfig.sCurrentSelected || 'InferenceSet',
      lInferenceSet: recordRuleConfig.lInferenceSet || [],
      dTimer: recordRuleConfig.dTimer || { iIntervalSeconds: 60 },
      dGPIO: recordRuleConfig.dGPIO || {
        sName: 'GPIO 0',
        sInitialLevel: 'low',
        sSignal: 'high',
        iDebounceDurationMs: 100
      },
      dTTY: recordRuleConfig.dTTY || {
        sName: 'Console',
        sCommand: 'RECORD'
      }
    });

    setConfigModalOpen(true);
  };

  // 保存配置（弹窗确定按钮）
  const handleSaveConfig = async () => {
    try {
      // 保存录制规则配置

      await RecordAPI.setRecordRuleConfig(tempRuleConfig);

      setRecordRuleConfig(tempRuleConfig);
      setConfigModalOpen(false);
      toast.success('配置保存成功');
    } catch (error) { }
  };

  // 应用触发类型
  const handleApplyTriggerType = async (triggerType) => {
    try {
      await RecordAPI.setRecordRuleConfig({ ...recordRuleConfig, sCurrentSelected: triggerType });
      setRecordRuleConfig({ ...recordRuleConfig, sCurrentSelected: triggerType });
      toast.success(`已应用 ${triggerTypes.find(t => t.key === triggerType)?.name}`);
    } catch (error) { }
  };

  // 切换录制规则启用状态
  const handleToggleRuleEnabled = async (enabled) => {
    try {
      const newConfig = { ...globalConfig, bRuleEnabled: enabled };

      await RecordAPI.setRuleConfig(newConfig);
      setGlobalConfig(newConfig);
      toast.success(enabled ? '已启用录制规则' : '已禁用录制规则');
    } catch (error) { }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="record-config">
      {/* 主配置区域 - 左右布局 */}
      <div className="config-row">
        {/* 左侧：触发类型列表 */}
        <div className="card content-card flex-2">
          <div className="card-header">
            <h3>触发设置</h3>
            <div className='header-middle'>
              <div className="global-config-form">
                <div className="form-group">
                  <label>录制格式</label>
                  <select
                    className="select-input"
                    value={globalConfig.dWriterConfig.sFormat}
                    onChange={(e) => saveGlobalConfig('sFormat', e.target.value)}
                  >
                    <option value="mp4">MP4 (视频)</option>
                    <option value="jpg">JPG (图片)</option>
                    <option value="raw">RAW (原始数据)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>最小捕获间隔 (毫秒)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={globalConfig.dWriterConfig.iIntervalMs}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                    placeholder="输入间隔时间"
                  />
                </div>
              </div>
            </div>
            <div className="header-right">
              <span className="current-type">
                当前: {triggerTypes.find(t => t.key === recordRuleConfig.sCurrentSelected)?.name || '未设置'}
              </span>
              <div className="header-switch">
                <span className={`switch-status ${globalConfig.bRuleEnabled ? 'on' : 'off'}`}>
                  {globalConfig.bRuleEnabled ? '已启用' : '已禁用'}
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={globalConfig.bRuleEnabled}
                    onChange={(e) => handleToggleRuleEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="trigger-type-list">
              {triggerTypes.map(trigger => (
                <div key={trigger.key} className={`trigger-type-item ${recordRuleConfig.sCurrentSelected === trigger.key ? 'active' : ''}`}>
                  <div className="trigger-info">
                    <span className="trigger-icon">{trigger.icon}</span>
                    <span className="trigger-name">{trigger.name}</span>
                    {recordRuleConfig.sCurrentSelected === trigger.key && (
                      <span className="active-badge">当前使用</span>
                    )}
                  </div>
                  <div className="trigger-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleOpenConfig(trigger.key)}
                    >
                      配置
                    </button>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleApplyTriggerType(trigger.key)}
                      disabled={recordRuleConfig.sCurrentSelected === trigger.key}
                    >
                      应用
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>

      {/* 配置弹窗 */}
      {configModalOpen && tempRuleConfig && (
        <div className="modal-overlay" onClick={() => setConfigModalOpen(false)}>
          <div
            className={`modal-content ${currentTriggerType === 'InferenceSet' ? 'large' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {triggerTypes.find(t => t.key === currentTriggerType)?.icon}{' '}
                {triggerTypes.find(t => t.key === currentTriggerType)?.name} - 配置
              </h3>
              <button className="modal-close" onClick={() => setConfigModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* 触发类型特定配置 */}
              <div className="config-section">

                {/* <h4>触发类型配置</h4> */}

                {/* 定时触发配置 */}
                {currentTriggerType === 'Timer' && (
                  <TimerConfig tempRuleConfig={tempRuleConfig} setTempRuleConfig={setTempRuleConfig} />)}

                {/* GPIO 触发配置 */}
                {currentTriggerType === 'GPIO' && (
                  <GpioConfig tempRuleConfig={tempRuleConfig} setTempRuleConfig={setTempRuleConfig} />
                )}

                {/* 串口触发配置 */}
                {currentTriggerType === 'TTY' && (
                  <TtyConfig tempRuleConfig={tempRuleConfig} setTempRuleConfig={setTempRuleConfig} />
                )}

                {/* AI 推理触发配置 */}
                {currentTriggerType === 'InferenceSet' && (
                  <InferenceConfig
                    tempRuleConfig={tempRuleConfig}
                    setTempRuleConfig={setTempRuleConfig}
                  />
                )}
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfigModalOpen(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveConfig}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordConfig;

