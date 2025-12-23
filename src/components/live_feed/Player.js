import React, { useRef, useEffect, useState, useCallback } from "react";
import OSDOverlay from "./OSDOverlay";
import "./LivePage.css";

const MAX_MASK_COUNT = 6; // 最多支持6个遮盖区域
// 使用相对路径，通过 nginx 代理访问 go2rtc，避免跨域问题
const WS_URL = (() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // 包含端口号
    return `${protocol}//${host}/api/ws?src=main`;
})();

export default function Player({ maskSettings, isDrawingMode, onMaskDrawn, mainStream, osdSettings, isOsdEditMode, onOsdUpdate }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const onmessageHandlersRef = useRef({});

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionMode, setConnectionMode] = useState(''); // 'WebRTC', 'MSE', 'HLS', etc.

    // 鼠标绘制相关状态
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState(null);
    const [currentRect, setCurrentRect] = useState(null);

    // 遮盖区域交互状态
    const [selectedMaskId, setSelectedMaskId] = useState(null);
    const [hoveredMaskId, setHoveredMaskId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    const [dragOffset, setDragOffset] = useState(null);

    // WebRTC 配置（参考 go2rtc 官方配置）
    const PC_CONFIG = {
        bundlePolicy: 'max-bundle',
        iceServers: [
            { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }
        ],
        sdpSemantics: 'unified-plan'
    };

    // 自动播放视频，支持静音回退
    const playVideo = useCallback(() => {
        if (!videoRef.current) return;

        videoRef.current.play().catch(() => {
            // 如果自动播放失败，尝试静音后播放
            if (!videoRef.current?.muted) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(err => {
                    console.warn("自动播放失败:", err);
                });
            }
        });
    }, []);

    // 发送 WebSocket 消息
    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    // 初始化 WebRTC 连接（参考 go2rtc 官方实现）
    const setupWebRTC = useCallback(() => {
        if (!videoRef.current || !wsRef.current) return;

        console.log("初始化 WebRTC 连接");

        const pc = new RTCPeerConnection(PC_CONFIG);
        pcRef.current = pc;
        const ws = wsRef.current;

        // 添加接收视频和音频的 transceiver，并立即设置 srcObject
        const tracks = ['video', 'audio'].map(kind =>
            pc.addTransceiver(kind, { direction: 'recvonly' }).receiver.track
        );

        // 立即设置 video srcObject（关键：在连接建立前就设置）
        videoRef.current.srcObject = new MediaStream(tracks);
        console.log("视频流已设置到 video 元素");

        // 处理连接状态变化
        pc.addEventListener('connectionstatechange', () => {
            console.log("WebRTC 连接状态:", pc.connectionState);

            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsLoading(false);
                setConnectionMode('WebRTC');
                playVideo();
                console.log("WebRTC 连接成功");
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.warn("WebRTC 连接失败或断开");
                pc.close();
                pcRef.current = null;
                setIsConnected(false);
                setError("WebRTC 连接失败");
                setIsLoading(false);
            }
        });

        // 处理 ICE 候选
        pc.addEventListener('icecandidate', (ev) => {
            if (!ev.candidate) return;
            const msg = {
                type: 'webrtc/candidate',
                value: ev.candidate.candidate
            };
            ws.send(JSON.stringify(msg));
        });

        // 创建并发送 offer
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
                const msg = {
                    type: 'webrtc/offer',
                    value: pc.localDescription.sdp
                };
                ws.send(JSON.stringify(msg));
                console.log("WebRTC offer 已发送");
            })
            .catch(err => {
                console.error("创建 offer 失败:", err);
                setError("创建 WebRTC offer 失败");
                setIsLoading(false);
            });

        // 设置 WebSocket 消息处理器（处理 answer 和 candidate）
        onmessageHandlersRef.current['webrtc'] = async (msg) => {
            switch (msg.type) {
                case 'webrtc/candidate':
                    if (msg.value) {
                        try {
                            await pc.addIceCandidate({
                                candidate: msg.value,
                                sdpMid: '0'
                            });
                            console.log("添加 ICE candidate 成功");
                        } catch (err) {
                            console.warn("添加 ICE candidate 失败:", err);
                        }
                    }
                    break;

                case 'webrtc/answer':
                    try {
                        await pc.setRemoteDescription({
                            type: 'answer',
                            sdp: msg.value
                        });
                        console.log("设置远程描述成功");
                    } catch (err) {
                        console.warn("设置远程描述失败:", err);
                    }
                    break;

                case 'error':
                    if (msg.value && msg.value.includes('webrtc')) {
                        console.error("WebRTC 错误:", msg.value);
                        setError(msg.value);
                        setIsLoading(false);
                    }
                    break;
            }
        };

    }, [playVideo]);

    // 创建 WebSocket 连接
    const createPeerConnection = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            setConnectionMode('');

            console.log("开始连接到:", WS_URL);

            // 创建 WebSocket 连接
            const ws = new WebSocket(WS_URL);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket 连接已建立");

                // 清空消息处理器
                onmessageHandlersRef.current = {};

                // 初始化 WebRTC
                setupWebRTC();
            };

            // 处理 WebSocket 消息
            ws.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    try {
                        const msg = JSON.parse(event.data);
                        console.log("收到消息:", msg.type);

                        // 调用所有注册的消息处理器
                        Object.values(onmessageHandlersRef.current).forEach(handler => {
                            handler(msg);
                        });
                    } catch (err) {
                        console.error("解析消息失败:", err);
                    }
                } else {
                    // 二进制数据（用于 MSE、MJPEG 等）
                    console.log("收到二进制数据");
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket 错误:", error);
                setError("WebSocket 连接错误");
                setIsLoading(false);
            };

            ws.onclose = () => {
                console.log("WebSocket 连接已关闭");

                // 不自动重连，避免无限循环
                // 用户可以手动点击"开始播放"按钮重新连接

                setIsConnected(false);
                setIsLoading(false);
                setError("连接已断开");
            };

        } catch (err) {
            console.error("创建连接失败:", err);
            setError(err.message || "连接失败");
            setIsLoading(false);
        }
    }, [setupWebRTC]);

    useEffect(() => {
        if (isConnected) {
            closeConnection();
            createPeerConnection();
        }

    }, [mainStream]);

    useEffect(() => {
        createPeerConnection();
    }, []);

    const closeConnection = useCallback(() => {
        console.log("关闭所有连接");

        // 清除重连定时器
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        // 关闭 RTCPeerConnection
        if (pcRef.current) {
            // 停止所有发送轨道
            pcRef.current.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });
            pcRef.current.close();
            pcRef.current = null;
        }

        // 关闭 WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // 清除视频流
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = '';
        }

        // 清空消息处理器
        onmessageHandlersRef.current = {};

        setIsConnected(false);
        setError(null);
        setIsLoading(false);
        setConnectionMode('');
    }, []);

    // 辅助函数：将相对坐标（0-1）转换为画布坐标
    const relativeToCanvas = (mask, canvasWidth, canvasHeight) => {
        if (!maskSettings) return null;

        return {
            x: mask.iPositionX * canvasWidth,
            y: mask.iPositionY * canvasHeight,
            w: mask.iMaskWidth * canvasWidth,
            h: mask.iMaskHeight * canvasHeight
        };
    };

    // 辅助函数：检测鼠标是否在遮盖区域内
    const isPointInMask = (x, y, mask, canvasWidth, canvasHeight) => {
        const rect = relativeToCanvas(mask, canvasWidth, canvasHeight);
        if (!rect) return false;
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    };

    // 辅助函数：检测鼠标是否在调整手柄上
    const getResizeHandle = (x, y, mask, canvasWidth, canvasHeight) => {
        const rect = relativeToCanvas(mask, canvasWidth, canvasHeight);
        if (!rect) return null;

        const handleSize = 12; // 手柄检测区域大小
        const tolerance = 8; // 边缘检测容差

        // 检测四个角
        if (Math.abs(x - rect.x) <= handleSize && Math.abs(y - rect.y) <= handleSize) return 'nw';
        if (Math.abs(x - (rect.x + rect.w)) <= handleSize && Math.abs(y - rect.y) <= handleSize) return 'ne';
        if (Math.abs(x - rect.x) <= handleSize && Math.abs(y - (rect.y + rect.h)) <= handleSize) return 'sw';
        if (Math.abs(x - (rect.x + rect.w)) <= handleSize && Math.abs(y - (rect.y + rect.h)) <= handleSize) return 'se';

        // 检测四条边
        if (Math.abs(x - rect.x) <= tolerance && y > rect.y + handleSize && y < rect.y + rect.h - handleSize) return 'w';
        if (Math.abs(x - (rect.x + rect.w)) <= tolerance && y > rect.y + handleSize && y < rect.y + rect.h - handleSize) return 'e';
        if (Math.abs(y - rect.y) <= tolerance && x > rect.x + handleSize && x < rect.x + rect.w - handleSize) return 'n';
        if (Math.abs(y - (rect.y + rect.h)) <= tolerance && x > rect.x + handleSize && x < rect.x + rect.w - handleSize) return 's';

        return null;
    };

    // 获取鼠标悬停的遮盖区域ID
    const getHoveredMaskId = (x, y, canvasWidth, canvasHeight) => {
        if (!maskSettings || !maskSettings.privacyMask) return null;

        // 从后往前检测，优先选择上层的遮盖
        for (let i = maskSettings.privacyMask.length - 1; i >= 0; i--) {
            const mask = maskSettings.privacyMask[i];
            if (isPointInMask(x, y, mask, canvasWidth, canvasHeight)) {
                return mask.id;
            }
        }
        return null;
    };

    // 绘制遮盖区域
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        // 设置canvas尺寸匹配视频容器
        const updateCanvasSize = () => {
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        let animationFrameId;

        const drawMasks = () => {
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const videoWidth = canvas.width;
            const videoHeight = canvas.height;

            // 绘制已有的遮盖区域（显示所有遮盖，无论是否启用，以便编辑）
            if (maskSettings && maskSettings.privacyMask && maskSettings.privacyMask.length > 0) {
                maskSettings.privacyMask.forEach((mask, index) => {
                    // 使用相对坐标（0-1）直接计算画布坐标
                    const x = mask.iPositionX * videoWidth;
                    const y = mask.iPositionY * videoHeight;
                    const w = mask.iMaskWidth * videoWidth;
                    const h = mask.iMaskHeight * videoHeight;

                    const isSelected = selectedMaskId === mask.id;
                    const isHovered = hoveredMaskId === mask.id && !isDrawingMode;

                    // 只有在遮盖启用时才绘制半透明黑色遮盖，否则只显示边框以便编辑
                    if (maskSettings?.iEnabled === 1) {
                        ctx.fillStyle = isSelected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
                        ctx.fillRect(x, y, w, h);
                    } else {
                        // 未启用时显示更淡的填充，表示这是编辑模式
                        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.05)';
                        ctx.fillRect(x, y, w, h);
                    }

                    // 绘制边框
                    if (isSelected) {
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 3;
                    } else if (isHovered) {
                        ctx.strokeStyle = '#f59e0b';
                        ctx.lineWidth = 2;
                    } else {
                        ctx.strokeStyle = '#ef4444';
                        ctx.lineWidth = 2;
                    }
                    ctx.strokeRect(x, y, w, h);

                    // 绘制标签
                    const labelText = `遮盖 ${index + 1}`;
                    const labelPadding = 8;
                    ctx.font = 'bold 14px sans-serif';
                    const labelWidth = ctx.measureText(labelText).width;

                    // 标签背景
                    ctx.fillStyle = isSelected ? '#3b82f6' : (isHovered ? '#f59e0b' : '#ef4444');
                    ctx.fillRect(x + 4, y + 4, labelWidth + labelPadding * 2, 24);

                    // 标签文字
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(labelText, x + 4 + labelPadding, y + 4 + 17);

                    // 如果选中，绘制调整手柄
                    if (isSelected && !isDrawingMode) {
                        const handleSize = 8;
                        ctx.fillStyle = '#3b82f6';
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;

                        // 四个角的手柄
                        const corners = [
                            { x: x, y: y }, // 左上
                            { x: x + w, y: y }, // 右上
                            { x: x, y: y + h }, // 左下
                            { x: x + w, y: y + h } // 右下
                        ];

                        corners.forEach(corner => {
                            ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                            ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                        });

                        // 四条边的中点手柄
                        const edges = [
                            { x: x + w / 2, y: y }, // 上
                            { x: x + w / 2, y: y + h }, // 下
                            { x: x, y: y + h / 2 }, // 左
                            { x: x + w, y: y + h / 2 } // 右
                        ];

                        edges.forEach(edge => {
                            ctx.fillRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
                            ctx.strokeRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
                        });

                        // 绘制尺寸信息（在遮盖区域下方）- 显示相对值
                        const sizeText = `${(mask.iMaskWidth * 100).toFixed(1)}% × ${(mask.iMaskHeight * 100).toFixed(1)}%`;
                        ctx.font = 'bold 12px sans-serif';
                        const sizeTextWidth = ctx.measureText(sizeText).width;
                        const sizeBoxX = x + w / 2 - sizeTextWidth / 2 - 6;
                        const sizeBoxY = y + h + 8;

                        // 尺寸信息背景
                        ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
                        ctx.fillRect(sizeBoxX, sizeBoxY, sizeTextWidth + 12, 20);

                        // 尺寸信息文字
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(sizeText, sizeBoxX + 6, sizeBoxY + 14);
                    }
                });
            }

            // 如果在绘制模式下已达到最大数量，显示提示信息
            if (isDrawingMode && maskSettings.privacyMask && maskSettings.privacyMask.length >= MAX_MASK_COUNT) {
                // 在画布中央显示提示信息
                const messageText = `已达到最大遮盖区域数量 (${MAX_MASK_COUNT}/${MAX_MASK_COUNT})`;
                const subText = '请删除现有区域后再添加新区域';

                ctx.font = 'bold 16px sans-serif';
                const messageWidth = ctx.measureText(messageText).width;
                ctx.font = '14px sans-serif';
                const subTextWidth = ctx.measureText(subText).width;
                const maxWidth = Math.max(messageWidth, subTextWidth);

                const boxWidth = maxWidth + 40;
                const boxHeight = 80;
                const boxX = (canvas.width - boxWidth) / 2;
                const boxY = (canvas.height - boxHeight) / 2;

                // 绘制半透明背景
                ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                // 绘制边框
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                // 绘制警告图标和文字
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText('⚠️ ' + messageText, boxX + 20, boxY + 30);

                ctx.font = '14px sans-serif';
                ctx.fillText(subText, boxX + 20, boxY + 55);
            }

            // 绘制当前正在绘制的矩形（无论遮盖是否启用）
            if (isDrawing && currentRect && currentRect.width !== 0 && currentRect.height !== 0) {
                const x = currentRect.x;
                const y = currentRect.y;
                const w = currentRect.width;
                const h = currentRect.height;

                // 绘制外部阴影效果
                ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
                ctx.shadowBlur = 10;

                // 绘制半透明填充
                ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
                ctx.fillRect(x, y, w, h);

                // 重置阴影
                ctx.shadowBlur = 0;

                // 绘制虚线边框（双层效果）
                // 外层白色虚线
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.setLineDash([10, 6]);
                ctx.strokeRect(x, y, w, h);

                // 内层蓝色虚线
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 6]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);

                // 绘制四角标记
                const cornerSize = 15;
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                // 左上角
                ctx.beginPath();
                ctx.moveTo(x, y + cornerSize);
                ctx.lineTo(x, y);
                ctx.lineTo(x + cornerSize, y);
                ctx.stroke();
                // 右上角
                ctx.beginPath();
                ctx.moveTo(x + w - cornerSize, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w, y + cornerSize);
                ctx.stroke();
                // 左下角
                ctx.beginPath();
                ctx.moveTo(x, y + h - cornerSize);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x + cornerSize, y + h);
                ctx.stroke();
                // 右下角
                ctx.beginPath();
                ctx.moveTo(x + w - cornerSize, y + h);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x + w, y + h - cornerSize);
                ctx.stroke();

                // 绘制尺寸信息标签
                const width = Math.abs(w);
                const height = Math.abs(h);
                const sizeText = `${Math.round(width)} × ${Math.round(height)} px`;

                // 计算文字位置（在矩形上方）
                ctx.font = 'bold 14px sans-serif';
                const textMetrics = ctx.measureText(sizeText);
                const textWidth = textMetrics.width;
                const textHeight = 20;
                const padding = 8;

                const labelX = x;
                const labelY = y - textHeight - padding;

                // 绘制标签背景
                ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
                ctx.fillRect(labelX, labelY, textWidth + padding * 2, textHeight + padding);

                // 绘制文字
                ctx.fillStyle = '#ffffff';
                ctx.fillText(sizeText, labelX + padding, labelY + textHeight - 2);
            }

            // 使用requestAnimationFrame持续绘制
            animationFrameId = requestAnimationFrame(drawMasks);
        };

        // 开始绘制循环
        drawMasks();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [maskSettings, isDrawing, currentRect, selectedMaskId, hoveredMaskId, isDrawingMode]);

    // 更新遮盖区域
    const updateMask = (maskId, updates) => {
        if (!maskSettings || !onMaskDrawn) return;

        const updatedMasks = maskSettings.privacyMask.map(mask =>
            mask.id === maskId ? { ...mask, ...updates } : mask
        );

        // 通过父组件的回调更新整个遮盖设置
        if (onMaskDrawn) {
            // 这里需要传递更新后的遮盖数组
            onMaskDrawn(null, updatedMasks);
        }
    };

    // 鼠标事件处理
    const handleMouseDown = (e) => {
        if (!maskSettings) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 如果是绘制模式，创建新的遮盖
        if (isDrawingMode) {
            // 检查是否已达到最大遮盖区域数量
            if (maskSettings.privacyMask && maskSettings.privacyMask.length >= MAX_MASK_COUNT) {
                // 已达到最大数量，不允许继续绘制
                return;
            }
            setIsDrawing(true);
            setDrawStart({ x, y });
            setCurrentRect({ x, y, width: 0, height: 0 });
            return;
        }

        // 非绘制模式：检测是否点击了现有遮盖区域
        if (maskSettings.privacyMask && maskSettings.privacyMask.length > 0) {
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // 检测是否点击了选中遮盖的调整手柄
            if (selectedMaskId !== null) {
                const selectedMask = maskSettings.privacyMask.find(m => m.id === selectedMaskId);
                if (selectedMask) {
                    const handle = getResizeHandle(x, y, selectedMask, canvasWidth, canvasHeight);
                    if (handle) {
                        setIsResizing(true);
                        setResizeHandle(handle);
                        setDrawStart({ x, y });
                        return;
                    }
                }
            }

            // 检测是否点击了遮盖区域以进行拖拽
            const clickedMaskId = getHoveredMaskId(x, y, canvasWidth, canvasHeight);
            if (clickedMaskId !== null) {
                const clickedMask = maskSettings.privacyMask.find(m => m.id === clickedMaskId);
                if (clickedMask) {
                    setSelectedMaskId(clickedMaskId);
                    setIsDragging(true);

                    const maskRect = relativeToCanvas(clickedMask, canvasWidth, canvasHeight);
                    setDragOffset({
                        x: x - maskRect.x,
                        y: y - maskRect.y
                    });
                    return;
                }
            }

            // 点击了空白区域，取消选中
            setSelectedMaskId(null);
        }
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 如果在绘制模式下已达到最大数量，显示禁止图标
        if (isDrawingMode && maskSettings && maskSettings.privacyMask &&
            maskSettings.privacyMask.length >= MAX_MASK_COUNT && !isDrawing) {
            canvas.style.cursor = 'not-allowed';
            return;
        }

        // 如果正在绘制新遮盖
        if (isDrawing && drawStart) {
            const width = x - drawStart.x;
            const height = y - drawStart.y;
            setCurrentRect({ x: drawStart.x, y: drawStart.y, width, height });
            return;
        }

        // 如果正在拖拽遮盖
        if (isDragging && selectedMaskId !== null && dragOffset && maskSettings) {
            const selectedMask = maskSettings.privacyMask.find(m => m.id === selectedMaskId);
            if (selectedMask) {
                const newX = x - dragOffset.x;
                const newY = y - dragOffset.y;

                // 转换为相对坐标（0-1）
                const relativeX = newX / canvasWidth;
                const relativeY = newY / canvasHeight;

                // 限制在画布范围内（0到1之间，且不能超出右下边界）
                const clampedX = Math.max(0, Math.min(relativeX, 1 - selectedMask.iMaskWidth));
                const clampedY = Math.max(0, Math.min(relativeY, 1 - selectedMask.iMaskHeight));

                updateMask(selectedMaskId, {
                    iPositionX: parseFloat(clampedX.toFixed(3)),
                    iPositionY: parseFloat(clampedY.toFixed(3))
                });
            }
            return;
        }

        // 如果正在调整大小
        if (isResizing && selectedMaskId !== null && drawStart && resizeHandle && maskSettings) {
            const selectedMask = maskSettings.privacyMask.find(m => m.id === selectedMaskId);
            if (selectedMask) {
                const maskRect = relativeToCanvas(selectedMask, canvasWidth, canvasHeight);
                const dx = x - drawStart.x;
                const dy = y - drawStart.y;

                let newX = maskRect.x;
                let newY = maskRect.y;
                let newW = maskRect.w;
                let newH = maskRect.h;

                // 根据调整手柄位置计算新尺寸
                if (resizeHandle.includes('n')) {
                    newY = maskRect.y + dy;
                    newH = maskRect.h - dy;
                }
                if (resizeHandle.includes('s')) {
                    newH = maskRect.h + dy;
                }
                if (resizeHandle.includes('w')) {
                    newX = maskRect.x + dx;
                    newW = maskRect.w - dx;
                }
                if (resizeHandle.includes('e')) {
                    newW = maskRect.w + dx;
                }

                // 确保最小尺寸（相对值，至少1%）
                const minRelativeSize = 0.01;
                const minCanvasSize = minRelativeSize * Math.min(canvasWidth, canvasHeight);
                if (newW < minCanvasSize) {
                    if (resizeHandle.includes('w')) newX = maskRect.x + maskRect.w - minCanvasSize;
                    newW = minCanvasSize;
                }
                if (newH < minCanvasSize) {
                    if (resizeHandle.includes('n')) newY = maskRect.y + maskRect.h - minCanvasSize;
                    newH = minCanvasSize;
                }

                // 转换为相对坐标（0-1）
                const relativeX = newX / canvasWidth;
                const relativeY = newY / canvasHeight;
                const relativeW = newW / canvasWidth;
                const relativeH = newH / canvasHeight;

                updateMask(selectedMaskId, {
                    iPositionX: parseFloat(Math.max(0, relativeX).toFixed(3)),
                    iPositionY: parseFloat(Math.max(0, relativeY).toFixed(3)),
                    iMaskWidth: parseFloat(Math.max(minRelativeSize, relativeW).toFixed(3)),
                    iMaskHeight: parseFloat(Math.max(minRelativeSize, relativeH).toFixed(3))
                });

                setDrawStart({ x, y });
            }
            return;
        }

        // 更新悬停状态和鼠标样式
        if (!isDrawingMode && maskSettings && maskSettings.privacyMask) {
            const hoveredId = getHoveredMaskId(x, y, canvasWidth, canvasHeight);
            setHoveredMaskId(hoveredId);

            // 更新鼠标样式
            if (selectedMaskId !== null) {
                const selectedMask = maskSettings.privacyMask.find(m => m.id === selectedMaskId);
                if (selectedMask) {
                    const handle = getResizeHandle(x, y, selectedMask, canvasWidth, canvasHeight);
                    if (handle) {
                        const cursors = {
                            'nw': 'nw-resize',
                            'ne': 'ne-resize',
                            'sw': 'sw-resize',
                            'se': 'se-resize',
                            'n': 'n-resize',
                            's': 's-resize',
                            'w': 'w-resize',
                            'e': 'e-resize'
                        };
                        canvas.style.cursor = cursors[handle];
                        return;
                    }
                }
            }

            if (hoveredId !== null) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    };

    const handleMouseUp = (e) => {
        // 如果正在绘制新遮盖
        if (isDrawing && drawStart && currentRect && maskSettings) {
            const canvas = canvasRef.current;

            // 计算相对坐标
            const videoWidth = canvas.width;
            const videoHeight = canvas.height;

            const x = Math.min(drawStart.x, drawStart.x + currentRect.width);
            const y = Math.min(drawStart.y, drawStart.y + currentRect.height);
            const w = Math.abs(currentRect.width);
            const h = Math.abs(currentRect.height);

            // 转换为相对坐标（0-1）
            const relativeX = x / videoWidth;
            const relativeY = y / videoHeight;
            const relativeW = w / videoWidth;
            const relativeH = h / videoHeight;

            // 只有当矩形有合理的尺寸时才添加（至少1%）
            const minRelativeSize = 0.01;
            if (relativeW > minRelativeSize && relativeH > minRelativeSize) {
                // 再次检查是否已达到最大数量（防止并发问题）
                if (maskSettings.privacyMask.length >= MAX_MASK_COUNT) {
                    console.warn('已达到最大遮盖区域数量限制');
                } else {
                    const newMask = {
                        id: maskSettings.privacyMask.length,
                        iPositionX: parseFloat(relativeX.toFixed(3)),
                        iPositionY: parseFloat(relativeY.toFixed(3)),
                        iMaskWidth: parseFloat(relativeW.toFixed(3)),
                        iMaskHeight: parseFloat(relativeH.toFixed(3))
                    };

                    if (onMaskDrawn) {
                        onMaskDrawn(newMask);
                    }
                }
            }

            setIsDrawing(false);
            setDrawStart(null);
            setCurrentRect(null);
        }

        // 结束拖拽或调整大小
        if (isDragging) {
            setIsDragging(false);
            setDragOffset(null);
        }

        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
            setDrawStart(null);
        }
    };

    // 键盘事件处理：按Delete或Backspace删除选中的遮盖
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMaskId !== null && maskSettings) {
                e.preventDefault();
                const updatedMasks = maskSettings.privacyMask.filter(mask => mask.id !== selectedMaskId);
                if (onMaskDrawn) {
                    onMaskDrawn(null, updatedMasks);
                }
                setSelectedMaskId(null);
            }

            // ESC键取消选中
            if (e.key === 'Escape' && selectedMaskId !== null) {
                setSelectedMaskId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedMaskId, maskSettings, onMaskDrawn]);

    useEffect(() => {
        return () => {
            closeConnection();
        };
    }, [closeConnection]);

    return (
        <div className="player-container">
            <div
                className="video-wrapper"
                ref={containerRef}
                style={{ cursor: isDrawingMode ? 'crosshair' : 'default' }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-player"
                />
                <canvas
                    ref={canvasRef}
                    className="mask-canvas"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        if (isDrawing) {
                            setIsDrawing(false);
                            setDrawStart(null);
                            setCurrentRect(null);
                        }
                    }}
                    style={{ pointerEvents: isOsdEditMode ? 'none' : 'all' }}
                />
                <OSDOverlay
                    osdSettings={osdSettings}
                    isOsdEditMode={isOsdEditMode}
                    onOsdUpdate={onOsdUpdate}
                    containerRef={containerRef}
                />
                {!isConnected && !isLoading && !error && (
                    <div className="video-overlay">
                        <div className="overlay-content">
                            <div className="overlay-icon">📹</div>
                            <div className="overlay-text">点击开始播放实时视频流</div>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="video-overlay">
                        <div className="overlay-content">
                            <div className="spinner"></div>
                            <div className="overlay-text">正在连接...</div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="video-overlay error">
                        <div className="overlay-content">
                            <div className="overlay-icon">⚠️</div>
                            <div className="overlay-text">连接错误: {error}</div>
                        </div>
                    </div>
                )}
            </div>
            <div className="player-controls">
                {!isConnected ? (
                    <button
                        className="btn btn-primary"
                        onClick={createPeerConnection}
                        disabled={isLoading}
                    >
                        {isLoading ? "连接中..." : "开始播放"}
                    </button>
                ) : (
                    <button
                        className="btn btn-danger"
                        onClick={closeConnection}
                    >
                        停止播放
                    </button>
                )}
                <div className="connection-status">
                    <span className={`status-dot ${isConnected ? "connected" : ""}`}></span>
                    <span className="status-text">
                        {isConnected
                            ? `已连接 ${connectionMode ? `(${connectionMode})` : ''}`
                            : "未连接"}
                    </span>
                </div>
                {isDrawingMode && (
                    <div className="drawing-mode-indicator">
                        <span className="drawing-icon">🖱️</span>
                        <span className="drawing-text">绘制模式</span>
                    </div>
                )}
            </div>
        </div>
    );
}
