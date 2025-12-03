import React from "react";
import { toast } from "../../base/Toast";

const GpioConfig = ({ tempRuleConfig, setTempRuleConfig }) => {

    const handleChange = (field, value) => {
        const intValue = parseInt(value);
        if (intValue < 0 || intValue > 1000) {
            toast.error("去抖时长不能小于0或大于1000毫秒");
            return;
        }
        setTempRuleConfig({
            ...tempRuleConfig,
            dGPIO: { ...tempRuleConfig.dGPIO, [field]: intValue }
        });
    };

    return (
        <div className="form-grid">
            <div className="form-group">
                <label>GPIO 引脚名称</label>
                <input
                    type="text"
                    className="input-field"
                    value={tempRuleConfig.dGPIO?.sName}
                    readOnly
                />
            </div>
            <div className="form-group">
                <label>初始电平</label>
                <select
                    className="select-input"
                    value={tempRuleConfig.dGPIO?.sInitialLevel}
                    onChange={(e) => setTempRuleConfig({
                        ...tempRuleConfig,
                        dGPIO: { ...tempRuleConfig.dGPIO, sInitialLevel: e.target.value }
                    })}
                >
                    <option value="low">低电平</option>
                    <option value="high">高电平</option>
                </select>
            </div>
            <div className="form-group">
                <label>触发信号</label>
                <select
                    className="select-input"
                    value={tempRuleConfig.dGPIO?.sSignal}
                    onChange={(e) => setTempRuleConfig({
                        ...tempRuleConfig,
                        dGPIO: { ...tempRuleConfig.dGPIO, sSignal: e.target.value }
                    })}
                >
                    <option value="high">高电平</option>
                    <option value="low">低电平</option>
                    <option value="rising">上升沿</option>
                    <option value="falling">下降沿</option>
                </select>
            </div>
            <div className="form-group">
                <label>去抖时长 (毫秒)</label>
                <input
                    type="number"
                    className="input-field"
                    value={tempRuleConfig.dGPIO?.iDebounceDurationMs}
                    max={1000}
                    min={0}
                    onChange={(e) => handleChange('iDebounceDurationMs', e.target.value)}
                />
            </div>
        </div>
    );
};

export default GpioConfig;