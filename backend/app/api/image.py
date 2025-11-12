from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import require_auth
from ..schemas.image import (
    ImageAdjustmentRequest,
    ImageBLCRequest,
    ImageConfig,
    ImageEnhancementRequest,
    ImageExposureRequest,
    ImageNightToDayRequest,
    ImageSceneRequest,
    ImageVideoAdjustmentRequest,
    ImageWhiteBalanceRequest,
)
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["image"])


def _get_image(cam_id: int) -> dict:
    config = state.image_config.get(cam_id)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    return config


def _get_profile(cam_id: int, scene_id: int) -> dict:
    config = _get_image(cam_id)
    profiles = config.get("profile", [])
    if not (0 <= scene_id < len(profiles)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found")
    return profiles[scene_id]


@router.get("/image/{cam_id}", response_model=ImageConfig)
def get_image_config(cam_id: int, _: str = Depends(require_auth)) -> ImageConfig:
    return ImageConfig(**_get_image(cam_id))


@router.post("/image/{cam_id}", response_model=ImageConfig)
def set_image_config(cam_id: int, payload: ImageConfig, _: str = Depends(require_auth)) -> ImageConfig:
    state.image_config[cam_id] = payload.model_dump()
    return ImageConfig(**state.image_config[cam_id])


@router.put("/image/{cam_id}/scene")
def set_image_scene(cam_id: int, payload: ImageSceneRequest, _: str = Depends(require_auth)):
    config = _get_image(cam_id)
    config["nightToDay"]["iProfileCur"] = payload.iProfileCur
    return {"status": 1, "message": "Scene updated"}


@router.put("/image/{cam_id}/video-adjustment", response_model=ImageConfig)
def set_video_adjustment(cam_id: int, payload: ImageVideoAdjustmentRequest, _: str = Depends(require_auth)) -> ImageConfig:
    config = _get_image(cam_id)
    config["videoAdjustment"] = payload.model_dump()
    return ImageConfig(**config)


@router.put("/image/{cam_id}/{scene_id}/night-to-day", response_model=ImageConfig)
def set_night_to_day(cam_id: int, scene_id: int, payload: ImageNightToDayRequest, _: str = Depends(require_auth)) -> ImageConfig:
    config = _get_image(cam_id)
    config["nightToDay"] = payload.model_dump()
    return ImageConfig(**config)


@router.put("/image/{cam_id}/{scene_id}/adjustment", response_model=ImageConfig)
def set_adjustment(cam_id: int, scene_id: int, payload: ImageAdjustmentRequest, _: str = Depends(require_auth)) -> ImageConfig:
    profile = _get_profile(cam_id, scene_id)
    profile["imageAdjustment"] = payload.model_dump()
    return ImageConfig(**_get_image(cam_id))


@router.put("/image/{cam_id}/{scene_id}/exposure", response_model=ImageConfig)
def set_exposure(cam_id: int, scene_id: int, payload: ImageExposureRequest, _: str = Depends(require_auth)) -> ImageConfig:
    profile = _get_profile(cam_id, scene_id)
    profile["exposure"] = payload.model_dump()
    return ImageConfig(**_get_image(cam_id))


@router.put("/image/{cam_id}/{scene_id}/blc", response_model=ImageConfig)
def set_blc(cam_id: int, scene_id: int, payload: ImageBLCRequest, _: str = Depends(require_auth)) -> ImageConfig:
    profile = _get_profile(cam_id, scene_id)
    profile["BLC"] = payload.model_dump()
    return ImageConfig(**_get_image(cam_id))


@router.put("/image/{cam_id}/{scene_id}/white-blance", response_model=ImageConfig)
def set_white_balance(cam_id: int, scene_id: int, payload: ImageWhiteBalanceRequest, _: str = Depends(require_auth)) -> ImageConfig:
    profile = _get_profile(cam_id, scene_id)
    profile["whiteBlance"] = payload.model_dump()
    return ImageConfig(**_get_image(cam_id))


@router.put("/image/{cam_id}/{scene_id}/enhancement", response_model=ImageConfig)
def set_enhancement(cam_id: int, scene_id: int, payload: ImageEnhancementRequest, _: str = Depends(require_auth)) -> ImageConfig:
    profile = _get_profile(cam_id, scene_id)
    profile["imageEnhancement"] = payload.model_dump()
    return ImageConfig(**_get_image(cam_id))
