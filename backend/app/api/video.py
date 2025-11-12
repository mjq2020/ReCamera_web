from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import require_auth
from ..schemas.video import (
    EncodeSettings,
    OSDCharSettings,
    OSDInferenceSettings,
    OSDMaskSettings,
    StreamConfig,
    StreamUpdateRequest,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["video"])


def _get_stream(stream_id: int) -> Dict[str, Dict]:
    if stream_id not in state.video_streams:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")
    return state.video_streams[stream_id]


@router.get("/video/{stream_id}/encode", response_model=EncodeSettings)
def get_encode(stream_id: int, _: str = Depends(require_auth)) -> EncodeSettings:
    stream = _get_stream(stream_id)
    return EncodeSettings(**stream.get("encode", {}))


@router.put("/video/{stream_id}/encode", response_model=EncodeSettings)
def update_encode(stream_id: int, payload: EncodeSettings, _: str = Depends(require_auth)) -> EncodeSettings:
    stream = _get_stream(stream_id)
    stream["encode"] = payload.model_dump()
    return EncodeSettings(**stream["encode"])


@router.get("/video/{stream_id}/osd-char", response_model=OSDCharSettings)
def get_osd_char(stream_id: int, _: str = Depends(require_auth)) -> OSDCharSettings:
    stream = _get_stream(stream_id)
    return OSDCharSettings(**stream.get("osd-char", {}))


@router.put("/video/{stream_id}/osd-char", response_model=OSDCharSettings)
def update_osd_char(stream_id: int, payload: OSDCharSettings, _: str = Depends(require_auth)) -> OSDCharSettings:
    stream = _get_stream(stream_id)
    stream["osd-char"] = payload.model_dump()
    return OSDCharSettings(**stream["osd-char"])


@router.get("/video/{stream_id}/osd-inference", response_model=OSDInferenceSettings)
def get_osd_inference(stream_id: int, _: str = Depends(require_auth)) -> OSDInferenceSettings:
    stream = _get_stream(stream_id)
    return OSDInferenceSettings(**stream.get("osd-inference", {}))


@router.post("/video/{stream_id}/osd-inference", response_model=OSDInferenceSettings)
def update_osd_inference(stream_id: int, payload: OSDInferenceSettings, _: str = Depends(require_auth)) -> OSDInferenceSettings:
    stream = _get_stream(stream_id)
    stream["osd-inference"] = payload.model_dump()
    return OSDInferenceSettings(**stream["osd-inference"])


@router.get("/video/{stream_id}/osd-mask", response_model=OSDMaskSettings)
def get_osd_mask(stream_id: int, _: str = Depends(require_auth)) -> OSDMaskSettings:
    stream = _get_stream(stream_id)
    return OSDMaskSettings(**stream.get("osd-mask", {}))


@router.post("/video/{stream_id}/osd-mask", response_model=OSDMaskSettings)
def update_osd_mask(stream_id: int, payload: OSDMaskSettings, _: str = Depends(require_auth)) -> OSDMaskSettings:
    stream = _get_stream(stream_id)
    stream["osd-mask"] = payload.model_dump()
    return OSDMaskSettings(**stream["osd-mask"])


@router.get("/video/{stream_id}/stream", response_model=StreamConfig)
def get_stream_config(stream_id: int, _: str = Depends(require_auth)) -> StreamConfig:
    stream = _get_stream(stream_id)
    return StreamConfig(**stream.get("stream", {}))


@router.post("/video/{stream_id}/stream", response_model=StreamConfig)
def update_stream_config(stream_id: int, payload: StreamUpdateRequest, _: str = Depends(require_auth)) -> StreamConfig:
    stream = _get_stream(stream_id)
    stream["stream"] = payload.model_dump()
    return StreamConfig(**stream["stream"])
