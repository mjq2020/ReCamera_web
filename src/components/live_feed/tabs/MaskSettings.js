import React, { useState, useEffect } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    iEnabled: 0,
    normalizedScreenSize: {
        iNormalizedScreenHeight: 1080,
        iNormalizedScreenWidth: 1920
    },
    privacyMask: []
}

export default function MaskSettings({ maskSettings, setMaskSettings, isDrawingMode, setIsDrawingMode }) {
    const [localSettings, setLocalSettings] = useState({
        iEnabled: 0,
        normalizedScreenSize: {
            iNormalizedScreenHeight: 1080,
            iNormalizedScreenWidth: 1920
        },
        privacyMask: []
    });

    const [loading, setLoading] = useState(false);

    // 当从父组件接收到maskSettings更新时，同步到本地
    useEffect(() => {
        if (maskSettings) {
            setLocalSettings(maskSettings);
        }
    }, [maskSettings]);

    // 加载当前设置
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getVideoOsdMask(0);
            const data = response.data;
            setLocalSettings(data);
            if (setMaskSettings) {
                setMaskSettings(data);
            }

        } catch (err) {
            console.error("加载遮盖设置失败:", err);
        }
    };

    const handleToggle = () => {
        const newSettings = {
            ...localSettings,
            iEnabled: localSettings.iEnabled === 1 ? 0 : 1
        };
        setLocalSettings(newSettings);
        if (setMaskSettings) {
            setMaskSettings(newSettings);
        }
    };

    const handleAddMask = () => {
        const newMask = {
            id: localSettings.privacyMask.length,
            iMaskHeight: 100,
            iMaskWidth: 100,
            iPositionX: 50,
            iPositionY: 50
        };
        const newSettings = {
            ...localSettings,
            privacyMask: [...localSettings.privacyMask, newMask]
        };
        setLocalSettings(newSettings);
        if (setMaskSettings) {
            setMaskSettings(newSettings);
        }
    };

    const handleRemoveMask = (id) => {
        const newSettings = {
            ...localSettings,
            privacyMask: localSettings.privacyMask.filter(mask => mask.id !== id)
        };
        setLocalSettings(newSettings);
        if (setMaskSettings) {
            setMaskSettings(newSettings);
        }
    };

    const handleMaskChange = (id, field, value) => {
        const newSettings = {
            ...localSettings,
            privacyMask: localSettings.privacyMask.map(mask =>
                mask.id === id ? { ...mask, [field]: parseInt(value) } : mask
            )
        };
        setLocalSettings(newSettings);
        if (setMaskSettings) {
            setMaskSettings(newSettings);
        }
    };

    const handleScreenSizeChange = (field, value) => {
        const newSettings = {
            ...localSettings,
            normalizedScreenSize: {
                ...localSettings.normalizedScreenSize,
                [field]: parseInt(value)
            }
        };
        setLocalSettings(newSettings);
        if (setMaskSettings) {
            setMaskSettings(newSettings);
        }
    };

    const toggleDrawingMode = () => {
        if (setIsDrawingMode) {
            setIsDrawingMode(!isDrawingMode);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await VideoAPI.postVideoOsdMask(0, localSettings);
            toast.success("图像遮盖设置保存成功！");
        } catch (err) {
            console.error("保存遮盖设置失败:", err);
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
            setLocalSettings(DEFAULT_SETTINGS);
            loadSettings();
        });
        toast.success("恢复默认设置成功！");
    };
    return (
        <div className="settings-tab">
            <div className="settings-section">
                <h4>隐私遮盖</h4>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={localSettings.iEnabled === 1}
                            onChange={handleToggle}
                        />
                        启用隐私遮盖
                    </label>
                    <p className="help-text">
                        启用后，可以在视频画面上设置遮盖区域，保护隐私敏感区域
                    </p>
                </div>
            </div>

            {localSettings.iEnabled === 1 && (<div>
                <div className="settings-section">
                    <h4>屏幕尺寸（归一化）</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>宽度</label>
                            <input
                                type="number"
                                className="form-control"
                                value={localSettings.normalizedScreenSize.iNormalizedScreenWidth}
                                onChange={(e) => handleScreenSizeChange("iNormalizedScreenWidth", e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>高度</label>
                            <input
                                type="number"
                                className="form-control"
                                value={localSettings.normalizedScreenSize.iNormalizedScreenHeight}
                                onChange={(e) => handleScreenSizeChange("iNormalizedScreenHeight", e.target.value)}
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="section-header">
                        <h4>遮盖区域</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={`btn btn-small ${isDrawingMode ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={toggleDrawingMode}
                            >
                                {isDrawingMode ? '✓ 绘制模式' : '🖱️ 在画面上绘制'}
                            </button>
                            <button className="btn btn-small btn-primary" onClick={handleAddMask}>
                                + 手动添加
                            </button>
                        </div>
                    </div>

                    {isDrawingMode ? (
                        <div className="info-box" style={{ marginBottom: '16px' }}>
                            <p className="info-text">
                                🖱️绘制模式已启用：在左侧视频画面上按住鼠标左键拖动即可绘制遮盖区域
                            </p>
                        </div>
                    ) : (
                        <div className="info-box" style={{ marginBottom: '16px', background: '#f0f9ff', border: '1px solid #3b82f6' }}>
                            <p className="info-text" style={{ color: '#1e40af', marginBottom: '8px' }}>
                                💡 <strong>交互提示：</strong>
                            </p>
                            <ul style={{ margin: '0', paddingLeft: '24px', color: '#1e40af', fontSize: '12px', lineHeight: '1.8' }}>
                                <li>点击遮盖区域可以选中</li>
                                <li>拖拽遮盖区域可以移动位置</li>
                                <li>拖拽边缘或角落可以调整大小</li>
                                <li>按 <kbd style={{ padding: '2px 6px', background: '#ffffff', border: '1px solid #3b82f6', borderRadius: '4px', fontFamily: 'monospace' }}>Delete</kbd> 或 <kbd style={{ padding: '2px 6px', background: '#ffffff', border: '1px solid #3b82f6', borderRadius: '4px', fontFamily: 'monospace' }}>Backspace</kbd> 删除选中的遮盖</li>
                                <li>按 <kbd style={{ padding: '2px 6px', background: '#ffffff', border: '1px solid #3b82f6', borderRadius: '4px', fontFamily: 'monospace' }}>ESC</kbd> 取消选中</li>
                            </ul>
                        </div>
                    )}

                    {localSettings.privacyMask.length === 0 ? (
                        <div className="empty-state">
                            <p>暂无遮盖区域，点击"在画面上绘制"或"手动添加"按钮</p>
                        </div>
                    ) : (
                        <div className="mask-list">
                            {localSettings.privacyMask.map((mask, index) => (
                                <div key={mask.id} className="mask-item">
                                    <div className="mask-header">
                                        <span className="mask-title">遮盖区域 {index + 1}</span>
                                        <button
                                            className="btn btn-small btn-danger"
                                            onClick={() => handleRemoveMask(mask.id)}
                                        >
                                            删除
                                        </button>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>X坐标</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mask.iPositionX}
                                                onChange={(e) => handleMaskChange(mask.id, "iPositionX", e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Y坐标</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mask.iPositionY}
                                                onChange={(e) => handleMaskChange(mask.id, "iPositionY", e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>宽度</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mask.iMaskWidth}
                                                onChange={(e) => handleMaskChange(mask.id, "iMaskWidth", e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>高度</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mask.iMaskHeight}
                                                onChange={(e) => handleMaskChange(mask.id, "iMaskHeight", e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
