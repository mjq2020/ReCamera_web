import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import "./LivePage.css";

const axiosInstance = axios.create({
    baseURL: "http://192.168.1.66:8000/cgi-bin/entry.cgi/",
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Cookie": "token=hWLp6dsjRMLIAwby0WQD136tR31utOYIWUvcBOoawn4"
    }
});

export default function Player({ maskSettings, isDrawingMode, onMaskDrawn, mainStream }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pcRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
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

    // 创建WebRTC连接
    const createPeerConnection = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 根据 mainStream 参数确定使用主码流（0）还是子码流（1）
            const streamId = mainStream ? 0 : 1;
            const streamType = mainStream ? "主码流" : "子码流";
            console.log(`准备连接 ${streamType}（stream_id: ${streamId}）`);

            // 创建 RTCPeerConnection（局域网直连，不使用 STUN 服务器）
            const pc = new RTCPeerConnection({
                iceServers: []
            });

            pcRef.current = pc;

            pc.ontrack = (event) => {
                console.log(`收到远程视频流（${streamType}）`, event.streams);
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                }
            };

            pc.onconnectionstatechange = () => {
                console.log(`连接状态（${streamType}）:`, pc.connectionState);
                setIsConnected(pc.connectionState === "connected");
                if (pc.connectionState === "failed") {
                    setError(`WebRTC连接失败（${streamType}）`);
                    setIsLoading(false);
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log(`ICE连接状态（${streamType}）:`, pc.iceConnectionState);
                if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                    setIsLoading(false);
                }
            };

            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false
            });

            await pc.setLocalDescription(offer);

            // 使用带 stream_id 的 API 路径
            const response = await axiosInstance.post(`webrtc/offer/${streamId}`, {
                sdp: offer.sdp,
                type: offer.type
            });

            const answer = response.data;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            console.log(`WebRTC连接建立成功（${streamType}）`);

        } catch (err) {
            console.error("创建WebRTC连接失败:", err);
            setError(err.message || "连接失败");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            closeConnection();
            createPeerConnection();
        }
        
    }, [mainStream]);

    const closeConnection = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsConnected(false);
        setError(null);
        setIsLoading(false);
    };

    // 辅助函数：将标准化坐标转换为画布坐标
    const normalizedToCanvas = (mask, canvasWidth, canvasHeight) => {
        if (!maskSettings) return null;
        const normWidth = maskSettings.normalizedScreenSize.iNormalizedScreenWidth;
        const normHeight = maskSettings.normalizedScreenSize.iNormalizedScreenHeight;
        
        return {
            x: (mask.iPositionX / normWidth) * canvasWidth,
            y: (mask.iPositionY / normHeight) * canvasHeight,
            w: (mask.iMaskWidth / normWidth) * canvasWidth,
            h: (mask.iMaskHeight / normHeight) * canvasHeight
        };
    };

    // 辅助函数：检测鼠标是否在遮盖区域内
    const isPointInMask = (x, y, mask, canvasWidth, canvasHeight) => {
        const rect = normalizedToCanvas(mask, canvasWidth, canvasHeight);
        if (!rect) return false;
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    };

    // 辅助函数：检测鼠标是否在调整手柄上
    const getResizeHandle = (x, y, mask, canvasWidth, canvasHeight) => {
        const rect = normalizedToCanvas(mask, canvasWidth, canvasHeight);
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
                const normWidth = maskSettings.normalizedScreenSize.iNormalizedScreenWidth;
                const normHeight = maskSettings.normalizedScreenSize.iNormalizedScreenHeight;

                maskSettings.privacyMask.forEach((mask, index) => {
                    const x = (mask.iPositionX / normWidth) * videoWidth;
                    const y = (mask.iPositionY / normHeight) * videoHeight;
                    const w = (mask.iMaskWidth / normWidth) * videoWidth;
                    const h = (mask.iMaskHeight / normHeight) * videoHeight;

                    const isSelected = selectedMaskId === mask.id;
                    const isHovered = hoveredMaskId === mask.id && !isDrawingMode;

                    // 只有在遮盖启用时才绘制半透明黑色遮盖，否则只显示边框以便编辑
                    if (maskSettings.iEnabled === 1) {
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
                            ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
                            ctx.strokeRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
                        });

                        // 四条边的中点手柄
                        const edges = [
                            { x: x + w/2, y: y }, // 上
                            { x: x + w/2, y: y + h }, // 下
                            { x: x, y: y + h/2 }, // 左
                            { x: x + w, y: y + h/2 } // 右
                        ];

                        edges.forEach(edge => {
                            ctx.fillRect(edge.x - handleSize/2, edge.y - handleSize/2, handleSize, handleSize);
                            ctx.strokeRect(edge.x - handleSize/2, edge.y - handleSize/2, handleSize, handleSize);
                        });

                        // 绘制尺寸信息（在遮盖区域下方）
                        const sizeText = `${mask.iMaskWidth} × ${mask.iMaskHeight}`;
                        ctx.font = 'bold 12px sans-serif';
                        const sizeTextWidth = ctx.measureText(sizeText).width;
                        const sizeBoxX = x + w/2 - sizeTextWidth/2 - 6;
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
                    
                    const maskRect = normalizedToCanvas(clickedMask, canvasWidth, canvasHeight);
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
                const normWidth = maskSettings.normalizedScreenSize.iNormalizedScreenWidth;
                const normHeight = maskSettings.normalizedScreenSize.iNormalizedScreenHeight;
                
                const newX = x - dragOffset.x;
                const newY = y - dragOffset.y;
                
                // 转换为标准化坐标
                const normalizedX = Math.round((newX / canvasWidth) * normWidth);
                const normalizedY = Math.round((newY / canvasHeight) * normHeight);
                
                // 限制在画布范围内
                const clampedX = Math.max(0, Math.min(normalizedX, normWidth - selectedMask.iMaskWidth));
                const clampedY = Math.max(0, Math.min(normalizedY, normHeight - selectedMask.iMaskHeight));
                
                updateMask(selectedMaskId, {
                    iPositionX: clampedX,
                    iPositionY: clampedY
                });
            }
            return;
        }
        
        // 如果正在调整大小
        if (isResizing && selectedMaskId !== null && drawStart && resizeHandle && maskSettings) {
            const selectedMask = maskSettings.privacyMask.find(m => m.id === selectedMaskId);
            if (selectedMask) {
                const normWidth = maskSettings.normalizedScreenSize.iNormalizedScreenWidth;
                const normHeight = maskSettings.normalizedScreenSize.iNormalizedScreenHeight;
                
                const maskRect = normalizedToCanvas(selectedMask, canvasWidth, canvasHeight);
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
                
                // 确保最小尺寸
                const minSize = 20;
                if (newW < minSize) {
                    if (resizeHandle.includes('w')) newX = maskRect.x + maskRect.w - minSize;
                    newW = minSize;
                }
                if (newH < minSize) {
                    if (resizeHandle.includes('n')) newY = maskRect.y + maskRect.h - minSize;
                    newH = minSize;
                }
                
                // 转换为标准化坐标
                const normalizedX = Math.round((newX / canvasWidth) * normWidth);
                const normalizedY = Math.round((newY / canvasHeight) * normHeight);
                const normalizedW = Math.round((newW / canvasWidth) * normWidth);
                const normalizedH = Math.round((newH / canvasHeight) * normHeight);
                
                updateMask(selectedMaskId, {
                    iPositionX: Math.max(0, normalizedX),
                    iPositionY: Math.max(0, normalizedY),
                    iMaskWidth: Math.max(10, normalizedW),
                    iMaskHeight: Math.max(10, normalizedH)
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
            
            // 计算标准化坐标
            const videoWidth = canvas.width;
            const videoHeight = canvas.height;
            const normWidth = maskSettings.normalizedScreenSize.iNormalizedScreenWidth;
            const normHeight = maskSettings.normalizedScreenSize.iNormalizedScreenHeight;
            
            const x = Math.min(drawStart.x, drawStart.x + currentRect.width);
            const y = Math.min(drawStart.y, drawStart.y + currentRect.height);
            const w = Math.abs(currentRect.width);
            const h = Math.abs(currentRect.height);
            
            // 转换为标准化坐标
            const normalizedX = Math.round((x / videoWidth) * normWidth);
            const normalizedY = Math.round((y / videoHeight) * normHeight);
            const normalizedW = Math.round((w / videoWidth) * normWidth);
            const normalizedH = Math.round((h / videoHeight) * normHeight);
            
            // 只有当矩形有合理的尺寸时才添加
            if (normalizedW > 10 && normalizedH > 10) {
                const newMask = {
                    id: maskSettings.privacyMask.length,
                    iPositionX: normalizedX,
                    iPositionY: normalizedY,
                    iMaskWidth: normalizedW,
                    iMaskHeight: normalizedH
                };
                
                if (onMaskDrawn) {
                    onMaskDrawn(newMask);
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
    }, []);

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
                        {isConnected ? "已连接" : "未连接"}
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
