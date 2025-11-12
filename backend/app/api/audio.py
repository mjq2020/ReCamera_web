from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import require_auth
from ..schemas.audio import AudioConfig
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["audio"])


@router.get("/audio/{audio_id}", response_model=AudioConfig)
def get_audio(audio_id: int, _: str = Depends(require_auth)) -> AudioConfig:
    config = state.audio_streams.get(audio_id)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio stream not found")
    return AudioConfig(**config)


@router.put("/audio/{audio_id}", response_model=AudioConfig)
def set_audio(audio_id: int, payload: AudioConfig, _: str = Depends(require_auth)) -> AudioConfig:
    state.audio_streams[audio_id] = payload.model_dump()
    return AudioConfig(**state.audio_streams[audio_id])
