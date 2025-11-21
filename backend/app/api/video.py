from __future__ import annotations

import asyncio
import cv2
import time
import logging
from typing import Dict, Set
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer
from av import VideoFrame
import numpy as np

# 配置日志
logger = logging.getLogger(__name__)

from ..dependencies import require_auth
from ..schemas.video import (
    EncodeSettings,
    OSDCharSettings,
    OSDInferenceSettings,
    OSDMaskSettings,
    StreamConfig,
    StreamUpdateRequest,
    WebRTCOffer,
    WebRTCAnswer,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["video"])

# 全局变量存储 peer connections
pcs: Set[RTCPeerConnection] = set()

# 视频文件路径
VIDEO_PATH = "/home/dq/github/RC2Web/test/people-walking.mp4"


class LocalVideoTrack(VideoStreamTrack):
    """
    从本地视频文件读取帧并通过 WebRTC 传输的视频轨道
    """
    
    def __init__(self, video_path: str):
        super().__init__()
        self.video_path = video_path
        self.cap = None
        self.fps = 30
        self._start_time = None
        self._frame_count = 0
        self._last_frame_time = None
        
    async def recv(self):
        """
        接收并返回视频帧
        """
        if self.cap is None:
            # 初始化视频捕获
            self.cap = cv2.VideoCapture(self.video_path)
            if not self.cap.isOpened():
                logger.error(f"无法打开视频文件: {self.video_path}")
                raise RuntimeError(f"无法打开视频文件: {self.video_path}")
            
            # 获取视频信息
            self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
            total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"视频已打开: {self.video_path}")
            logger.info(f"分辨率: {width}x{height}, FPS: {self.fps}, 总帧数: {total_frames}")
            
            self._start_time = time.time()
            self._last_frame_time = self._start_time
        
        # 计算帧率控制
        current_time = time.time()
        if self._frame_count > 0:
            elapsed_time = current_time - self._start_time
            expected_frame_time = self._frame_count / self.fps
            sleep_time = expected_frame_time - elapsed_time
            
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
        
        # 计算时间戳
        pts, time_base = await self.next_timestamp()
        
        # 读取一帧
        ret, frame = self.cap.read()
        
        # 如果视频结束，循环播放
        if not ret:
            logger.info("视频播放完毕，重新开始循环播放")
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            self._frame_count = 0
            self._start_time = time.time()
            ret, frame = self.cap.read()
            
        if not ret:
            logger.error("无法读取视频帧")
            raise RuntimeError("无法读取视频帧")
        
        # 将 BGR 转换为 RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 创建 VideoFrame
        new_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        new_frame.pts = pts
        new_frame.time_base = time_base
        
        self._frame_count += 1
        self._last_frame_time = time.time()
        
        return new_frame
    
    def stop(self):
        """
        停止视频轨道并释放资源
        """
        super().stop()
        if self.cap is not None:
            self.cap.release()
            logger.info(f"视频资源已释放: {self.video_path}")
    
    def __del__(self):
        """
        清理资源
        """
        if self.cap is not None:
            self.cap.release()


async def on_shutdown():
    """
    关闭所有 peer connections
    """
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


def _get_stream(stream_id: int) -> Dict[str, Dict]:
    if stream_id not in state.video_streams:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")
    return state.video_streams[stream_id]


@router.get("/video/{stream_id}/encode", response_model=EncodeSettings)
def get_encode(stream_id: int, _: str = Depends(require_auth)) -> EncodeSettings:
    stream = _get_stream(stream_id)
    return EncodeSettings(**stream.get("encode", {}))


@router.put("/video/{stream_id}/encode", response_model=EncodeSettings)
def update_encode(stream_id: int, payload: EncodeSettings, _: str = Depends(require_auth)) -> EncodeSettings:
    stream = _get_stream(stream_id)
    stream["encode"] = payload.model_dump()
    return EncodeSettings(**stream["encode"])


@router.get("/video/{stream_id}/osd-char", response_model=OSDCharSettings)
def get_osd_char(stream_id: int, _: str = Depends(require_auth)) -> OSDCharSettings:
    stream = _get_stream(stream_id)
    return OSDCharSettings(**stream.get("osd-char", {}))


@router.put("/video/{stream_id}/osd-char", response_model=OSDCharSettings)
def update_osd_char(stream_id: int, payload: OSDCharSettings, _: str = Depends(require_auth)) -> OSDCharSettings:
    stream = _get_stream(stream_id)
    stream["osd-char"] = payload.model_dump()
    return OSDCharSettings(**stream["osd-char"])


@router.get("/video/{stream_id}/osd-inference", response_model=OSDInferenceSettings)
def get_osd_inference(stream_id: int, _: str = Depends(require_auth)) -> OSDInferenceSettings:
    stream = _get_stream(stream_id)
    return OSDInferenceSettings(**stream.get("osd-inference", {}))


@router.post("/video/{stream_id}/osd-inference", response_model=OSDInferenceSettings)
def update_osd_inference(stream_id: int, payload: OSDInferenceSettings, _: str = Depends(require_auth)) -> OSDInferenceSettings:
    stream = _get_stream(stream_id)
    stream["osd-inference"] = payload.model_dump()
    return OSDInferenceSettings(**stream["osd-inference"])


