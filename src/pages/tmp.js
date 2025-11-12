import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../contexts/API'
import './wifi.css'
import { Wifi, Eye, EyeOff } from 'lucide-react';
import CryptoJS from 'crypto-js';

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





// 时间设置组件
function TimeSetting() {
    const [originTime, setOriginTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('ntps');

    const handleAddressChange = (e) => {
        console.log(e.target.value)
        setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: e.target.value, sPort: currentTime?.dNtpConfig?.sPort } })
        console.log(currentTime)
    }
    const handlePortChange = (e) => {
        setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: currentTime?.dNtpConfig?.sAddress, sPort: e.target.value } })
        console.log(currentTime)
    }

    const ntp = (ipAddress, ntpPort) => {

        return (
            <div className='form-row'>
                <div className='form-group'>
                    <label>NTP服务器地址:</label>
                    <input type='text' className='form-control' id='ntpServer' placeholder='NTP服务器地址' onChange={handleAddressChange} value={currentTime?.dNtpConfig?.sAddress} />
                </div>
                <div className='form-group'>
                    <label>NTP端口:</label>
                    <input type='text' className='form-control' id='ntpPort' onChange={handlePortChange} placeholder='NTP端口' value={currentTime?.dNtpConfig?.sPort} />
                </div>
            </div>
        )
    };
    const handleTimeChange = (e) => {
        const date = new Date(e.target.value)
        setCurrentTime({ ...currentTime, iTimestamp: date.getTime() / 1000 });

    };
    const manual = () => {

        return (
            <div className='form-group' style={{ margin: "20px 0" }}>
                <input type='datetime-local' className='form-control' onChange={handleTimeChange}></input>
            </div>
        )
    };

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getSystemTime();
                console.log("系统时间：", response.data);
                setOriginTime(response.data);
                setCurrentTime(response.data);
                setSelectedMethod(response.data.sMethod);
            } catch (err) {
                console.error(err);
            };
        };
        request();

    }, [])

    const sendTime = (timestamp) => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.putSystemTime(currentTime);
                console.log(currentTime)
                console.log(response.status)
            } catch (err) {
                console.error(err)
            }
        }
        request();
    }
    const handleChange = (event) => {
        console.log(event)
        console.log(event.target.value)
        setSelectedMethod(event.target.value)

        if (event.target.value === "ntp") {
            const address = originTime?.dNtpConfig.sAddress || "pool.ntp.org"
            const port = originTime?.dNtpConfig.sPort || "123"
            setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: address, sPort: port } })
        } else {
            const timestamp = originTime?.iTimestamp || new Date().getTime()
            const timezone = originTime?.sTimezone || "Asia/Shanghai"
            const tz = originTime?.sTz || "UTC+8"
            setCurrentTime({ sMethod: "manual", iTimestamp: timestamp, sTimezone: timezone, sTz: tz })
        }
    }

    return (
        <div className="card">
            <div className='card-body'>
                <div className='form-group'>
                    <label>当前时间</label>
                    <select className='form-control' value={selectedMethod} onChange={handleChange}>
                        <option value="ntp">自动刷新</option>
                        <option value="manual">手动设置</option>
                    </select>
                    {selectedMethod === "ntp" ? ntp("adfa", "adfadf") : manual()}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={sendTime}>设置</button>
                </div>
            </div>

        </div>

    )
}



