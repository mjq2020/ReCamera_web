from __future__ import annotations

from typing import Any, Dict, Optional
import io
import os
import tarfile
import tempfile
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request, Header, status
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
def export_config(response: Response, _: str = Depends(require_auth)):
    """
    导出配置文件
    返回配置文件的大小和下载链接
    """
    try:
        # 设置响应头，禁用缓存
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
        # 创建临时目录来存储配置文件
        temp_dir = Path(tempfile.gettempdir()) / "config_exports"
        temp_dir.mkdir(exist_ok=True)
        
        # 创建配置 tar 文件
        config_tar_path = "/home/dq/github/RC2Web/backend/config.tar"
        
        # 创建一个模拟的配置 tar 文件
        # 实际应用中，这里应该收集所有配置文件并打包
        # with tarfile.open(config_tar_path, "w") as tar:
        #     # 添加一些模拟的配置数据
        #     config_data = {
        #         "network": state.network_wlan,
        #         "wifi": state.wifi_status,
        #         "http_setting": state.http_setting,
        #         "ftp_setting": state.ftp_setting,
        #         "multicast": state.multicast,
        #         "device_info": state.device_info,
        #     }
            
        #     # 将配置转换为 JSON 并添加到 tar 文件中
        #     import json
        #     config_json = json.dumps(config_data, indent=2).encode('utf-8')
            
        #     # 创建一个内存中的文件对象
        #     from io import BytesIO
        #     config_file = BytesIO(config_json)
            
        #     # 创建 tarinfo 对象
        #     tarinfo = tarfile.TarInfo(name="config.json")
        #     tarinfo.size = len(config_json)
            
        #     # 添加到 tar 文件
        #     config_file.seek(0)
        #     tar.addfile(tarinfo, config_file)
        
        # 保存到状态中，以便下载端点可以访问
        state.last_exported_config = str(config_tar_path)
        
        # 获取文件大小
        file_size = os.path.getsize(config_tar_path)
        
        # 返回 JSON 响应
        return {
            "size": file_size,
            "url": "/download/config.tar"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导出配置失败: {str(e)}"
        )


@router.post("/config/upload")
async def upload_config(
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
    配置上传端点，支持三种模式（类似固件上传）：
    1. 初始化上传：upload-type=resumable -> 返回 File-Id
    2. 上传分块：id=<file_id>, Content-Range=bytes start-end -> 接收数据块
    3. 完成上传：start=<file_id>, md5sum=<hash> -> 验证并完成
    """
    
    # 模式1: 初始化上传
    if upload_type == "resumable" and not id and not start:
        # 生成唯一的文件ID
        import secrets
        file_id = secrets.token_hex(16)
        
        # 创建临时文件来存储上传的数据
        temp_dir = Path(tempfile.gettempdir()) / "config_uploads"
        temp_dir.mkdir(exist_ok=True)
        temp_file = temp_dir / f"{file_id}.tar"
        
        # 保存上传状态
        if not hasattr(state, 'config_uploads'):
            state.config_uploads = {}
        
        state.config_uploads[file_id] = {
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
        if not hasattr(state, 'config_uploads') or id not in state.config_uploads:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file ID"
            )
        
        upload_info = state.config_uploads[id]
        
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
        
        if not hasattr(state, 'config_uploads') or file_id not in state.config_uploads:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file ID"
            )
        
        upload_info = state.config_uploads[file_id]
        file_path = upload_info["file_path"]
        
        # 验证文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file not found"
            )
        
        # 计算文件的MD5
        import hashlib
        md5_hash = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
        
        calculated_md5 = md5_hash.hexdigest()
        
        # 验证MD5
        if calculated_md5.lower() != md5sum.lower():
            # MD5不匹配，清理文件
            os.remove(file_path)
            del state.config_uploads[file_id]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MD5 mismatch. Expected: {md5sum}, Got: {calculated_md5}"
            )
        
        # MD5验证通过
        upload_info["status"] = "completed"
        upload_info["md5"] = calculated_md5
        
        # 这里可以添加实际的配置恢复逻辑
        # 例如：解压配置文件、验证配置、应用配置等
        
        file_size = os.path.getsize(file_path)
        
        # 保存配置文件路径（可选）
        state.last_uploaded_config = file_path
        
        return {
            "code": 0,
            "message": "Config upload successful",
            "file_id": file_id,
            "file_size": file_size,
            "md5": calculated_md5,
            "status": "completed"
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request parameters"
        )


# 创建一个单独的路由用于下载，不包含 /cgi-bin/entry.cgi 前缀
download_router = APIRouter(tags=["downloads"])


@download_router.get("/download/config.tar")
def download_config(_: str = Depends(require_auth)):
    """
    下载导出的配置文件
    """
    if not state.last_exported_config or not os.path.exists(state.last_exported_config):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置文件不存在或已过期"
        )
    
    return FileResponse(
        path=state.last_exported_config,
        filename="config.tar",
        media_type="application/x-tar"
    )
