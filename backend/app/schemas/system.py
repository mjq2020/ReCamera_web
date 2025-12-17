from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    sUserName: str = Field(..., min_length=1, max_length=64)
    sPassword: str = Field(..., min_length=1, max_length=64)


class LoginResponse(BaseModel):
    iStatus: int = Field(..., ge=0)
    iAuth: int = Field(..., ge=0)


class DeviceInfoResponse(BaseModel):
    sSerialNumber: str
    sFirmwareVersion: str
    sSensorModel: str
    sBasePlateModel: str


class TimeMethod(str, Enum):
    ntp = "ntp"
    manual = "manual"


class SystemTimeResponse(BaseModel):
    iTimestamp: int
    sTimezone: str
    sTz: str
    sMethod: str
    dNtpConfig: dict


class SystemTimeUpdateRequest(BaseModel):
    sMethod: TimeMethod
    sTimezone: Optional[str] = None
    sTz: Optional[str] = None
    iTimestamp: Optional[int] = Field(default=None, ge=0)

    @field_validator("sTimezone", "sTz")
    @classmethod
    def validate_ntp_fields(cls, value: Optional[str], info):
        if info.data.get("sMethod") == TimeMethod.ntp:
            if value is None:
                raise ValueError("Timezone fields are required when method is ntp")
        return value

    @field_validator("iTimestamp")
    @classmethod
    def validate_timestamp(cls, value: Optional[int], info):
        if info.data.get("sMethod") == TimeMethod.manual:
            if value is None:
                raise ValueError("iTimestamp is required when method is manual")
        return value


class ResourceInfoResponse(BaseModel):
    iCpuUsage: int = Field(..., ge=0, le=100)
    iNpuUsage: int = Field(..., ge=0, le=100)
    iMemUsage: int = Field(..., ge=0, le=100)
    iStorageUsage: int = Field(..., ge=0, le=100)


class PasswordUpdateRequest(BaseModel):
    sUserName: str = Field(..., min_length=1, max_length=64)
    sOldPassword: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]{64}$")
    sNewPassword: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]{64}$")


class PasswordUpdateResponse(BaseModel):
    code: int = Field(..., description="成功返回0，错误返回其他错误码")
    message: str = Field(default="", description="可携带相关错误信息")


class FactoryResetInitResponse(BaseModel):
    code: int = Field(..., description="成功返回0，错误返回其他错误码")
    sConfirmToken: str = Field(..., description="后端生成的确认token，有时效性")


class FactoryResetConfirmRequest(BaseModel):
    sConfirmToken: str = Field(..., min_length=1, description="第一阶段响应的确认码")


class FactoryResetConfirmResponse(BaseModel):
    code: int = Field(..., description="成功返回0，错误返回其他错误码")
    message: str = Field(default="", description="可携带相关错误信息")
