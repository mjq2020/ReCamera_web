from __future__ import annotations

from typing import Dict, List, Literal

from pydantic import BaseModel, Field


class RecordConditionEntry(BaseModel):
    sName: str
    iFrmae: int = Field(..., ge=0)
    lLabel: List[str]


class RecordControlConfig(BaseModel):
    sRecordCondition: Literal["time", "trigger"]
    sRecordType: Literal["video", "image"]
    iRecordTime: int = Field(..., ge=1, le=600)
    sRecordFormat: Literal["jpg", "raw"]
    sTriggerMethod: Literal["io", "ai", "serial"]
    iAntiShake: int = Field(..., ge=0, le=60)
    sIoPin: str
    sTriggerLevel: Literal["height", "low", "up", "down"]
    sTriggerComand: str
    iPfTrigger: int = Field(..., ge=0)
    sTriggerMask: str
    lCondition: List[RecordConditionEntry]
    sCurrentModel: str
    sModelType: Literal["cl", "det", "seg", "kp", "obb", "null"]


class ScheduleTimeSlot(BaseModel):
    startTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    endTime: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class RecordScheduleConfig(BaseModel):
    lMonday: List[ScheduleTimeSlot]
    lTuesday: List[ScheduleTimeSlot]
    lWednesday: List[ScheduleTimeSlot]
    lThursday: List[ScheduleTimeSlot]
    lFriday: List[ScheduleTimeSlot]
    lSaturday: List[ScheduleTimeSlot]
    lSunday: List[ScheduleTimeSlot]
