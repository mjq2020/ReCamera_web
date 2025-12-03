import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from '../../base/Toast';
import '../RecordPage.css';
import './InferenceConfig.css';
import { InferenceAPI } from '../../../contexts/API';

const axiosInstance = axios.create({
    baseURL: "http://192.168.1.66:8000/cgi-bin/entry.cgi/",
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Cookie": "token=hWLp6dsjRMLIAwby0WQD136tR31utOYIWUvcBOoawn4"
    }
});

const InferenceConfig = ({ tempRuleConfig, setTempRuleConfig }) => {
    // Video player refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pcRef = useRef(null);

    // Range slider refs and state
    const rangeContainerRef = useRef(null);
    const [draggingSlider, setDraggingSlider] = useState(null); // 'min' or 'max'

    // Video connection states
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mainStream, setMainStream] = useState(true);

    // Inference editing states
    const [editingInference, setEditingInference] = useState(null);
    const [isDrawingRegion, setIsDrawingRegion] = useState(false);
    const [modelInfo, setModelInfo] = useState(null);

    // Drawing states - 多边形点击绘制
    const [currentPolygon, setCurrentPolygon] = useState([]);

    // 双滑块处理函数
    const getValueFromPosition = (clientX) => {
        if (!rangeContainerRef.current) return 0;
        const rect = rangeContainerRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(position * 100) / 100; // 保留两位小数
    };

    const handleSliderMouseDown = (type) => (e) => {
        e.preventDefault();
        setDraggingSlider(type);
    };

    const handleSliderMouseMove = (e) => {
        if (!draggingSlider || !editingInference) return;
        const newValue = getValueFromPosition(e.clientX);

        if (draggingSlider === 'min') {
            const maxValue = editingInference.lConfidenceFilter[1];
            if (newValue <= maxValue) {
                setEditingInference({
                    ...editingInference,
                    lConfidenceFilter: [newValue, maxValue]
                });
            }
        } else if (draggingSlider === 'max') {
            const minValue = editingInference.lConfidenceFilter[0];
            if (newValue >= minValue) {
                setEditingInference({
                    ...editingInference,
                    lConfidenceFilter: [minValue, newValue]
                });
            }
        }
    };

    const handleSliderMouseUp = () => {
        setDraggingSlider(null);
    };

    useEffect(() => {
        if (draggingSlider) {
            document.addEventListener('mousemove', handleSliderMouseMove);
            document.addEventListener('mouseup', handleSliderMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleSliderMouseMove);
                document.removeEventListener('mouseup', handleSliderMouseUp);
            };
        }
    }, [draggingSlider, editingInference]);


    useEffect(() => {
        const requestInferenceStatus = async () => {
            try {
                const response = await InferenceAPI.getInferenceStatus();
                if (response.status == 200) {
                    const modelResponse = await InferenceAPI.getModelInfo(response.data.sModel);
                    if (modelResponse.status == 200) {
                        setModelInfo(modelResponse.data);
                        console.log(modelInfo);
                    }
                }
            } catch (error) {
                console.error('获取推理状态或模型信息失败:', error);
            }
        };
        requestInferenceStatus();
    }, [editingInference]);

    // WebRTC 连接管理
    const createPeerConnection = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const streamId = mainStream ? 0 : 1;
            const streamType = mainStream ? "主码流" : "子码流";
            console.log(`准备连接 ${streamType}（stream_id: ${streamId}）`);

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

    // 关闭连接时清理
    useEffect(() => {
        return () => {
            closeConnection();
        };
    }, []);

    // 确保视频流在编辑器打开时正确显示
    useEffect(() => {
        if (editingInference && isConnected && videoRef.current && pcRef.current) {
            // 确保视频元素有正确的流
            const checkVideoStream = () => {
                if (videoRef.current && !videoRef.current.srcObject) {
                    // 如果 video 元素没有 srcObject，尝试从 peer connection 获取
                    const receivers = pcRef.current.getReceivers();
                    if (receivers.length > 0) {
                        const stream = new MediaStream();
                        receivers.forEach(receiver => {
                            if (receiver.track) {
                                stream.addTrack(receiver.track);
                            }
                        });
                        if (stream.getTracks().length > 0) {
                            videoRef.current.srcObject = stream;
                        }
                    }
                }
            };

            // 延迟检查以确保 DOM 已经更新
            const timeoutId = setTimeout(checkVideoStream, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [editingInference, isConnected]);

    // AI 推理配置管理
    const handleAddInference = () => {
        setEditingInference({
            sID: `inference_${Date.now()}`,
            iDebounceTimes: 3,
            lConfidenceFilter: [0.5, 1.0],
            lClassFilter: [],
            lRegionFilter: []
        });
        // 自动开启视频连接
        if (!isConnected && !isLoading) {
            createPeerConnection();
        }
    };

    const handleSaveInference = () => {
        if (!editingInference || !tempRuleConfig) return;

        const newInferences = [...tempRuleConfig.lInferenceSet];
        const index = newInferences.findIndex(inf => inf.sID === editingInference.sID);

        if (index >= 0) {
            newInferences[index] = editingInference;
        } else {
            newInferences.push(editingInference);
        }

        setTempRuleConfig({
            ...tempRuleConfig,
            lInferenceSet: newInferences
        });
        setEditingInference(null);
        setIsDrawingRegion(false);
        setCurrentPolygon([]);
    };

    const handleDeleteInference = (id) => {
        if (!tempRuleConfig) return;
        setTempRuleConfig({
            ...tempRuleConfig,
            lInferenceSet: tempRuleConfig.lInferenceSet.filter(inf => inf.sID !== id)
        });
    };

    // 判断两个点是否相同（考虑浮点数精度）
    const pointsEqual = (p1, p2, epsilon = 0.0001) => {
        return Math.abs(p1[0] - p2[0]) < epsilon && Math.abs(p1[1] - p2[1]) < epsilon;
    };

    // 判断两条线段是否相交（不包括端点重合的情况）
    const doSegmentsIntersect = (p1, p2, p3, p4) => {
        // 如果两条线段共享端点，不认为是相交
        if (pointsEqual(p1, p3) || pointsEqual(p1, p4) ||
            pointsEqual(p2, p3) || pointsEqual(p2, p4)) {
            return false;
        }

        const ccw = (A, B, C) => {
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
        };

        // 检查两条线段 (p1, p2) 和 (p3, p4) 是否相交
        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    };

    // 检查新边是否会与当前多边形已有的边相交
    const checkSelfIntersection = (newPoint) => {
        if (currentPolygon.length < 2) return false; // 少于2个点时无法形成边，不会相交

        const newEdgeStart = currentPolygon[currentPolygon.length - 1];
        const newEdgeEnd = newPoint;

        // 检查新边与所有已存在的边（除了与新边直接相连的边）
        // 新边的起点是 currentPolygon[length-1]，所以最后一条边 (currentPolygon[length-2], currentPolygon[length-1]) 与新边共享端点
        // 只需要检查到 length-2 之前的边
        for (let i = 0; i < currentPolygon.length - 1; i++) {
            const existingEdgeStart = currentPolygon[i];
            const existingEdgeEnd = currentPolygon[i + 1];

            if (doSegmentsIntersect(newEdgeStart, newEdgeEnd, existingEdgeStart, existingEdgeEnd)) {
                return true; // 发现相交
            }
        }

        // 如果当前有3个或以上的点，还需要检查闭合边（新点到第一个点）是否与已有边相交
        if (currentPolygon.length >= 3) {
            const firstPoint = currentPolygon[0];
            // 检查闭合边与中间的边（不包括第一条和最后一条，因为它们与闭合边共享端点）
            for (let i = 1; i < currentPolygon.length - 1; i++) {
                const existingEdgeStart = currentPolygon[i];
                const existingEdgeEnd = currentPolygon[i + 1];

                if (doSegmentsIntersect(newPoint, firstPoint, existingEdgeStart, existingEdgeEnd)) {
                    return true;
                }
            }
        }

        return false;
    };

    // 多边形点击绘制区域
    const handleCanvasClick = (e) => {
        if (!isDrawingRegion || !editingInference) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // 计算归一化坐标 (0-1)
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        const newPoint = [x, y];

        // 检查是否会产生自相交
        if (checkSelfIntersection(newPoint)) {
            toast.error('新的边不能与当前多边形已有的边相交');
            return;
        }

        setCurrentPolygon([...currentPolygon, newPoint]);
    };

    const handleFinishPolygon = () => {
        if (!editingInference) return;

        if (currentPolygon.length < 3) {
            toast.error('至少需要3个点才能形成多边形区域');
            return;
        }

        const newRegion = { lPolygon: currentPolygon };
        setEditingInference({
            ...editingInference,
            lRegionFilter: [...(editingInference.lRegionFilter || []), newRegion]
        });
        setCurrentPolygon([]);
        setIsDrawingRegion(false);
    };

    const handleCancelPolygon = () => {
        setCurrentPolygon([]);
        setIsDrawingRegion(false);
    };

    const handleDeleteRegion = (index) => {
        const newRegions = [...editingInference.lRegionFilter];
        newRegions.splice(index, 1);
        setEditingInference({
            ...editingInference,
            lRegionFilter: newRegions
        });
    };

    // 绘制canvas上的区域
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');

        // 设置canvas尺寸匹配视频容器
        const updateCanvasSize = () => {
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        };

        updateCanvasSize();

        // 使用 setTimeout 确保在 DOM 更新后再次更新尺寸
        const timeoutId = setTimeout(updateCanvasSize, 100);

        window.addEventListener('resize', updateCanvasSize);

        let animationFrameId;

        const drawRegions = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!editingInference) {
                animationFrameId = requestAnimationFrame(drawRegions);
                return;
            }

            // 绘制已保存的区域
            editingInference.lRegionFilter?.forEach((region, index) => {
                ctx.beginPath();
                ctx.strokeStyle = '#3b82f6';
                ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                ctx.lineWidth = 2;

                region.lPolygon.forEach((point, i) => {
                    const x = point[0] * canvas.width;
                    const y = point[1] * canvas.height;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // 绘制标签
                const labelText = `区域 ${index + 1}`;
                ctx.font = 'bold 14px sans-serif';
                const labelWidth = ctx.measureText(labelText).width;
                const firstPoint = region.lPolygon[0];
                const labelX = firstPoint[0] * canvas.width;
                const labelY = firstPoint[1] * canvas.height;

                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(labelX + 4, labelY + 4, labelWidth + 16, 24);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(labelText, labelX + 12, labelY + 21);
            });

            // 绘制正在绘制的多边形
            if (currentPolygon.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = '#ef4444';
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.lineWidth = 2;

                currentPolygon.forEach((point, i) => {
                    const x = point[0] * canvas.width;
                    const y = point[1] * canvas.height;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });

                // 如果有多个点，绘制线条
                if (currentPolygon.length > 1) {
                    ctx.stroke();
                }

                // 如果有3个或以上的点，显示半透明填充预览
                if (currentPolygon.length >= 3) {
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // 绘制每个点
                currentPolygon.forEach((point, i) => {
                    const x = point[0] * canvas.width;
                    const y = point[1] * canvas.height;

                    // 绘制点的外圈
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();

                    // 绘制点的内圈
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();

                    // 绘制点的序号
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(i + 1, x, y);
                });

                // 绘制提示信息
                if (currentPolygon.length > 0) {
                    const firstPoint = currentPolygon[0];
                    const x = firstPoint[0] * canvas.width;
                    const y = firstPoint[1] * canvas.height;

                    const tipText = currentPolygon.length < 3
                        ? `已添加 ${currentPolygon.length} 个点，至少需要 3 个点`
                        : `已添加 ${currentPolygon.length} 个点，点击"完成多边形"按钮`;

                    ctx.font = 'bold 14px sans-serif';
                    const textMetrics = ctx.measureText(tipText);
                    const textWidth = textMetrics.width;
                    const padding = 8;

                    const labelX = x;
                    const labelY = y - 40;

                    ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
                    ctx.fillRect(labelX, labelY, textWidth + padding * 2, 28);

                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'left';
                    ctx.fillText(tipText, labelX + padding, labelY + 18);
                }

                // 重置文本对齐
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            }

            animationFrameId = requestAnimationFrame(drawRegions);
        };

        drawRegions();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [editingInference, currentPolygon]);

    return (
        <div>
            {/* 已有的推理规则列表 */}
            {!editingInference && (<div>
                <div className="inference-list">
                    {tempRuleConfig.lInferenceSet.map((inference) => (
                        <div key={inference.sID} className="inference-item">
                            <div className="inference-header">
                                <span className="inference-name">{inference.sID}</span>
                                <div className="inference-actions">
                                    <button
                                        className="btn-small"
                                        onClick={() => {
                                            setEditingInference(inference);
                                            // 自动开启视频连接
                                            if (!isConnected && !isLoading) {
                                                createPeerConnection();
                                            }
                                        }}
                                    >
                                        编辑
                                    </button>
                                    <button
                                        className="btn-small btn-danger"
                                        onClick={() => handleDeleteInference(inference.sID)}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                            <div className="inference-details">
                                <span>置信度: {inference.lConfidenceFilter[0]} - {inference.lConfidenceFilter[1]}</span>
                                <span>类别: {inference.lClassFilter.join(', ')}</span>
                                <span>确认帧数: {inference.iDebounceTimes}</span>
                                <span>区域数: {inference.lRegionFilter?.length || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="btn btn-secondary" onClick={handleAddInference}>
                    添加推理规则
                </button>
            </div>)}

            {/* 推理规则编辑器 */}
            {editingInference && (
                <div className="inference-editor">
                    <h5>编辑推理规则</h5>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>规则名称</label>
                            <input
                                type="text"
                                className="input-field"
                                value={editingInference.sID}
                                onChange={(e) => setEditingInference({ ...editingInference, sID: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>确认帧数</label>
                            <input
                                type="number"
                                className="input-field"
                                value={editingInference.iDebounceTimes}
                                onChange={(e) => setEditingInference({ ...editingInference, iDebounceTimes: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>置信度范围: {editingInference.lConfidenceFilter[0].toFixed(2)} - {editingInference.lConfidenceFilter[1].toFixed(2)}</label>
                            <div ref={rangeContainerRef} className="confidence-range-container">
                                {/* 轨道背景 */}
                                <div className="confidence-range-track" />

                                {/* 选中区域 */}
                                <div
                                    className="confidence-range-selected"
                                    style={{
                                        left: `${editingInference.lConfidenceFilter[0] * 100}%`,
                                        width: `${(editingInference.lConfidenceFilter[1] - editingInference.lConfidenceFilter[0]) * 100}%`
                                    }}
                                />

                                {/* 最小值滑块 */}
                                <div
                                    className={`confidence-slider ${draggingSlider === 'min' ? 'dragging' : ''}`}
                                    onMouseDown={handleSliderMouseDown('min')}
                                    style={{
                                        left: `${editingInference.lConfidenceFilter[0] * 100}%`
                                    }}
                                />

                                {/* 最大值滑块 */}
                                <div
                                    className={`confidence-slider ${draggingSlider === 'max' ? 'dragging' : ''}`}
                                    onMouseDown={handleSliderMouseDown('max')}
                                    style={{
                                        left: `${editingInference.lConfidenceFilter[1] * 100}%`
                                    }}
                                />
                            </div>
                        </div>


                    </div>
                    <div className="form-group form-group-full">
                        <label className="class-filter-label">
                            类别筛选
                            <span className="class-filter-count">
                                已选择 {editingInference.lClassFilter.length} 个类别
                            </span>
                        </label>
                        {modelInfo.classes.length === 0 ? (
                            <p className="class-filter-empty">
                                暂无可用类别，请先上传并配置模型
                            </p>
                        ) : (
                            <div className="class-filter-container">
                                <div className="class-filter-grid">
                                    {modelInfo.classes.map((classItem, index) => {
                                        const isSelected = editingInference.lClassFilter.includes(index);
                                        return (
                                            <div
                                                key={index}
                                                className={`class-filter-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setEditingInference({
                                                        ...editingInference,
                                                        lClassFilter: isSelected
                                                            ? editingInference.lClassFilter.filter(item => item !== index)
                                                            : [...editingInference.lClassFilter, index].sort((a, b) => a - b)
                                                    });
                                                }}
                                            >
                                                {isSelected && (
                                                    <span className="class-filter-checkmark">
                                                        ✓
                                                    </span>
                                                )}
                                                {classItem}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 区域绘制 - 带视频预览 */}
                    <div className="region-editor">
                        <label>触发区域</label>

                        {/* 视频播放器控制 */}
                        <div className="video-controls">
                            {!isConnected ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={createPeerConnection}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "连接中..." : "开始视频预览"}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-secondary"
                                    onClick={closeConnection}
                                >
                                    停止视频预览
                                </button>
                            )}
                            <span className={`video-status ${isConnected ? 'connected' : 'disconnected'}`}>
                                {isConnected ? '● 已连接' : '○ 未连接'}
                            </span>
                        </div>

                        {/* 视频容器 */}
                        <div className="inference-video-container">
                            <div ref={containerRef} className="inference-video-wrapper">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="inference-video"
                                />
                                <canvas
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    className={`inference-canvas ${isDrawingRegion ? 'drawing' : ''}`}
                                />
                                {!isConnected && !isLoading && !error && (
                                    <div className="video-overlay video-overlay-placeholder">
                                        <div className="video-overlay-content">
                                            <div className="video-overlay-icon">📹</div>
                                            <div>点击"开始视频预览"查看画面</div>
                                        </div>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="video-overlay video-overlay-loading">
                                        正在连接...
                                    </div>
                                )}
                                {error && (
                                    <div className="video-overlay video-overlay-error">
                                        <div className="video-overlay-content">
                                            <div className="video-overlay-icon">⚠️</div>
                                            <div>连接错误: {error}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="region-controls">
                            {!isDrawingRegion ? (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setIsDrawingRegion(true)}
                                    disabled={!isConnected}
                                >
                                    {isConnected ? '开始绘制多边形区域' : '请先连接视频预览'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleFinishPolygon}
                                        disabled={currentPolygon.length < 3}
                                    >
                                        完成多边形 ({currentPolygon.length} 个点)
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleCancelPolygon}
                                    >
                                        取消
                                    </button>
                                    <span className="region-draw-hint">
                                        提示: 在画面上点击添加多边形顶点，至少需要3个点
                                    </span>
                                </>
                            )}
                        </div>

                        {/* 已绘制的区域列表 */}
                        {editingInference.lRegionFilter?.length > 0 && (
                            <div className="region-list">
                                <h6>已添加的区域:</h6>
                                {editingInference.lRegionFilter.map((region, index) => (
                                    <div key={index} className="region-item">
                                        <span>区域 {index + 1} ({region.lPolygon.length} 个点)</span>
                                        <button
                                            className="btn-small btn-danger"
                                            onClick={() => handleDeleteRegion(index)}
                                        >
                                            删除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="button-group">
                        <button className="btn btn-primary" onClick={handleSaveInference}>
                            保存规则
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setEditingInference(null);
                                setIsDrawingRegion(false);
                                setCurrentPolygon([]);
                                // 可选：关闭视频连接以节省资源
                                // closeConnection();
                            }}
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InferenceConfig;
