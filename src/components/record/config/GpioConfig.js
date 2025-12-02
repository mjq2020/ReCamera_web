import React from "react";

const GpioConfig = ({ tempRuleConfig, setTempRuleConfig }) => {
    return (
        <div className="form-grid">
            <div className="form-group">
                <label>GPIO 引脚名称</label>
                <input
                    type="text"
                    className="input-field"
                    value={tempRuleConfig.dGPIO?.sName}
                    onChange={(e) => setTempRuleConfig({
                        ...tempRuleConfig,
                        dGPIO: { ...tempRuleConfig.dGPIO, sName: e.target.value }
                    })}
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
                    onChange={(e) => setTempRuleConfig({
                        ...tempRuleConfig,
                        dGPIO: { ...tempRuleConfig.dGPIO, iDebounceDurationMs: parseInt(e.target.value) }
                    })}
                />
            </div>
        </div>
    );
};

export default GpioConfig;