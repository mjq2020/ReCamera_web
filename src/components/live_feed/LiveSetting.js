import React, { useState } from "react";
import BasicSettings from "./tabs/BasicSettings";
import DisplaySettings from "./tabs/DisplaySettings";
import OSDSettings from "./tabs/OSDSettings";
import AISettings from "./tabs/AISettings";
import MaskSettings from "./tabs/MaskSettings";
import StreamSettings from "./tabs/StreamSettings";
import "./LivePage.css";

export default function LiveSetting({ maskSettings, setMaskSettings, isDrawingMode, setIsDrawingMode, mainStream, setMainStream, osdSettings, setOsdSettings, isOsdEditMode, setIsOsdEditMode }) {
    const [activeTab, setActiveTab] = useState("basic");

    const tabs = [
        { id: "basic", label: "基础设置", icon: "⚙️", component: BasicSettings, props: { mainStream, setMainStream } },
        { id: "display", label: "显示设置", icon: "🎨", component: DisplaySettings, props: {} },
        { id: "osd", label: "OSD设置", icon: "📝", component: OSDSettings, props: { osdSettings, setOsdSettings, isOsdEditMode, setIsOsdEditMode } },
        { id: "ai", label: "AI结果", icon: "🤖", component: AISettings, props: {} },
        { id: "mask", label: "图像遮盖", icon: "🔒", component: MaskSettings, props: { maskSettings, setMaskSettings, isDrawingMode, setIsDrawingMode } },
        { id: "stream", label: "推流设置", icon: "📡", component: StreamSettings, props: {} }
    ];

    const activeTabData = tabs.find(tab => tab.id === activeTab);
    const ActiveComponent = activeTabData?.component;
    const componentProps = activeTabData?.props || {};

    return (
        <div className="live-settings-container">
            <div className="settings-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="settings-content">
                {ActiveComponent && <ActiveComponent {...componentProps} />}
            </div>
        </div>
    );
}
