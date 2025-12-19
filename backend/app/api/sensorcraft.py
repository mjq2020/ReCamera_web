from __future__ import annotations

import os
import requests
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel

from ..dependencies import require_auth

router = APIRouter(prefix="/cgi-bin/entry.cgi/sensecraft", tags=["sensecraft"])

# 配置
SENSECRAFT_BASE_URL = "https://test-sensecraft-train-api.seeed.cc"
SENSECRAFT_LOGIN_API = "https://sensecraft-hmi-api.seeed.cc/api/v1/user/login_token"


# ==================== Schemas ====================

class TokenParseRequest(BaseModel):
    """解析 token 获取 user_id 的请求"""
    token: str


class TokenParseResponse(BaseModel):
    """解析 token 的响应"""
    code: int = 0
    message: str = "success"
    data: dict


class CreateTaskRequest(BaseModel):
    """创建模型转换任务的请求"""
    user_id: str
    framework_type: int = 9  # 固定值：RKNN
    device_type: int = 40  # 固定值：reCamera


class CreateTaskResponse(BaseModel):
    """创建任务的响应"""
    code: int
    msg: str
    data: dict


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    code: int
    msg: str
    data: dict


class ModelListResponse(BaseModel):
    """模型列表响应"""
    code: int
    msg: str
    data: dict


# ==================== API Endpoints ====================

@router.post("/parse-token", response_model=TokenParseResponse)
async def parse_token(
    payload: TokenParseRequest,
    _: str = Depends(require_auth)
) -> TokenParseResponse:
    """
    解析 Sensecraft token 获取 user_id
    
    前端通过重定向获取 token 后，调用此接口解析获取 user_id
    """
    try:
        headers = {
            "Authorization": payload.token
        }
        
        response = requests.post(SENSECRAFT_LOGIN_API, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # 尝试从不同的可能位置获取 user_id
        user_id = data.get("result", {}).get("user_id") or data.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="无法从响应中获取 user_id")
        
        return TokenParseResponse(
            code=0,
            message="success",
            data={
                "user_id": user_id,
                "token": payload.token
            }
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"请求 Sensecraft API 失败: {str(e)}")


@router.post("/create-task", response_model=CreateTaskResponse)
async def create_conversion_task(
    user_id: str = Form(...),
    framework_type: int = Form(9),
    device_type: int = Form(40),
    file: UploadFile = File(...),
    dataset_file: Optional[UploadFile] = File(None),
    _: str = Depends(require_auth)
) -> CreateTaskResponse:
    """
    创建模型转换任务（ONNX → RKNN）
    
    Args:
        user_id: 用户ID（从 token 解析获得）
        framework_type: 框架类型，固定值 9（RKNN）
        device_type: 设备类型，固定值 40（reCamera）
        file: ONNX 模型文件
        dataset_file: 可选，用于量化的图片数据集 zip 文件
    """
    try:
        # 验证文件格式
        if not file.filename.lower().endswith('.onnx'):
            raise HTTPException(status_code=400, detail="模型文件必须是 .onnx 格式")
        
        # 准备请求
        url = f"{SENSECRAFT_BASE_URL}/v1/api/create_task"
        
        # 读取模型文件
        model_content = await file.read()
        
        files = {
            'file': (file.filename, model_content, 'application/octet-stream')
        }
        
        data = {
            'user_id': user_id,
            'framework_type': str(framework_type),
            'device_type': str(device_type)
        }
        
        # 如果提供了数据集，添加到请求中
        if dataset_file:
            if not dataset_file.filename.lower().endswith('.zip'):
                raise HTTPException(status_code=400, detail="数据集文件必须是 .zip 格式")
            
            dataset_content = await dataset_file.read()
            files['dataset_file'] = (dataset_file.filename, dataset_content, 'application/zip')
        
        # 发送请求到 Sensecraft API
        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        
        result = response.json()
        
        return CreateTaskResponse(**result)
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"创建任务失败: {str(e)}")


@router.get("/task-status", response_model=TaskStatusResponse)
async def get_task_status(
    user_id: str = Query(...),
    model_id: str = Query(...),
    _: str = Depends(require_auth)
) -> TaskStatusResponse:
    """
    获取转换任务当前状态
    
    Args:
        user_id: 用户ID
        model_id: 模型任务ID
    """
    try:
        url = f"{SENSECRAFT_BASE_URL}/v1/api/train_status"
        params = {
            "user_id": user_id,
            "model_id": model_id
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        
        return TaskStatusResponse(**result)
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"查询状态失败: {str(e)}")


@router.get("/model-list", response_model=ModelListResponse)
async def get_model_list(
    user_id: str = Query(...),
    framework_type: int = Query(9),
    device_type: int = Query(40),
    page: int = Query(1),
    size: int = Query(10),
    _: str = Depends(require_auth)
) -> ModelListResponse:
    """
    获取用户的模型列表
    
    Args:
        user_id: 用户ID
        framework_type: 框架类型，固定值 9（RKNN）
        device_type: 设备类型，固定值 40（reCamera）
        page: 页码
        size: 每页数量
    """
    try:
        url = f"{SENSECRAFT_BASE_URL}/v1/api/get_training_records"
        params = {
            "user_id": user_id,
            "framework_type": framework_type,
            "device_type": device_type,
            "page": page,
            "size": size
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        
        return ModelListResponse(**result)
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"查询模型列表失败: {str(e)}")


@router.get("/download-model")
async def download_model(
    user_id: str = Query(...),
    model_id: str = Query(...),
    _: str = Depends(require_auth)
):
    """
    下载转换完成的 RKNN 模型
    
    Args:
        user_id: 用户ID
        model_id: 模型任务ID
    
    Returns:
        RKNN 模型文件（二进制流）
    """
    try:
        url = f"{SENSECRAFT_BASE_URL}/v1/api/get_model"
        params = {
            "user_id": user_id,
            "model_id": model_id
        }
        
        response = requests.get(url, params=params, stream=True)
        response.raise_for_status()
        
        # 返回文件流
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            response.iter_content(chunk_size=8192),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={model_id}.rknn"
            }
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"下载模型失败: {str(e)}")