// 网络设置组件
function NetworkSetting() {
    const [wifiOn, setWiFiOn] = useState(false);
    const [wiredOn, setWiredOn] = useState(true);

    const [wifiList, setWiFiList] = useState(null);
    const [wiredInfo, setwiredInfo] = useState(null);
    const [wlanInfo, setWlanInfo] = useState({
        sGetMethod: "DHCP",
        sIpAddress: "192.168.1.11",
        sIpGateway: "192.168.1.1",
        sIpNetmask: "255.255.255.0",
        sDNS0: "8.8.8.8",
        sDNS1: "1.1.1.1"

    });

    // 弹窗相关状态
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [selectedWifi, setSelectedWifi] = useState(null)
    const [wifiPassword, setWifiPassword] = useState('')
    const [connecting, setConnecting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getWifiInfo();
                if (response.status === 200) {
                    if (response.data?.iPower) {
                        setWiFiOn(true)
                    } else {
                        setWiFiOn(false)
                    }
                    console.log(response.data)
                }
            } catch (err) {
                console.log(err)
            }
        }
        if (wifiOn == true) {
            request();
        }
    }, [])

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getWifiList();
                if (response.status === 200) {
                    setWiFiList(response.data);
                }
            } catch (err) {
                console.log(err)
            }
        }
        console.log(wifiOn, "222")
        if (wifiOn == true) {

            request();
            console.log(wifiList)
        }
    }, [wifiOn])

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getWlanInfo();
                if (response.status === 200) {
                    setwiredInfo(response.data)

                    console.log('1111', response.data)
                }
            } catch (err) {
                console.log(err)
            }
        }
        if (wiredOn == true) {
            request();
        }
    }, [wiredOn])


    const wifiSwitch = () => {

        if (wifiOn) {
            setWiFiList(null);
            console.log(111)
        }
        setWiFiOn(!wifiOn)
    }


    const getSignalBars = (iRssi) => {
        const bars = iRssi > -33 ? 3 : iRssi > -66 ? 2 : 1;
        const name = iRssi > -33 ? 'strong' : iRssi > -66 ? 'medium' : 'weak';
        return (
            <div className={`wifi-signal signal-${name}`}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`signal-bar ${i < bars ? 'active' : ''}`}></div>
                ))}
            </div>
        );
    };

    const handleToggleConnection = (wifi) => {
        console.log(wifi)
        if (wifi.isConnected) {
            // 如果已连接，则断开连接
            handleDisconnect(wifi);
        } else {
            // 如果未连接，显示密码输入框
            setSelectedWifi(wifi);
            setWifiPassword('');
            setShowPasswordModal(true);
        }
    };

    // 处理断开连接
    const handleDisconnect = async (wifi) => {
        try {
            console.log('断开连接:', wifi.sSsid);
            // 这里调用断开连接的 API
            // await DeviceInfoAPI.disconnectWifi(wifi.sBssid);

            // 更新状态：创建新数组，修改对应项的 isConnected 属性
            setWiFiList(prevList =>
                prevList.map(item =>
                    item.sBssid === wifi.sBssid
                        ? { ...item, isConnected: false }
                        : item
                )
            );
        } catch (err) {
            console.error('断开连接失败:', err);
            alert('断开连接失败: ' + err.message);
        }
    };

    // 处理连接 WiFi
    const handleConnect = async () => {
        if (!wifiPassword.trim()) {
            alert('请输入密码');
            return;
        }

        try {
            setConnecting(true);
            console.log('连接 WiFi:', selectedWifi.sSsid, '密码:', wifiPassword);
            // 这里调用连接 WiFi 的 API
            const response = await DeviceInfoAPI.postWifiInfo({
                sName: selectedWifi.sSsid,
                sPassword: wifiPassword
            });
            if (response.status == 200) {
                if (response.data.status == 0) {
                    console.log("连接成功")
                    // 更新状态：创建新数组，修改对应项的 isConnected 属性
                    setWiFiList(prevList =>
                        prevList.map(item =>
                            item.sBssid === selectedWifi.sBssid
                                ? { ...item, isConnected: true }
                                : item
                        )
                    );
                    // 连接成功后关闭弹窗
                    setShowPasswordModal(false);
                    setWifiPassword('');
                    setSelectedWifi(null);
                } else {
                    console.error("连接失败")
                    alert("连接失败：" + response.data.message)
                }
            }
        } catch (err) {
            console.error('连接失败:', err);
            alert('连接失败: ' + err.message);
        } finally {
            setConnecting(false);
        }
    };

    // 关闭弹窗
    const handleCloseModal = () => {
        setShowPasswordModal(false);
        setWifiPassword('');
        setSelectedWifi(null);
        setShowPassword(false);
    };

    const dhcpPage = () => {

        return (
            <div className='info-grid'>
                <div className='info-item'>
                    <label>
                        IP地址:
                    </label>
                    <span>{wiredInfo?.dIpv4.sV4Address}</span>
                </div>
                <div className='info-item'>
                    <label>
                        网关地址:
                    </label>
                    <span>{wiredInfo?.dIpv4.sV4Gateway}</span>
                </div>
                <div className='info-item'>
                    <label>
                        子网掩码:
                    </label>
                    <span>{wiredInfo?.dIpv4.sV4Netmask}</span>
                </div>
                <div className='info-item'>
                    <label>
                        主DNS:
                    </label>
                    <span>{wiredInfo?.dLink.sDNS1}</span>
                </div>
                <div className='info-item'>
                    <label>
                        备用DNS:
                    </label>
                    <span>{wiredInfo?.dLink.sDNS2}</span>
                </div>
                <div className='info-item'>
                    <label>
                        设备名称:
                    </label>
                    <span>{wiredInfo?.dLink.sInterface}</span>
                </div>
                <div className='info-item'>
                    <label>
                        网络带宽:
                    </label>
                    <span>{wiredInfo?.dLink.sNicSpeed}</span>
                </div>
                <div className='info-item'>
                    <label>
                        MAC地址:
                    </label>
                    <span>{wiredInfo?.dLink.sAddress}</span>
                </div>
            </div>
        )

    };

    const sendWlanConfig = (data) => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.putWlanInfo(data)
                if (response.status == 200) {
                    alert("设置成功")
                }
            } catch (err) {
                console.error(err)
            }
        }
        console.log(1111)
        request();
    }

    const staticPage = () => {

        return (
            <div className='form-group'>
                <label>
                    IP地址
                </label>

                <input className='form-control' value={wlanInfo.sIpAddress} onChange={(e) => { setWlanInfo({ ...wlanInfo, sIpAddress: e.target.value }) }}></input>
                <label>
                    网关地址
                </label>

                <input className='form-control' value={wlanInfo.sIpGateway} onChange={(e) => { setWlanInfo({ ...wlanInfo, sIpGateway: e.target.value }) }}></input>
                <label>
                    子网掩码
                </label>

                <input className='form-control' value={wlanInfo.sIpNetmask} onChange={(e) => { setWlanInfo({ ...wlanInfo, sIpNetmask: e.target.value }) }}></input>
                <label>
                    主DNS
                </label>

                <input className='form-control' value={wlanInfo.sDNS0} onChange={(e) => { setWlanInfo({ ...wlanInfo, sDNS0: e.target.value }) }}></input>
                <label>
                    备用DNS
                </label>

                <input className='form-control' value={wlanInfo.sDNS1} onChange={(e) => { setWlanInfo({ ...wlanInfo, sDNS1: e.target.value }) }}></input>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}></div>
                <button className='btn btn-primary' onClick={() => sendWlanConfig(wlanInfo)}>设置</button>
            </div>
        )
    };

    return (
        <div className='content-card'>
            <div className='card-header'>
                <h3>WiFi设置</h3>
                <div className='header-switch'>
                    <span className={`switch-status ${wifiOn ? 'on' : 'off'}`}>{wifiOn ? '已开启' : '已关闭'}</span>
                    <label className='toggle-switch'>
                        <input type='checkbox' checked={wifiOn} onChange={wifiSwitch} />
                        <span className='toggle-slider'></span>
                    </label>
                </div>
            </div>
            <div className='card-body'>
                {wifiList && wifiList.map((wifi, index) => {
                    return (
                        <div
                            key={wifi.sBssid}
                            className={`wifi-item ${wifi.isConnected ? 'connected' : ''} ${index !== wifiList.length - 1 ? 'border-bottom' : ''
                                }`}
                        >
                            <div className="wifi-info">
                                <div className="signal-container">
                                    {getSignalBars(wifi.iRssi)}
                                </div>

                                <div className="wifi-details">
                                    <div className="wifi-name-row">
                                        <h3 className="wifi-name">{wifi.sSsid}</h3>
                                        {wifi.sFlags && (
                                            <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="wifi-status">
                                        <span className="signal-text">
                                            信号: {wifi.iRssi > -33 ? '强' : wifi.iRssi > -66 ? '中等' : '弱'}
                                        </span>
                                        {wifi.isConnected && (
                                            <span className="connected-badge">已连接</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggleConnection(wifi)}
                                className={`action-button ${wifi.isConnected ? 'disconnect' : 'connect'}`}
                            >
                                {wifi.isConnected ? '断开' : '连接'}
                            </button>
                        </div>
                    );
                })}

            </div>
            <div className='card-header'>
                <h3>有线网络设置</h3>
                <div className='header-switch'>
                    <span className={`switch-status ${wiredOn ? 'on' : 'off'}`}>{wiredOn ? '自动' : '手动'}</span>
                    <label className='toggle-switch'>
                        <input type='checkbox' checked={wiredOn} onChange={() => { setWiredOn(!wiredOn) }} />
                        <span className='toggle-slider'></span>
                    </label>
                </div>
            </div>
            <div className='card-body'>
                {wiredOn ? dhcpPage() : staticPage()}

            </div>

            {/* WiFi 密码输入弹窗 */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>连接到 WiFi</h3>
                            <button className="modal-close" onClick={handleCloseModal}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="wifi-info-display">
                                <Wifi size={24} />
                                <span className="wifi-ssid">{selectedWifi?.sSsid}</span>
                            </div>
                            <div className="form-group">
                                <label htmlFor="wifi-password">WiFi 密码</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="wifi-password"
                                        className="form-control"
                                        placeholder="请输入 WiFi 密码"
                                        value={wifiPassword}
                                        onChange={(e) => setWifiPassword(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !connecting) {
                                                handleConnect();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "隐藏密码" : "显示密码"}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={handleCloseModal}
                                disabled={connecting}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConnect}
                                disabled={connecting}
                            >
                                {connecting ? '连接中...' : '连接'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
}

// 连接设置组件
function LinkSetting() {
    const [httpapiInfo, setHttpapiInfo] = useState(null);
    const [ftpInfo, setFtpInfo] = useState(null);
    const [httpOn, setHttpOn] = useState(false);
    const [ftpOn, setFtpOn] = useState(false);

    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getWebSetting();
                if (response.status == 200) {
                    setHttpapiInfo(response.data)
                    setHttpOn(response.data?.sEnable)
                }
            } catch (err) {
                console.error(err);
                alert(err);
            }
        };
        request();

    }, [])

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getFtpSetting();
                console.log(response.data);
                if (response.status == 200) {
                    setFtpInfo(response.data)
                    setFtpOn(response.data?.sEnable)
                }
            } catch (err) {
                console.error(err);
                alert(err);
            }
        };
        request();

    }, [])

    const sendHttpConfig = (data) => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.postWebSetting(data);
                console.log(data)
                if (response.status == 200) {
                    console.log("success");
                } else {
                    console.error("失败");
                    alert('设置失败')
                }
            } catch (err) {
                console.error(err);
                alert(err)
            }
        }
        request();
    }
    const sendFtpConfig = (data) => {
        const request = async () => {
            try {
                // 对密码进行 SHA256 哈希
                const hashedData = {
                    ...data,
                    sFtpPassword: CryptoJS.SHA256(data.sFtpPassword).toString()
                };

                console.log('原始数据:', data);
                console.log('哈希后的数据:', hashedData);

                const response = await DeviceInfoAPI.postFtpSetting(hashedData);
                if (response.status == 200) {
                    alert("设置成功")
                }
            } catch (err) {
                console.error(err);
                alert('设置失败: ' + err.message);
            }
        }
        request();
    }

    const httpPage = () => {
        return httpOn &&
            <div className='form-group'>
                <label>API端口</label>
                <input className='form-control' value={httpapiInfo?.sApiPort} onChange={(e) => { setHttpapiInfo({ ...httpapiInfo, sApiPort: e.target.value }) }}></input>
                <label>访问密钥</label>
                <input className='form-control' value={httpapiInfo?.sApiKey} onChange={(e) => { setHttpapiInfo({ ...httpapiInfo, sApiKey: e.target.value }) }}></input>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={() => sendHttpConfig(httpapiInfo)}>设置</button>
                </div>
            </div>
    }
    const ftpPage = () => {
        return ftpOn &&
            <div className='form-group'>
                <label>端口号</label>
                <input className='form-control' value={ftpInfo?.sFtpPort} onChange={(e) => { setFtpInfo({ ...ftpInfo, sFtpPort: e.target.value }) }}></input>
                <label>用户名</label>
                <input className='form-control' value={ftpInfo?.sFtpUser} onChange={(e) => { setFtpInfo({ ...ftpInfo, sFtpUser: e.target.value }) }}></input>
                <label>密码</label>
                <div className="password-input-wrapper">
                    <input
                        type={showPassword ? "text" : "password"}
                        className='form-control'
                        // value={ftpInfo?.sFtpPassword}
                        onChange={(e) => {
                            setFtpInfo({ ...ftpInfo, sFtpPassword: e.target.value })
                        }}
                    />
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "隐藏密码" : "显示密码"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={() => sendFtpConfig(ftpInfo)}>设置</button>
                </div>
            </div >
    };

    const httpSwitch = () => {
        setHttpOn(!httpOn);
        console.log(httpOn)
    };
    const ftpSwitch = () => {
        setFtpOn(!ftpOn)
    };

    return (
        <div className="content-card">
            <div className='card-header'>
                <h3>HTTP API设置</h3>
                <div className='header-switch'>
                    <span className={`switch-status ${httpOn ? 'on' : 'off'}`}>{httpOn ? '已开启' : '已关闭'}</span>
                    <label className='toggle-switch'>
                        <input type='checkbox' checked={httpOn} onChange={httpSwitch} />
                        <span className='toggle-slider'></span>
                    </label>
                </div>
            </div>
            <div className='card-body'>
                {httpPage()}
            </div>

            <div className='card-header'>
                <h3>FTP 配置</h3>
                <div className='header-switch'>
                    <span className={`switch-status ${ftpOn ? 'on' : 'off'}`}>{ftpOn ? '已开启' : '已关闭'}</span>
                    <label className='toggle-switch'>
                        <input type='checkbox' checked={ftpOn} onChange={ftpSwitch} />
                        <span className='toggle-slider'></span>
                    </label>
                </div>
            </div>
            <div className='card-body'>
                {ftpPage()}
            </div>
        </div>
    );
}

