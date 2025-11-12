from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict, IPvAnyAddress, field_validator


class IPv4Method(str, Enum):
    manual = "manual"
    dhcp = "DHCP"
    static = "STATIC"


class IPv4AddressConfig(BaseModel):
    sV4Address: IPvAnyAddress
    sV4Gateway: IPvAnyAddress
    sV4Method: str
    sV4Netmask: str = Field(..., pattern=r"^(?:\d{1,3}\.){3}\d{1,3}$")


class LinkInfo(BaseModel):
    sDNS1: IPvAnyAddress
    sDNS2: Optional[IPvAnyAddress] = None
    sAddress: str = Field(..., pattern=r"^(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")
    sInterface: str
    iPower: int = Field(..., ge=0, le=1)
    sNicSpeed: str


class NetworkInfoResponse(BaseModel):
    dIpv4: IPv4AddressConfig
    dLink: LinkInfo


class NetworkUpdateRequest(BaseModel):
    sGetMethod: Literal["DHCP", "STATIC"]
    sIpAddress: Optional[IPvAnyAddress] = None
    sIpGateway: Optional[IPvAnyAddress] = None
    sIpNetmask: Optional[str] = Field(default=None, pattern=r"^(?:\d{1,3}\.){3}\d{1,3}$")
    sDNS0: Optional[IPvAnyAddress] = None
    sDNS1: Optional[IPvAnyAddress] = None

    model_config = ConfigDict(use_enum_values=True)

    @field_validator("sIpAddress", "sIpGateway", "sIpNetmask", "sDNS0", "sDNS1")
    @classmethod
    def validate_static_fields(cls, value, info):
        if info.data.get("sGetMethod") == "STATIC" and value is None:
            raise ValueError("Static configuration requires all network fields")
        return value


class WifiStatusResponse(BaseModel):
    iPower: int = Field(..., ge=0, le=1)
    iId: int = Field(..., ge=0)
    sType: Literal["wifi"]


class WifiInfoEntry(BaseModel):
    sBssid: str = Field(..., pattern=r"^(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")
    sFlags: str
    iFrequency: int = Field(..., ge=0)
    iRssi: int
    sSsid: str
    sConnected:bool


class WifiScanRequest(BaseModel):
    scan: int = Field(..., ge=1, le=50)


class WifiPowerRequest(BaseModel):
    power: Literal["on", "off"]


class WifiConnectRequest(BaseModel):
    sSsid: str = Field(..., alias="service")

    model_config = ConfigDict(populate_by_name=True)


class WifiPowerResponse(BaseModel):
    iPower: int = Field(..., ge=0, le=1)


class MulticastConfig(BaseModel):
    muticastAddress: IPvAnyAddress
    muticastPort: str = Field(..., pattern=r"^\d{1,5}$")


class HttpSetting(BaseModel):
    sApiPort: str = Field(..., pattern=r"^\d{1,5}$")
    sApiKey: str
    sEnable:bool


class FtpSetting(BaseModel):
    sFtpPort: str = Field(..., pattern=r"^\d{1,5}$")
    sFtpUser: str
    sFtpPassword: str = Field(..., min_length=1)
    sEnable:bool


class ConfigUploadRequest(BaseModel):
    data: dict


class FirmwareUpgradeRequest(BaseModel):
    upload_type: Literal["resumable", "network"] = Field(..., alias="upload-type")

    model_config = ConfigDict(populate_by_name=True)


class FirmwareNetworkConfirmRequest(BaseModel):
    sToken: str
    sStart: Literal["on", "off"]
