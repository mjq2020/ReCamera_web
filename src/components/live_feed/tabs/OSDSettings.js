import React, { useState, useEffect, useRef } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";
import "./OSDSettings.css";

const DEFAULT_SETTINGS = {
    attribute: {
        iOSDFontSize: 32,
        sOSDFrontColor: "FFFFFF",
        sOSDFrontColorMode: 1
    },
    channelNameOverlay: {
        iEnabled: 1,
        iPositionX: 0.05,
        iPositionY: 0.05,
        sChannelName: "摄像头 01"
    },
    dateTimeOverlay: {
        iEnabled: 1,
        iDisplayWeekEnabled: 1,
        iPositionX: 0.05,
        iPositionY: 0.15,
        sDateStyle: "CHR-YYYY-MM-DD",
        sTimeStyle: "24hour"
    },
    SNOverlay: {
        iEnabled: 1,
        iPositionX: 0.05,
        iPositionY: 0.25
    }
}

export default function OSDSettings({ osdSettings, setOsdSettings, isOsdEditMode, setIsOsdEditMode }) {
    const [settings, setSettings] = useState({
        attribute: {
            iOSDFontSize: 32,
            sOSDFrontColor: "FFFFFF",
            sOSDFrontColorMode: 1
        },
        channelNameOverlay: {
            iEnabled: 1,
            iPositionX: 0.05,
            iPositionY: 0.05,
            sChannelName: "摄像头 01"
        },
        dateTimeOverlay: {
            iEnabled: 1,
            iDisplayWeekEnabled: 1,
            iPositionX: 0.05,
            iPositionY: 0.15,
            sDateStyle: "CHR-YYYY-MM-DD",
            sTimeStyle: "24hour"
        },
        SNOverlay: {
            iEnabled: 0,
            iPositionX: 0.05,
            iPositionY: 0.25
        }
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    // 接收父组件的OSD设置更新（来自拖动）
    // 只在实际内容有变化时更新，避免循环
    const prevOsdSettingsRef = useRef(null);

    useEffect(() => {
        if (osdSettings) {
            const currentStr = JSON.stringify(osdSettings);
            const prevStr = JSON.stringify(prevOsdSettingsRef.current);

            if (currentStr !== prevStr) {
                prevOsdSettingsRef.current = osdSettings;
                setSettings(osdSettings);
            }
        }
    }, [osdSettings]);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoOsdConfig();
            const loadedSettings = response.data;
            setSettings(loadedSettings);
            // 初始加载时同步到父组件
            if (setOsdSettings) {
                setOsdSettings(loadedSettings);
            }
        } catch (err) {
            console.error("加载OSD设置失败:", err);
        }
    };

    const handleAttributeChange = (field, value) => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                attribute: { ...prev.attribute, [field]: value }
            };
            // 立即更新父组件
            if (setOsdSettings) {
                setOsdSettings(newSettings);
            }
            return newSettings;
        });
    };

    const handleOverlayChange = (overlay, field, value) => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                [overlay]: { ...prev[overlay], [field]: value }
            };
            // 立即更新父组件
            if (setOsdSettings) {
                setOsdSettings(newSettings);
            }
            return newSettings;
        });
    };

    const handleSave = async () => {
        const newSettings = {
            ...settings,
            attribute: { ...settings.attribute },
            channelNameOverlay: { ...settings.channelNameOverlay },
            dateTimeOverlay: { ...settings.dateTimeOverlay },
            SNOverlay: { ...settings.SNOverlay }
        };
        setLoading(true);
        try {
            await VideoAPI.postVideoOsdConfig(newSettings);
            setSettings(newSettings);
            toast.success("OSD设置保存成功！");
        } catch (err) { } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        toast.confirm("确定要恢复默认设置吗？").then(confirmed => {
            if (!confirmed) {
                return;
            }
            setSettings(DEFAULT_SETTINGS);
            loadSettings();
        });
        toast.success("恢复默认设置成功！");
    };
    return (
        <div className="settings-tab">
            <div className="settings-section">
                <h4>字体属性</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>字体大小</label>
                        <select
                            className="form-control"
                            value={settings.attribute?.iOSDFontSize}
                            onChange={(e) => handleAttributeChange("iOSDFontSize", parseInt(e.target.value))}
                        >
                            <option value="0">自适应</option>
                            <option value="16">16</option>
                            <option value="32">32</option>
                            <option value="48">48</option>
                            <option value="64">64</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>字体颜色</label>
                        <input
                            type="color"
                            className="form-control"
                            value={`#${settings.attribute?.sOSDFrontColor}`}
                            onChange={(e) => handleAttributeChange("sOSDFrontColor", e.target.value.slice(1))}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>颜色模式</label>
                    <select
                        className="form-control"
                        value={settings.attribute?.sOSDFrontColorMode}
                        onChange={(e) => handleAttributeChange("sOSDFrontColorMode", parseInt(e.target.value))}
                    >
                        <option value="0">黑白自动</option>
                        <option value="1">自定义</option>
                    </select>
                </div>
            </div>

            <div className="settings-section">
                <div className="section-header">
                    <h4>通道名称叠加</h4>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.channelNameOverlay?.iEnabled === 1}
                            onChange={(e) => handleOverlayChange("channelNameOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {settings.channelNameOverlay?.iEnabled === 1 && (
                    <div className="overlay-settings-content">
                        <div className="form-group">
                            <label>通道名称</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.channelNameOverlay?.sChannelName}
                                onChange={(e) => handleOverlayChange("channelNameOverlay", "sChannelName", e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>X坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.channelNameOverlay?.iPositionX}
                                    onChange={(e) => handleOverlayChange("channelNameOverlay", "iPositionX", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Y坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.channelNameOverlay?.iPositionY}
                                    onChange={(e) => handleOverlayChange("channelNameOverlay", "iPositionY", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-section">
                <div className="section-header">
                    <h4>日期时间叠加</h4>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.dateTimeOverlay?.iEnabled === 1}
                            onChange={(e) => handleOverlayChange("dateTimeOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {settings.dateTimeOverlay?.iEnabled === 1 && (
                    <div className="overlay-settings-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>日期格式</label>
                                <select
                                    className="form-control"
                                    value={settings.dateTimeOverlay?.sDateStyle}
                                    onChange={(e) => handleOverlayChange("dateTimeOverlay", "sDateStyle", e.target.value)}
                                >
                                    <option value="CHR-YYYY-MM-DD">CHR-YYYY-MM-DD</option>
                                    <option value="CHR-DD-MM-YYYY">CHR-DD-MM-YYYY</option>
                                    <option value="CHR-MM-DD-YYYY">CHR-MM-DD-YYYY</option>
                                    <option value="NUM-YYYY-MM-DD">NUM-YYYY-MM-DD</option>
                                    <option value="NUM-DD-MM-YYYY">NUM-DD-MM-YYYY</option>
                                    <option value="NUM-MM-DD-YYYY">NUM-MM-DD-YYYY</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>时间格式</label>
                                <select
                                    className="form-control"
                                    value={settings.dateTimeOverlay?.sTimeStyle}
                                    onChange={(e) => handleOverlayChange("dateTimeOverlay", "sTimeStyle", e.target.value)}
                                >
                                    <option value="24hour">24小时制</option>
                                    <option value="12hour">12小时制</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.dateTimeOverlay.iDisplayWeekEnabled === 1}
                                    onChange={(e) => handleOverlayChange("dateTimeOverlay", "iDisplayWeekEnabled", e.target.checked ? 1 : 0)}
                                />
                                显示星期
                            </label>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>X坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.dateTimeOverlay.iPositionX}
                                    onChange={(e) => handleOverlayChange("dateTimeOverlay", "iPositionX", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Y坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.dateTimeOverlay.iPositionY}
                                    onChange={(e) => handleOverlayChange("dateTimeOverlay", "iPositionY", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-section">
                <div className="section-header">
                    <h4>序列号叠加</h4>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.SNOverlay?.iEnabled === 1}
                            onChange={(e) => handleOverlayChange("SNOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {settings.SNOverlay?.iEnabled === 1 && (
                    <div className="overlay-settings-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label>X坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.SNOverlay?.iPositionX}
                                    onChange={(e) => handleOverlayChange("SNOverlay", "iPositionX", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Y坐标（相对位置 0-1）</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.SNOverlay?.iPositionY}
                                    onChange={(e) => handleOverlayChange("SNOverlay", "iPositionY", parseFloat(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.001"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="osd-edit-mode-section">
                <div className="edit-mode-info">
                    <div className="info-icon">💡</div>
                    <div className="info-text">
                        <strong>可视化编辑模式</strong>
                        <p>开启后，可在左侧视频画面上直接拖动OSD元素调整位置</p>
                        <ul>
                            <li>拖动元素调整位置</li>
                            <li>双击通道名称可编辑内容</li>
                            <li>实时预览字体大小和颜色效果</li>
                        </ul>
                    </div>
                </div>
                <label className="toggle-switch toggle-switch-large">
                    <input
                        type="checkbox"
                        checked={isOsdEditMode || false}
                        onChange={(e) => setIsOsdEditMode && setIsOsdEditMode(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{isOsdEditMode ? '编辑模式已开启' : '开启编辑模式'}</span>
                </label>
            </div>

            <div className="button-group">
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? "保存中..." : "保存设置"}
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                    重置
                </button>
            </div>
        </div>
    );
}

