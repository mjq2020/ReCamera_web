import React from 'react';
import { useApp } from '../contexts/AppContext';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange }) => {
  const { t } = useApp();
  
  const menuItems = [
    { id: 'device-info', labelKey: 'sidebar.deviceInfo', icon: '📱' },
    { id: 'live-view', labelKey: 'sidebar.liveView', icon: '📹' },
    { id: 'record-settings', labelKey: 'sidebar.recordSettings', icon: '⚙️' },
    { id: 'ai-inference', labelKey: 'sidebar.aiInference', icon: '🤖' },
    { id: 'terminal', labelKey: 'sidebar.terminal', icon: '💻' }
  ];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

