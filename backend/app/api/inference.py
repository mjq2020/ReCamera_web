from __future__ import annotations

import asyncio
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, Query, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from ..dependencies import require_auth
from ..schemas.inference import (
    AlgorithmSupport,
    InferenceConfig,
    InferenceStatus,
    ModelInfo,
    ModelListItem,
    NotifyConfig,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["inference"])


# ============= 模型管理 =============

@router.get("/model/list", response_model=List[ModelListItem])
def get_model_list(_: str = Depends(require_auth)) -> List[ModelListItem]:
    """获取设备已有模型列表"""
    # 模拟返回模型列表
    print(111)
    return [
        ModelListItem(
            model="yolov5.rknn",
            modelInfo=ModelInfo(
                name="yolov5",
                framework="rknn",
                version="1.0.0",
                category="Detection",
                algorithm="YOLOV5",
                description="YOLOv5 目标检测模型",
                classes=["person", "car", "bus", "truck"],
                metrics={"iou": 60, "confidence": 60, "topk": 100},
                author="Seeed Studio",
                size=1110,
                md5sum="b3312af49a5d59a2533c973695a2267a",
            ),
        ),
        ModelListItem(
            model="yolov8.rknn",
            modelInfo=None,  # 没有找到模型信息
        ),
    ]


@router.post("/model/upload")
async def upload_model(
    request: Request,
    upload_type: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    file_name: Optional[str] = Query(None, alias="File-name"),
    md5sum: Optional[str] = Query(None),
    _: str = Depends(require_auth),
):
    """上传模型（支持分段上传和断点续传）"""
    
    # 开始上传
    if upload_type == "resumable":
        file_id = secrets.token_hex(16)
        return Response(
            status_code=200,
            headers={"File-Id": file_id},
        )
    
    # 上传模型内容
    if id:
        # 接收二进制内容
        body = await request.body()
        # 这里应该保存到临时文件
        return JSONResponse({"status": "success"})
    
    # 结束上传
    if start and file_name:
        # 验证 md5sum 并保存文件
        return JSONResponse({"status": "success", "message": "模型上传完成"})
    
    return JSONResponse({"status": 0, "message": "Invalid request"}, status_code=400)


@router.delete("/model/delete")
def delete_model(
    file_name: str = Query(..., alias="File-name"),
    _: str = Depends(require_auth),
):
    """删除模型"""
    # 模拟删除模型
    return JSONResponse({"status": 1, "message": "模型删除成功"})


@router.get("/model/info", response_model=ModelInfo)
def get_model_info(
    file_name: str = Query(..., alias="File-name"),
    _: str = Depends(require_auth),
) -> ModelInfo:
    """获取模型信息"""
    # 模拟返回模型信息
    return ModelInfo(
        name="yolov5",
        framework="rknn",
        version="1.0.0",
        category="Object Detection",
        algorithm="YOLOV5",
        description="YOLOv5 目标检测模型",
        classes=["person", "car", "bus", "truck"],
        metrics={"iou": 60, "confidence": 60, "topk": 100},
        author="Seeed Studio",
        size=1110,
        md5sum="b3312af49a5d59a2533c973695a2267a",
    )


@router.post("/model/info", response_model=ModelInfo)
def set_model_info(
    payload: ModelInfo,
    file_name: str = Query(..., alias="File-name"),
    _: str = Depends(require_auth),
) -> ModelInfo:
    """设置或添加模型信息"""
    # 保存模型信息
    return payload


@router.get("/model/algorithm", response_model=AlgorithmSupport)
def get_algorithm_support(_: str = Depends(require_auth)) -> AlgorithmSupport:
    """获取当前支持的模型算法"""
    return AlgorithmSupport(
        lDetection=["yolov5", "yolov8", "yolov10"],
        lClassification=["resnet", "mobilenet"],
        lSegmentation=["unet", "deeplabv3"],
        lTracking=["bytetrack", "deepsort"],
        lKeypoint=["hrnet", "openpose"],
    )


# ============= 推理管理 =============

