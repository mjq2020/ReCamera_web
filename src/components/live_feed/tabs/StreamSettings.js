import React, { useState, useEffect } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    streamProtocol: "rtsp",
    rtsp: {
        iPort: 554
    },
    rtmp: {
        sURL: "",
        iAuthType: 0,
    },
    onvif: {
        sUserName: "",
        sPassword: ""
    }
}

export default function StreamSettings() {
    const [settings, setSettings] = useState({
        streamProtocol: "rtsp",
        rtsp: {
            iPort: 554
        },
        rtmp: {
            sURL: "",
            iAuthType: 0,
            sSecretKey: "",
            sUserName: "",
            sPassword: ""
        },
        onvif: {
            sUserName: "",
            sPassword: ""
        }
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoStream(0);
            setSettings(response.data);
        } catch (err) {
            console.error("加载推流设置失败:", err);
        }
    };

    const handleProtocolChange = (protocol) => {
        setSettings(prev => ({ ...prev, streamProtocol: protocol }));
    };

    const handleRtspChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            rtsp: { ...prev.rtsp, [field]: value }
        }));
    };

    const handleRtmpChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            rtmp: { ...prev.rtmp, [field]: value }
        }));
    };

    const handleOnvifChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            onvif: { ...prev.onvif, [field]: value }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await VideoAPI.postVideoStream(0, settings);
            toast.success("推流设置保存成功！");
        } catch (err) {
            console.error("保存推流设置失败:", err);
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
                <h4>推流协议</h4>
                <div className="protocol-selector">
                    <label className="protocol-option">
                        <input
                            type="radio"
                            name="protocol"
                            value="rtsp"
                            checked={settings.streamProtocol === "rtsp"}
                            onChange={(e) => handleProtocolChange(e.target.value)}
                        />
                        <span className="protocol-label">RTSP</span>
                    </label>
                    <label className="protocol-option">
                        <input
                            type="radio"
                            name="protocol"
                            value="rtmp"
                            checked={settings.streamProtocol === "rtmp"}
                            onChange={(e) => handleProtocolChange(e.target.value)}
                        />
                        <span className="protocol-label">RTMP</span>
                    </label>
                    <label className="protocol-option">
                        <input
                            type="radio"
                            name="protocol"
                            value="onvif"
                            checked={settings.streamProtocol === "onvif"}
                            onChange={(e) => handleProtocolChange(e.target.value)}
                        />
                        <span className="protocol-label">ONVIF</span>
                    </label>
                </div>
            </div>

            {settings.streamProtocol === "rtsp" && (
                <div className="settings-section">
                    <h4>RTSP 配置</h4>
                    <div className="form-group">
                        <label>端口号</label>
                        <input
                            type="number"
                            className="form-control"
                            value={settings.rtsp?.iPort}
                            onChange={(e) => handleRtspChange("iPort", parseInt(e.target.value))}
                            min="1"
                            max="65535"
                        />
                    </div>
                    <div className="info-box">
                        <p className="info-text">
                            RTSP地址: rtsp://[设备IP]:{settings.rtsp?.iPort}/stream
                        </p>
                    </div>
                </div>
            )}

            {settings.streamProtocol === "rtmp" && (
                <div className="settings-section">
                    <h4>RTMP 配置</h4>
                    <div className="form-group">
                        <label>推流地址</label>
                        <input
                            type="text"
                            className="form-control"
                            value={settings.rtmp?.sURL}
                            onChange={(e) => handleRtmpChange("sURL", e.target.value)}
                            placeholder="rtmp://example.com/live/stream"
                        />
                    </div>
                    <div className="form-group">
                        <label>认证类型</label>
                        <select
                            className="form-control"
                            value={settings.rtmp?.iAuthType}
                            onChange={(e) => handleRtmpChange("iAuthType", parseInt(e.target.value))}
                        >
                            <option value={0}>无认证</option>
                            <option value={1}>需要认证</option>
                        </select>
                    </div>
                    {settings.rtmp?.iAuthType === 1 && (
                        <>
                            <div className="form-group">
                                <label>用户名</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settings.rtmp?.sUserName}
                                    onChange={(e) => handleRtmpChange("sUserName", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>密码</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={settings.rtmp?.sPassword}
                                    onChange={(e) => handleRtmpChange("sPassword", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>密钥</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settings.rtmp?.sSecretKey}
                                    onChange={(e) => handleRtmpChange("sSecretKey", e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {settings.streamProtocol === "onvif" && (
                <div className="settings-section">
                    <h4>ONVIF 配置</h4>
                    <div className="form-group">
                        <label>用户名</label>
                        <input
                            type="text"
                            className="form-control"
                            value={settings.onvif?.sUserName}
                            onChange={(e) => handleOnvifChange("sUserName", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>密码</label>
                        <input
                            type="password"
                            className="form-control"
                            value={settings.onvif?.sPassword}
                            onChange={(e) => handleOnvifChange("sPassword", e.target.value)}
                        />
                    </div>
                </div>
            )}

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

