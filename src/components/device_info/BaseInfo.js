import React, { useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API';
import { InfoSection, InfoResource } from '../base/InfoDisplay';

// BaseInfo 基本信息组件
function BaseInfo() {
    // 使用 useState 存储响应数据
    const [baseInfo, setBaseInfo] = useState(null);
    const [currentTime, setCurrentTime] = useState(null); // 当前显示的时间

    // 使用 useEffect 处理异步请求
    useEffect(() => {
        const fetchDeviceInfo = async () => {
            try {

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

            } finally {

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

    const getTimezoneOffset = (sTz) => {
        if (!sTz) return 0;
        const match = sTz.match(/UTC([+-])(\d+)/);
        if (!match) return 0;
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        return sign * hours;
    };
    // 格式化时间戳
    const formatTimestamp = (timestamp) => {
        const timezoneOffsetHours = getTimezoneOffset(currentTime?.sTz || 'UTC+8');
        const timestampWithOffset = timestamp + (timezoneOffsetHours * 60 * 60);
        if (!timestampWithOffset) return '-';
        const date = new Date(timestampWithOffset);
        return date.toLocaleString('en');
    };

    // 准备设备信息数据
    const deviceInfoItems = [
        // { key: 'deviceName', label: '设备名称:', value: baseInfo?.sDeviceName },
        { key: 'basePlate', label: '主板型号:', value: baseInfo?.sBasePlateModel },
        { key: 'sensor', label: '传感器型号:', value: baseInfo?.sSensorModel },
        { key: 'firmware', label: '固件版本:', value: baseInfo?.sFirmwareVersion },
        { key: 'serial', label: '序列号:', value: baseInfo?.sSerialNumber },
        // { key: 'mac', label: 'MAC地址:', value: baseInfo?.sMacAddress }
    ];

    // 准备时间信息数据
    const timeInfoItems = [
        { key: 'currentTime', label: '当前时间:', value: formatTimestamp(currentTime) },
        { key: 'timezone', label: '时区:', value: baseInfo?.sTimezone },
        { key: 'tz', label: '时区代码:', value: baseInfo?.sTz },
        { key: 'method', label: '同步方式:', value: baseInfo?.sMethod }
    ];

    const resourceInfoItems = [
        { key: 'cpuUsage', label: 'CPU 使用率:', value: baseInfo?.iCpuUsage },
        { key: 'npuUsage', label: 'NPU 使用率:', value: baseInfo?.iNpuUsage },
        { key: 'memUsage', label: '内存使用率:', value: baseInfo?.iMemUsage },
        { key: 'storageUsage', label: '存储使用率:', value: baseInfo?.iStorageUsage }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '20px',
            padding: '10px'
        }}>
            {/* 设备基本信息卡片 */}
            <InfoSection
                title="设备基本信息"
                items={deviceInfoItems}
            />

            {/* 系统时间信息卡片 */}
            <InfoSection
                title="系统时间信息"
                items={timeInfoItems}
            />

            {/* 系统资源状态卡片 */}
            <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                    <h3>系统资源状态</h3>
                </div>
                <div className="card-body">
                    {resourceInfoItems.map(item => <InfoResource label={item.label} value={item.value} />)}
                </div>
            </div>
        </div>
    );
}

export default BaseInfo;