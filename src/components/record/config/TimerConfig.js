import React from "react";

const TimerConfig = ({ tempRuleConfig, setTempRuleConfig }) => {

    return (
        <div className="form-group">
            <label>触发间隔 (秒)</label>
            <input
                type="number"
                className="input-field"
                value={tempRuleConfig?.dTimer?.iIntervalSeconds}
                min={0}
                onChange={(e) => setTempRuleConfig({
                    ...tempRuleConfig,
                    dTimer: { iIntervalSeconds: parseInt(e.target.value) }
                })}
            />
        </div>
    );
};

export default TimerConfig;