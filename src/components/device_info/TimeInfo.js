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
            const address = originTime?.dNtpConfig?.sAddress || "pool.ntp.org"
            const port = originTime?.dNtpConfig?.sPort || "123"
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



export default TimeSetting;