@router.get("/model/inference", response_model=InferenceStatus)
def get_inference_status(
    id: int = Query(0),
    _: str = Depends(require_auth),
) -> InferenceStatus:
    """获取推理状态"""
    # 从 state 获取推理状态
    if "inference_status" not in state.__dict__:
        state.inference_status = {
            "iEnable": 1,
            "sStatus": "running",
            "sModel": "yolov5.rknn",
            "iFPS": 30,
        }
    return InferenceStatus(**state.inference_status)


@router.post("/model/inference", response_model=InferenceStatus)
def set_inference_config(
    payload: InferenceConfig,
    id: int = Query(0),
    _: str = Depends(require_auth),
) -> InferenceStatus:
    """推理配置"""
    # 更新推理配置
    state.inference_status = {
        "iEnable": payload.iEnable,
        "sStatus": "running" if payload.iEnable == 1 else "stop",
        "sModel": payload.sModel,
        "iFPS": payload.iFPS,
    }
    return InferenceStatus(**state.inference_status)


# ============= 推理输出配置 =============

@router.get("/notify/cfg", response_model=NotifyConfig)
def get_notify_config(_: str = Depends(require_auth)) -> NotifyConfig:
    """获取推理输出配置"""
    # 从 state 获取通知配置
    if "notify_config" not in state.__dict__:
        state.notify_config = {
            "iMode": 1,
            "dTemplate": {
                "sDetection": "{timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
                "sClassification": "",
                "sSegmentation": "",
                "sTracking": "",
                "sKeypoint": "",
                "sOBB": "",
            },
            "dMqtt": {
                "sURL": "mqtt.example.com",
                "iPort": 1883,
                "sTopic": "results/data",
                "sUsername": "name",
                "sPassword": "root",
            },
            "dUart": {
                "sPort": "/dev/ttyS0",
                "iBaudRate": 115200,
            },
            "dHttp": {
                "sUrl": "http://192.168.1.111/results/data",
                "sToken": "admin xxx",
            },
        }
    return NotifyConfig(**state.notify_config)


@router.post("/notify/cfg", response_model=NotifyConfig)
def set_notify_config(
    payload: NotifyConfig,
    _: str = Depends(require_auth),
) -> NotifyConfig:
    """推理输出配置"""
    state.notify_config = payload.model_dump()
    return NotifyConfig(**state.notify_config)


# ============= WebSocket 接口 =============

@router.websocket("/ws/inference/results")
async def ws_inference_results(websocket: WebSocket):
    """推理结果输出"""
    await websocket.accept()
    try:
        while True:
            # 获取模板
            if "notify_config" in state.__dict__:
                template = state.notify_config.get("dTemplate", {}).get(
                    "sDetection",
                    "{timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
                )
            else:
                template = "{timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})"
            
            # 模拟推理结果
            template_vars = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "class": "person",
                "confidence": "0.85",
                "x1": 120,
                "y1": 80,
                "x2": 250,
                "y2": 300,
            }
            
            message = template.format(**template_vars)
            await websocket.send_text(message)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return


@router.websocket("/ws/system/logs")
async def ws_system_logs(websocket: WebSocket):
    """系统日志"""
    await websocket.accept()
    
    # 初次建立连接发送历史日志列表
    initial_logs = [
        {
            "sTimestamp": "1732262400",
            "sLevel": "INFO",
            "sData": "系统启动",
        },
        {
            "sTimestamp": "1732262460",
            "sLevel": "INFO",
            "sData": "网络连接成功",
        },
        {
            "sTimestamp": "1732262520",
            "sLevel": "INFO",
            "sData": "模型加载完成",
        },
    ]
    
    try:
        # 发送初始日志列表
        await websocket.send_json(initial_logs)
        
        # 后续增量发送
        while True:
            await asyncio.sleep(2)
            log_entry = {
                "sTimestamp": str(int(datetime.now().timestamp())),
                "sLevel": "INFO",
                "sData": f"模拟日志条目 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            }
            await websocket.send_json(log_entry)
    except WebSocketDisconnect:
        return


@router.websocket("/ws/system/terminal")
async def ws_system_terminal(websocket: WebSocket):
    """终端交互"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # 模拟终端输出
            await websocket.send_text(f"$ {data}\nMock terminal output for command: {data}")
    except WebSocketDisconnect:
        return
