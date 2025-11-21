import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API'
import './WiFi.css'

// BaseInfo 基本信息组件
function BaseInfo() {
    // 使用 useState 存储响应数据
    const [baseInfo, setBaseInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(null); // 当前显示的时间

    // 使用 useEffect 处理异步请求
    useEffect(() => {
        const fetchDeviceInfo = async () => {
            try {
                setLoading(true);
                setError(null);

                // 并行获取所有数据
                const [deviceResponse, timeResponse, resourceResponse] = await Promise.all([
                    DeviceInfoAPI.getDeviceInfo(),
                    DeviceInfoAPI.getSystemTime(),
                    DeviceInfoAPI.getSystemResourceInfo()
                ]);

                console.log('设备数据:', deviceResponse.data);
                console.log('时间数据:', timeResponse.data);
                console.log('资源数据:', resourceResponse.data);

                // 合并所有数据
                setBaseInfo({
                    ...deviceResponse.data,
                    ...timeResponse.data,
                    ...resourceResponse.data
                });

                // 初始化当前时间（使用服务器返回的时间戳）
                if (timeResponse.data.iTimestamp) {
                    setCurrentTime(new Date(timeResponse.data.iTimestamp * 1000));
                }

            } catch (err) {
                console.error('请求失败:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDeviceInfo();
    }, []);

    // 自动更新时间 - 每秒更新一次
    useEffect(() => {
        if (!currentTime) return;

        const timer = setInterval(() => {
            setCurrentTime(prevTime => {
                const newTime = new Date(prevTime);
                newTime.setSeconds(newTime.getSeconds() + 1);
                return newTime;
            });
        }, 1000);

        // 清理定时器
        return () => clearInterval(timer);
    }, [currentTime]);

    // 格式化时间戳
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    };

    // 加载状态
    if (loading) {
        return (
            <div className="page-container">
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
                        <div className="loading-spinner">⏳</div>
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                            正在加载设备信息...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className="page-container">
                <div className="card">
                    <div className="card-body">
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '4px',
                            color: '#c00',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            ⚠️ 请求失败: {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* 设备基本信息卡片 */}
            <div className="card">
                <div className="card-header">
                    <h3>设备基本信息</h3>
                </div>
                <div className="card-body">
                    <div className="info-grid">
                        <div className="info-item">
                            <label>设备名称:</label>
                            <span>{baseInfo?.sDeviceName || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>主板型号:</label>
                            <span>{baseInfo?.sBasePlateModel || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>传感器型号:</label>
                            <span>{baseInfo?.sSensorModel || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>固件版本:</label>
                            <span>{baseInfo?.sFirmwareVersion || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>序列号:</label>
                            <span>{baseInfo?.sSerialNumber || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>MAC地址:</label>
                            <span>{baseInfo?.sMacAddress || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 系统时间信息卡片 */}
            <div className="card">
                <div className="card-header">
                    <h3>系统时间信息</h3>
                </div>
                <div className="card-body">
                    <div className="info-grid">
                        <div className="info-item">
                            <label>当前时间:</label>
                            <span>{formatTimestamp(currentTime)}</span>
                        </div>
                        <div className="info-item">
                            <label>时区:</label>
                            <span>{baseInfo?.sTimezone || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>时区代码:</label>
                            <span>{baseInfo?.sTz || '-'}</span>
                        </div>
                        <div className="info-item">
                            <label>同步方式:</label>
                            <span>{baseInfo?.sMethod || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 系统资源状态卡片 */}
            <div className="card">
                <div className="card-header">
                    <h3>系统资源状态</h3>
                </div>
                <div className="card-body">
                    {baseInfo?.iCpuUsage !== undefined && (
                        <div className="resource-item">
                            <label>CPU 使用率</label>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${baseInfo.iCpuUsage}%`,
                                        background: baseInfo.iCpuUsage >= 80 ? '#ee0a1dff' : '#0fe464ff'
                                    }}
                                >
                                    {baseInfo.iCpuUsage}%
                                </div>
                            </div>
                        </div>
                    )}
                    {baseInfo?.iNpuUsage !== undefined && (
                        <div className="resource-item">
                            <label>NPU 使用率</label>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${baseInfo.iNpuUsage}%`,
                                        background: baseInfo.iNpuUsage >= 80 ? '#ee0a1dff' : '#0fe464ff'
                                    }}
                                >
                                    {baseInfo.iNpuUsage}%
                                </div>
                            </div>
                        </div>
                    )}
                    {baseInfo?.iMemUsage !== undefined && (
                        <div className="resource-item">
                            <label>内存使用率</label>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${baseInfo.iMemUsage}%`,
                                        background: baseInfo.iMemUsage >= 80 ? '#ee0a1dff' : '#0fe464ff'
                                    }}
                                >
                                    {baseInfo.iMemUsage}%
                                </div>
                            </div>
                        </div>
                    )}
                    {baseInfo?.iStorageUsage !== undefined && (
                        <div className="resource-item">
                            <label>存储使用率</label>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${baseInfo.iStorageUsage}%`,
                                        background: baseInfo.iStorageUsage >= 80 ? '#ee0a1dff' : '#0fe464ff'
                                    }}
                                >
                                    {baseInfo.iStorageUsage}%
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BaseInfo;