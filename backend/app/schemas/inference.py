from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# 模型信息相关
class ModelMetrics(BaseModel):
    """模型评估指标"""
    iou: Optional[int] = None
    confidence: Optional[int] = None
    topk: Optional[int] = None


class ModelInfo(BaseModel):
    """模型信息"""
    name: str = Field(..., description="模型名")
    framework: Literal["rknn", "rkllm"] = Field(..., description="模型类别")
    version: str = Field(..., description="版本号")
    category: str = Field(..., description="模型类型")
    algorithm: str = Field(..., description="模型算法")
    description: str = Field(..., description="模型描述")
    classes: List[str] = Field(default_factory=list, description="类别列表")
    metrics: ModelMetrics = Field(default_factory=ModelMetrics, description="评估指标")
    author: str = Field(..., description="作者")
    size: int = Field(..., description="模型大小")
    md5sum: str = Field(..., description="模型文件md5校验")


class ModelListItem(BaseModel):
    """模型列表项"""
    model: str = Field(..., description="模型文件名")
    modelInfo: Optional[ModelInfo] = Field(None, description="模型信息，可能为空")


# 算法支持
class AlgorithmSupport(BaseModel):
    """支持的算法"""
    lDetection: List[str] = Field(default_factory=list)
    lClassification: List[str] = Field(default_factory=list)
    lSegmentation: List[str] = Field(default_factory=list)
    lTracking: List[str] = Field(default_factory=list)
    lKeypoint: List[str] = Field(default_factory=list)


# 推理相关
class InferenceStatus(BaseModel):
    """推理状态"""
    iEnable: int = Field(..., description="使能推理, 0 为关闭推理, 1 使能推理")
    sStatus: Literal["running", "stop", "error"] = Field(..., description="推理的状态")
    sModel: str = Field(..., description="当前运行的模型")
    iFPS: int = Field(..., description="推理频率")


class InferenceConfig(BaseModel):
    """推理配置"""
    iEnable: int = Field(..., ge=0, le=1, description="使能推理, 0 为关闭推理, 1 使能推理")
    sModel: str = Field(..., description="当前运行的模型")
    iFPS: int = Field(..., ge=1, le=120, description="推理频率")


# 通知配置相关
class NotifyTemplate(BaseModel):
    """输出模板"""
    sDetection: str = Field(default="", description="检测模板")
    sClassification: str = Field(default="", description="分类模板")
    sSegmentation: str = Field(default="", description="分割模板")
    sTracking: str = Field(default="", description="跟踪模板")
    sKeypoint: str = Field(default="", description="关键点模板")
    sOBB: str = Field(default="", description="OBB模板")


class MqttConfig(BaseModel):
    """MQTT配置"""
    sURL: str = Field(..., description="broker 地址")
    iPort: int = Field(..., description="端口")
    sTopic: str = Field(..., description="topic")
    sUsername: str = Field(..., description="用户名")
    sPassword: str = Field(..., description="密码")
    # sClientId: str = Field(..., description="客户端ID")


class UartConfig(BaseModel):
    """串口配置"""
    sPort: str = Field(..., description="串口号")
    iBaudRate: int = Field(..., description="波特率")


class HttpConfig(BaseModel):
    """HTTP配置"""
    sUrl: str = Field(..., description="htpp api 接口")
    sToken: str = Field(..., description="token 鉴权")


class NotifyConfig(BaseModel):
    """通知配置"""
    iMode: int = Field(..., description="输出方式, 0: 关闭, 1: mqtt, 2: http, 3: uart")
    dTemplate: NotifyTemplate = Field(default_factory=NotifyTemplate, description="输出模板")
    dMqtt: Optional[MqttConfig] = Field(None, description="MQTT 配置")
    dUart: Optional[UartConfig] = Field(None, description="串口配置")
    dHttp: Optional[HttpConfig] = Field(None, description="HTTP配置")
