from __future__ import annotations

import secrets
import hashlib
import tempfile
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response, status, Request, Header, Query
from typing import Optional

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


@router.post("/system/login", response_model=LoginResponse)
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
async def firmware_upgrade(
    request: Request,
    response: Response,
    upload_type: Optional[str] = Query(None, alias="upload-type"),
    id: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    md5sum: Optional[str] = Query(None),
    content_range: Optional[str] = Header(None),
    _: str = Depends(require_auth)
):
    """
    固件上传端点，支持三种模式：
    1. 初始化上传：upload-type=resumable -> 返回 File-Id
    2. 上传分块：id=<file_id>, Content-Range=bytes start-end -> 接收数据块
    3. 完成上传：start=<file_id>, md5sum=<hash> -> 验证并完成
    """
    
    # 模式1: 初始化上传
    if upload_type == "resumable" and not id and not start:
        # 生成唯一的文件ID
        file_id = secrets.token_hex(16)
        
        # 创建临时文件来存储上传的数据
        temp_dir = Path(tempfile.gettempdir()) / "firmware_uploads"
        temp_dir.mkdir(exist_ok=True)
        temp_file = temp_dir / f"{file_id}.bin"
        
        # 保存上传状态
        state.firmware_uploads[file_id] = {
            "file_path": str(temp_file),
            "received_bytes": 0,
            "chunks": [],
            "status": "uploading"
        }
        
        # 在响应头中返回 File-Id
        response.headers["File-Id"] = file_id
        
        return {"status": "initialized", "file_id": file_id}
    
    # 模式2: 上传文件分块
    elif id and not start and not md5sum:
        if id not in state.firmware_uploads:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file ID"
            )
        
        upload_info = state.firmware_uploads[id]
        
        # 读取请求体（文件分块）
        chunk_data = await request.body()
        
        # 解析 Content-Range 头
        if content_range:
            # Content-Range: bytes 0-524287
            try:
                range_part = content_range.replace("bytes ", "")
                start_byte, end_byte = map(int, range_part.split("-"))
            except:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Content-Range header"
                )
        else:
            start_byte = upload_info["received_bytes"]
            end_byte = start_byte + len(chunk_data) - 1
        
        # 将分块追加到文件
        file_path = upload_info["file_path"]
        with open(file_path, "ab") as f:
            f.write(chunk_data)
        
        # 更新状态
        upload_info["received_bytes"] = end_byte + 1
        upload_info["chunks"].append({
            "start": start_byte,
            "end": end_byte,
            "size": len(chunk_data)
        })
        
        return {
            "status": "chunk_received",
            "received_bytes": upload_info["received_bytes"],
            "chunk_count": len(upload_info["chunks"])
        }
    
    # 模式3: 完成上传
    elif start and md5sum:
        file_id = start
        
        if file_id not in state.firmware_uploads:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file ID"
            )
        
        upload_info = state.firmware_uploads[file_id]
        file_path = upload_info["file_path"]
        
        # 验证文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file not found"
            )
        
        # 计算文件的MD5
        md5_hash = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
        
        calculated_md5 = md5_hash.hexdigest()
        
        # 验证MD5
        if calculated_md5.lower() != md5sum.lower():
            # MD5不匹配，清理文件
            os.remove(file_path)
            del state.firmware_uploads[file_id]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MD5 mismatch. Expected: {md5sum}, Got: {calculated_md5}"
            )
        
        # MD5验证通过
        upload_info["status"] = "completed"
        upload_info["md5"] = calculated_md5
        
        # 这里可以添加实际的固件更新逻辑
        # 例如：解压固件、验证签名、应用更新等
        
        # 模拟固件更新成功
        file_size = os.path.getsize(file_path)
        
        return {
            "code": 0,
            "message": "Firmware upload successful",
            "file_id": file_id,
            "file_size": file_size,
            "md5": calculated_md5,
            "status": "completed"
        }
    
    # 模式4: 网络更新
    elif upload_type == "network":
        token = secrets.token_hex(8)
        payload = {
            "iUpdateAvailable": 1,
            "sCurrentVersion": state.device_info.get("sFirmwareVersion", "V1.0.0"),
            "sLatestVersion": "V1.1.0",
            "sToken": token,
        }
        state.firmware_tokens[token] = payload
        return payload
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request parameters"
        )


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
