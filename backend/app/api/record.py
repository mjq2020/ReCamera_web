from __future__ import annotations

from fastapi import APIRouter, Depends

from ..dependencies import require_auth
from ..schemas.record import RecordControlConfig, RecordScheduleConfig
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["record"])


@router.get("/record/control", response_model=RecordControlConfig)
def get_record_control(_: str = Depends(require_auth)) -> RecordControlConfig:
    return RecordControlConfig(**state.record_control)


@router.post("/record/control", response_model=RecordControlConfig)
def set_record_control(payload: RecordControlConfig, _: str = Depends(require_auth)) -> RecordControlConfig:
    state.record_control = payload.model_dump()
    return RecordControlConfig(**state.record_control)


@router.get("/record/schedule", response_model=RecordScheduleConfig)
def get_record_schedule(_: str = Depends(require_auth)) -> RecordScheduleConfig:
    return RecordScheduleConfig(**state.record_schedule)


@router.post("/record/schedule", response_model=RecordScheduleConfig)
def set_record_schedule(payload: RecordScheduleConfig, _: str = Depends(require_auth)) -> RecordScheduleConfig:
    state.record_schedule = payload.model_dump()
    return RecordScheduleConfig(**state.record_schedule)
