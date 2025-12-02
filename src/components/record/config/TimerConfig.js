import React from "react";

const TimerConfig = ({ tempRuleConfig, setTempRuleConfig }) => {
    console.log(111)
    return (
        <div className="form-group">
            <label>触发间隔 (秒)</label>
            <input
                type="number"
                className="input-field"
                value={tempRuleConfig?.dTimer?.iIntervalSeconds}
                onChange={(e) => setTempRuleConfig({
                    ...tempRuleConfig,
                    dTimer: { iIntervalSeconds: parseInt(e.target.value) }
                })}
            />
        </div>
    );
};

export default TimerConfig;