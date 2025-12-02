from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

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
    slot_name = payload.sSlotName
    
    # 查找对应的存储槽位
    slots = state.storage_status["dSlots"]
    slot_index = None
    for i, slot in enumerate(slots):
        if slot["sDevPath"] == slot_name:
            slot_index = i
            break
    
    if slot_index is None:
        return {"iCode": 2, "sMessage": f"Storage slot {slot_name} not found"}
    
    # 执行不同的操作
    if action == "format":
        # 格式化操作
        slots[slot_index]["eState"] = 3  # Formatting
        slots[slot_index]["sState"] = "Formatting"
        state.storage_status["iRevision"] += 1
        return {"iCode": 0, "sMessage": "Format operation started"}
    
    elif action == "free_up":
        # 释放空间操作
        current_used = slots[slot_index]["iQuotaUsedBytes"]
        if current_used > 0:
            # 模拟释放一些空间
            freed_space = min(current_used, 10000000)  # 释放最多10MB
            slots[slot_index]["iQuotaUsedBytes"] -= freed_space
            slots[slot_index]["iStatsFreeBytes"] += freed_space
        state.storage_status["iRevision"] += 1
        return {"iCode": 0, "sMessage": "Free up operation completed"}
    
    elif action == "eject":
        # 弹出操作
        if not slots[slot_index]["bRemovable"]:
            return {"iCode": 16, "sMessage": "Cannot eject non-removable storage"}
        slots[slot_index]["bEnabled"] = False
        slots[slot_index]["eState"] = 4  # NotMounted
        slots[slot_index]["sState"] = "NotMounted"
        state.storage_status["iRevision"] += 1
        return {"iCode": 0, "sMessage": "Eject operation completed"}
    
    elif action == "config":
        # 配置操作
        if payload.dSlotConfig is None:
            return {"iCode": 22, "sMessage": "Slot config is required for config action"}
        
        slot_config = payload.dSlotConfig.model_dump()
        slots[slot_index]["iQuotaLimitBytes"] = slot_config["iQuotaLimitBytes"]
        slots[slot_index]["bQuotaRotate"] = slot_config["bQuotaRotate"]
        state.storage_status["iRevision"] += 1
        return {"iCode": 0, "sMessage": "Config operation completed"}
    
    elif action == "relay":
        # 中继操作
        import uuid
        relay_dir = str(uuid.uuid4())
        slots[slot_index]["dRelayStatus"]["sRelayDirectory"] = relay_dir
        slots[slot_index]["dRelayStatus"]["iRelayTimeoutRemain"] = slots[slot_index]["dRelayStatus"]["iRelayTimeout"]
        state.storage_status["iRevision"] += 1
        return {
            "iCode": 0,
            "sMessage": "Relay operation started",
            "sRelayDirectory": relay_dir
        }
    
    elif action == "unrelay":
        # 取消中继操作
        slots[slot_index]["dRelayStatus"]["sRelayDirectory"] = ""
        slots[slot_index]["dRelayStatus"]["iRelayTimeoutRemain"] = 0
        state.storage_status["iRevision"] += 1
        return {"iCode": 0, "sMessage": "Unrelay operation completed"}
    
    return {"iCode": 22, "sMessage": f"Invalid action: {action}"}
