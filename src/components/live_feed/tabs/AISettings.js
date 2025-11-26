import React, { useState, useEffect } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    inferenceOverlay: {
        iEnabled: 1
    }
}

export default function AISettings() {
    const [settings, setSettings] = useState({
        inferenceOverlay: {
            iEnabled: 1
        }
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoOsdInference(0);
            setSettings(response.data);
        } catch (err) {
            console.error("加载AI设置失败:", err);
        }
    };

    const handleToggle = () => {
        setSettings(prev => ({
            inferenceOverlay: {
                iEnabled: prev.inferenceOverlay.iEnabled === 1 ? 0 : 1
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await VideoAPI.postVideoOsdInference(0, settings);
            toast.success("AI结果显示设置保存成功！");
        } catch (err) {
            console.error("保存AI设置失败:", err);
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
                <h4>AI推理结果叠加</h4>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={settings.inferenceOverlay.iEnabled === 1}
                            onChange={handleToggle}
                        />
                        启用AI推理结果显示
                    </label>
                    <p className="help-text">
                        开启后，AI检测结果（如人脸、车辆、物体识别等）将叠加显示在视频画面上
                    </p>
                </div>
            </div>

            {settings.inferenceOverlay.iEnabled === 1 && (<div>
                <div className="settings-section">
                    <h4>显示样式</h4>
                    <div className="info-box">
                        <div className="info-item">
                            <span className="info-label">边界框颜色：</span>
                            <span className="info-value">自动（根据类别）</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">标签位置：</span>
                            <span className="info-value">边界框上方</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">置信度显示：</span>
                            <span className="info-value">是</span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h4>支持的AI功能</h4>
                    <div className="feature-list">
                        <div className="feature-item">
                            <span className="feature-icon">👤</span>
                            <span className="feature-name">人脸检测</span>
                            <span className="feature-status enabled">已启用</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🚗</span>
                            <span className="feature-name">车辆识别</span>
                            <span className="feature-status enabled">已启用</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🚶</span>
                            <span className="feature-name">行人检测</span>
                            <span className="feature-status enabled">已启用</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">📦</span>
                            <span className="feature-name">物体识别</span>
                            <span className="feature-status enabled">已启用</span>
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

