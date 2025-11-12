import React, { useState, useEffect } from "react"
import { DeviceInfoAPI } from "../../contexts/API";

export default function TimeSetting() {

    const [currentTime, setCurrentTime] = useState(null);


    useEffect(() => {
        const request = async () => {
            try {
                const response = await DeviceInfoAPI.getSystemTime();
                console.log("系统时间：", response.data);
                setCurrentTime(response.data);
            } catch (err) {
                console.error(err);
            };
        };
        request();

    }, [])

    return (
        <div className="card">
            <label>当前时间</label>

        </div>

    )

}