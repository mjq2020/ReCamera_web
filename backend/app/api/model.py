from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..dependencies import require_auth
from ..schemas.model import ModelConfigResponse, ModelConfigUpdate, ModelEntry
from ..state import state

router = APIRouter(prefix="/cgi-bin/entry.cgi", tags=["model"])


@router.get("/model/list", response_model=list[ModelEntry])
def list_models(_: str = Depends(require_auth)) -> list[ModelEntry]:
    return [ModelEntry(**model) for model in state.models]


@router.post("/model/upload")
def upload_model(file: UploadFile = File(...), _: str = Depends(require_auth)):
    contents = file.filename
    model_entry = {
        "sFileName": contents,
        "sModelNmae": contents.split(".")[0],
        "sModelType": "det",
        "iModelSize": file.size or 0,
    }
    state.models.append(model_entry)
    state.model_configs.setdefault(
        contents,
        {
            "sFileName": contents,
            "sModelType": "det",
            "dConfig": {
                "fThr": 0.2,
                "fIouThr": 0.5,
                "iMaxObject": 300,
                "lLablel": ["person"],
            },
        },
    )
    return {"status": 1, "message": f"Model {contents} uploaded"}


@router.get("/model/config", response_model=ModelConfigResponse)
def get_model_config(sFileName: str, _: str = Depends(require_auth)) -> ModelConfigResponse:
    config = state.model_configs.get(sFileName)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model config not found")
    return ModelConfigResponse(**config)


@router.post("/model/config", response_model=ModelConfigResponse)
def update_model_config(payload: ModelConfigUpdate, _: str = Depends(require_auth)) -> ModelConfigResponse:
    config = payload.model_dump()
    state.model_configs[config["sFileName"]] = config
    return ModelConfigResponse(**config)
