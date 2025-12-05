import React, { useState, useRef, useEffect } from 'react';
import './PageStyles.css';
import SystemLogViewer from '../components/terminal_logs/Logs';
import XtermTtydClient from '../components/terminal_logs/Terminal'

const Terminal = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', text: 'AI摄像头终端 v1.0.0' },
    { type: 'output', text: '输入 "help" 查看可用命令' },
    { type: 'prompt', text: '$ ' }
  ]);
  const terminalEndRef = useRef(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>系统日志</h2>
        <p className="page-description">实时查看和监控系统运行日志</p>
      </div>

      <SystemLogViewer />

      <div className="page-header" style={{ marginTop: '40px' }}>
        <h2>终端控制台</h2>
        <p className="page-description">通过命令行管理和监控设备</p>
      </div>
      <XtermTtydClient />

    </div>
  );
};

export default Terminal;

