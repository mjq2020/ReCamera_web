import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import './Sidebar.css';

const Sidebar = () => {
  const { t, language, theme, toggleLanguage, toggleTheme, username, logout } = useApp();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'preview', path: '/preview', labelKey: 'sidebar.preview', icon: '🎬' },
    { id: 'device-info', path: '/device-info', labelKey: 'sidebar.deviceInfo', icon: '📱' },
    { id: 'live-view', path: '/live-view', labelKey: 'sidebar.liveView', icon: '📹' },
    { id: 'record-settings', path: '/record-settings', labelKey: 'sidebar.recordSettings', icon: '🎥' },
    { id: 'ai-inference', path: '/ai-inference', labelKey: 'sidebar.aiInference', icon: '🤖' },
    { id: 'terminal', path: '/terminal', labelKey: 'sidebar.terminal', icon: '💻' }
  ];

  return (
    <div className="sidebar">
      {/* 顶部品牌标题 */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📷</span>
          <div className="logo-text">
            <h1 className="logo-title">ReCamera</h1>
            <span className="logo-version">V2</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* 底部控件区域 */}
      <div className="sidebar-controls">
        {/* 用户信息 */}
        {username && (
          <div className="sidebar-control-item user-info">
            <span className="sidebar-control-icon">👤</span>
            <span className="sidebar-control-text">{username}</span>
          </div>
        )}

        {/* 语言切换 */}
        <button
          className="sidebar-control-button"
          onClick={toggleLanguage}
          title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          <span className="sidebar-control-icon">🌐</span>
          <span className="sidebar-control-text">{language === 'zh' ? '中文' : 'EN'}</span>
        </button>

        {/* 主题切换 */}
        <button
          className="sidebar-control-button"
          onClick={toggleTheme}
          title={theme === 'light' ? t('common.dark') : t('common.light')}
        >
          <span className="sidebar-control-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="sidebar-control-text">
            {theme === 'light' ? t('common.light') : t('common.dark')}
          </span>
        </button>

        {/* 登出按钮 */}
        <button
          className="sidebar-control-button logout-button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="登出"
        >
          <span className="sidebar-control-icon">🚪</span>
          <span className="sidebar-control-text">登出</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

