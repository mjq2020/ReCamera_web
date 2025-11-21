import React from 'react';

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

export default SystemSetting;