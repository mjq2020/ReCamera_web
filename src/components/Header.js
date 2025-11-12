import React from 'react';
import { useApp } from '../contexts/AppContext';
import './Header.css';

const Header = () => {
  const { language, theme, toggleLanguage, toggleTheme, t } = useApp();

  return (
    <div className="app-header">
      <h1>{t('appTitle')}</h1>
      
      <div className="header-controls">
        {/* 语言切换 */}
        <div className="control-item">
          <label className="control-label">{t('common.language')}</label>
          <button 
            className="control-button"
            onClick={toggleLanguage}
            title={language === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <span className="control-icon">🌐</span>
            <span className="control-text">{language === 'zh' ? '中文' : 'EN'}</span>
          </button>
        </div>

        {/* 主题切换 */}
        <div className="control-item">
          <label className="control-label">{t('common.theme')}</label>
          <button 
            className="control-button"
            onClick={toggleTheme}
            title={theme === 'light' ? t('common.dark') : t('common.light')}
          >
            <span className="control-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="control-text">
              {theme === 'light' ? t('common.light') : t('common.dark')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

