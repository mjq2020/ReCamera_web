import React, { useState } from 'react';
import RecordConfig from './RecordConfig';
import RecordSchedule from './RecordSchedule';
import RecordStorage from './RecordStorage';
import RecordPreview from './RecordPreview';
import './RecordPage.css';

const RecordPage = () => {
  const [activeTab, setActiveTab] = useState('config');

  const renderContent = () => {
    switch (activeTab) {
      case 'config':
        return <RecordConfig />;
      case 'schedule':
        return <RecordSchedule />;
      case 'storage':
        return <RecordStorage />;
      case 'preview':
        return <RecordPreview />;
      default:
        return <RecordConfig />;
    }
  };

  return (
    <div className="record-page">
      <div className="page-header">
        <h2>录制设置</h2>
        <p className="page-description">配置录制规则、日程、存储和查看录制文件</p>
      </div>

      <div className="record-tabs">
        <button
          className={`record-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <span className="tab-icon">⚙️</span>
          录制配置
        </button>
        <button
          className={`record-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className="tab-icon">📅</span>
          日程管理
        </button>
        <button
          className={`record-tab ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <span className="tab-icon">💾</span>
          存储管理
        </button>
        <button
          className={`record-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <span className="tab-icon">🎬</span>
          文件预览
        </button>
      </div>

      <div className="record-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default RecordPage;

