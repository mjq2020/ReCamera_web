import React, { useRef, useEffect, useState, useCallback } from "react";
import "./PreviewPage.css";
import { toast } from "../base/Toast";

// WebRTC配置
const PC_CONFIG = {
    bundlePolicy: 'max-bundle',
    iceServers: [
        { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }
    ],
    sdpSemantics: 'unified-plan'
};

export default function PreviewPage() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionMode, setConnectionMode] = useState('');
    const [currentStream, setCurrentStream] = useState('main'); // 'main' or 'sub'
    const [isMuted, setIsMuted] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSwitchingStream, setIsSwitchingStream] = useState(false); // 是否正在切换码流
    const [isFullscreen, setIsFullscreen] = useState(false); // 是否全屏
    const [recordQuality, setRecordQuality] = useState('high'); // 录制质量: 'high', 'medium', 'low'
    const recordingTimerRef = useRef(null);
    const isSwitchingStreamRef = useRef(false); // 用ref存储切换状态，避免闭包问题

    // 生成WebSocket URL
    const getWsUrl = useCallback((stream) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // 根据码流选择不同的源
        const src = stream === 'main' ? 'main' : 'sub';
        return `${protocol}//${host}/go2rtc/api/ws?src=${src}`;
    }, []);

    // 自动播放视频（改进 Edge 兼容性）
    const playVideo = useCallback(() => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        console.log("尝试播放视频", {
            srcObject: !!video.srcObject,
            readyState: video.readyState,
            paused: video.paused
        });

        // 确保视频已加载
        const attemptPlay = () => {
            video.play()
                .then(() => {
                    console.log("视频播放成功");
                })
                .catch((err) => {
                    console.warn("自动播放失败:", err.name, err.message);
                    // 如果失败，尝试静音后播放（Edge 的自动播放策略）
                    if (!video?.muted) {
                        video.muted = true;
                        setIsMuted(true);
                        video?.play()
                            .then(() => {
                                console.log("静音后视频播放成功");
                            })
                            .catch(err2 => {
                                console.error("静音后仍然无法播放:", err2);
                            });
                    }
                });
        };

        // 如果视频还没准备好，等待 loadedmetadata 事件
        if (video.readyState < 2) {
            console.log("等待视频元数据加载...");
            video.addEventListener('loadedmetadata', attemptPlay, { once: true });
        } else {
            attemptPlay();
        }
    }, []);

    // 初始化 WebRTC 连接（改进 Edge 兼容性）
    const setupWebRTC = useCallback(() => {
        if (!videoRef.current || !wsRef.current) return;

        console.log("初始化 WebRTC 连接");
        console.log("浏览器信息:", {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor
        });

        const pc = new RTCPeerConnection(PC_CONFIG);
        pcRef.current = pc;
        const ws = wsRef.current;
        const video = videoRef.current;

        // 创建一个 MediaStream 来接收轨道
        const stream = new MediaStream();
        video.srcObject = stream;

        // 添加接收视频和音频的 transceiver
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // 监听轨道添加事件（这对 Edge 很重要）
        pc.addEventListener('track', (event) => {
            console.log("收到轨道:", event.track.kind, {
                id: event.track.id,
                readyState: event.track.readyState,
                enabled: event.track.enabled
            });

            // 将轨道添加到 MediaStream
            if (event.streams && event.streams[0]) {
                video.srcObject = event.streams[0];
                console.log("使用 event.streams[0] 设置视频流");
            } else {
                stream.addTrack(event.track);
                console.log("手动添加轨道到 MediaStream");
            }

            // 当收到视频轨道时尝试播放
            if (event.track.kind === 'video') {
                console.log("收到视频轨道，准备播放");
                // 延迟一点确保所有轨道都添加完成
                setTimeout(() => {
                    playVideo();
                }, 100);
            }
        });

        console.log("视频流已设置到 video 元素");

        // 处理连接状态变化
        pc.addEventListener('connectionstatechange', () => {
            console.log("WebRTC 连接状态:", pc.connectionState);

            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsLoading(false);
                setConnectionMode('WebRTC');
                console.log("WebRTC 连接成功");
                // 连接成功后再次尝试播放
                setTimeout(() => playVideo(), 200);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.warn("WebRTC 连接失败或断开");
                pc.close();
                pcRef.current = null;
                setIsConnected(false);
                setError("WebRTC 连接失败");
                setIsLoading(false);
            }
        });

        // 监听 ICE 连接状态（帮助调试 Edge 问题）
        pc.addEventListener('iceconnectionstatechange', () => {
            console.log("ICE 连接状态:", pc.iceConnectionState);
        });

        pc.addEventListener('icegatheringstatechange', () => {
            console.log("ICE 收集状态:", pc.iceGatheringState);
        });

        // 处理 ICE 候选
        pc.addEventListener('icecandidate', (ev) => {
            if (ev.candidate) {
                console.log("发送 ICE candidate:", ev.candidate.candidate.substring(0, 50) + "...");
                const msg = {
                    type: 'webrtc/candidate',
                    value: ev.candidate.candidate
                };
                ws.send(JSON.stringify(msg));
            } else {
                console.log("ICE 候选收集完成");
            }
        });

        // 创建并发送 offer（改进编解码器配置以兼容 Edge）
        pc.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true
        })
            .then(offer => {
                console.log("创建的 offer:", {
                    type: offer.type,
                    sdp_length: offer.sdp.length
                });
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                console.log("本地描述已设置");
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

        // 处理 WebSocket 消息
        ws.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                try {
                    const msg = JSON.parse(event.data);
                    console.log("收到消息:", msg.type);

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
                } catch (err) {
                    console.error("解析消息失败:", err);
                }
            }
        };
    }, [playVideo]);

    // 创建 WebSocket 连接
    const createPeerConnection = useCallback(async (stream = currentStream) => {
        try {
            setIsLoading(true);
            setError(null);
            setConnectionMode('');

            const wsUrl = getWsUrl(stream);
            console.log("开始连接到:", wsUrl);

            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket 连接已建立");
                setupWebRTC();
            };

            ws.onerror = (error) => {
                console.error("WebSocket 错误:", error);
                setError("WebSocket 连接错误");
                setIsLoading(false);
            };

            ws.onclose = () => {
                console.log("WebSocket 连接已关闭");
                setIsConnected(false);
                setIsLoading(false);
                // 如果正在切换码流，不显示错误信息（使用ref避免闭包问题）
                if (!isSwitchingStreamRef.current) {
                    setError("连接已断开");
                }
            };

        } catch (err) {
            console.error("创建连接失败:", err);
            setError(err.message || "连接失败");
            setIsLoading(false);
        }
    }, [currentStream, getWsUrl, setupWebRTC]);

    useEffect(() => {
        createPeerConnection()
    }, []);

    // 停止录制（内部函数，不依赖状态）
    const stopRecordingInternal = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
                console.log("内部停止录制");
            } catch (err) {
                console.warn("停止录制时出错:", err);
            }
        }

        // 清除计时器
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        setIsRecording(false);
    }, []);

    // 关闭连接
    const closeConnection = useCallback((skipRecordingStop = false) => {
        console.log("关闭所有连接");

        // 停止录制（如果正在录制）
        if (!skipRecordingStop) {
            stopRecordingInternal();
        }

        // 关闭 RTCPeerConnection
        if (pcRef.current) {
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

        setIsConnected(false);
        if (!isSwitchingStreamRef.current) {
            setError(null);
        }
        setIsLoading(false);
        setConnectionMode('');
    }, [stopRecordingInternal]);

    // 拍照功能
    const takeSnapshot = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !isConnected) {
            console.warn("无法拍照：视频未连接");
            return;
        }

        // 设置canvas尺寸为视频实际尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 绘制当前帧到canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 转换为图片并下载
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                a.download = `snapshot_${timestamp}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("拍照成功");
            }
        }, 'image/png');
    }, [isConnected]);

    // 开始录制（高清晰度版本）
    const startRecording = useCallback(() => {
        const video = videoRef.current;
        if (!video || !video.srcObject || !isConnected) {
            console.warn("无法开始录制：视频未连接");
            toast.alert("请先连接视频流");
            return;
        }

        try {
            // 创建一个新的MediaStream，包含视频和音频轨道
            const stream = video.srcObject;
            
            // 检查是否有视频轨道
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            console.log(`视频轨道数: ${videoTracks.length}, 音频轨道数: ${audioTracks.length}`);
            
            if (videoTracks.length === 0) {
                throw new Error("没有可用的视频轨道");
            }

            // 获取视频尺寸来计算合适的比特率
            const videoWidth = video.videoWidth || 1920;
            const videoHeight = video.videoHeight || 1080;
            const pixelCount = videoWidth * videoHeight;
            
            // 根据用户选择的质量和分辨率动态计算比特率
            // 质量倍率: high=1.0, medium=0.6, low=0.3
            const qualityMultiplier = {
                'high': 1.0,    // 高质量：接近无损
                'medium': 0.6,  // 中等质量：平衡
                'low': 0.3      // 低质量：节省空间
            }[recordQuality];

            // 基础比特率计算
            // 1080p (1920x1080) = 2,073,600 pixels -> 10-12 Mbps (high)
            // 720p (1280x720) = 921,600 pixels -> 6-8 Mbps (high)
            // 480p (640x480) = 307,200 pixels -> 3-4 Mbps (high)
            let baseBitrate;
            if (pixelCount >= 2000000) { // >= 1080p
                baseBitrate = 12000000; // 12 Mbps
            } else if (pixelCount >= 900000) { // >= 720p
                baseBitrate = 8000000; // 8 Mbps
            } else if (pixelCount >= 300000) { // >= 480p
                baseBitrate = 4000000; // 4 Mbps
            } else {
                baseBitrate = 2000000; // 2 Mbps
            }

            const videoBitrate = Math.round(baseBitrate * qualityMultiplier);
            const audioBitrate = recordQuality === 'high' ? 192000 : 128000; // 192/128 kbps for audio

            console.log(`视频分辨率: ${videoWidth}x${videoHeight}, 质量: ${recordQuality}, 比特率: ${(videoBitrate / 1000000).toFixed(1)} Mbps`);

            // 优先尝试高质量编解码器
            let options;
            const codecConfigs = [
                // VP9 提供更好的质量和压缩率
                {
                    mimeType: 'video/webm;codecs=vp9,opus',
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: audioBitrate
                },
                // H.264 (如果支持的话，兼容性最好)
                {
                    mimeType: 'video/webm;codecs=h264,opus',
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: audioBitrate
                },
                // VP8 作为备选
                {
                    mimeType: 'video/webm;codecs=vp8,opus',
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: audioBitrate
                },
                // 只有视频的 VP9
                {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: videoBitrate
                },
                // 只有视频的 VP8
                {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: videoBitrate
                },
                // 通用 WebM
                {
                    mimeType: 'video/webm',
                    videoBitsPerSecond: videoBitrate
                }
            ];

            for (const config of codecConfigs) {
                if (MediaRecorder.isTypeSupported(config.mimeType)) {
                    options = config;
                    console.log(`使用编解码器: ${config.mimeType}, 视频比特率: ${(config.videoBitsPerSecond / 1000000).toFixed(1)} Mbps`);
                    break;
                }
            }

            if (!options) {
                // 如果都不支持，使用默认配置但提高比特率
                options = { 
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: audioBitrate
                };
                console.warn("使用默认编解码器，比特率:", (videoBitrate / 1000000).toFixed(1), "Mbps");
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];

            // 数据可用事件
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    console.log(`录制数据块: ${event.data.size} bytes, 总块数: ${recordedChunksRef.current.length}`);
                }
            };

            // 停止事件
            mediaRecorder.onstop = () => {
                console.log(`录制停止，总共 ${recordedChunksRef.current.length} 个数据块`);
                
                if (recordedChunksRef.current.length === 0) {
                    console.warn("没有录制到任何数据");
                    toast.error("录制失败：没有录制到数据");
                    return;
                }

                const blob = new Blob(recordedChunksRef.current, {
                    type: options.mimeType || 'video/webm'
                });
                
                console.log(`创建Blob，大小: ${blob.size} bytes`);
                
                if (blob.size === 0) {
                    console.error("Blob大小为0");
                    toast.error("录制失败：文件为空");
                    return;
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const extension = options.mimeType?.includes('mp4') ? 'mp4' : 'webm';
                a.download = `recording_${timestamp}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // 延迟释放URL，确保下载完成
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000);
                
                console.log(`录制已保存: ${a.download}`);
                toast.success(`录制已保存: ${a.download}`);
            };

            // 错误事件
            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder错误:", event.error);
                toast.error(`录制错误: ${event.error?.message || '未知错误'}`);
                stopRecordingInternal();
            };

            // 开始录制
            mediaRecorder.start(1000); // 每秒收集一次数据
            setIsRecording(true);
            setRecordingTime(0);

            // 开始计时
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            console.log("开始录制，状态:", mediaRecorder.state);
        } catch (err) {
            console.error("开始录制失败:", err);
            toast.error(`开始录制失败: ${err.message}`);
            setIsRecording(false);
        }
    }, [isConnected, stopRecordingInternal]);

    // 停止录制（用户调用的函数）
    const stopRecording = useCallback(() => {
        console.log("用户请求停止录制");
        stopRecordingInternal();
    }, [stopRecordingInternal]);

    // 切换码流
    const switchStream = useCallback((stream) => {
        if (stream === currentStream) return;
        if (isSwitchingStreamRef.current) return; // 防止重复切换

        // 如果正在录制，先提示用户
        if (isRecording) {
            toast.confirm("正在录制中，切换码流将停止录制。是否继续？").then(confirmed => {
                if (!confirmed) return;
            });
        }

        console.log(`切换码流: ${currentStream} -> ${stream}`);
        
        // 设置切换状态（同时更新state和ref）
        setIsSwitchingStream(true);
        isSwitchingStreamRef.current = true;
        setError(null); // 清除错误信息
        
        // 先关闭当前连接（包括停止录制）
        closeConnection();
        
        // 更新码流状态
        setCurrentStream(stream);
        
        // 延迟一点时间后建立新连接
        setTimeout(async () => {
            try {
                console.log(`开始建立新连接，码流: ${stream}`);
                await createPeerConnection(stream);
                console.log("新连接建立成功");
            } catch (err) {
                console.error("切换码流失败:", err);
                toast.error(`切换码流失败: ${err.message}`);
            } finally {
                // 切换完成后重置状态
                setTimeout(() => {
                    setIsSwitchingStream(false);
                    isSwitchingStreamRef.current = false;
                    console.log("码流切换完成");
                }, 1000);
            }
        }, 300);
    }, [currentStream, isRecording, closeConnection, createPeerConnection]);

    // 切换静音
    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current?.muted;
            setIsMuted(videoRef.current?.muted);
        }
    }, []);

    // 切换全屏
    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            // 进入全屏
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) { // Safari
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) { // Firefox
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) { // IE/Edge
                container.msRequestFullscreen();
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
        }
    }, []);

    // 监听全屏状态变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyPress = (e) => {
            // F键或f键 - 切换全屏
            if ((e.key === 'f' || e.key === 'F') && isConnected && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // 确保不是在输入框中
                const target = e.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    toggleFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [isConnected, toggleFullscreen]);

    // 格式化录制时间
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 监听视频元素事件（帮助调试）
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const logEvent = (eventName) => (e) => {
            console.log(`视频事件 [${eventName}]:`, {
                readyState: video.readyState,
                networkState: video.networkState,
                paused: video.paused,
                currentTime: video.currentTime,
                duration: video.duration,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
            });
        };

        // 监听关键事件
        const events = [
            'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
            'playing', 'waiting', 'stalled', 'suspend', 'error'
        ];

        events.forEach(eventName => {
            video.addEventListener(eventName, logEvent(eventName));
        });

        // 特殊处理 error 事件
        const handleError = (e) => {
            console.error("视频错误:", {
                error: video.error,
                code: video.error?.code,
                message: video.error?.message
            });
        };
        video.addEventListener('error', handleError);

        return () => {
            events.forEach(eventName => {
                video.removeEventListener(eventName, logEvent(eventName));
            });
            video.removeEventListener('error', handleError);
        };
    }, []);

    // 清理资源
    useEffect(() => {
        return () => {
            closeConnection();
        };
    }, [closeConnection]);

    return (
        <div className="preview-page-container">
            <div className="preview-page-header">
                <h2>📹 实时预览</h2>
                <p className="page-description">实时查看摄像头画面，支持拍照、录制和码流切换</p>
            </div>

            <div className="preview-page-content">
                {/* 视频播放器区域 */}
                <div className="preview-player-section">
                    <div className="player-container">
                        <div className="video-wrapper" ref={containerRef}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted={isMuted}
                                className="video-player"
                                controls={false}
                                preload="auto"
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {/* 录制指示器 */}
                            {isRecording && (
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span className="recording-text">REC {formatTime(recordingTime)}</span>
                                </div>
                            )}

                            {/* 全屏控制按钮 */}
                            {isConnected && (
                                <button 
                                    className="fullscreen-button"
                                    onClick={toggleFullscreen}
                                    title={isFullscreen ? "退出全屏 (ESC)" : "全屏播放 (F)"}
                                >
                                    {isFullscreen ? '⛶' : '⛶'}
                                </button>
                            )}

                            {/* 状态覆盖层 */}
                            {!isConnected && !isLoading && !error && !isSwitchingStream && (
                                <div className="video-overlay">
                                    <div className="overlay-content">
                                        <div className="overlay-icon">📹</div>
                                        <div className="overlay-text">点击"开始播放"查看实时视频</div>
                                    </div>
                                </div>
                            )}
                            {(isLoading || isSwitchingStream) && (
                                <div className="video-overlay">
                                    <div className="overlay-content">
                                        <div className="spinner"></div>
                                        <div className="overlay-text">
                                            {isSwitchingStream ? "正在切换码流..." : "正在连接..."}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {error && !isSwitchingStream && (
                                <div className="video-overlay error">
                                    <div className="overlay-content">
                                        <div className="overlay-icon">⚠️</div>
                                        <div className="overlay-text">连接错误: {error}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 控制按钮区域 */}
                        <div className="player-controls">
                            <div className="control-group">
                                {!isConnected ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => createPeerConnection()}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "连接中..." : "▶️ 开始播放"}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-danger"
                                        onClick={closeConnection}
                                    >
                                        ⏹️ 停止播放
                                    </button>
                                )}
                            </div>

                            <div className="connection-status">
                                <span className={`status-dot ${isConnected ? "connected" : ""}`}></span>
                                <span className="status-text">
                                    {isConnected
                                        ? `已连接 ${connectionMode ? `(${connectionMode})` : ''}`
                                        : "未连接"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 功能控制区域 */}
                <div className="preview-controls-section">
                    <div className="control-panel">
                        <h3>🎛️ 功能控制</h3>

                        {/* 拍照功能 */}
                        <div className="control-section">
                            <h4>📸 拍照</h4>
                            <p className="control-desc">保存当前画面为图片</p>
                            <button
                                className="btn btn-primary btn-full"
                                onClick={takeSnapshot}
                                disabled={!isConnected}
                            >
                                📸 拍照
                            </button>
                        </div>

                        {/* 录制功能 */}
                        <div className="control-section">
                            <h4>🎥 录制</h4>
                            <p className="control-desc">录制视频并保存到本地</p>
                            
                            {/* 录制质量选择 */}
                            {/* {!isRecording && (
                                <div className="quality-selector">
                                    <label className="quality-label">录制质量：</label>
                                    <div className="quality-buttons">
                                        <button
                                            className={`btn btn-small ${recordQuality === 'high' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setRecordQuality('high')}
                                            disabled={!isConnected}
                                            title="高质量 (12 Mbps) - 文件大"
                                        >
                                            高清
                                        </button>
                                        <button
                                            className={`btn btn-small ${recordQuality === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setRecordQuality('medium')}
                                            disabled={!isConnected}
                                            title="中等质量 (6-8 Mbps) - 推荐"
                                        >
                                            标清
                                        </button>
                                        <button
                                            className={`btn btn-small ${recordQuality === 'low' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setRecordQuality('low')}
                                            disabled={!isConnected}
                                            title="低质量 (3-4 Mbps) - 文件小"
                                        >
                                            流畅
                                        </button>
                                    </div>
                                </div>
                            )} */}

                            {!isRecording ? (
                                <button
                                    className="btn btn-danger btn-full"
                                    onClick={startRecording}
                                    disabled={!isConnected}
                                >
                                    ⏺️ 开始录制
                                </button>
                            ) : (
                                <button
                                    className="btn btn-secondary btn-full recording-btn"
                                    onClick={stopRecording}
                                >
                                    ⏹️ 停止录制 ({formatTime(recordingTime)})
                                </button>
                            )}
                        </div>

                        {/* 码流切换 */}
                        <div className="control-section">
                            <h4>🔄 码流切换</h4>
                            <p className="control-desc">在主码流和子码流之间切换</p>
                            <div className="stream-buttons">
                                <button
                                    className={`btn ${currentStream === 'main' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => switchStream('main')}
                                    disabled={!isConnected || isLoading}
                                >
                                    主码流
                                </button>
                                <button
                                    className={`btn ${currentStream === 'sub' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => switchStream('sub')}
                                    disabled={!isConnected || isLoading}
                                >
                                    子码流
                                </button>
                            </div>
                        </div>

                        {/* 音频控制 */}
                        <div className="control-section">
                            <h4>🔊 音频控制</h4>
                            <p className="control-desc">控制视频音频播放</p>
                            <button
                                className="btn btn-secondary btn-full"
                                onClick={toggleMute}
                                disabled={!isConnected}
                            >
                                {isMuted ? "🔇 取消静音" : "🔊 静音"}
                            </button>
                        </div>

                        {/* 全屏控制 */}
                        {/* <div className="control-section">
                            <h4>🖥️ 显示控制</h4>
                            <p className="control-desc">全屏播放视频画面</p>
                            <button
                                className="btn btn-secondary btn-full"
                                onClick={toggleFullscreen}
                                disabled={!isConnected}
                            >
                                {isFullscreen ? "⛶ 退出全屏" : "⛶ 全屏播放"}
                            </button>
                        </div> */}
                    </div>

                    {/* 使用说明 */}
                    {/* <div className="info-panel">
                        <h3>ℹ️ 使用说明</h3>
                        <ul className="info-list">
                            <li>
                                <strong>开始播放：</strong>点击"开始播放"按钮连接实时视频流
                            </li>
                            <li>
                                <strong>拍照：</strong>保存当前画面为PNG图片到本地
                            </li>
                            <li>
                                <strong>录制：</strong>录制视频并保存为WebM格式到本地
                            </li>
                            <li>
                                <strong>码流切换：</strong>主码流清晰度高，子码流占用带宽少
                            </li>
                            <li>
                                <strong>静音：</strong>控制是否播放视频声音
                            </li>
                            <li>
                                <strong>全屏播放：</strong>点击全屏按钮或按 F 键进入全屏，按 ESC 键退出
                            </li>
                        </ul>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

