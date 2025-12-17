import React from "react";
import { toast } from '../base/Toast';

function ipChecking(ip) {
    // IPv4 格式验证
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    if (!ipv4Regex.test(ip)) {
        toast.error('IP地址格式错误');
        return false;
    }

    // 检查每个部分是否在 0-255 范围内
    const parts = ip.split('.');
    const isValid = parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
    if (!isValid) {
        toast.error('IP地址每段必须在0-255之间');
        return false;
    }
    return true;
}

function portChecking(port) {
    if (port === '') {
        toast.error('端口不能为空');
        return false;
    }

    // 检查是否为纯数字
    if (!/^\d+$/.test(port)) {
        toast.error('端口必须是数字');
        return false;
    }

    const portNumber = parseInt(port, 10);

    // 检查端口范围 (1-65535)
    if (portNumber < 1 || portNumber > 65535) {
        toast.error('端口号必须在 1 到 65535 之间');
        return false;
    }

    return true;
};

export { ipChecking, portChecking };