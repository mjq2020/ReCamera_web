import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from '../../base/Toast';
import '../RecordPage.css';

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
    
    // Video connection states
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mainStream, setMainStream] = useState(true);
    
    // Inference editing states
    const [editingInference, setEditingInference] = useState(null);
    const [isDrawingRegion, setIsDrawingRegion] = useState(false);
    
    // Drawing states - 多边形点击绘制
    const [currentPolygon, setCurrentPolygon] = useState([]);

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
            lClassFilter: [0],
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

    // 多边形点击绘制区域
    const handleCanvasClick = (e) => {
        if (!isDrawingRegion || !editingInference) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // 计算归一化坐标 (0-1)
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        setCurrentPolygon([...currentPolygon, [x, y]]);
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

            {/* 推理规则编辑器 */}
            {editingInference && (
                <div className="inference-editor">
                    <h5>编辑推理规则</h5>

                    <div className="form-group">
                        <label>规则名称</label>
                        <input
                            type="text"
                            className="input-field"
                            value={editingInference.sID}
                            onChange={(e) => setEditingInference({ ...editingInference, sID: e.target.value })}
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>确认帧数</label>
                            <input
                                type="number"
                                className="input-field"
                                value={editingInference.iDebounceTimes}
                                onChange={(e) => setEditingInference({ ...editingInference, iDebounceTimes: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>最小置信度</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                className="input-field"
                                value={editingInference.lConfidenceFilter[0]}
                                onChange={(e) => setEditingInference({
                                    ...editingInference,
                                    lConfidenceFilter: [parseFloat(e.target.value), editingInference.lConfidenceFilter[1]]
                                })}
                            />
                        </div>
                        <div className="form-group">
                            <label>最大置信度</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                className="input-field"
                                value={editingInference.lConfidenceFilter[1]}
                                onChange={(e) => setEditingInference({
                                    ...editingInference,
                                    lConfidenceFilter: [editingInference.lConfidenceFilter[0], parseFloat(e.target.value)]
                                })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>类别筛选 (逗号分隔)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={editingInference.lClassFilter.join(',')}
                            onChange={(e) => setEditingInference({
                                ...editingInference,
                                lClassFilter: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
                            })}
                            placeholder="例如: 0,1,2"
                        />
                    </div>

                    {/* 区域绘制 - 带视频预览 */}
                    <div className="region-editor">
                        <label>触发区域</label>
                        
                        {/* 视频播放器控制 */}
                        <div className="video-controls" style={{ marginBottom: '10px' }}>
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
                            <span style={{ marginLeft: '10px', color: isConnected ? '#10b981' : '#6b7280' }}>
                                {isConnected ? '● 已连接' : '○ 未连接'}
                            </span>
                        </div>

                        {/* 视频容器 */}
                        <div className="video-container" style={{ 
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/9',
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '10px'
                        }}>
                            <div 
                                ref={containerRef}
                                style={{ 
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: isDrawingRegion ? 'crosshair' : 'default',
                                        pointerEvents: 'all',
                                        zIndex: 10
                                    }}
                                />
                                {!isConnected && !isLoading && !error && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        backdropFilter: 'blur(4px)',
                                        color: 'white',
                                        fontSize: '18px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                                            <div>点击"开始视频预览"查看画面</div>
                                        </div>
                                    </div>
                                )}
                                {isLoading && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        backdropFilter: 'blur(4px)',
                                        color: 'white'
                                    }}>
                                        正在连接...
                                    </div>
                                )}
                                {error && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(220, 38, 38, 0.1)',
                                        backdropFilter: 'blur(4px)',
                                        color: 'white'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
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
                                        style={{ marginLeft: '10px' }}
                                    >
                                        取消
                                    </button>
                                    <span style={{ marginLeft: '10px', color: '#3b82f6' }}>
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
