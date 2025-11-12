from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


class ModelEntry(BaseModel):
    sFileName: str
    sModelNmae: str
    sModelType: Literal["cl", "det", "seg", "kp", "obb", "null"]
    iModelSize: int = Field(..., ge=0)

class ClassificationConfig(BaseModel):
    fThr: float = Field(..., ge=0.0, le=1.0)
    iTopK: int = Field(..., ge=1, le=100)
    lLablel: List[str]


class DetectionConfig(BaseModel):
    fThr: float = Field(..., ge=0.0, le=1.0)
    fIouThr: float = Field(..., ge=0.0, le=1.0)
    iMaxObject: int = Field(..., ge=1, le=1000)
    lLablel: List[str]


class KeypointConfig(BaseModel):
    fThr: float = Field(..., ge=0.0, le=1.0)
    lLablel: List[str]


class ModelConfigResponse(BaseModel):
    sFileName: str
    sModelType: Literal["cl", "det", "seg", "kp", "obb", "null"]
    dConfig: dict


class ModelConfigUpdate(BaseModel):
    sFileName: str
    sModelType: Literal["cl", "det", "seg", "kp", "obb", "null"]
    dConfig: dict
