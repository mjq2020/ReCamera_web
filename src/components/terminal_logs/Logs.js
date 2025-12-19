import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Terminal, Download, Filter, X } from 'lucide-react';
import { urls } from '../../contexts/urls';
import './Logs.css';

// 优化日志条目组件，避免不必要的重新渲染
const LogEntry = memo(({ log, formatTimestamp }) => {
    return (
        <div className="log-entry">
            <div className="log-timestamp-wrapper">
                <div className="log-indicator"></div>
                <span className="log-timestamp">
                    {formatTimestamp(log.timestamp)}
                </span>
            </div>
            <span className="log-data">{log.data}</span>
        </div>
    );
});

LogEntry.displayName = 'LogEntry';

export default function SystemLogViewer() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected, connecting, connected, error
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);

    const wsRef = useRef(null);
    const logContainerRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    const WS_URL = urls.wsSystemLogs;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;
    const MAX_LOG_ENTRIES = 999999; // 最大保存日志条数，超过自动删除旧日志

    // 滚动到底部 - 使用 requestAnimationFrame 优化性能
    const scrollToBottom = useCallback(() => {
        if (autoScroll && logContainerRef.current) {
            requestAnimationFrame(() => {
                if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
            });
        }
    }, [autoScroll]);

    // 连接 WebSocket
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setWsStatus('connecting');

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket连接成功');
                setWsStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // 检查是否为数组（初始历史日志）
                    if (Array.isArray(data)) {
                        // 初次连接，接收历史日志列表
                        const historicalLogs = data.map((log, index) => ({
                            id: Date.now() + index,
                            data: log.sData || '',
                            timestamp: new Date(Number(log.sTimestamp) * 1000).toISOString() || '',
                            level: log.sLevel || 'INFO',
                        }));
                        console.log(historicalLogs)

                        setLogs(historicalLogs);
                    } else {
                        // 增量更新，接收单条日志
                        const newLog = {
                            id: Date.now() + Math.random(),
                            data: data.sData || '',
                            timestamp: new Date(Number(data.sTimestamp) * 1000).toISOString() || '',
                            level: data.sLevel || 'INFO',
                        };

                        setLogs(prevLogs => {
                            // 限制日志数量，超过最大值时删除最旧的日志
                            const updatedLogs = [...prevLogs, newLog];
                            if (updatedLogs.length > MAX_LOG_ENTRIES) {
                                return updatedLogs.slice(updatedLogs.length - MAX_LOG_ENTRIES);
                            }
                            return updatedLogs;
                        });
                    }
                } catch (error) {
                    console.error('解析日志数据失败:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
                setWsStatus('error');
            };

            // ws.onclose = () => {
            //     console.log('WebSocket连接关闭');
            //     setWsStatus('disconnected');
            //     wsRef.current = null;

            //     // 自动重连
            //     if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            //         reconnectAttemptsRef.current += 1;
            //         console.log(66)
            //         reconnectTimeoutRef.current = setTimeout(() => {
            //             console.log(`尝试重连... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            //             connectWebSocket();
            //         }, RECONNECT_DELAY);
            //     }
            // };
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            setWsStatus('error');
        }
    }, []);

    // 断开 WebSocket
    const disconnectWebSocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // 防止自动重连
        setWsStatus('disconnected');
    }, []);

    // 时间过滤 - 使用 useMemo 优化
    useEffect(() => {
        if (!startTime && !endTime) {
            setFilteredLogs(logs);
            return;
        }

        const startTimestamp = startTime ? new Date(startTime).getTime() : 0;
        const endTimestamp = endTime ? new Date(endTime).getTime() : Infinity;

        const filtered = logs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime >= startTimestamp && logTime <= endTimestamp;
        });

        setFilteredLogs(filtered);
    }, [logs, startTime, endTime]);

    // 自动滚动
    useEffect(() => {
        scrollToBottom();
    }, [filteredLogs, scrollToBottom]);

    // 组件挂载时连接 WebSocket
    useEffect(() => {
        connectWebSocket();

        return () => {
            disconnectWebSocket();
        };
    }, [connectWebSocket, disconnectWebSocket]);

    // 清空日志
    const handleClearLogs = () => {
        if (logs.length > 0) {
            const confirmed = window.confirm(`确定要清空所有 ${logs.length} 条日志吗？`);
            if (confirmed) {
                setLogs([]);
                setFilteredLogs([]);
            }
        }
    };

    // 下载日志
    const handleDownloadLogs = () => {
        const logText = filteredLogs
            .map(log => `[${log.timestamp}] ${log.data}`)
            .join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 清除时间过滤
    const handleClearFilter = () => {
        setStartTime('');
        setEndTime('');
    };

    // 格式化时间戳 - 使用 useCallback 优化
    const formatTimestamp = useCallback((timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch {
            return timestamp;
        }
    }, []);

    // 状态指示器
    const getStatusBadge = () => {
        const statusConfig = {
            connected: { text: '已连接', className: 'connected' },
            connecting: { text: '连接中...', className: 'connecting' },
            disconnected: { text: '未连接', className: 'disconnected' },
            error: { text: '连接错误', className: 'error' }
        };

        const config = statusConfig[wsStatus];
        return (
            <div className="log-status-badge">
                <div className={`status-indicator ${config.className}`} />
                <span className="status-text">{config.text}</span>
            </div>
        );
    };

    return (
        <div className="log-viewer-container">
            <div className="log-viewer-card">
                {/* 头部控制栏 */}
                <div className="log-viewer-header">
                    <div className="log-header-content">
                        {/* 左侧信息区 */}
                        <div className="log-header-left">
                            <div className="log-title-section">
                                <div className="log-icon-wrapper">
                                    <Terminal />
                                </div>
                                <h3 className="log-title">系统日志监控</h3>
                            </div>

                            {getStatusBadge()}

                            <div className="log-count-badge">
                                <span className="label">总计</span>
                                <span className="value">{filteredLogs.length}</span>
                                <span className="unit">条日志</span>
                                {logs.length >= MAX_LOG_ENTRIES * 0.9 && (
                                    <span style={{
                                        marginLeft: '8px',
                                        fontSize: '11px',
                                        color: '#f59e0b',
                                        fontWeight: '600'
                                    }}>
                                        (接近上限)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 右侧控制按钮区 */}
                        <div className="log-header-controls">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`log-btn log-btn-filter ${showFilter ? 'active' : ''}`}
                                title="时间过滤"
                            >
                                <Filter />
                                过滤
                            </button>

                            <button
                                onClick={handleDownloadLogs}
                                disabled={filteredLogs.length === 0}
                                className="log-btn log-btn-secondary"
                                title="下载日志"
                            >
                                <Download />
                                下载
                            </button>

                            <button
                                onClick={handleClearLogs}
                                className="log-btn log-btn-danger"
                                title="清空日志"
                            >
                                清空
                            </button>

                            <button
                                onClick={wsStatus === 'connected' ? disconnectWebSocket : connectWebSocket}
                                className={`log-btn ${wsStatus === 'connected' ? 'log-btn-disconnect' : 'log-btn-connect'}`}
                            >
                                {wsStatus === 'connected' ? '断开连接' : '连接'}
                            </button>

                            <label className="auto-scroll-toggle">
                                <input
                                    type="checkbox"
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                />
                                <span>自动滚动</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 时间过滤面板 */}
                {showFilter && (
                    <div className="log-filter-panel">
                        <div className="filter-controls">
                            <div className="filter-group">
                                <label>开始时间</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <label>结束时间</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>

                            {(startTime || endTime) && (
                                <>
                                    <button
                                        onClick={handleClearFilter}
                                        className="log-btn log-btn-secondary"
                                    >
                                        <X />
                                        清除过滤
                                    </button>

                                    <div className="filter-result">
                                        已过滤 {filteredLogs.length}/{logs.length} 条
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* 日志内容区域 */}
                <div className="log-content-wrapper">
                    <div
                        ref={logContainerRef}
                        className="log-content"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="log-empty-state">
                                <div className="empty-state-content">
                                    <div className="empty-state-icon">
                                        <Terminal />
                                    </div>
                                    <p className="empty-state-text">
                                        {wsStatus === 'connected' ? '等待日志数据...' : '未连接到日志服务器'}
                                    </p>
                                    {wsStatus !== 'connected' && (
                                        <p className="empty-state-hint">
                                            点击"连接"按钮开始接收日志
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="log-entries">
                                {filteredLogs.map((log) => (
                                    <LogEntry
                                        key={log.id}
                                        log={log}
                                        formatTimestamp={formatTimestamp}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}