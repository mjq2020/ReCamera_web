import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API';
import { InfoGrid, InfoItem } from '../base/InfoDisplay';
import './WiFi.css';
import { Wifi, Eye, EyeOff } from 'lucide-react';
import ipChecking from '../base/Checking';
import toast from '../base/Toast';


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
            <InfoGrid>
                <InfoItem label="IP地址:" value={wiredInfo?.dIpv4.sV4Address} />
                <InfoItem label="网关地址:" value={wiredInfo?.dIpv4.sV4Gateway} />
                <InfoItem label="子网掩码:" value={wiredInfo?.dIpv4.sV4Netmask} />
                <InfoItem label="主DNS:" value={wiredInfo?.dLink.sDNS1} />
                <InfoItem label="备用DNS:" value={wiredInfo?.dLink.sDNS2} />
                <InfoItem label="设备名称:" value={wiredInfo?.dLink.sInterface} />
                <InfoItem label="网络带宽:" value={wiredInfo?.dLink.sNicSpeed} />
                <InfoItem label="MAC地址:" value={wiredInfo?.dLink.sAddress} />
            </InfoGrid>
        );
    };

    const sendWlanConfig = (data) => {
        const request = async () => {
            try {
                if (!ipChecking(data.sIpAddress) || !ipChecking(data.sIpGateway) || !ipChecking(data.sIpNetmask) || !ipChecking(data.sDNS0) || !ipChecking(data.sDNS1)) {
                    toast.error("IP地址格式错误")
                    return;
                }
                const response = await DeviceInfoAPI.putWlanInfo(data)
                if (response.status == 200) {
                    toast.success("设置成功")
                }
            } catch (err) {
                console.error(err)
                toast.error("设置失败")
            }
        }
        request();
    }

    const handleChange = (e) => {
        console.log(e.target.value)
        setWiredOn(e.target.value === "auto")
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
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            padding: '10px'
        }}>
            {/* WiFi设置卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
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
            </div>

            {/* 有线网络设置卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>有线网络设置</h3>
                    <div className='header-switch'>
                        <select className='form-control' value={wiredOn ? "auto" : "manual"} onChange={handleChange}>
                            <option value="auto">自动</option>
                            <option value="manual">手动</option>
                        </select>
                    </div>
                </div>
                <div className='card-body'>
                    {wiredOn ? dhcpPage() : staticPage()}
                </div>
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

export default NetworkSetting;