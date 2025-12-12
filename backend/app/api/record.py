from __future__ import annotations

from typing import List, Optional
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response, FileResponse, JSONResponse

from ..dependencies import require_auth
from ..schemas.record import (
    RecordRuleConfig,
    RuleConfig,
    ScheduleTimeRange,
    StorageConfig,
    StorageControl,
    StorageStatus,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["record"])


# 1. 全局规则配置 (General Rule Configuration)
@router.get("/vigil/rule/config", response_model=RuleConfig)
def get_rule_config(_: str = Depends(require_auth)) -> RuleConfig:
    return RuleConfig(**state.rule_config)


@router.post("/vigil/rule/config", response_model=RuleConfig)
def set_rule_config(payload: RuleConfig, _: str = Depends(require_auth)) -> RuleConfig:
    state.rule_config = payload.model_dump()
    return RuleConfig(**state.rule_config)


# 2. 计划规则配置 (Schedule Rule Configuration)
@router.get("/vigil/rule/schedule-rule-config", response_model=List[ScheduleTimeRange])
def get_schedule_rule_config(_: str = Depends(require_auth)) -> List[ScheduleTimeRange]:
    return [ScheduleTimeRange(**item) for item in state.schedule_rule_config]


@router.post("/vigil/rule/schedule-rule-config", response_model=List[ScheduleTimeRange])
def set_schedule_rule_config(
    payload: List[ScheduleTimeRange], _: str = Depends(require_auth)
) -> List[ScheduleTimeRange]:
    state.schedule_rule_config = [item.model_dump() for item in payload]
    return [ScheduleTimeRange(**item) for item in state.schedule_rule_config]


# 3. 录制规则配置 (Record Rule Configuration)
@router.get("/vigil/rule/record-rule-config", response_model=RecordRuleConfig)
def get_record_rule_config(_: str = Depends(require_auth)) -> RecordRuleConfig:
    return RecordRuleConfig(**state.record_rule_config)


@router.post("/vigil/rule/record-rule-config", response_model=RecordRuleConfig)
def set_record_rule_config(
    payload: RecordRuleConfig, _: str = Depends(require_auth)
) -> RecordRuleConfig:
    state.record_rule_config = payload.model_dump()
    return RecordRuleConfig(**state.record_rule_config)


# 4. 存储配置 (Storage Configuration)
@router.get("/vigil/storage/config", response_model=StorageConfig)
def get_storage_config(_: str = Depends(require_auth)) -> StorageConfig:
    return StorageConfig(**state.storage_config)


@router.post("/vigil/storage/config", response_model=StorageConfig)
def set_storage_config(
    payload: StorageConfig, _: str = Depends(require_auth)
) -> StorageConfig:
    state.storage_config = payload.model_dump()
    return StorageConfig(**state.storage_config)


# 5. 存储状态 (Storage Status)
@router.get("/vigil/storage/status", response_model=StorageStatus)
def get_storage_status(_: str = Depends(require_auth)) -> StorageStatus:
    return StorageStatus(**state.storage_status)


