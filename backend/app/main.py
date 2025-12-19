from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import system, network, video, audio, image, record, model, inference, sensorcraft

app = FastAPI(title="reCamera Mock Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（开发环境）
    allow_credentials=True,  # 允许携带 Cookie
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
    expose_headers=["File-Id", "Content-Range"],  # 暴露自定义响应头
)

app.include_router(system.router)
app.include_router(network.router)
app.include_router(network.download_router)  # 下载路由（没有前缀）
app.include_router(video.router)
app.include_router(audio.router)
app.include_router(image.router)
app.include_router(record.router)
# app.include_router(model.router)
app.include_router(inference.router)
app.include_router(sensorcraft.router)
