import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Preview from './pages/Preview';
import DeviceInfo from './pages/DeviceInfo';
import LiveView from './pages/LiveView';
import RecordSettings from './pages/RecordSettings';
import AIInference from './pages/AIInference';
import Terminal from './pages/TerminalLogs';
import Login from './pages/Login';
import { useApp } from './contexts/AppContext';
import { ToastProvider } from './components/base/Toast';
import { setNavigate } from './utils/navigation';

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 主应用布局组件
function AppLayout() {
  return (
    <div className="app">
      <div className="app-container">
        <Sidebar />
        <div className="content-area">
          <Routes>
            {/* 默认路由重定向到预览页面 */}
            <Route path="/" element={<Navigate to="/preview" replace />} />

            {/* 各个功能页面路由 */}
            <Route path="/preview" element={<Preview />} />
            <Route path="/device-info" element={<DeviceInfo />} />
            <Route path="/live-view" element={<LiveView />} />
            <Route path="/record-settings" element={<RecordSettings />} />
            <Route path="/ai-inference" element={<AIInference />} />
            <Route path="/terminal" element={<Terminal />} />

            {/* 未匹配的路由重定向到预览页面 */}
            <Route path="*" element={<Navigate to="/preview" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// 路由配置组件
function AppRoutes() {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();

  // 设置全局导航函数，供API.js等非组件使用
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <Routes>
      {/* 登录路由 */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/preview" replace /> : <Login />}
      />

      {/* 受保护的主应用路由 */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// 主App组件
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

