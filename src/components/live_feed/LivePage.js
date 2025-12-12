import React, { useState } from "react";
import Player from "./Player";
import LiveSetting from "./LiveSetting";
import "./LivePage.css";

export default function LivePage() {
    const [maskSettings, setMaskSettings] = useState(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [mainStream, setMainStream] = useState(true);
    const [osdSettings, setOsdSettings] = useState(null);
    const [isOsdEditMode, setIsOsdEditMode] = useState(false);

    return (
        <div className="live-page-container">
            <div className="live-page-header" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                <h2>实时视频监控</h2>
                <p className="page-description" >实时查看视频流并进行画面参数配置</p>
            </div>
            <div className="live-page-content">
                <div className="live-player-section">
                    <Player
                        maskSettings={maskSettings}
                        isDrawingMode={isDrawingMode}
                        mainStream={mainStream}
                        osdSettings={osdSettings}
                        isOsdEditMode={isOsdEditMode}
                        onOsdUpdate={setOsdSettings}
                        onMaskDrawn={(newMask, updatedMasks) => {
                            if (maskSettings) {
                                if (updatedMasks) {
                                    // 更新整个遮盖数组（用于拖拽和调整大小）
                                    setMaskSettings({
                                        ...maskSettings,
                                        privacyMask: updatedMasks
                                    });
                                } else if (newMask) {
                                    // 添加新遮盖（用于绘制新区域）
                                    setMaskSettings({
                                        ...maskSettings,
                                        privacyMask: [...maskSettings.privacyMask, newMask]
                                    });
                                }
                            }
                        }}
                    />
                </div>
                <div className="live-settings-section">
                    <LiveSetting
                        maskSettings={maskSettings}
                        setMaskSettings={setMaskSettings}
                        isDrawingMode={isDrawingMode}
                        setIsDrawingMode={setIsDrawingMode}
                        mainStream={mainStream}
                        setMainStream={setMainStream}
                        osdSettings={osdSettings}
                        setOsdSettings={setOsdSettings}
                        isOsdEditMode={isOsdEditMode}
                        setIsOsdEditMode={setIsOsdEditMode}
                    />
                </div>
            </div>
        </div>
    );
}
