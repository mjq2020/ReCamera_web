import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './PageStyles.css';
import BaseInfo from '../components/device_info/BaseInfo';
import TimeSetting from '../components/device_info/TimeInfo';
import NetworkSetting from '../components/device_info/NetworkInfo';
import LinkSetting from '../components/device_info/HttpInfo';
import SystemSetting from '../components/device_info/SystemInfo';
import toast from '../components/base/Toast';


const DeviceInfo = () => {
  const { t } = useApp();

  // 状态管理
  const [activeTabId, setTabId] = useState('base');
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新数据
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastUpdateTime(new Date());
    toast.success("刷新成功");
  };


  const tabs = [
    { id: 'base', label: '基本信息', icon: '🖥️', component: <BaseInfo key={`base-${refreshKey}`} /> },
    { id: 'time', label: '时间设置', icon: '⏰', component: <TimeSetting key={`time-${refreshKey}`} /> },
    { id: 'network', label: "网络设置", icon: '📡', component: <NetworkSetting key={`network-${refreshKey}`} /> },
    { id: 'link', label: "连接设置", icon: '🔗', component: <LinkSetting key={`link-${refreshKey}`} /> },
    { id: 'system', label: "系统设置", icon: '💻', component: <SystemSetting key={`system-${refreshKey}`} /> }
  ];

  return (
    <div className="page-container">
      {/* 页面头部 */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{t('deviceInfo.title')}</h2>
            <p className="page-description">
              {t('deviceInfo.description')}
              {lastUpdateTime && (
                <span style={{
                  marginLeft: '16px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  最后更新: {lastUpdateTime.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </p>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleRefresh}>
              🔄 刷新数据
            </button>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className='record-tabs'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`record-tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setTabId(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div>
        {tabs.find((tab) => tab.id === activeTabId)?.component}
      </div>
    </div>
  )
};

export default DeviceInfo;

