from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, RootModel


# 1. 全局规则配置 (General Rule Configuration)
class WriterConfig(BaseModel):
    sFormat: Literal["mp4", "jpg", "raw"]  # 视频或图片格式
    iIntervalMs: int = Field(..., ge=0)  # 最短捕获时间间隔（毫秒）


class RuleConfig(BaseModel):
    bRuleEnabled: bool  # 启用或禁用所有规则
    dWriterConfig: WriterConfig


# 2. 计划规则配置 (Schedule Rule Configuration)
class TimePoint(BaseModel):
    iDay: int = Field(..., ge=0, le=6)  # 0-6 (周日-周六)
    iHour: int = Field(..., ge=0, le=23)  # 0-23
    iMinute: int = Field(..., ge=0, le=59)  # 0-59
    iSecond: int = Field(..., ge=0, le=59)  # 0-59


class ScheduleTimeRange(BaseModel):
    dStart: TimePoint
    dEnd: TimePoint


# 使用 RootModel 定义列表类型的根模型
class ScheduleRuleConfig(RootModel):
    root: List[ScheduleTimeRange]


# 3. 录制规则配置 (Record Rule Configuration)
class PolygonRegion(BaseModel):
    lPolygon: List[List[float]]  # [[x, y], ...] 坐标范围 0.0-1.0


class InferenceSetItem(BaseModel):
    sID: str  # 名称（可不唯一，但建议唯一）
    iDebounceTimes: int = Field(..., ge=0)  # 确认检测所需的连续帧数
    lConfidenceFilter: List[float] = Field(..., min_length=2, max_length=2)  # [min, max]
    lClassFilter: List[int]  # 要过滤的类别 ID
    lRegionFilter: Optional[List[PolygonRegion]] = None  # 可选，多边形列表


class TimerConfig(BaseModel):
    iIntervalSeconds: int = Field(..., ge=0)  # 触发间隔（秒）


class GPIOConfig(BaseModel):
    sName: str  # GPIO 引脚名称
    sInitialLevel: Literal["high", "low"]  # 初始电平
    sSignal: Literal["high", "low", "rising", "falling"]  # 触发信号
    iDebounceDurationMs: int = Field(..., ge=0)  # 去抖动时长（毫秒）


class TTYConfig(BaseModel):
    sName: str  # TTY 名称
    sCommand: str  # 触发录制的命令字符串


class RecordRuleConfig(BaseModel):
    sType: str  # 录制条件类型，对应下面的字段名
    lInferenceSet: Optional[List[InferenceSetItem]] = None
    dTimer: Optional[TimerConfig] = None
    dGPIO: Optional[GPIOConfig] = None
    dTTY: Optional[TTYConfig] = None


# 4. 存储配置 (Storage Configuration)
class StorageConfig(BaseModel):
    sEnabledSlotName: str  # 已启用插槽的设备路径，如果没有则为空


# 5. 存储状态 (Storage Status)
class RelayStatus(BaseModel):
    iRelayTimeoutRemain: int = Field(..., ge=0)  # 中继超时剩余时间（秒）
    iRelayTimeout: int = Field(..., ge=0)  # 中继超时时长（秒）
    sRelayDirectory: str  # 活动中继目录名称


class StorageSlot(BaseModel):
    sDevPath: str  # 设备路径
    sMountPath: str  # 挂载路径
    bRemovable: bool  # 是否可移除
    bInternal: bool  # 是否内部存储
    sLabel: str  # 标签
    sUUID: str  # UUID
    sType: str  # 文件系统类型
    bEnabled: bool  # 是否启用
    bWriting: bool  # 是否正在写入
    eState: int  # SlotState 枚举值 (1: Error, 2: NotFormattedOrFormatUnsupported, 3: Formatting, 4: NotMounted, 5: Mounted, 6: Configured, 7: Indexing, 8: Ready)
    sState: str  # 可读的状态描述
    iStatsSizeBytes: int = Field(..., ge=0)  # 总大小（字节）
    iStatsFreeBytes: int = Field(..., ge=0)  # 剩余空间（字节）
    iQuotaLimitBytes: int = Field(..., ge=0)  # 配额限制（字节）
    iQuotaUsedBytes: int = Field(..., ge=0)  # 配额已用（字节）
    bQuotaRotate: bool  # 是否启用配额轮转
    dRelayStatus: RelayStatus  # 中继状态


class StorageStatus(BaseModel):
    iRevision: int = Field(..., ge=0)  # 配置修订号，每次调用存储控制后 +1
    dSlots: List[StorageSlot]  # 存储槽位列表
    sDataDirName: str  # 数据目录名称


# 6. 存储控制 (Storage Control)
class SlotConfig(BaseModel):
    iQuotaLimitBytes: int = Field(..., ge=0)  # 配额限制（字节）
    bQuotaRotate: bool  # 是否启用配额轮转


class StorageControl(BaseModel):
    sAction: Literal["format", "free_up", "eject", "config", "relay", "unrelay"]  # 操作类型
    sSlotName: str  # 插槽的设备路径
    dSlotConfig: Optional[SlotConfig] = None  # 可选，仅 "config" 操作需要
