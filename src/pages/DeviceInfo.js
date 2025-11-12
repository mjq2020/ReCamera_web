import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './PageStyles.css';
import { BaseInfo, TimeSetting, NetworkSetting, LinkSetting,SystemSetting} from './tmp';


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

  // return (
  //   <div className="page-container">
  //     <div className="page-header">
  //       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  //         <div>
  //           <h2>{t('deviceInfo.title')}</h2>
  //           <p className="page-description">{t('deviceInfo.description')}</p>
  //         </div>

  //         {/* 刷新控制区域 */}
  //         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  //           {lastUpdateTime && (
  //             <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
  //               上次更新: {lastUpdateTime.toLocaleTimeString()}
  //             </div>
  //           )}

  //           <button
  //             className="btn btn-secondary"
  //             onClick={handleManualRefresh}
  //             disabled={loading}
  //             title="手动刷新"
  //           >
  //             🔄 刷新
  //           </button>

  //           <label className="checkbox-label" style={{ margin: 0 }}>
  //             <input
  //               type="checkbox"
  //               checked={autoRefresh}
  //               onChange={toggleAutoRefresh}
  //             />
  //             <span style={{ fontSize: '14px' }}>自动刷新 (5s)</span>
  //           </label>
  //         </div>
  //       </div>

  //       {/* 错误提示 */}
  //       {/* {error && (
  //         <div style={{
  //           marginTop: '12px',
  //           padding: '12px',
  //           backgroundColor: '#fee',
  //           border: '1px solid #fcc',
  //           borderRadius: '4px',
  //           color: '#c00',
  //           fontSize: '14px'
  //         }}>
  //           ⚠️ 请求失败: {error} (使用模拟数据)
  //         </div>
  //       )} */}
  //     </div>

  //     <div className="card">
  //       <div className="card-header">
  //         <h3>{t('deviceInfo.basicInfo')}</h3>
  //       </div>
  //       <div className="card-body">
  //         <div className="info-grid">
  //           <div className="info-item">
  //             <label>{t('deviceInfo.deviceName')}:</label>
  //             <span>{deviceData.sBasePlateModel}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.model')}:</label>
  //             <span>{deviceData.sSensorModel}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.firmwareVersion')}:</label>
  //             <span>{deviceData.sFirmwareVersion}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.serialNumber')}:</label>
  //             <span>{deviceData.sSerialNumber}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.ipAddress')}:</label>
  //             <span>{deviceData.ipAddress}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.macAddress')}:</label>
  //             <span>{deviceData.macAddress}</span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.status')}:</label>
  //             <span className="status-badge online">
  //               {t(`deviceInfo.${deviceData.status}`)}
  //             </span>
  //           </div>
  //           <div className="info-item">
  //             <label>{t('deviceInfo.uptime')}:</label>
  //             <span>{deviceData.uptime}</span>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="card">
  //       <div className="card-header">
  //         <h3>{t('deviceInfo.systemResources')}</h3>
  //       </div>
  //       <div className="card-body">
  //         <div className="resource-item">
  //           <label>{t('deviceInfo.cpuUsage')}</label>
  //           <div className="progress-bar">
  //             <div
  //               className="progress-fill"
  //               style={{
  //                 width: `${systemResources.cpu}%`,
  //                 background: systemResources.cpu >= 80 ? '#ee0a1dff' : '#0fe464ff'
  //               }}
  //             >
  //               {systemResources.cpu}%
  //             </div>
  //           </div>
  //         </div>
  //         <div className="resource-item">
  //           <label>{t('deviceInfo.memoryUsage')}</label>
  //           <div className="progress-bar">
  //             <div
  //               className="progress-fill"
  //               style={{
  //                 width: `${systemResources.memory}%`,
  //                 background: systemResources.memory >= 80 ? '#ee0a1dff' : '#0fe464ff'
  //               }}
  //             >
  //               {systemResources.memory}%
  //             </div>
  //           </div>
  //         </div>
  //         <div className="resource-item">
  //           <label>{t('deviceInfo.storageSpace')}</label>
  //           <div className="progress-bar">
  //             <div
  //               className="progress-fill"
  //               style={{
  //                 width: `${systemResources.storage}%`,
  //                 background: systemResources.storage >= 80 ? '#ee0a1dff' : '#0fe464ff'
  //               }}
  //             >
  //               {systemResources.storage}%
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <div className="button-group">
  //       <button className="btn btn-primary">{t('deviceInfo.saveConfig')}</button>
  //       <button className="btn btn-secondary">{t('deviceInfo.restartDevice')}</button>
  //       <button className="btn btn-danger">{t('deviceInfo.factoryReset')}</button>
  //     </div>
  //   </div>
  // );
};

export default DeviceInfo;

