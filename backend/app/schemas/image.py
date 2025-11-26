from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class VideoAdjustment(BaseModel):
    iImageRotation: Literal[0, 90, 180, 270]
    sImageFlip: Literal["close", "mirror", "flip", "centrosymmetric"]
    sPowerLineFrequencyMode: Literal["PAL(50HZ)", "NTSC(60HZ)"]


class NightToDay(BaseModel):
    iMode: Literal[0, 1, 2]
    iNightToDayFilterLevel: int = Field(..., ge=0, le=5)
    iNightToDayFilterTime: int = Field(..., ge=1, le=60)
    iDawnTime: int = Field(..., ge=0, le=86400)
    iDuskTime: int = Field(..., ge=0, le=86400)
    iProfileSelect: int = Field(..., ge=0, le=2)
    iProfileCur: Optional[int] = Field(default=None, ge=0, le=2)


class ImageAdjustment(BaseModel):
    iBrightness: int = Field(..., ge=0, le=100)
    iContrast: int = Field(..., ge=0, le=100)
    iHue: int = Field(..., ge=0, le=100)
    iSaturation: int = Field(..., ge=0, le=100)
    iSharpness: int = Field(..., ge=0, le=100)


class Exposure(BaseModel):
    iExposureGain: int = Field(..., ge=0)
    sExposureMode: Literal["auto", "manual"]
    sExposureTime: str
    sGainMode: Literal["auto", "manual"]


class BLC(BaseModel):
    iBLCStrength: int = Field(..., ge=0, le=100)
    iDarkBoostLevel: int = Field(..., ge=0, le=100)
    iHDRLevel: int = Field(..., ge=0, le=10)
    iHLCLevel: int = Field(..., ge=0, le=100)
    sBLCRegion: Literal["open", "close"]
    sHDR: Literal["open", "close"]
    sHLC: Literal["open", "close"]


class WhiteBalance(BaseModel):
    iWhiteBalanceCT: int = Field(..., ge=2800, le=7500)
    sWhiteBlanceStyle: Literal[
        "auto",
        "manual",
        "natural",
        "streetlight",
        "outdoor",
    ]


class ImageEnhancement(BaseModel):
    iSpatialDenoiseLevel: int = Field(..., ge=0, le=100)
    iTemporalDenoiseLevel: int = Field(..., ge=0, le=100)
    sNoiseReduceMode: int


class ProfileConfig(BaseModel):
    imageAdjustment: ImageAdjustment
    exposure: Exposure
    BLC: BLC
    whiteBlance: WhiteBalance
    imageEnhancement: ImageEnhancement


class ImageConfig(BaseModel):
    id: int = Field(..., ge=0)
    videoAdjustment: VideoAdjustment
    nightToDay: NightToDay
    profile: List[ProfileConfig]


class ImageSceneRequest(BaseModel):
    iProfileCur: int = Field(..., ge=0, le=2)


class ImageVideoAdjustmentRequest(VideoAdjustment):
    pass


class ImageNightToDayRequest(NightToDay):
    pass


class ImageAdjustmentRequest(ImageAdjustment):
    pass


class ImageExposureRequest(Exposure):
    pass


class ImageBLCRequest(BLC):
    pass


class ImageWhiteBalanceRequest(WhiteBalance):
    pass


class ImageEnhancementRequest(ImageEnhancement):
    pass
