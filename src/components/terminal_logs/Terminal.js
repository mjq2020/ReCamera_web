import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

// ttyd 协议命令定义
const Command = {
  // 服务器端命令
  OUTPUT: '0',           // 输出数据
  SET_WINDOW_TITLE: '1', // 设置窗口标题
  SET_PREFERENCES: '2',  // 设置偏好设置

  // 客户端命令
  INPUT: '0',            // 输入数据
  RESIZE_TERMINAL: '1',  // 调整终端大小
  PAUSE: '2',            // 暂停
  RESUME: '3',           // 恢复
};

const XtermTtydClient = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const onDataHandlerRef = useRef(null);
  const onResizeHandlerRef = useRef(null);
  const textEncoderRef = useRef(new TextEncoder());
  const textDecoderRef = useRef(new TextDecoder());
  const keyDisposeRef = useRef(null);

  // 流量控制
  const flowControlRef = useRef({
    limit: 100000,
    highWater: 10,
    lowWater: 5,
    written: 0,
    pending: 0
  });

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [tokenUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [enterReconnect, setEnterReconnect] = useState(true);

  // ttyd WebSocket 地址
  const TTYD_URL = 'ws://192.168.1.66:5556/ws';

  // 写入数据到终端（带流量控制）
  const writeData = useCallback((data) => {
    const term = xtermRef.current;
    const socket = socketRef.current;
    const flowControl = flowControlRef.current;
    const textEncoder = textEncoderRef.current;

    if (!term) return;

    flowControl.written += data.length;

    if (flowControl.written > flowControl.limit) {
      term.write(data, () => {
        flowControl.pending = Math.max(flowControl.pending - 1, 0);
        if (flowControl.pending < flowControl.lowWater && socket?.readyState === WebSocket.OPEN) {
          socket.send(textEncoder.encode(Command.RESUME));
        }
      });
      flowControl.pending++;
      flowControl.written = 0;

      if (flowControl.pending > flowControl.highWater && socket?.readyState === WebSocket.OPEN) {
        socket.send(textEncoder.encode(Command.PAUSE));
      }
    } else {
      term.write(data);
    }
  }, []);

  // 发送数据到服务器
  const sendData = useCallback((data) => {
    const socket = socketRef.current;
    const textEncoder = textEncoderRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    if (typeof data === 'string') {
      // 字符串数据处理
      const payload = new Uint8Array(data.length * 3 + 1);
      payload[0] = Command.INPUT.charCodeAt(0);
      const stats = textEncoder.encodeInto(data, payload.subarray(1));
      socket.send(payload.subarray(0, (stats.written || 0) + 1));
    } else {
      // Uint8Array 数据处理
      const payload = new Uint8Array(data.length + 1);
      payload[0] = Command.INPUT.charCodeAt(0);
      payload.set(data, 1);
      socket.send(payload);
    }
  }, []);

  // 连接到 ttyd WebSocket
  const connectToTtyd = useCallback((token = null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('[ttyd] Already connected');
      return;
    }

    if (!xtermRef.current) {
      console.error('[ttyd] Terminal not initialized');
      return;
    }

    setConnectionStatus('connecting');
    const term = xtermRef.current;

    try {
      console.log('[ttyd] Connecting to:', TTYD_URL);
      const socket = new WebSocket(TTYD_URL, ['tty']);
      socketRef.current = socket;
      socket.binaryType = 'arraybuffer';

      socket.onopen = () => {
        console.log('[ttyd] WebSocket connection opened');
        setConnectionStatus('connected');
        setIsPasswordRequired(false);

        // 发送认证和终端尺寸信息
        const textEncoder = textEncoderRef.current;
        const { cols, rows } = term;
        const authMsg = JSON.stringify({
          AuthToken: token || authToken || '',
          columns: cols,
          rows: rows
        });
        socket.send(textEncoder.encode(authMsg));
        console.log('[ttyd] Sent auth and size:', authMsg);

        term.writeln('\r\n\x1b[32m[已连接到远程终端]\x1b[0m');
        term.focus();

        // 移除旧的处理器
        if (onDataHandlerRef.current) {
          onDataHandlerRef.current.dispose();
          onDataHandlerRef.current = null;
        }
        if (onResizeHandlerRef.current) {
          onResizeHandlerRef.current.dispose();
          onResizeHandlerRef.current = null;
        }

        // 监听终端输入
        onDataHandlerRef.current = term.onData(sendData);

        // 监听终端 binary 输入
        const onBinaryHandler = term.onBinary((data) => {
          sendData(Uint8Array.from(data, v => v.charCodeAt(0)));
        });

        // 监听终端大小变化
        onResizeHandlerRef.current = term.onResize(({ cols, rows }) => {
          if (socket.readyState === WebSocket.OPEN) {
            const textEncoder = textEncoderRef.current;
            const resizeMsg = JSON.stringify({ columns: cols, rows: rows });
            socket.send(textEncoder.encode(Command.RESIZE_TERMINAL + resizeMsg));
            console.log('[ttyd] Terminal resized:', cols, 'x', rows);
          }
        });
      };

      socket.onmessage = (event) => {
        if (!xtermRef.current) return;

        const textDecoder = textDecoderRef.current;
        const rawData = event.data;

        if (rawData instanceof ArrayBuffer) {
          // 二进制数据处理
          const uint8Data = new Uint8Array(rawData);
          if (uint8Data.length === 0) return;

          const cmd = String.fromCharCode(uint8Data[0]);
          const data = rawData.slice(1);

          switch (cmd) {
            case Command.OUTPUT:
              // 输出数据
              writeData(new Uint8Array(data));
              break;

            case Command.SET_WINDOW_TITLE:
              // 设置窗口标题
              const title = textDecoder.decode(data);
              document.title = title;
              console.log('[ttyd] Window title set:', title);
              break;

            case Command.SET_PREFERENCES:
              // 设置偏好设置
              try {
                const preferences = JSON.parse(textDecoder.decode(data));
                console.log('[ttyd] Preferences received:', preferences);
                // 这里可以根据需要应用偏好设置
              } catch (e) {
                console.error('[ttyd] Failed to parse preferences:', e);
              }
              break;

            default:
              console.warn('[ttyd] Unknown command:', cmd);
              // 默认作为输出处理
              writeData(uint8Data);
              break;
          }
        }
      };

      socket.onerror = (error) => {
        console.error('[ttyd] WebSocket error:', error);
        if (xtermRef.current) {
          xtermRef.current.writeln('\r\n\x1b[31m[连接错误]\x1b[0m');
        }
        setConnectionStatus('error');
      };

      socket.onclose = (event) => {
        console.log(`[ttyd] WebSocket connection closed with code: ${event.code}`);
        setConnectionStatus('disconnected');

        if (xtermRef.current) {
          xtermRef.current.writeln('\r\n\x1b[33m[连接已断开]\x1b[0m');
        }

        // 清理处理器
        if (onDataHandlerRef.current) {
          onDataHandlerRef.current.dispose();
          onDataHandlerRef.current = null;
        }
        if (onResizeHandlerRef.current) {
          onResizeHandlerRef.current.dispose();
          onResizeHandlerRef.current = null;
        }

        // 重置流量控制
        flowControlRef.current.written = 0;
        flowControlRef.current.pending = 0;

        // 检查是否需要密码认证
        if (event.code === 1008 || (event.reason && event.reason.includes('auth'))) {
          setIsPasswordRequired(true);
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[33m[需要密码认证]\x1b[0m');
          }
        } else if (autoReconnect && event.code !== 1000) {
          // 自动重连（排除正常关闭 1000: CLOSE_NORMAL）
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[33m[5秒后尝试重新连接...]\x1b[0m');
          }
          reconnectTimerRef.current = setTimeout(() => {
            connectToTtyd(token);
          }, 5000);
        } else {
          // 提示按回车重连
          if (xtermRef.current) {
            if (!keyDisposeRef.current) {
              keyDisposeRef.current = xtermRef.current.onKey(e => {
                if (e.domEvent.key === 'Enter') {
                  keyDisposeRef.current.dispose();
                  keyDisposeRef.current = null;
                  connectToTtyd(token);
                }
              });
            }
            xtermRef.current.writeln('\x1b[36m[按 Enter 键重新连接]\x1b[0m');

          }
        }
      };

    } catch (error) {
      console.error('[ttyd] Failed to create WebSocket:', error);
      setConnectionStatus('error');
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[31m[连接失败: ' + error.message + ']\x1b[0m');
      }
    }
  }, [TTYD_URL, autoReconnect, authToken, sendData, writeData]);

  // 初始化终端
  useEffect(() => {
    if (!terminalRef.current) {
      console.error('[ttyd] Terminal container not found');
      return;
    }

    console.log('[ttyd] Initializing terminal...');

    // 创建 xterm.js 实例
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#d19a66',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#d19a66',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
      },
      allowTransparency: false,
      scrollback: 1000,
      tabStopWidth: 4,
      bellStyle: 'none',
      convertEol: false,
      scrollOnUserInput: true,
      rightClickSelectsWord: true
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    try {
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      // 打开终端
      term.open(terminalRef.current);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // 等待终端完全渲染后再调整大小
      setTimeout(() => {
        try {
          fitAddon.fit();
          console.log('[ttyd] Terminal fitted successfully, size:', term.cols, 'x', term.rows);
        } catch (e) {
          console.error('[ttyd] Error fitting terminal:', e);
        }
      }, 100);

      console.log('[ttyd] Terminal initialized');

      // 窗口大小改变时自动调整
      const handleResize = () => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            setTimeout(() => {
              fitAddonRef.current.fit();
              // onResize 事件会自动发送 RESIZE_TERMINAL 命令
            }, 100);
          } catch (e) {
            console.error('[ttyd] Error in resize handler:', e);
          }
        }
      };

      // 监听选择变化（自动复制）
      const onSelectionChangeHandler = term.onSelectionChange(() => {
        if (term.getSelection() === '') return;
        try {
          document.copyText(term.getSelection());
        } catch (e) {
          // 忽略错误
        }
      });

      window.addEventListener('resize', handleResize);

      // 延迟连接，确保终端完全初始化
      const connectTimer = setTimeout(() => {
        connectToTtyd();
      }, 200);

      return () => {
        console.log('[ttyd] Cleaning up terminal...');
        clearTimeout(connectTimer);
        window.removeEventListener('resize', handleResize);

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        if (onDataHandlerRef.current) {
          onDataHandlerRef.current.dispose();
          onDataHandlerRef.current = null;
        }

        if (onResizeHandlerRef.current) {
          onResizeHandlerRef.current.dispose();
          onResizeHandlerRef.current = null;
        }

        if (onSelectionChangeHandler) {
          onSelectionChangeHandler.dispose();
        }

        if (socketRef.current) {
          socketRef.current.close(1000);
          socketRef.current = null;
        }

        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
      };
    } catch (error) {
      console.error('[ttyd] Error initializing terminal:', error);
    }
  }, [connectToTtyd]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      setAuthToken(password);
      connectToTtyd(password);
      setPassword('');
    }
  };

  const handleReconnect = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
    // setAutoReconnect(true);
    connectToTtyd();
  };

  const handleDisconnect = () => {
    // setAutoReconnect(false);
    setEnterReconnect(false);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close(1000);
    }

  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4caf50';
      case 'connecting':
        return '#ff9800';
      case 'disconnected':
        return '#9e9e9e';
      case 'error':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '未连接';
      case 'error':
        return '连接错误';
      default:
        return '未知';
    }
  };

  return (
    <div className="xterm-container">
      <div className="xterm-toolbar">
        <div className="xterm-status">
          <span
            className="status-indicator"
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        <div className="xterm-controls">
          {connectionStatus !== 'connected' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleReconnect}
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? '连接中...' : '重新连接'}
            </button>
          )}
          {connectionStatus === 'connected' && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDisconnect}
            >
              断开连接
            </button>
          )}
        </div>
      </div>

      {isPasswordRequired && connectionStatus !== 'connected' && (
        <div className="password-prompt">
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <label htmlFor="password">终端密码:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              连接
            </button>
          </form>
        </div>
      )}

      <div
        ref={terminalRef}
        className="xterm-terminal"
        style={{
          height: '500px',
          padding: '10px'
        }}
      />

      {connectionStatus === 'connected' && (
        <div style={{
          padding: '10px',
          fontSize: '12px',
          color: '#98c379',
          background: '#2d2d2d',
          borderTop: '1px solid #3d3d3d'
        }}>
          💡 提示：终端已就绪。右键选择文本自动复制，按 Ctrl+Shift+V 粘贴。
        </div>
      )}
      {connectionStatus === 'disconnected' && !isPasswordRequired && (
        <div style={{
          padding: '10px',
          fontSize: '12px',
          color: '#ff9800',
          background: '#2d2d2d',
          borderTop: '1px solid #3d3d3d'
        }}>
          ⚠️ 未连接到终端服务器 ({TTYD_URL})
        </div>
      )}
    </div>
  );
};

export default XtermTtydClient;
