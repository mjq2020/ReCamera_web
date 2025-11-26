import React, { useState, useEffect } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    attribute: {
        iOSDFontSize: 32,
        sOSDFrontColor: "FFFFFF",
        sOSDFrontColorMode: "customize",
        iEnabled: 1
    },
    channelNameOverlay: {
        iEnabled: 1,
        iPositionX: 10,
        iPositionY: 10,
        sChannelName: "摄像头 01"
    },
    dateTimeOverlay: {
        iEnabled: 1,
        iDisplayWeekEnabled: 1,
        iPositionX: 10,
        iPositionY: 50,
        sDateStyle: "YYYY-MM-DD",
        sTimeStyle: "24hour"
    },
    SNOverlay: {
        iEnabled: 1,
        iPositionX: 10,
        iPositionY: 90
    }
}

export default function OSDSettings() {
    const [settings, setSettings] = useState({
        attribute: {
            iOSDFontSize: 32,
            sOSDFrontColor: "FFFFFF",
            sOSDFrontColorMode: "customize",
            iEnabled: 1
        },
        channelNameOverlay: {
            iEnabled: 1,
            iPositionX: 10,
            iPositionY: 10,
            sChannelName: "摄像头 01"
        },
        dateTimeOverlay: {
            iEnabled: 1,
            iDisplayWeekEnabled: 1,
            iPositionX: 10,
            iPositionY: 50,
            sDateStyle: "YYYY-MM-DD",
            sTimeStyle: "24hour"
        },
        SNOverlay: {
            iEnabled: 0,
            iPositionX: 10,
            iPositionY: 90
        }
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoOsdChar(0);
            setSettings(response.data);
        } catch (err) {
            console.error("加载OSD设置失败:", err);
        }
    };

    const handleAttributeChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            attribute: { ...prev.attribute, [field]: value }
        }));
    };

    const handleOverlayChange = (overlay, field, value) => {
        setSettings(prev => ({
            ...prev,
            [overlay]: { ...prev[overlay], [field]: value }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await VideoAPI.putVideoOsdChar(0, settings);
            toast.success("OSD设置保存成功！");
        } catch (err) {
            console.error("保存OSD设置失败:", err);
            toast.error("保存失败：" + err.message);
        } finally {
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
                <h4>OSD设置</h4>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={settings.attribute.iEnabled === 1}
                            onChange={(e) => handleAttributeChange("iEnabled", e.target.checked ? 1 : 0)}
                        />
                        启用OSD叠加显示
                    </label>
                </div>
            </div>
            {settings.attribute.iEnabled === 1 && (<div>
                <div className="settings-section">
                    <h4>字体属性</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>字体大小</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.attribute.iOSDFontSize}
                                onChange={(e) => handleAttributeChange("iOSDFontSize", parseInt(e.target.value))}
                                min="16"
                                max="128"
                            />
                        </div>
                        <div className="form-group">
                            <label>字体颜色</label>
                            <input
                                type="color"
                                className="form-control"
                                value={`#${settings.attribute.sOSDFrontColor}`}
                                onChange={(e) => handleAttributeChange("sOSDFrontColor", e.target.value.slice(1))}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>颜色模式</label>
                        <select
                            className="form-control"
                            value={settings.attribute.sOSDFrontColorMode}
                            onChange={(e) => handleAttributeChange("sOSDFrontColorMode", e.target.value)}
                        >
                            <option value="customize">自定义</option>
                            <option value="auto">自动</option>
                            <option value="black_white">黑白</option>
                        </select>
                    </div>
                </div>

                <div className="settings-section">
                    <h4>通道名称叠加</h4>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.channelNameOverlay.iEnabled === 1}
                                onChange={(e) => handleOverlayChange("channelNameOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                            />
                            启用通道名称显示
                        </label>
                    </div>
                    <div className="form-group">
                        <label>通道名称</label>
                        <input
                            type="text"
                            className="form-control"
                            value={settings.channelNameOverlay.sChannelName}
                            onChange={(e) => handleOverlayChange("channelNameOverlay", "sChannelName", e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>X坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.channelNameOverlay.iPositionX}
                                onChange={(e) => handleOverlayChange("channelNameOverlay", "iPositionX", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Y坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.channelNameOverlay.iPositionY}
                                onChange={(e) => handleOverlayChange("channelNameOverlay", "iPositionY", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h4>日期时间叠加</h4>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.dateTimeOverlay.iEnabled === 1}
                                onChange={(e) => handleOverlayChange("dateTimeOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                            />
                            启用日期时间显示
                        </label>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>日期格式</label>
                            <select
                                className="form-control"
                                value={settings.dateTimeOverlay.sDateStyle}
                                onChange={(e) => handleOverlayChange("dateTimeOverlay", "sDateStyle", e.target.value)}
                            >
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>时间格式</label>
                            <select
                                className="form-control"
                                value={settings.dateTimeOverlay.sTimeStyle}
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
                            <label>X坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.dateTimeOverlay.iPositionX}
                                onChange={(e) => handleOverlayChange("dateTimeOverlay", "iPositionX", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Y坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.dateTimeOverlay.iPositionY}
                                onChange={(e) => handleOverlayChange("dateTimeOverlay", "iPositionY", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h4>序列号叠加</h4>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.SNOverlay.iEnabled === 1}
                                onChange={(e) => handleOverlayChange("SNOverlay", "iEnabled", e.target.checked ? 1 : 0)}
                            />
                            启用序列号显示
                        </label>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>X坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.SNOverlay.iPositionX}
                                onChange={(e) => handleOverlayChange("SNOverlay", "iPositionX", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Y坐标</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.SNOverlay.iPositionY}
                                onChange={(e) => handleOverlayChange("SNOverlay", "iPositionY", parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="button-group">
                    <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? "保存中..." : "保存设置"}
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
                        重置
                    </button>
                </div>
            </div>)}
        </div>
    );
}