@router.get("/video/{stream_id}/osd-mask", response_model=OSDMaskSettings)
def get_osd_mask(stream_id: int, _: str = Depends(require_auth)) -> OSDMaskSettings:
    stream = _get_stream(stream_id)
    return OSDMaskSettings(**stream.get("osd-mask", {}))


@router.post("/video/{stream_id}/osd-mask", response_model=OSDMaskSettings)
def update_osd_mask(stream_id: int, payload: OSDMaskSettings, _: str = Depends(require_auth)) -> OSDMaskSettings:
    stream = _get_stream(stream_id)
    stream["osd-mask"] = payload.model_dump()
    return OSDMaskSettings(**stream["osd-mask"])


@router.get("/video/{stream_id}/stream", response_model=StreamConfig)
def get_stream_config(stream_id: int, _: str = Depends(require_auth)) -> StreamConfig:
    stream = _get_stream(stream_id)
    return StreamConfig(**stream.get("stream", {}))


@router.post("/video/{stream_id}/stream", response_model=StreamConfig)
def update_stream_config(stream_id: int, payload: StreamUpdateRequest, _: str = Depends(require_auth)) -> StreamConfig:
    stream = _get_stream(stream_id)
    stream["stream"] = payload.model_dump()
    return StreamConfig(**stream["stream"])


@router.post("/webrtc/offer", response_model=WebRTCAnswer)
async def webrtc_offer(offer: WebRTCOffer, _: str = Depends(require_auth)) -> WebRTCAnswer:
    """
    处理 WebRTC offer 并返回 answer
    """
    # 检查视频文件是否存在
    if not Path(VIDEO_PATH).exists():
        logger.error(f"视频文件不存在: {VIDEO_PATH}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"视频文件不存在: {VIDEO_PATH}"
        )
    
    # 配置 ICE 服务器（用于 NAT 穿透）
    configuration = RTCConfiguration(
        iceServers=[
            RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
            RTCIceServer(urls=["stun:stun1.l.google.com:19302"]),
        ]
    )
    
    # 创建 RTCPeerConnection
    pc = RTCPeerConnection(configuration=configuration)
    pcs.add(pc)
    
    logger.info(f"创建新的 WebRTC 连接，当前活跃连接数: {len(pcs)}")
    
    # 创建本地视频轨道
    local_video = LocalVideoTrack(VIDEO_PATH)
    
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        """
        监听连接状态变化
        """
        logger.info(f"WebRTC 连接状态变化: {pc.connectionState}")
        if pc.connectionState == "connected":
            logger.info("WebRTC 连接已建立")
        elif pc.connectionState == "failed":
            logger.warning("WebRTC 连接失败")
            await pc.close()
            pcs.discard(pc)
            local_video.stop()
        elif pc.connectionState == "closed":
            logger.info("WebRTC 连接已关闭")
            pcs.discard(pc)
            local_video.stop()
    
    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        """
        监听 ICE 连接状态变化
        """
        logger.info(f"ICE 连接状态: {pc.iceConnectionState}")
    
    @pc.on("icegatheringstatechange")
    async def on_icegatheringstatechange():
        """
        监听 ICE 收集状态变化
        """
        logger.info(f"ICE 收集状态: {pc.iceGatheringState}")
    
    # 添加视频轨道到 peer connection
    pc.addTrack(local_video)
    logger.info("视频轨道已添加到 WebRTC 连接")
    
    try:
        # 设置远程描述
        await pc.setRemoteDescription(
            RTCSessionDescription(sdp=offer.sdp, type=offer.type)
        )
        logger.info("远程 SDP 描述已设置")
        
        # 创建 answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        logger.info("本地 SDP 描述已设置")
        
        # 返回 answer
        return WebRTCAnswer(
            sdp=pc.localDescription.sdp,
            type=pc.localDescription.type
        )
    except Exception as e:
        logger.error(f"处理 WebRTC offer 时发生错误: {str(e)}")
        await pc.close()
        pcs.discard(pc)
        local_video.stop()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理 WebRTC offer 失败: {str(e)}"
        )


@router.get("/webrtc/status")
async def webrtc_status(_: str = Depends(require_auth)) -> Dict:
    """
    获取 WebRTC 连接状态
    """
    video_exists = Path(VIDEO_PATH).exists()
    video_info = {}
    
    if video_exists:
        try:
            cap = cv2.VideoCapture(VIDEO_PATH)
            if cap.isOpened():
                video_info = {
                    "fps": cap.get(cv2.CAP_PROP_FPS),
                    "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
                    "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                    "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                    "duration": cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS) if cap.get(cv2.CAP_PROP_FPS) > 0 else 0
                }
                cap.release()
        except Exception as e:
            logger.error(f"读取视频信息失败: {str(e)}")
            video_info = {"error": str(e)}
    
    return {
        "active_connections": len(pcs),
        "video_path": VIDEO_PATH,
        "video_exists": video_exists,
        "video_info": video_info
    }
