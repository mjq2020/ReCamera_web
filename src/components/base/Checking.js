import React from "react";

function ipChecking(ip) {
    // IPv4 格式验证
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    if (!ipv4Regex.test(ip)) {
        return false;
    }

    // 检查每个部分是否在 0-255 范围内
    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
}
export default ipChecking;