# 6. 存储控制 (Storage Control)
@router.post("/vigil/storage/control")
def storage_control(payload: StorageControl, _: str = Depends(require_auth)) -> dict:
    """
    对存储系统执行操作
    支持的操作: format, free_up, eject, config, relay, unrelay
    """
    action = payload.sAction
    slot_name = payload.sSlotDevPath
    
    # 查找对应的存储槽位
    slots = state.storage_status["lSlots"]
    slot_index = None
    for i, slot in enumerate(slots):
        if slot["sDevPath"] == slot_name:
            slot_index = i
            break
    
    if slot_index is None:
        return {"code": 2, "sMessage": f"Storage slot {slot_name} not found"}
    
    # 执行不同的操作
    if action == "format":
        # 格式化操作
        slots[slot_index]["eState"] = 3  # Formatting
        slots[slot_index]["sState"] = "Formatting"
        state.storage_status["iRevision"] += 1
        return {"code": 0, "sMessage": "Format operation started"}
    
    elif action == "free_up":
        # 释放空间操作
        current_used = slots[slot_index]["iQuotaUsedBytes"]
        if current_used > 0:
            # 模拟释放一些空间
            freed_space = min(current_used, 10000000)  # 释放最多10MB
            slots[slot_index]["iQuotaUsedBytes"] -= freed_space
            slots[slot_index]["iStatsFreeBytes"] += freed_space
        state.storage_status["iRevision"] += 1
        return {"code": 0, "sMessage": "Free up operation completed"}
    
    elif action == "eject":
        # 弹出操作
        if not slots[slot_index]["bRemovable"]:
            return {"code": 16, "sMessage": "Cannot eject non-removable storage"}
        slots[slot_index]["bEnabled"] = False
        slots[slot_index]["eState"] = 4  # NotMounted
        slots[slot_index]["sState"] = "NotMounted"
        state.storage_status["iRevision"] += 1
        return {"code": 0, "sMessage": "Eject operation completed"}
    
    elif action == "config":
        # 配置操作
        if payload.dSlotConfig is None:
            return {"code": 22, "sMessage": "Slot config is required for config action"}
        
        slot_config = payload.dSlotConfig.model_dump()
        slots[slot_index]["iQuotaLimitBytes"] = slot_config["iQuotaLimitBytes"]
        slots[slot_index]["bQuotaRotate"] = slot_config["bQuotaRotate"]
        state.storage_status["iRevision"] += 1
        return {"code": 0, "sMessage": "Config operation completed"}
    
    elif action == "relay":
        # 中继操作
        import uuid
        relay_dir = str(uuid.uuid4())
        slots[slot_index]["dRelayStatus"]["sRelayDirectory"] = relay_dir
        slots[slot_index]["dRelayStatus"]["iRelayTimeoutRemain"] = slots[slot_index]["dRelayStatus"]["iRelayTimeout"]
        
        # 保存中继映射
        state.relay_mappings[relay_dir] = slot_name
        
        state.storage_status["iRevision"] += 1
        return {
            "code": 0,
            "sMessage": "Relay operation started",
            "dRelayStatus": {
                "iRelayTimeoutRemain": slots[slot_index]["dRelayStatus"]["iRelayTimeoutRemain"],
                "iRelayTimeout": slots[slot_index]["dRelayStatus"]["iRelayTimeout"],
                "sRelayDirectory": relay_dir
            }
        }
    
    elif action == "relay_status":
        # 查询中继状态
        relay_status = slots[slot_index]["dRelayStatus"]
        return {
            "code": 0,
            "dRelayStatus": {
                "iRelayTimeoutRemain": relay_status["iRelayTimeoutRemain"],
                "iRelayTimeout": relay_status["iRelayTimeout"],
                "sRelayDirectory": relay_status["sRelayDirectory"]
            }
        }
    
    elif action == "unrelay":
        # 取消中继操作
        relay_dir = slots[slot_index]["dRelayStatus"]["sRelayDirectory"]
        if relay_dir and relay_dir in state.relay_mappings:
            del state.relay_mappings[relay_dir]
        
        slots[slot_index]["dRelayStatus"]["sRelayDirectory"] = ""
        slots[slot_index]["dRelayStatus"]["iRelayTimeoutRemain"] = 0
        state.storage_status["iRevision"] += 1
        return {"code": 0, "sMessage": "Unrelay operation completed"}
    
    elif action == "remove_files_or_directories":
        # 删除文件或文件夹
        if payload.lFilesOrDirectoriesToRemove is None or len(payload.lFilesOrDirectoriesToRemove) == 0:
            return {"code": 22, "sMessage": "No files specified for removal"}
        
        removed_files = []
        filesystem = state.mock_filesystems.get(slot_name, {})
        
        for file_path in payload.lFilesOrDirectoriesToRemove:
            # 移除文件
            if file_path in filesystem:
                del filesystem[file_path]
                removed_files.append(file_path)
            else:
                # 尝试移除文件夹（及其所有子文件）
                folder_removed = False
                keys_to_remove = []
                for key in filesystem.keys():
                    if key.startswith(file_path + "/") or key == file_path:
                        keys_to_remove.append(key)
                        folder_removed = True
                
                for key in keys_to_remove:
                    del filesystem[key]
                
                if folder_removed:
                    removed_files.append(file_path)
        
        state.storage_status["iRevision"] += 1
        return {
            "code": 0,
            "sMessage": "Files removed successfully",
            "lRemovedFilesOrDirectories": removed_files
        }
    
    return {"code": 22, "sMessage": f"Invalid action: {action}"}


