import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InferenceAPI } from '../../contexts/API';
import { Send, Save, Wifi, Zap, Trash2 } from 'lucide-react';
import { jsx } from 'react/jsx-runtime';
import toast from '../base/Toast';

export default function InferenceOutput() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentTask, setCurrentTask] = useState("sDetection");
    const [wsStatus, setWsStatus] = useState("disconnected")
    const [messages, setMessages] = useState([])
    const wsRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const MAX_LOG_ENTRIES = 1000;
    const WS_URL = "ws://192.168.66.48/ws/inference/results";
    const [config, setConfig] = useState({
        iMode: 0,
        dTemplate: {
            sDetection: '',
            sClassification: '',
            sSegmentation: '',
            sTracking: '',
            sKeypoint: '',
            sOBB: ''
        },
        dMqtt: {
            sURL: '',
            iPort: '',
            sTopic: '',
            sUsername: '',
            sPassword: '',
            sClientId: ''
        },
        dUart: {
            sPort: '/dev/ttyS0',
            iBaudRate: 115200
        },
        dHttp: {
            sUrl: '',
            sToken: ''
        }
    });

    const taskType = {
        sDetection: {
            id: 0, task: "Detection", label: "sDetection", placeholder: "例如: {timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度，x1：box的左上角x坐标，y1：box的左上角y坐标，x2：box右下角x坐标，y2：box右下角y坐标"
        },
        sSegmentation: {
            id: 1, task: "Segmentation", label: "sSegmentation", placeholder: "例如: {timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度，box的左上角x坐标，y1：box的左上角y坐标，x2：box右下角x坐标，y2：box右下角y坐标"
        },
        sClassification: {
            id: 2, task: "Classification", label: "sClassification", placeholder: "例如: {timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度"
        },
        sKeypoint: {
            id: 3, task: "Keypoint", label: "sKeypoint", placeholder: "例如: {timestamp}: 检测到 {key} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度，x:x坐标，y：y坐标"
        },
        sTracking: {
            id: 4, task: "Tracking", label: "sTracking", placeholder: "例如: {timestamp}: 检测到 {class} ID {id} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度，id:目标id号,x1:box的左上角x坐标，y1：box的左上角y坐标，x2：box右下角x坐标，y2：box右下角y坐标"
        },
        sOBB: {
            id: 5, task: "OBB", label: "sOBB", placeholder: "例如: {timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
            tips: "timestamp:时间戳，class：类别，confidence：置信度，x1：box的左上角x坐标，y1：box的左上角y坐标，x2：box右下角x坐标，y2：box右下角y坐标，corn：旋转框角度"
        }
    }

    // 输出方式选项
    const outputModes = [
        { value: 0, label: '关闭' },
        { value: 1, label: 'MQTT' },
        { value: 2, label: 'HTTP' },
        { value: 3, label: 'UART' }
    ];

    // 加载配置
    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await InferenceAPI.getNotifyConfig();
            setConfig(response.data);

        } catch (error) {
            console.error('获取推理输出配置失败:', error);
            toast.error('获取推理输出配置失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);


    // 更新配置

    const handleTaskChange = (value) => {
        console.log(value)
        setCurrentTask(value)
    }


    const handleChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 更新嵌套配置
    const handleNestedChange = (parent, field, value) => {
        setConfig(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    // 保存配置
    const handleSave = async () => {
        try {
            setSaving(true);
            await InferenceAPI.setNotifyConfig(config);
            toast.success('推理输出配置保存成功');
        } catch (error) {
            console.error('保存推理输出配置失败:', error);
            toast.error('保存推理输出配置失败');
        } finally {
            setSaving(false);
        }
    };

    // 清空消息
    const handleClearMessages = async () => {
        if (messages.length > 0) {
            const confirmed = await toast.confirm('确定要清空所有消息吗？');
            if (confirmed) {
                setMessages([]);
            }
        }
    };

    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }
        setWsStatus("connecting");
        try {
            // 安全地从cookie中获取token
            const getCookieToken = () => {
                const cookies = document.cookie.split('; ');
                const tokenCookie = cookies.find(row => row.startsWith('token='));
                return tokenCookie ? tokenCookie.split('=')[1] : null;
            };

            const cookieToken = getCookieToken();
            console.log("Cookie中的token:", cookieToken);

            // 优先使用cookie中的token，如果没有则使用localStorage
            const token = cookieToken || window.localStorage.getItem('token');
            console.log("使用的token:", token);

            if (!token) {
                console.error("未找到token，无法建立WebSocket连接");
                setWsStatus("disconnected");
                return;
            }

            const ws = new WebSocket(WS_URL + "?token=" + token);
            wsRef.current = ws;
            ws.onopen = () => {
                console.log("WebSocket连接成功！");
                setWsStatus("connected");
            }
            ws.onmessage = (event) => {
                try {
                    setMessages(prev => {
                        const newMessage = {
                            id: Date.now() + Math.random(), // 确保唯一ID
                            text: event.data,
                            timestamp: new Date().toLocaleTimeString()
                        };
                        const updatedMessages = [...prev, newMessage];
                        // 限制消息数量，保留最新的消息
                        return updatedMessages.length > MAX_LOG_ENTRIES
                            ? updatedMessages.slice(-MAX_LOG_ENTRIES)
                            : updatedMessages;
                    });
                } catch (err) {
                    console.error('处理WebSocket消息失败:', err);
                }
            }
            ws.onerror = (error) => {
                setWsStatus('disconnected');
                console.error('WebSocket错误:', error);
            };
            ws.onclose = () => {
                setWsStatus('disconnected');
                console.log('WebSocket连接关闭');
            };

        } catch (err) {
            console.error('解析日志数据失败:', err);
        }


    })

    // 自动滚动到最新消息（只在消息容器内滚动）
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        connectWebSocket();
        return () => {
            // 清理WebSocket连接
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [])



    if (loading) {
        return (
            <div className="content-card">
                <div className="card-header">
                    <h3>推理输出配置</h3>
                </div>
                <div className="card-body">
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        加载中...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="content-card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Send size={20} color="#3b82f6" />
                            <div>
                                <h3>推理输出实时监控</h3>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 'normal'
                                }}>
                                    实时显示推理结果输出（最多保留 {MAX_LOG_ENTRIES} 条）
                                </p>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: wsStatus === 'connected' ? '#10b981' :
                                        wsStatus === 'connecting' ? '#f59e0b' : '#ef4444',
                                    boxShadow: wsStatus === 'connected' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                                }}></div>
                                <span style={{
                                    fontSize: '13px',
                                    color: wsStatus === 'connected' ? '#10b981' :
                                        wsStatus === 'connecting' ? '#f59e0b' : '#ef4444',
                                    fontWeight: '500'
                                }}>
                                    {wsStatus === 'connected' ? '已连接' :
                                        wsStatus === 'connecting' ? '连接中...' : '未连接'}
                                </span>
                            </div>
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearMessages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 12px',
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        backgroundColor: '#fee2e2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fecaca';
                                        e.currentTarget.style.borderColor = '#fca5a5';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fee2e2';
                                        e.currentTarget.style.borderColor = '#fecaca';
                                    }}
                                >
                                    <Trash2 size={14} />
                                    清空 ({messages.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div
                    ref={messagesContainerRef}
                    className="card-body"
                    style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        backgroundColor: '#f8fafc',
                        padding: '16px'
                    }}
                >
                    {messages.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: 'var(--text-secondary)'
                        }}>
                            暂无推理输出数据...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid #3b82f6',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            fontFamily: 'monospace'
                                        }}>
                                            {msg.timestamp}
                                        </span>
                                        <span style={{
                                            fontSize: '14px',
                                            color: '#1e293b',
                                            wordBreak: 'break-word'
                                        }}>
                                            {msg.text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Send size={20} color="#3b82f6" />
                        <div>
                            <h3>推理输出配置</h3>
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                fontWeight: 'normal'
                            }}>
                                配置推理结果的输出方式和模板格式
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    {/* 任务模板选择 */}
                    <div className="form-group">
                        <label>输出模板</label>
                        <select
                            className="form-control"
                            value={currentTask}
                            onChange={(e) => handleTaskChange(e.target.value)}
                        >
                            {Object.entries(taskType).map(([key, value]) => (
                                <option key={value.id} value={key}>
                                    {value.task}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* 输出模板 */}
                    <div style={{
                        marginTop: '32px',
                        padding: '24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '4px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '2px'
                            }}></div>
                            输出模板配置
                        </h4>
                        <p style={{
                            // margin: '4px 0 0 0',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            fontWeight: 'normal'
                        }}>
                            {taskType[currentTask].tips}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={config.dTemplate[currentTask]}
                                    onChange={(e) => handleNestedChange('dTemplate', currentTask, e.target.value)}
                                    placeholder={taskType[currentTask].placeholder}
                                />
                            </div>

                        </div>
                    </div>

                    {/* 输出方式选择 */}
                    <div className="form-group">
                        <label>输出方式</label>
                        <select
                            className="form-control"
                            value={config.iMode}
                            onChange={(e) => handleChange('iMode', parseInt(e.target.value))}
                        >
                            {outputModes.map(mode => (
                                <option key={mode.value} value={mode.value}>
                                    {mode.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* MQTT配置 */}
                    {config.iMode === 1 && (
                        <div style={{
                            marginTop: '32px',
                            padding: '24px',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '12px',
                            border: '1px solid #bbf7d0'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '20px',
                                color: '#166534',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Wifi size={18} />
                                MQTT配置
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Broker地址</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dMqtt.sURL}
                                        onChange={(e) => handleNestedChange('dMqtt', 'sURL', e.target.value)}
                                        placeholder="mqtt.example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>端口</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={config.dMqtt.iPort}
                                        onChange={(e) => handleNestedChange('dMqtt', 'iPort', parseInt(e.target.value) || 1883)}
                                        placeholder="1883"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Topic</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dMqtt.sTopic}
                                        onChange={(e) => handleNestedChange('dMqtt', 'sTopic', e.target.value)}
                                        placeholder="results/data"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>用户名</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dMqtt.sUsername}
                                        onChange={(e) => handleNestedChange('dMqtt', 'sUsername', e.target.value)}
                                        placeholder="username"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>密码</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={config.dMqtt.sPassword}
                                        onChange={(e) => handleNestedChange('dMqtt', 'sPassword', e.target.value)}
                                        placeholder="password"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HTTP配置 */}
                    {config.iMode === 2 && (
                        <div style={{
                            marginTop: '32px',
                            padding: '24px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '12px',
                            border: '1px solid #fde047'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '20px',
                                color: '#854d0e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Zap size={18} />
                                HTTP配置
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>API接口</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dHttp.sUrl}
                                        onChange={(e) => handleNestedChange('dHttp', 'sUrl', e.target.value)}
                                        placeholder="http://192.168.1.111/results/data"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Token鉴权</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dHttp.sToken}
                                        onChange={(e) => handleNestedChange('dHttp', 'sToken', e.target.value)}
                                        placeholder="admin xxx"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UART配置 */}
                    {config.iMode === 3 && (
                        <div style={{
                            marginTop: '32px',
                            padding: '24px',
                            backgroundColor: '#ede9fe',
                            borderRadius: '12px',
                            border: '1px solid #c4b5fd'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '20px',
                                color: '#5b21b6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>⚡</div>
                                串口配置
                            </h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>串口号</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={config.dUart.sPort}
                                        onChange={(e) => handleNestedChange('dUart', 'sPort', e.target.value)}
                                        placeholder="/dev/ttyS0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>波特率</label>
                                    <select
                                        className="form-control"
                                        value={config.dUart.iBaudRate}
                                        onChange={(e) => handleNestedChange('dUart', 'iBaudRate', parseInt(e.target.value))}
                                    >
                                        <option value={9600}>9600</option>
                                        <option value={19200}>19200</option>
                                        <option value={38400}>38400</option>
                                        <option value={57600}>57600</option>
                                        <option value={115200}>115200</option>
                                        <option value={230400}>230400</option>
                                        <option value={460800}>460800</option>
                                        <option value={921600}>921600</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 保存按钮 */}
                    <div className="button-group" style={{ marginTop: '24px' }}>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary"
                            disabled={saving}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Save size={16} />
                            {saving ? '保存中...' : '保存配置'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