function SystemSetting() {
    
    return (
        <div className='main-content'>
            <div className='content-card'>
                <div className='card-head'>
                    <h3>配置管理</h3>
                </div>
                <div className='card-body'>
                    <button className='btn btn-primary'>导出设置</button>
                    <button className='btn btn-primary' style={{ marginLeft: "10px" }}>导入设置</button>
                </div>
            </div>
            <div className='content-card'>
                <div className='card-head'>
                    <h3>固件管理</h3>
                </div>
                <div className='card-body'>
                    <button className='btn btn-primary'  >在线更新固件</button>
                    <button className='btn btn-primary' style={{ marginLeft: "10px" }}>本地更新固件</button>
                </div>
            </div>
            <div className='content-card'>
                <div className='card-head'>
                    <h3>系统设置</h3>
                </div>
                <div className='card-body'>
                    <button className='btn btn-primary' style={{ background: "#0a0909ff" }} >重启设备</button>
                    <button className='btn btn-primary' style={{ marginLeft: "10px", background: "#062fcfff" }}>修改密码</button>
                    <button className='btn btn-primary' style={{ marginLeft: "10px", background: "#bc1313ff" }}>恢复出厂设置</button>
                </div>
            </div>
        </div>
    )
}

export { BaseInfo, TimeSetting, NetworkSetting, LinkSetting, SystemSetting }