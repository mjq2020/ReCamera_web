import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API'

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

    const handleTimezoneChange = (e) => {
        const selectedTimezone = e.target.value;
        const timezoneMap = {
            'Asia/Shanghai': 'UTC+8',
            'Asia/Tokyo': 'UTC+9',
            'Asia/Seoul': 'UTC+9',
            'Asia/Hong_Kong': 'UTC+8',
            'Asia/Singapore': 'UTC+8',
            'Asia/Dubai': 'UTC+4',
            'Europe/London': 'UTC+0',
            'Europe/Paris': 'UTC+1',
            'Europe/Berlin': 'UTC+1',
            'Europe/Moscow': 'UTC+3',
            'America/New_York': 'UTC-5',
            'America/Chicago': 'UTC-6',
            'America/Denver': 'UTC-7',
            'America/Los_Angeles': 'UTC-8',
            'America/Sao_Paulo': 'UTC-3',
            'Australia/Sydney': 'UTC+10',
            'Pacific/Auckland': 'UTC+12',
            'UTC': 'UTC+0'
        };

        setCurrentTime({
            ...currentTime,
            sTimezone: selectedTimezone,
            sTz: timezoneMap[selectedTimezone] || 'UTC+0'
        });
    };

    // 将时间戳转换为datetime-local格式
    const formatDateTimeLocal = (timestamp) => {
        const date = new Date(timestamp * 1000); // 转换为毫秒
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const manual = () => {
        // 优先使用currentTime的时间戳，如果为空则使用当前时间
        const displayTimestamp = currentTime?.iTimestamp || Math.floor(new Date().getTime() / 1000);
        const displayValue = formatDateTimeLocal(displayTimestamp);

        return (
            <div>
                <div className='form-group' style={{ margin: "20px 0" }}>
                    <label>设置时间:</label>
                    <input
                        type='datetime-local'
                        className='form-control'
                        onChange={handleTimeChange}
                        value={displayValue}
                    />
                </div>
                <div className='form-group' style={{ margin: "20px 0" }}>
                    <label>时区:</label>
                    <select
                        className='form-control'
                        value={currentTime?.sTimezone || 'Asia/Shanghai'}
                        onChange={handleTimezoneChange}
                    >
                        <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                        <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
                        <option value="Asia/Seoul">韩国标准时间 (UTC+9)</option>
                        <option value="Asia/Hong_Kong">香港时间 (UTC+8)</option>
                        <option value="Asia/Singapore">新加坡时间 (UTC+8)</option>
                        <option value="Asia/Dubai">迪拜时间 (UTC+4)</option>
                        <option value="Europe/London">伦敦时间 (UTC+0)</option>
                        <option value="Europe/Paris">巴黎时间 (UTC+1)</option>
                        <option value="Europe/Berlin">柏林时间 (UTC+1)</option>
                        <option value="Europe/Moscow">莫斯科时间 (UTC+3)</option>
                        <option value="America/New_York">纽约时间 (UTC-5)</option>
                        <option value="America/Chicago">芝加哥时间 (UTC-6)</option>
                        <option value="America/Denver">丹佛时间 (UTC-7)</option>
                        <option value="America/Los_Angeles">洛杉矶时间 (UTC-8)</option>
                        <option value="America/Sao_Paulo">圣保罗时间 (UTC-3)</option>
                        <option value="Australia/Sydney">悉尼时间 (UTC+10)</option>
                        <option value="Pacific/Auckland">奥克兰时间 (UTC+12)</option>
                        <option value="UTC">协调世界时 (UTC+0)</option>
                    </select>
                </div>
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
            const address = originTime?.dNtpConfig?.sAddress || "pool.ntp.org"
            const port = originTime?.dNtpConfig?.sPort || "123"
            setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: address, sPort: port } })
        } else {
            const timestamp = originTime?.iTimestamp || new Date().getTime()
            const timezone = originTime?.sTimezone || "Asia/Shanghai"
            const tz = originTime?.sTz || "UTC+8"
            setCurrentTime({ sMethod: "manual", iTimestamp: timestamp, sTimezone: timezone, sTz: tz, dNtpConfig: null })
        }
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px'
        }}>
            <div className="card" style={{
                margin: 0,
                maxWidth: '800px',
                width: '100%'
            }}>
                <div className='card-header'>
                    <h3>时间设置</h3>
                </div>
                <div className='card-body'>
                    <div className='form-group'>
                        <label>同步方式</label>
                        <select className='form-control' value={selectedMethod} onChange={handleChange}>
                            <option value="ntp">自动刷新 (NTP)</option>
                            <option value="manual">手动设置</option>
                        </select>
                        {selectedMethod === "ntp" ? ntp("adfa", "adfadf") : manual()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className='btn btn-primary' onClick={sendTime}>设置</button>
                    </div>
                </div>
            </div>
        </div>

    )
}



export default TimeSetting;