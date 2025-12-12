from __future__ import annotations

from typing import Any, Dict
import io
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse,StreamingResponse
from ..dependencies import require_auth
from ..schemas.network import (
    ConfigUploadRequest,
    FtpSetting,
    HttpSetting,
    MulticastConfig,
    NetworkInfoResponse,
    NetworkUpdateRequest,
    WifiInfoEntry,
    WifiStatusResponse,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["network"])


@router.get("/network/wlan", response_model=NetworkInfoResponse)
def get_network_wlan(_: str = Depends(require_auth)) -> NetworkInfoResponse:
    return NetworkInfoResponse(**state.network_wlan)


@router.put("/network/wlan", response_model=NetworkInfoResponse)
def update_network_wlan(payload: NetworkUpdateRequest, _: str = Depends(require_auth)) -> NetworkInfoResponse:
    state.network_wlan["dIpv4"]["sV4Method"] = payload.sGetMethod
    print(payload)
    if payload.sGetMethod == "STATIC":
        state.network_wlan["dIpv4"].update(
            {
                "sV4Address": str(payload.sIpAddress),
                "sV4Gateway": str(payload.sIpGateway),
                "sV4Netmask": payload.sIpNetmask,
            }
        )
        state.network_wlan["dLink"].update(
            {
                "sDNS1": str(payload.sDNS0),
                "sDNS2": str(payload.sDNS1) if payload.sDNS1 else None,
            }
        )
    return NetworkInfoResponse(**state.network_wlan)


@router.get("/network/wifi", response_model=WifiStatusResponse)
def get_wifi_status(_: str = Depends(require_auth)) -> WifiStatusResponse:
    print(123)
    return WifiStatusResponse(**state.wifi_status)


@router.get("/network/wifi-list", response_model=list[WifiInfoEntry])
def get_wifi_list(_: str = Depends(require_auth)) -> list[WifiInfoEntry]:
    return [WifiInfoEntry(**entry) for entry in state.wifi_list]


@router.post("/network/wifi")
def post_wifi(payload:dict,scan: int=0,  _: str = Depends(require_auth)):
    count = max(1, int(scan))
    print(payload)
    if scan == 0:
        return {"status":0,"message":'adfaf'}
    return state.wifi_list[:count]

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported WiFi action")


@router.delete("/network/wifi")
def delete_wifi(service: str, _: str = Depends(require_auth)):
    if service in state.wifi_connections:
        state.wifi_connections.remove(service)
        return {"status": 1, "message": f"Disconnected {service}"}
    return {"status": 0, "message": "SSID not connected"}


@router.get("/network/multicast", response_model=MulticastConfig)
def get_multicast(_: str = Depends(require_auth)) -> MulticastConfig:
    return MulticastConfig(**state.multicast)

@router.get("/network/multicast", response_model=MulticastConfig)
def set_multicast( _: str = Depends(require_auth)) -> MulticastConfig:

    return {
"muticastAddress": "224.1.1.1",    
"muticastPort": "8868"          
}


@router.post("/network/multicast", response_model=MulticastConfig)
def set_multicast(payload: MulticastConfig, _: str = Depends(require_auth)) -> MulticastConfig:
    state.multicast.update(payload.model_dump())
    return MulticastConfig(**state.multicast)


@router.get("/web/setting", response_model=HttpSetting)
def get_http_setting(_: str = Depends(require_auth)) -> HttpSetting:
    return HttpSetting(**state.http_setting)


@router.post("/web/setting", response_model=HttpSetting)
def set_http_setting(payload: HttpSetting, _: str = Depends(require_auth)) -> HttpSetting:
    state.http_setting.update(payload.model_dump())
    return HttpSetting(**state.http_setting)


@router.get("/ftp/setting", response_model=FtpSetting)
def get_ftp_setting(_: str = Depends(require_auth)) -> FtpSetting:
    return FtpSetting(**state.ftp_setting)


@router.post("/ftp/setting", response_model=FtpSetting)
def set_ftp_setting(payload: FtpSetting, _: str = Depends(require_auth)) -> FtpSetting:
    state.ftp_setting.update(payload.model_dump())
    return FtpSetting(**state.ftp_setting)


@router.get("/config/export")
def export_config(_: str = Depends(require_auth)):
    return FileResponse(path="/home/dq/github/RC2Web/package.json",
                        filename="page.json",
                        media_type="application/json") or {"status": 1, "message": "No config uploaded"}


@router.post("/config/upload")
def upload_config(payload: ConfigUploadRequest, _: str = Depends(require_auth)):
    state.config_blob = payload.data
    return {"status": 1, "message": "Config uploaded"}
