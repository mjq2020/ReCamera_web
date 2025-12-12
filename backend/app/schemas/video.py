from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


class StreamType(str, Enum):
    main = "mainStream"
    sub = "subStream"


class RateControlMode(str, Enum):
    cbr = "CBR"
    vbr = "VBR"


class RCQuality(str, Enum):
    highest = "highest"
    high = "high"
    medium = "medium"
    low = "low"


class EncodeSettings(BaseModel):
    id: int = Field(..., ge=0, le=1)
    sStreamType: StreamType
    sResolution: str = Field(..., pattern=r"^\d{2,4}\*\d{2,4}$")
    sOutputDataType: Literal["H.264", "H.265"]
    sFrameRate: str = Field(..., pattern=r"^\d{1,3}$")
    iMaxRate: int = Field(..., gt=0)
    iGOP: int = Field(..., gt=0)
    sRCMode: RateControlMode
    sRCQuality: RCQuality
    iMinRate: Optional[int] = Field(default=None, ge=0)
    iStreamSmooth: Optional[int] = Field(default=None, ge=0, le=100)
    iTargetRate: Optional[int] = Field(default=None, ge=0)
    sFrameRateIn: Optional[str] = None
    sGOPMode: Optional[str] = None
    sH264Profile: Optional[str] = None
    sSmart: Optional[Literal["open", "close"]] = None


class OSDAttribute(BaseModel):
    iOSDFontSize: int = Field(..., ge=0, le=128)
    sOSDFrontColor: str = Field(..., pattern=r"^[0-9a-fA-F]{6}$")
    sOSDFrontColorMode: Literal["customize", "auto", "black_white", "0", "1"]


class OverlaySwitch(BaseModel):
    iEnabled: int = Field(..., ge=0, le=1)


class ChannelOverlay(OverlaySwitch):
    iPositionX: int = Field(..., ge=0)
    iPositionY: int = Field(..., ge=0)
    sChannelName: str


class DateTimeOverlay(OverlaySwitch):
    iDisplayWeekEnabled: int = Field(..., ge=0, le=1)
    iPositionX: int = Field(..., ge=0)
    iPositionY: int = Field(..., ge=0)
    sDateStyle: str
    sTimeStyle: Literal["12hour", "24hour"]


class SNOverlay(OverlaySwitch):
    iPositionX: int = Field(..., ge=0)
    iPositionY: int = Field(..., ge=0)


class NormalizedScreenSize(BaseModel):
    iNormalizedScreenHeight: int = Field(..., gt=0)
    iNormalizedScreenWidth: int = Field(..., gt=0)


class OSDCharSettings(BaseModel):
    attribute: OSDAttribute
    channelNameOverlay: ChannelOverlay
    dateTimeOverlay: DateTimeOverlay
    SNOverlay: SNOverlay


class InferenceOverlay(OverlaySwitch):
    pass


class OSDInferenceSettings(BaseModel):
    inferenceOverlay: InferenceOverlay


class PrivacyMaskRegion(BaseModel):
    id: int = Field(..., ge=0)
    iMaskHeight: int = Field(..., ge=0)
    iMaskWidth: int = Field(..., ge=0)
    iPositionX: int = Field(..., ge=0)
    iPositionY: int = Field(..., ge=0)


class OSDMaskSettings(BaseModel):
    iEnabled: int = Field(..., ge=0, le=1)
    normalizedScreenSize: NormalizedScreenSize
    privacyMask: list[PrivacyMaskRegion]


class StreamProtocol(str, Enum):
    rtsp = "rtsp"
    rtmp = "rtmp"
    onvif = "onvif"


class RtspConfig(BaseModel):
    iPort: int = Field(..., ge=1, le=65535)


class RtmpConfig(BaseModel):
    sURL: str
    iAuthType: Literal[0, 1]
    sSecretKey: Optional[str] = None
    sUserName: Optional[str] = None
    sPassword: Optional[str] = None


