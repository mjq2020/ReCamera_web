import React, { useState, useEffect } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    "mainStream": {
        "id": 0,
        "sStreamType": "mainStream",
        "sResolution": "1920*1080",
        "sOutputDataType": "H.264",
        "sFrameRate": "30",
        "iMaxRate": 4096,
        "iGOP": 50,
        "sRCMode": "VBR",
        "sRCQuality": "high"
    }, "subStream": {
        "id": 1,
        "sStreamType": "subStream",
        "sResolution": "1920*1080",
        "sOutputDataType": "H.264",
        "sFrameRate": "30",
        "iMaxRate": 4096,
        "iGOP": 50,
        "sRCMode": "VBR",
        "sRCQuality": "high"
    }
}

export default function BasicSettings({ mainStream, setMainStream }) {

    const [settings, setSettings] = useState({
        id: 0,
        sStreamType: "mainStream",
        sResolution: "1920*1080",
        sOutputDataType: "H.264",
        sFrameRate: "30",
        iMaxRate: 4096,
        iGOP: 50,
        sRCMode: "VBR",
        sRCQuality: "high"
    });

    const [loading, setLoading] = useState(false);

    // 加载当前设置
    useEffect(() => {
        loadSettings();
        // console.log("mainStream", mainStream);
        console.log("settings", settings);
    }, [mainStream]);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoEncode(mainStream ? 0 : 1);
            setSettings(response.data);
        } catch (err) {
            toast.error("加载设置失败:", err);
        }
    };

    // reset settings to default settings
    const resetSettings = () => {
        toast.confirm("确定要重置设置吗？").then(confirmed => {
            if (!confirmed) {
                return;
            }
            handleSave();
            toast.success("设置重置成功！");
            loadSettings();
        }).catch(err => {
            toast.error("重置失败：" + err.message);
        });
    };

    const handleChange = (field, value) => {
        if (field === "sStreamType") {
            setMainStream(value === "mainStream" ? true : false);
        }
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await VideoAPI.putVideoEncode(mainStream ? 0 : 1, settings);
            toast.success("设置保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-tab">
            <div className="form-row">
                <div className="form-group">
                    <label>码流类型</label>
                    <select
                        className="form-control"
                        value={settings.sStreamType}
                        onChange={(e) => handleChange("sStreamType", e.target.value)}
                    >
                        <option value="mainStream">主码流</option>
                        <option value="subStream">子码流</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>分辨率</label>
                    <select
                        className="form-control"
                        value={settings.sResolution}
                        onChange={(e) => handleChange("sResolution", e.target.value)}
                    >
                        <option value="3840*2160">3840x2160 (4K)</option>
                        <option value="2560*1440">2560x1440 (2K)</option>
                        <option value="1920*1080">1920x1080 (1080P)</option>
                        <option value="1280*720">1280x720 (720P)</option>
                        <option value="640*480">640x480 (VGA)</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>编码格式</label>
                    <select
                        className="form-control"
                        value={settings.sOutputDataType}
                        onChange={(e) => handleChange("sOutputDataType", e.target.value)}
                    >
                        <option value="H.264">H.264</option>
                        <option value="H.265">H.265</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>帧率 (FPS)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={settings.sFrameRate}
                        onChange={(e) => handleChange("sFrameRate", e.target.value)}
                        min="1"
                        max="120"
                    />
                </div>
            </div>



            <div className="form-row">
                <div className="form-group">
                    <label>最大码率 (Kbps)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={settings.iMaxRate}
                        onChange={(e) => handleChange("iMaxRate", parseInt(e.target.value))}
                        min="1"
                        max="20480"
                    />
                </div>
                <div className="form-group">
                    <label>GOP (关键帧间隔)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={settings.iGOP}
                        onChange={(e) => handleChange("iGOP", parseInt(e.target.value))}
                        min="1"
                        max="300"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>码率控制模式</label>
                    <select
                        className="form-control"
                        value={settings.sRCMode}
                        onChange={(e) => handleChange("sRCMode", e.target.value)}
                    >
                        <option value="CBR">CBR (固定码率)</option>
                        <option value="VBR">VBR (可变码率)</option>
                    </select>
                </div>
                {settings.sRCMode === "VBR" && <div className="form-group">
                    <label>码率质量</label>
                    <select
                        className="form-control"
                        value={settings.sRCQuality}
                        onChange={(e) => handleChange("sRCQuality", e.target.value)}
                    >
                        <option value="highest">最高</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                    </select>
                </div>}
            </div>

            <div className="button-group">
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? "保存中..." : "保存设置"}
                </button>
                <button className="btn btn-secondary" onClick={resetSettings}>
                    重置
                </button>
            </div>
        </div>
    );
}

