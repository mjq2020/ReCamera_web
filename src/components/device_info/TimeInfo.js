import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API'

function TimeZoneSelect({ currentTime, setCurrentTime }) {
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
    return (
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
    )
};

// 时间设置组件
function TimeSetting() {
    const [originTime, setOriginTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('ntps');

    const handleAddressChange = (e) => {
        setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: e.target.value, sPort: currentTime?.dNtpConfig?.sPort } })
    }
    const handlePortChange = (e) => {
        setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: currentTime?.dNtpConfig?.sAddress, sPort: e.target.value } })
    }

    const ntp = (ipAddress, ntpPort) => {

        return (
            <div>
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
                <TimeZoneSelect currentTime={currentTime} setCurrentTime={setCurrentTime} />
            </div>
        )
    };
    const handleTimeChange = (e) => {
        // e.target.value 是用户选择的本地时间字符串，如 "2024-01-01T12:00"
        const localDateStr = e.target.value;

        // 将字符串分解为各个部分，避免时区问题
        const [datePart, timePart] = localDateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);

        // 使用 Date.UTC 创建时间戳（这表示"用户选择的时间"作为 UTC 时间的时间戳）
        const localAsUtcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

        // 将"本地时区时间"转换为真正的 UTC 时间戳
        // 用户选择的是本地时区的时间，需要减去时区偏移得到 UTC 时间
        const timezoneOffsetHours = getTimezoneOffset(currentTime?.sTz || 'UTC+8');
        const utcTimestamp = Math.floor(localAsUtcTimestamp / 1000) - (timezoneOffsetHours * 60 * 60);

        // 存储 UTC 时间戳（秒）
        setCurrentTime({ ...currentTime, iTimestamp: utcTimestamp });
    };



    // 从sTz字符串中提取时区偏移量（小时）
    const getTimezoneOffset = (sTz) => {
        if (!sTz) return 0;
        const match = sTz.match(/UTC([+-])(\d+)/);
        if (!match) return 0;
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        return sign * hours;
    };

    const manual = () => {
        // 优先使用currentTime的时间戳，如果为空则使用当前时间
        const utcTimestamp = currentTime?.iTimestamp || Math.floor(new Date().getTime() / 1000);

        // 将 UTC 时间戳转换为本地时区时间戳以供显示
        const timezoneOffsetHours = getTimezoneOffset(currentTime?.sTz || 'UTC+8');
        const localTimestamp = utcTimestamp + (timezoneOffsetHours * 60 * 60);

        // 使用 UTC 方法显示本地时区时间，避免浏览器时区影响
        const date = new Date(localTimestamp * 1000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const displayValue = `${year}-${month}-${day}T${hours}:${minutes}`;

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
                <TimeZoneSelect currentTime={currentTime} setCurrentTime={setCurrentTime} />
            </div>
        )
    };

    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getSystemTime();
                const data = response.data;

                // 直接存储后端返回的 UTC 时间戳，不进行转换
                setOriginTime(data);
                setCurrentTime(data);
                setSelectedMethod(data.sMethod);
            } catch (err) {
                console.error(err);
            };
        };
        request();

    }, [])

    const sendTime = (timestamp) => {
        const request = async () => {
            try {
                // 状态中已经存储的是 UTC 时间戳，直接发送即可
                const dataToSend = { ...currentTime };
                const response = await DeviceInfoAPI.putSystemTime(dataToSend);
                console.log(response.status)
            } catch (err) {
                console.error(err)
            }
        }
        request();
    }
    const handleChange = (event) => {
        setSelectedMethod(event.target.value)

        if (event.target.value === "ntp") {
            const address = originTime?.dNtpConfig?.sAddress || "pool.ntp.org"
            const port = originTime?.dNtpConfig?.sPort || "123"
            setCurrentTime({ sMethod: "ntp", dNtpConfig: { sAddress: address, sPort: port } })
        } else {
            const timestamp = originTime?.iTimestamp || Math.floor(new Date().getTime() / 1000)
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