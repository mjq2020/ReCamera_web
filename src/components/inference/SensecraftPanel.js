import React, { useState, useEffect, useRef } from "react";
import { SensecraftAPI } from "../../contexts/API";
import { Cloud, Upload, RefreshCw, Download, CheckCircle, XCircle, Clock, LogIn, User } from 'lucide-react';
import toast from '../base/Toast';
import './Inference.css';

const SENSECRAFT_AUTH_URL = "https://sensecraft.seeed.cc/ai/authorize";

export default function SensecraftPanel({ onModelConverted }) {
    // 认证状态
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);

    // 模型转换状态
    const [converting, setConverting] = useState(false);
    const [selectedOnnxFile, setSelectedOnnxFile] = useState(null);
    const [selectedDatasetFile, setSelectedDatasetFile] = useState(null);
    
    // 任务状态
    const [currentTaskId, setCurrentTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState(null);
    const [taskProgress, setTaskProgress] = useState(0);
    
    // 模型列表
    const [modelList, setModelList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    // 轮询定时器
    const pollTimerRef = useRef(null);

    // 组件加载时检查是否有保存的认证信息
    useEffect(() => {
        const savedToken = localStorage.getItem('sensecraft_token');
        const savedUserId = localStorage.getItem('sensecraft_user_id');
        
        if (savedToken && savedUserId) {
            setToken(savedToken);
            setUserId(savedUserId);
            setIsAuthenticated(true);
        }

        // 监听来自授权窗口的消息
        const handleMessage = async (event) => {
            // 安全检查：确保消息来自我们自己的域名（回调页面）
            const currentOrigin = window.location.origin;
            
            // 允许来自当前域名或 sensecraft.seeed.cc 的消息
            if (event.origin !== currentOrigin && !event.origin.includes('sensecraft.seeed.cc')) {
                console.log('忽略来自未知源的消息:', event.origin);
                return;
            }

            if (event.data && event.data.type === 'sensecraft_auth') {
                const authToken = event.data.token;
                if (authToken) {
                    console.log('收到授权 Token，开始处理...');
                    await handleAuthToken(authToken);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        // 检查 URL 中是否有 token（从重定向返回）
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const urlToken = urlParams.get('token');
        if (urlToken && !isAuthenticated) {
            handleAuthToken(urlToken);
            // 清理 URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
            }
        };
    }, []);

    // 处理授权 token
    const handleAuthToken = async (authToken) => {
        try {
            const response = await SensecraftAPI.parseToken(authToken);
            
            if (response.data.code === 0) {
                const { user_id, token: validToken } = response.data.data;
                
                setToken(validToken);
                setUserId(user_id);
                setIsAuthenticated(true);
                
                // 保存到本地存储
                localStorage.setItem('sensecraft_token', validToken);
                localStorage.setItem('sensecraft_user_id', user_id);
                
                toast.success('Sensecraft 授权成功');
                
                // 加载模型列表
                loadModelList(user_id);
            } else {
                toast.error('Token 解析失败');
            }
        } catch (error) {
            console.error('解析 token 失败:', error);
            toast.error('授权失败，请重试');
        }
    };

    // 打开授权页面
    const handleLogin = () => {
        // 构建回调 URL（指向我们的回调页面）
        const protocol = window.location.protocol;
        const host = window.location.host;
        const callbackUrl = `${protocol}//${host}/sensecraft-callback.html`;
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        
        const authUrl = `${SENSECRAFT_AUTH_URL}?client_id=seeed_recamera&response_type=token&scop=profile&redirec_url=${encodedCallbackUrl}`;
        
        // 打开新窗口进行授权
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const authWindow = window.open(
            authUrl,
            'Sensecraft Authorization',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // 监听弹窗关闭事件
        const checkClosed = setInterval(() => {
            if (authWindow && authWindow.closed) {
                clearInterval(checkClosed);
                console.log('授权窗口已关闭');
            }
        }, 1000);
    };

    // 退出登录
    const handleLogout = () => {
        setIsAuthenticated(false);
        setToken(null);
        setUserId(null);
        setModelList([]);
        
        localStorage.removeItem('sensecraft_token');
        localStorage.removeItem('sensecraft_user_id');
        
        toast.success('已退出 Sensecraft');
    };

    // 加载模型列表
    const loadModelList = async (uid = userId) => {
        if (!uid) return;
        
        try {
            setLoadingList(true);
            const response = await SensecraftAPI.getModelList(uid, 1, 20);
            
            if (response.data.code === 0) {
                setModelList(response.data.data.records || []);
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            toast.error('获取模型列表失败');
        } finally {
            setLoadingList(false);
        }
    };

    // 创建转换任务
    const handleCreateTask = async () => {
        if (!selectedOnnxFile) {
            toast.error('请选择 ONNX 模型文件');
            return;
        }

        try {
            setConverting(true);
            
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('framework_type', 9);
            formData.append('device_type', 40);
            formData.append('file', selectedOnnxFile);
            
            if (selectedDatasetFile) {
                formData.append('dataset_file', selectedDatasetFile);
            }

            const response = await SensecraftAPI.createTask(formData);
            
            if (response.data.code === 0) {
                const modelId = response.data.data.model_id;
                setCurrentTaskId(modelId);
                setTaskStatus('init');
                
                toast.success('任务创建成功，开始转换...');
                
                // 开始轮询状态
                startPollingStatus(modelId);
            } else {
                toast.error('创建任务失败: ' + response.data.msg);
            }
        } catch (error) {
            console.error('创建任务失败:', error);
            toast.error('创建任务失败');
        } finally {
            setConverting(false);
        }
    };

    // 开始轮询任务状态
    const startPollingStatus = (modelId) => {
        // 清除之前的定时器
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
        }

        // 每2秒轮询一次
        pollTimerRef.current = setInterval(async () => {
            try {
                const response = await SensecraftAPI.getTaskStatus(userId, modelId);
                
                if (response.data.code === 0) {
                    const status = response.data.data.status;
                    setTaskStatus(status);

                    // 更新进度
                    if (status === 'init') {
                        setTaskProgress(0);
                    } else if (status === 'done') {
                        setTaskProgress(100);
                        clearInterval(pollTimerRef.current);
                        toast.success('模型转换完成！');
                        
                        // 刷新模型列表
                        loadModelList();
                        
                        // 通知父组件模型已转换
                        if (onModelConverted) {
                            onModelConverted();
                        }
                    } else if (status === 'error') {
                        clearInterval(pollTimerRef.current);
                        toast.error('模型转换失败: ' + response.data.data.error_message);
                    } else if (!isNaN(status)) {
                        // 数值表示进度
                        setTaskProgress(parseInt(status));
                    }
                }
            } catch (error) {
                console.error('查询任务状态失败:', error);
            }
        }, 2000);
    };

    // 下载模型
    const handleDownloadModel = (modelId) => {
        const downloadUrl = SensecraftAPI.downloadModel(userId, modelId);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${modelId}.rknn`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('开始下载模型');
    };

    // 获取状态图标和文本
    const getStatusDisplay = (status) => {
        if (status === 'done') {
            return { icon: <CheckCircle size={16} color="#16a34a" />, text: '完成', color: '#16a34a' };
        } else if (status === 'error') {
            return { icon: <XCircle size={16} color="#dc2626" />, text: '失败', color: '#dc2626' };
        } else if (status === 'init') {
            return { icon: <Clock size={16} color="#f59e0b" />, text: '初始化', color: '#f59e0b' };
        } else if (!isNaN(status)) {
            return { icon: <RefreshCw size={16} color="#3b82f6" />, text: `${status}%`, color: '#3b82f6' };
        }
        return { icon: <Clock size={16} color="#64748b" />, text: '未知', color: '#64748b' };
    };

    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + ' MB';
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(parseInt(timestamp));
        return date.toLocaleString('zh-CN');
    };

    return (
        <div className="content-card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Cloud size={20} color="#3b82f6" />
                    <div>
                        <h3>Sensecraft 模型转换</h3>
                        <p style={{ 
                            margin: '4px 0 0 0', 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)',
                            fontWeight: 'normal'
                        }}>
                            将 ONNX 模型转换为 RKNN 格式
                        </p>
                    </div>
                </div>
                
                {/* 登录状态 */}
                {isAuthenticated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1',
                            fontSize: '13px'
                        }}>
                            <User size={14} />
                            <span>{userId}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary"
                            style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                            退出
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <LogIn size={16} />
                        登录授权
                    </button>
                )}
            </div>

            <div className="card-body">
                {!isAuthenticated ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <Cloud size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <p>请先登录 Sensecraft 平台进行授权</p>
                        <p style={{ fontSize: '13px', marginTop: '8px' }}>
                            授权后可以使用模型转换服务
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* 模型转换区域 */}
                        <div>
                            <h4 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>
                                创建转换任务
                            </h4>
                            
                            <div className="form-grid">
                                {/* ONNX 模型文件 */}
                                <div className="form-group">
                                    <label>ONNX 模型文件 *</label>
                                    <input
                                        type="file"
                                        accept=".onnx"
                                        onChange={(e) => setSelectedOnnxFile(e.target.files[0])}
                                        className="form-control"
                                    />
                                    {selectedOnnxFile && (
                                        <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                                            已选择: {selectedOnnxFile.name}
                                        </p>
                                    )}
                                </div>

                                {/* 数据集文件（可选）*/}
                                <div className="form-group">
                                    <label>量化数据集 (可选)</label>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={(e) => setSelectedDatasetFile(e.target.files[0])}
                                        className="form-control"
                                    />
                                    {selectedDatasetFile ? (
                                        <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                                            已选择: {selectedDatasetFile.name}
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            未提供时使用默认 COCO 数据集
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="button-group" style={{ marginTop: '16px' }}>
                                <button
                                    onClick={handleCreateTask}
                                    className="btn btn-primary"
                                    disabled={converting || !selectedOnnxFile || taskStatus === 'init' || (!isNaN(taskStatus) && taskStatus !== 'done')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {converting ? (
                                        <>
                                            <RefreshCw size={16} className="spin" />
                                            上传中...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            开始转换
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 当前任务进度 */}
                            {currentTaskId && taskStatus && taskStatus !== 'done' && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                            转换进度
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getStatusDisplay(taskStatus).icon}
                                            <span style={{ fontSize: '14px', color: getStatusDisplay(taskStatus).color }}>
                                                {getStatusDisplay(taskStatus).text}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* 进度条 */}
                                    {taskStatus !== 'error' && (
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: '#e2e8f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${taskProgress}%`,
                                                height: '100%',
                                                backgroundColor: '#3b82f6',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    )}
                                    
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                        任务 ID: {currentTaskId}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 模型列表 */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '600' }}>
                                    我的模型
                                </h4>
                                <button
                                    onClick={() => loadModelList()}
                                    className="btn btn-secondary"
                                    disabled={loadingList}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        padding: '6px 12px'
                                    }}
                                >
                                    <RefreshCw size={14} className={loadingList ? 'spin' : ''} />
                                    刷新
                                </button>
                            </div>

                            {loadingList ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                    加载中...
                                </div>
                            ) : modelList.length === 0 ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    暂无模型记录
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {modelList.map((model, index) => {
                                        const statusDisplay = getStatusDisplay(model.status);
                                        
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'monospace' }}>
                                                            {model.model_id}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {statusDisplay.icon}
                                                            <span style={{ fontSize: '13px', color: statusDisplay.color }}>
                                                                {statusDisplay.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        <span>大小: {formatFileSize(model.model_size)}</span>
                                                        <span>进度: {model.progress}%</span>
                                                        <span>创建时间: {formatTime(model.created_at)}</span>
                                                    </div>
                                                    
                                                    {model.error_message && (
                                                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                                                            错误: {model.error_message}
                                                        </p>
                                                    )}
                                                </div>

                                                {model.status === 'done' && (
                                                    <button
                                                        onClick={() => handleDownloadModel(model.model_id)}
                                                        className="btn btn-primary"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '13px',
                                                            padding: '6px 12px',
                                                            marginLeft: '16px'
                                                        }}
                                                    >
                                                        <Download size={14} />
                                                        下载
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