# 7. 文件中继 - 获取文件列表
@router.get("/vigil/relay/{relay_uuid}/{path:path}")
async def get_file_list(relay_uuid: str, path: str = "", request: Request = None, _: str = Depends(require_auth)):
    """
    获取中继目录中的文件列表或文件内容
    如果路径是目录，返回文件列表（JSON）
    如果路径是文件，返回文件内容（支持Range请求）
    """
    # 验证中继UUID
    if relay_uuid not in state.relay_mappings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relay UUID not found: {relay_uuid}"
        )
    
    device_path = state.relay_mappings[relay_uuid]
    filesystem = state.mock_filesystems.get(device_path, {})
    
    # 如果path为空，列出根目录
    if not path:
        path = state.storage_status.get("sDataDirName", "DCIM")
    
    # 检查是否是文件
    if path in filesystem and filesystem[path]["type"] == "file":
        # 返回文件内容（模拟）
        file_info = filesystem[path]
        
        # 检查Range请求
        range_header = request.headers.get("Range") if request else None
        
        if range_header:
            # 处理Range请求（用于视频缩略图）
            # 模拟返回部分内容
            return Response(
                content=b"Mock video data for thumbnail...",
                status_code=206,
                media_type="video/mp4" if path.endswith(".mp4") else "image/jpeg",
                headers={
                    "Content-Range": f"bytes 0-1023/{file_info['size']}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": "1024"
                }
            )
        else:
            # 返回完整文件（模拟）
            # 在实际应用中，这里应该返回真实的文件内容
            content_type = "video/mp4" if path.endswith(".mp4") else "image/jpeg" if path.endswith((".jpg", ".jpeg")) else "application/octet-stream"
            
            return Response(
                content=f"Mock file content for {path}".encode(),
                media_type=content_type,
                headers={
                    "Content-Length": str(file_info['size']),
                    "Accept-Ranges": "bytes"
                }
            )
    
    # 列出目录内容
    file_list = []
    
    # 如果是根目录，列出所有顶级文件夹
    if path == state.storage_status.get("sDataDirName", "DCIM"):
        seen_dirs = set()
        for file_path in filesystem.keys():
            if file_path.startswith(path + "/"):
                # 提取第一级目录或文件
                relative_path = file_path[len(path)+1:]
                first_part = relative_path.split("/")[0]
                
                if "/" in relative_path:
                    # 这是一个子目录
                    if first_part not in seen_dirs:
                        seen_dirs.add(first_part)
                        # 获取目录信息
                        dir_path = f"{path}/{first_part}"
                        if dir_path in filesystem:
                            file_list.append(filesystem[dir_path])
                else:
                    # 这是一个文件
                    file_list.append(filesystem[file_path])
    else:
        # 列出指定目录下的文件
        for file_path in filesystem.keys():
            if file_path.startswith(path + "/"):
                relative_path = file_path[len(path)+1:]
                # 只列出直接子文件/文件夹
                if "/" not in relative_path:
                    file_list.append(filesystem[file_path])
    
    return JSONResponse(content=file_list)


# 8. 文件中继 - 下载文件（完整路径）
@router.get("/vigil/relay/{relay_uuid}")
async def get_relay_root(relay_uuid: str, _: str = Depends(require_auth)):
    """
    获取中继根目录的文件列表
    """
    return await get_file_list(relay_uuid, "", None, _)
