import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // 从 localStorage 读取保存的设置
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh';
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // 保存语言设置到 localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 保存主题设置到 localStorage 并应用到 body
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // 切换语言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // 切换主题
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 获取翻译文本
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value;
  };

  const value = {
    language,
    theme,
    toggleLanguage,
    toggleTheme,
    t
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