class OnvifConfig(BaseModel):
    sUserName: str
    sPassword: str


class StreamConfig(BaseModel):
    streamProtocol: StreamProtocol
    rtsp: Optional[RtspConfig] = None
    rtmp: Optional[RtmpConfig] = None
    onvif: Optional[OnvifConfig] = None


class StreamUpdateRequest(StreamConfig):
    pass


class WebRTCOffer(BaseModel):
    sdp: str
    type: Literal["offer"]


class WebRTCAnswer(BaseModel):
    sdp: str
    type: Literal["answer"]


# OSD 配置相关模型（使用相对坐标 0-1）
class OSDAttributeConfig(BaseModel):
    """OSD 字体属性配置"""
    iOSDFontSize: int = Field(..., description="字体大小，取值:0, 16, 32, 48, 64, 其中0表示自适应")
    sOSDFrontColor: str = Field(..., pattern=r"^[0-9a-fA-F]{6}$", description="字体颜色，RGB十六进制表示法")
    sOSDFrontColorMode: int = Field(..., ge=0, le=1, description="字体颜色模式, 0=黑白自动, 1=自定义")


class ChannelNameOverlayConfig(BaseModel):
    """通道名称覆盖配置"""
    iEnabled: int = Field(..., ge=0, le=1, description="0=关闭, 1=开启")
    iPositionX: float = Field(..., ge=0, le=1, description="X坐标相对位置")
    iPositionY: float = Field(..., ge=0, le=1, description="Y坐标相对位置")
    sChannelName: str = Field(..., description="通道名称")


class DateTimeOverlayConfig(BaseModel):
    """日期时间覆盖配置"""
    iEnabled: int = Field(..., ge=0, le=1, description="0=关闭, 1=开启")
    iDisplayWeekEnabled: int = Field(..., ge=0, le=1, description="0=不显示星期, 1=显示星期")
    iPositionX: float = Field(..., ge=0, le=1, description="X坐标相对位置")
    iPositionY: float = Field(..., ge=0, le=1, description="Y坐标相对位置")
    sDateStyle: str = Field(..., description="日期格式")
    sTimeStyle: Literal["12hour", "24hour"] = Field(..., description="时间格式")


class SNOverlayConfig(BaseModel):
    """SN信息覆盖配置"""
    iEnabled: int = Field(..., ge=0, le=1, description="0=关闭, 1=开启")
    iPositionX: float = Field(..., ge=0, le=1, description="X坐标相对位置")
    iPositionY: float = Field(..., ge=0, le=1, description="Y坐标相对位置")


class InferenceOverlayConfig(BaseModel):
    """推理覆盖配置"""
    iEnabled: int = Field(..., ge=0, le=1, description="0=关闭, 1=开启")


class PrivacyMaskConfig(BaseModel):
    """遮挡区域配置"""
    id: int = Field(..., ge=0, description="遮挡区域ID")
    iMaskHeight: float = Field(..., ge=0, le=1, description="遮挡区域相对高度")
    iMaskWidth: float = Field(..., ge=0, le=1, description="遮挡区域相对宽度")
    iPositionX: float = Field(..., ge=0, le=1, description="左上角X坐标相对位置")
    iPositionY: float = Field(..., ge=0, le=1, description="左上角Y坐标相对位置")


class MaskOverlayConfig(BaseModel):
    """遮罩覆盖配置"""
    iEnabled: int = Field(..., ge=0, le=1, description="0=关闭, 1=开启")
    privacyMask: list[PrivacyMaskConfig] = Field(..., max_items=6, description="遮挡区域列表，最多6个")


class OSDConfig(BaseModel):
    """完整的 OSD 配置"""
    attribute: OSDAttributeConfig
    channelNameOverlay: ChannelNameOverlayConfig
    dateTimeOverlay: DateTimeOverlayConfig
    SNOverlay: SNOverlayConfig
    inferenceOverlay: InferenceOverlayConfig
    maskOverlay: MaskOverlayConfig
