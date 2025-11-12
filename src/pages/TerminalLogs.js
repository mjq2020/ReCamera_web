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

  const handleCommand = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    // 添加命令到历史
    const newHistory = [
      ...history,
      { type: 'command', text: `$ ${command}` }
    ];

    // 模拟命令响应
    let response = '';
    switch (command.toLowerCase().trim()) {
      case 'help':
        response = `可用命令：
  status      - 查看系统状态
  logs        - 查看日志
  restart     - 重启服务
  network     - 查看网络信息
  ai-status   - 查看AI推理状态
  clear       - 清空终端
  help        - 显示帮助信息`;
        break;
      case 'status':
        response = `系统状态：
  设备：在线
  CPU：45%
  内存：62%
  温度：48°C
  录制：进行中
  AI推理：运行中`;
        break;
      case 'logs':
        response = `[2025-10-10 14:32:15] INFO: AI推理服务启动
[2025-10-10 14:32:18] INFO: 加载模型: YOLOv8-n
[2025-10-10 14:32:20] INFO: 视频流连接成功
[2025-10-10 14:32:25] INFO: 检测到目标: person (0.95)`;
        break;
      case 'network':
        response = `网络信息：
  IP地址：192.168.1.100
  子网掩码：255.255.255.0
  网关：192.168.1.1
  DNS：8.8.8.8
  MAC地址：00:1A:2B:3C:4D:5E`;
        break;
      case 'ai-status':
        response = `AI推理状态：
  模型：YOLOv8-n
  任务：目标检测
  设备：GPU (CUDA)
  推理速度：35 FPS
  延迟：28 ms
  状态：运行中`;
        break;
      case 'clear':
        setHistory([{ type: 'prompt', text: '$ ' }]);
        setCommand('');
        return;
      case 'restart':
        response = '正在重启服务...';
        break;
      default:
        response = `命令未找到: ${command}\n输入 "help" 查看可用命令`;
    }

    newHistory.push(
      { type: 'output', text: response },
      { type: 'prompt', text: '$ ' }
    );

    setHistory(newHistory);
    setCommand('');
  };

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
      <XtermTtydClient/>
      {/* <div className="card">
        <div className="card-body">
          <div className="terminal">
            <div className="terminal-output">
              {history.map((item, index) => (
                <div key={index} className={`terminal-line ${item.type}`}>
                  {item.type === 'command' ? (
                    <span className="command-text">{item.text}</span>
                  ) : item.type === 'prompt' ? (
                    <span className="prompt-text">{item.text}</span>
                  ) : (
                    <pre className="output-text">{item.text}</pre>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <form onSubmit={handleCommand} className="terminal-input-form">
              <span className="prompt-symbol">$</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="terminal-input"
                placeholder="输入命令..."
                autoFocus
              />
            </form>
          </div>
        </div>
      </div> */}

      <div className="card">
        <div className="card-header">
          <h3>快捷操作</h3>
        </div>
        <div className="card-body">
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setCommand('status')}>
              查看状态
            </button>
            <button className="btn btn-secondary" onClick={() => setCommand('logs')}>
              查看日志
            </button>
            <button className="btn btn-secondary" onClick={() => setCommand('network')}>
              网络信息
            </button>
            <button className="btn btn-secondary" onClick={() => setCommand('ai-status')}>
              AI状态
            </button>
            <button className="btn btn-danger" onClick={() => setCommand('clear')}>
              清空终端
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;

