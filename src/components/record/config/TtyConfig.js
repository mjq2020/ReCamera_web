import React from "react";

const TtyConfig = ({ tempRuleConfig, setTempRuleConfig }) => {
    return (
        <div className="form-grid">
            <div className="form-group">
                <label>串口名称</label>
                <input
                    type="text"
                    className="input-field"
                    value={tempRuleConfig.dTTY.sName}
                    readOnly
                />
            </div>
            <div className="form-group">
                <label>触发命令</label>
                <input
                    type="text"
                    className="input-field"
                    value={tempRuleConfig.dTTY.sCommand}
                    onChange={(e) => setTempRuleConfig({
                        ...tempRuleConfig,
                        dTTY: { ...tempRuleConfig.dTTY, sCommand: e.target.value }
                    })}
                />
            </div>
        </div>
    );
};

export default TtyConfig;