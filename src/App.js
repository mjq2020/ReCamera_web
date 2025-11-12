import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DeviceInfo from './pages/DeviceInfo';
import LiveView from './pages/LiveView';
import RecordSettings from './pages/RecordSettings';
import AIInference from './pages/AIInference';
import Terminal from './pages/TerminalLogs';

function App() {
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

