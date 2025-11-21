import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API'
import './WiFi.css'
import { Eye, EyeOff } from 'lucide-react';
import CryptoJS from 'crypto-js';

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

export default LinkSetting;