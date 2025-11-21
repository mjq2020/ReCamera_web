import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DeviceInfo from './pages/DeviceInfo';
import LiveView from './pages/LiveView';
import RecordSettings from './pages/RecordSettings';
import AIInference from './pages/AIInference';
import Terminal from './pages/TerminalLogs';
import Login from './pages/Login';
import { useApp } from './contexts/AppContext';

function App() {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('device-info');

  const renderContent = () => {
    switch (activeTab) {
      case 'device-info':
        return <DeviceInfo />;
      case 'live-view':
        return <LiveView />;
      case 'record-settings':
        return <RecordSettings />;
      case 'ai-inference':
        return <AIInference />;
      case 'terminal':
        return <Terminal />;
      default:
        return <DeviceInfo />;
    }
  };

  // 如果未登录，显示登录页面
  if (!isAuthenticated) {
    return <Login />;
  }

  // 已登录，显示主应用界面
  return (
    <div className="app">
      <Header />
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;

