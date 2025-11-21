import React, { useState, useCallback } from "react";

export default function DisplaySettings() {
    const [settings, setSettings] = useState({
        brightness: 50,
        contrast: 50,
        saturation: 50,
        sharpness: 50,
        flip: false,
        mirror: false,
        rotation: 0
    });

    const handleSliderChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: parseInt(value) }));
    };

    const handleCheckboxChange = (field) => {
        setSettings(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleRotationChange = (value) => {
        setSettings(prev => ({ ...prev, rotation: parseInt(value) }));
    };

    const handleSave = () => {
        console.log("保存显示设置:", settings);
        alert("显示设置已保存！");
    };

    const handleReset = () => {
        setSettings({
            brightness: 50,
            contrast: 50,
            saturation: 50,
            sharpness: 50,
            flip: false,
            mirror: false,
            rotation: 0
        });
    };

    return (
        <div className="settings-tab">
            <div className="settings-section">
                <h4>画面设置</h4>
                <div className="form-group">
                    <label>画面翻转</label>
                    <select
                        className="form-control"
                    // value={settings.attribute.sOSDFrontColorMode}
                    // onChange={(e) => handleAttributeChange("sOSDFrontColorMode", e.target.value)}
                    >
                        <option value="origin">原始画面</option>
                        <option value="vertical">垂直镜像</option>
                        <option value="horizontal">水平镜像</option>

                    </select>
                </div>
                <div className="form-group">
                    <label>画面旋转</label>
                    <select
                        className="form-control"
                    // value={settings.attribute.sOSDFrontColorMode}
                    // onChange={(e) => handleAttributeChange("sOSDFrontColorMode", e.target.value)}
                    >
                        <option value="0">0°</option>
                        <option value="90">90°</option>
                        <option value="180">180°</option>
                        <option value="270">270°</option>

                    </select>
                </div>
                <div className="form-group">
                    <label>视频制式</label>
                    <select
                        className="form-control"
                    // value={settings.attribute.sOSDFrontColorMode}
                    // onChange={(e) => handleAttributeChange("sOSDFrontColorMode", e.target.value)}
                    >
                        <option value="PAL">PAL(50HZ)</option>
                        <option value="NTSC">NTSC(60HZ)</option>

                    </select>
                </div>


            </div>
            <div className="settings-section">
                <h4>日夜参数转换</h4>
                <div className="form-group">
                    <label>转换模式</label>
                    <select
                        className="form-control"
                    // value={settings.attribute.sOSDFrontColorMode}
                    // onChange={(e) => handleAttributeChange("sOSDFrontColorMode", e.target.value)}
                    >
                        <option value="auto">自动转换</option>
                        <option value="timer">定时转换</option>
                        <option value="keep">保持不变</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>转换阈值灵敏度</label>
                    <select className="form-control">
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>转换滞后时间</label>
                    <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="60"
                    // value={settings.nightToDayFilterTime}
                    // onChange={(e) => handleSliderChange("nightToDayFilterTime", e.target.value)}
                    />
                </div>
            </div>
            <div className="settings-section">
                <h4>图像基础调节</h4>
                <div className="form-group">
                    <label>选择配置文件</label>
                    <select className="form-control">
                        <option value="common">通用</option>
                        <option value="day">白天</option>
                        <option value="night">夜晚</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>亮度</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="100"
                        value={settings.brightness}
                        onChange={(e) => handleSliderChange("brightness", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>对比度</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="100"
                        value={settings.contrast}
                        onChange={(e) => handleSliderChange("contrast", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>饱和度</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="100"
                        value={settings.saturation}
                        onChange={(e) => handleSliderChange("saturation", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>锐度</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="100"
                        value={settings.sharpness}
                        onChange={(e) => handleSliderChange("sharpness", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>色调</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="100"
                        value={settings.hue}
                        onChange={(e) => handleSliderChange("hue", e.target.value)}
                    />
                </div>
            </div>
            <div className="settings-section">
                <h4>相机设置</h4>
                <div className="form-group">
                    <label>曝光时间</label>
                    <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="1000"
                        value={settings.exposureTime}
                        onChange={(e) => handleSliderChange("exposureTime", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>曝光增益模式</label>
                    <select className="form-control">
                        <option value="auto">自动</option>
                        <option value="manual">手动</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>曝光增益值</label>
                    <input
                        type="range"
                        className="slider"
                        min="1"
                        max="10"
                        value={settings.exposureGain}
                        onChange={(e) => handleSliderChange("exposureGain", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>背光模式</label>
                    <select className="form-control">
                        <option value="close">关闭</option>
                        <option value="hlc">强光抑制</option>
                        <option value="blc">背光补偿</option>
                        <option value="hdr">宽动态</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>背光补偿强度</label>
                    <input
                        type="range"
                        className="slider"
                        min="1"
                        max="50"
                        value={settings.blcStrength}
                        onChange={(e) => handleSliderChange("blcStrength", e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>白平衡模式</label>
                    <select className="form-control">
                        <option value="autoWhiteBalance">自动</option>
                        <option value="manualWhiteBalance">手动</option>
                        <option value="natural">自然光</option>
                        <option value="streetlight">路灯</option>
                        <option value="outdoor">室外</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>降噪模式</label>
                    <select className="form-control">
                        <option value="close">关闭</option>
                        <option value="pro">专家模式</option>
                    </select>
                    <label>空域降噪</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="50"
                        value={settings.spatialDenoise}
                        onChange={(e) => handleSliderChange("spatialDenoise", e.target.value)}
                    />
                    <label>时域降噪</label>
                    <input
                        type="range"
                        className="slider"
                        min="0"
                        max="50"
                        value={settings.temporalDenoise}
                        onChange={(e) => handleSliderChange("temporalDenoise", e.target.value)}
                    />
                </div>
            </div>
            <div className="button-group">
                <button className="btn btn-primary" onClick={handleSave}>
                    保存设置
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                    恢复默认
                </button>
            </div>
        </div>
    );
}

