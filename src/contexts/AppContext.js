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

  // 登录状态管理
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 检查 localStorage 中是否有登录标记
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
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

  // 监听未授权事件
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event received, logging out...');
      // 调用logout清除所有状态
      setIsAuthenticated(false);
      setUsername('');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
    };

    // 添加事件监听器
    window.addEventListener('unauthorized', handleUnauthorized);

    // 清理函数
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 切换语言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // 切换主题
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 登录函数 - 只负责更新本地状态
  const login = (sUserName) => {
    setIsAuthenticated(true);
    setUsername(sUserName);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', sUserName);
  };

  // 登出函数
  const logout = () => {
    setIsAuthenticated(false);
    setUsername('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
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
    t,
    isAuthenticated,
    username,
    login,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

