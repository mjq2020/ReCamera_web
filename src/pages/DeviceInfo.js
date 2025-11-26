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
    { id: 'base', label: '基本信息', component: <BaseInfo key={`base-${refreshKey}`} /> },
    { id: 'time', label: '时间设置', component: <TimeSetting key={`time-${refreshKey}`} /> },
    { id: 'network', label: "网络设置", component: <NetworkSetting key={`network-${refreshKey}`} /> },
    { id: 'link', label: "连接设置", component: <LinkSetting key={`link-${refreshKey}`} /> },
    { id: 'system', label: "系统设置", component: <SystemSetting key={`system-${refreshKey}`} /> }
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
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '20px',
          gap: '4px'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabId(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTabId === tab.id ? 'var(--button-primary)' : 'transparent',
                color: activeTabId === tab.id ? 'white' : 'var(--text-secondary)',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTabId === tab.id ? '600' : '400',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (activeTabId !== tab.id) {
                  e.target.style.background = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTabId !== tab.id) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
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

