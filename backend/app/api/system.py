from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..dependencies import require_auth
from ..schemas.system import (
    DeviceInfoResponse,
    LoginRequest,
    LoginResponse,
    PasswordUpdateRequest,
    ResourceInfoResponse,
    SystemTimeResponse,
    SystemTimeUpdateRequest,
)
from ..schemas.network import FirmwareNetworkConfirmRequest, FirmwareUpgradeRequest
from ..state import state
from ..utils import current_timestamp_payload, random_status

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["system"])


@router.post("/system/system/login", response_model=LoginResponse)
def login(payload: LoginRequest, response: Response) -> LoginResponse:
    password_hash = state.passwords.get(payload.sUserName)
    # if password_hash is None or password_hash.lower() != payload.sPassword.lower():
    #     print(payload.sPassword.lower(),password_hash)
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    state.tokens[token] = payload.sUserName
    response.set_cookie("token", token, httponly=True, secure=False)
    return LoginResponse(iStatus=0, iAuth=1)


@router.get("/system/device-info", response_model=DeviceInfoResponse)
def get_device_info(_: str = Depends(require_auth)) -> DeviceInfoResponse:
    return DeviceInfoResponse(**state.device_info)


@router.get("/system/time", response_model=SystemTimeResponse)
def get_system_time(_: str = Depends(require_auth)) -> SystemTimeResponse:
    # state.timezone["iTimestamp"] = int(datetime.now(tz=timezone.utc).timestamp())
    return SystemTimeResponse(**state.timezone)


@router.put("/system/time", response_model=SystemTimeResponse)
def update_system_time(payload: SystemTimeUpdateRequest, _: str = Depends(require_auth)) -> SystemTimeResponse:
    print(111)
    data = state.timezone.copy()
    # if payload.sMethod == "ntp":
    #     data.update({
    #         "sTimezone": payload.sTimezone or data["sTimezone"],
    #         "sTz": payload.sTz or data["sTz"],
    #         "iTimstemp": int(datetime.now(tz=timezone.utc).timestamp()),
    #     })
    # else:
    #     print(111)
    #     data.update({
    #         "iTimstemp": payload.iTimestamp,
    #     })
    print(data)
    state.timezone = data
    print(data)
    res = SystemTimeResponse(**data)
    print(1111)
    return res


@router.get("/system/resource-info", response_model=ResourceInfoResponse)
def get_resource_info(_: str = Depends(require_auth)) -> ResourceInfoResponse:
    info = random_status()
    state.resource_info.update(info)
    return ResourceInfoResponse(**state.resource_info)


@router.post("/system/firmware-upgrade")
def firmware_upgrade(payload: FirmwareUpgradeRequest, _: str = Depends(require_auth)):
    upload_type = payload.upload_type
    if upload_type == "network":
        token = secrets.token_hex(8)
        payload = {
            "iUpdateAvailable": 1,
            "sCurrentVersion": state.device_info.get("sFirmwareVersion", "V1.0.0"),
            "sLatestVersion": "V1.1.0",
            "sToken": token,
        }
        state.firmware_tokens[token] = payload
        return payload
    return {"status": 1, "message": "Upload accepted"}


@router.post("/system/firmware-network")
def firmware_network(payload: FirmwareNetworkConfirmRequest, _: str = Depends(require_auth)):
    token = payload.sToken
    if token not in state.firmware_tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    if payload.sStart != "on":
        return {"status": 1, "message": "Cancelled"}
    return {"status": 1, "message": "Update started"}


@router.post("/system/reboot", status_code=status.HTTP_204_NO_CONTENT)
def system_reboot(_: str = Depends(require_auth)) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/system/factory-reset", status_code=status.HTTP_204_NO_CONTENT)
def system_factory_reset(_: str = Depends(require_auth)) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/system/password")
def update_password(payload: PasswordUpdateRequest, user: str = Depends(require_auth)):
    stored = state.passwords.get(user)
    stored = "913b1ccfC0573A5D44Dc4EbdEcdAa8272Ff9e16bbA68eB79eea6416BcdFED127"
    print(stored)
    if stored is None or stored.lower() != payload.sOldPassword.lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password incorrect")
    state.passwords[user] = payload.sNewPassword.lower()
    return {"status": 1, "message": "Password updated"}
