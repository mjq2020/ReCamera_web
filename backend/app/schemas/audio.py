from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AudioConfig(BaseModel):
    iEnable: int = Field(..., ge=0, le=1)
    iBitRate: int = Field(..., gt=0)
    sEncodeType: Literal["G711A", "G711U", "OPUS"]
