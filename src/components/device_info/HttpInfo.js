import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API'
import './WiFi.css'
import { Eye, EyeOff } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { toast } from '../base/Toast';


// 连接设置组件
function LinkSetting() {
    const [httpapiInfo, setHttpapiInfo] = useState(null);
    const [ftpInfo, setFtpInfo] = useState(null);
    const [multicastInfo, setMulticastInfo] = useState(null);
    const [httpOn, setHttpOn] = useState(false);
    const [ftpOn, setFtpOn] = useState(false);
    const [multicastOn, setMulticastOn] = useState(false);

    const [showPassword, setShowPassword] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)

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
                toast.error(err);
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
                toast.error(err);
            }
        };
        request();

    }, [])

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getMultiCastInfo();
                console.log(response.data);
                if (response.status == 200) {
                    setMulticastInfo(response.data)
                    setMulticastOn(response.data?.sEnable)
                }
            } catch (err) {
                console.error(err);
                toast.error(err);
            }
        };
        request();

    }, [])

    // 生成随机密钥
    const generateApiKey = async () => {
        const confirmed = await toast.confirm('确定生成随机密钥吗？生成后旧密钥将失效');
        if (!confirmed) {
            return;
        }
        const length = 32;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += charset[randomValues[i] % charset.length];
        }
        setHttpapiInfo({ ...httpapiInfo, sApiKey: result });
        setShowApiKey(false); // 生成后自动显示密钥
        toast.success('密钥已生成');
    };

    // 生成随机FTP密码
    const generateFtpPassword = () => {
        const length = 16;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += charset[randomValues[i] % charset.length];
        }
        setFtpInfo({ ...ftpInfo, sFtpPassword: result });
        setShowPassword(false); // 生成后自动显示密码
        toast.success('密码已生成');
    };

    const sendHttpConfig = (data) => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.postWebSetting(data);
                console.log(data)
                if (response.status == 200) {
                    console.log("success");
                } else {
                    console.error("失败");
                    toast.error('设置失败')
                }
            } catch (err) {
                console.error(err);
                toast.error(err)
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
                    toast.success("设置成功")
                }
            } catch (err) {
                console.error(err);
                toast.error('设置失败: ' + err.message);
            }
        }
        request();
    }

    const sendMulticastConfig = (data) => {
        const request = async () => {
            try {
                await DeviceInfoAPI.postMutiCast(data);
            } catch (err) { }
        }
        request();
    }

    const httpPage = () => {
        return httpOn &&
            <div className='form-group'>
                <label>API端口</label>
                <input
                    className='form-control'
                    value={httpapiInfo?.sApiPort}
                    onChange={(e) => { setHttpapiInfo({ ...httpapiInfo, sApiPort: e.target.value }) }}
                />
                <label>访问密钥</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="password-input-wrapper" style={{ flex: 1 }}>
                        <input
                            type={showApiKey ? "text" : "password"}
                            className='form-control'
                            value={httpapiInfo?.sApiKey}
                            onChange={(e) => { setHttpapiInfo({ ...httpapiInfo, sApiKey: e.target.value }) }}
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowApiKey(!showApiKey)}
                            title={showApiKey ? "隐藏密钥" : "显示密钥"}
                        >
                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={generateApiKey}
                        title="生成随机密钥"
                        style={{
                            padding: '8px 16px',
                            height: '38px',
                            border: '1px solid #007bff',
                            background: '#007bff',
                            color: 'white',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#0056b3';
                            e.target.style.borderColor = '#0056b3';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#007bff';
                            e.target.style.borderColor = '#007bff';
                        }}
                    >
                        生成密钥
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={() => sendHttpConfig(httpapiInfo)}>设置</button>
                </div>
            </div>
    }
    const ftpPage = () => {
        return ftpOn &&
            <div className='form-group'>
                <label>端口号</label>
                <input
                    className='form-control'
                    value={ftpInfo?.sFtpPort}
                    onChange={(e) => { setFtpInfo({ ...ftpInfo, sFtpPort: e.target.value }) }}
                />
                <label>用户名</label>
                <input
                    className='form-control'
                    value={ftpInfo?.sFtpUser}
                    onChange={(e) => { setFtpInfo({ ...ftpInfo, sFtpUser: e.target.value }) }}
                />
                <label>密码</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="password-input-wrapper" style={{ flex: 1 }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className='form-control'
                            value={ftpInfo?.sFtpPassword}
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

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={() => sendFtpConfig(ftpInfo)}>设置</button>
                </div>
            </div >
    };

    const multicastPage = () => {
        return multicastOn &&
            <div className='form-group'>
                <label>组播地址</label>
                <input className='form-control' value={multicastInfo?.sMulticastAddress} onChange={(e) => { setMulticastInfo({ ...multicastInfo, sMulticastAddress: e.target.value }) }}></input>
                <label>组播端口</label>
                <input className='form-control' value={multicastInfo?.sMulticastPort} onChange={(e) => { setMulticastInfo({ ...multicastInfo, sMulticastPort: e.target.value }) }}></input>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className='btn btn-primary' onClick={() => sendMulticastConfig(multicastInfo)}>设置</button>
                </div>
            </div>
    };

    const httpSwitch = async () => {
        if (!httpOn) {
            setHttpOn(!httpOn);
            return;
        }
        const newData = { ...httpapiInfo, sEnable: !httpOn }
        try {
            await DeviceInfoAPI.postWebSetting(newData);
            setHttpapiInfo(newData);
            setHttpOn(!httpOn);
        } catch (err) { }

    };
    const ftpSwitch = () => {
        setFtpOn(!ftpOn)
    };
    const multicastSwitch = async () => {
        const newData = { ...multicastInfo, sEnable: !multicastOn }
        try {
            await DeviceInfoAPI.postMutiCast(newData);
            setMulticastInfo(newData);
            setMulticastOn(!multicastOn);
        } catch (err) { }
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '20px',
            padding: '10px'
        }}>
            {/* HTTP API设置 */}
            <div className="content-card" style={{ margin: 0 }}>
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
            </div>

            {/* FTP 配置 */}
            <div className="content-card" style={{ margin: 0 }}>
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

            {/* 组播配置 */}
            <div className="content-card" style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>组播配置</h3>
                    <div className='header-switch'>
                        <span className={`switch-status ${multicastOn ? 'on' : 'off'}`}>{multicastOn ? '已开启' : '已关闭'}</span>
                        <label className='toggle-switch'>
                            <input type='checkbox' checked={multicastOn} onChange={() => multicastSwitch()} />
                            <span className='toggle-slider'></span>
                        </label>
                    </div>
                </div>
                <div className='card-body'>
                    {multicastPage()}
                </div>
            </div>
        </div>
    );
}

export default LinkSetting;