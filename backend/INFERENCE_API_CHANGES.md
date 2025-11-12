# AI 推理 API 更新说明

## 概述
根据最新的 API 文档（reCamera_API.txt 第四章）重新实现了推理相关的所有接口。

## 修改的文件

### 1. `backend/app/schemas/inference.py`
重新定义了所有数据模型，包括：

#### 模型管理相关
- **ModelMetrics**: 模型评估指标（iou, confidence, topk）
- **ModelInfo**: 完整的模型信息（名称、框架、版本、类别、算法、描述、类别列表等）
- **ModelListItem**: 模型列表项（模型文件名 + 模型信息）
- **AlgorithmSupport**: 支持的算法列表（检测、分类、分割、跟踪、关键点）

#### 推理相关
- **InferenceStatus**: 推理状态（使能、状态、当前模型、FPS）
- **InferenceConfig**: 推理配置（使能、模型、FPS）

#### 通知配置相关
- **NotifyTemplate**: 输出模板（检测、分类、分割、跟踪、关键点、OBB）
- **MqttConfig**: MQTT 配置
- **UartConfig**: 串口配置
- **HttpConfig**: HTTP 配置
- **NotifyConfig**: 完整的通知配置

### 2. `backend/app/api/inference.py`
重新实现了所有 API 端点：

#### 模型管理接口
1. **GET `/model/list`** - 获取设备已有模型列表
   - 返回模型列表，包含模型信息（如果存在）

2. **POST `/model/upload`** - 上传模型（支持分段上传和断点续传）
   - 参数：`upload-type=resumable` 开始上传
   - 参数：`id=xxx` 上传模型内容
   - 参数：`start=xxx&File-name=xxx&md5sum=xxx` 结束上传

3. **DELETE `/model/delete`** - 删除模型
   - 参数：`File-name=xxx`

4. **GET `/model/info`** - 获取模型信息
   - 参数：`File-name=xxx`

5. **POST `/model/info`** - 设置或添加模型信息
   - 参数：`File-name=xxx`
   - Body: ModelInfo JSON

6. **GET `/model/algorithm`** - 获取当前支持的模型算法
   - 返回所有支持的算法类型

#### 推理管理接口
7. **GET `/model/inference`** - 获取推理状态
   - 参数：`id=0`（推理通道 ID）
   - 返回：使能状态、运行状态、当前模型、FPS

8. **POST `/model/inference`** - 推理配置
   - 参数：`id=0`（推理通道 ID）
   - Body: InferenceConfig JSON
   - 返回：更新后的推理状态

#### 通知配置接口
9. **GET `/notify/cfg`** - 获取推理输出配置
   - 返回：输出方式、模板、MQTT/UART/HTTP 配置

10. **POST `/notify/cfg`** - 设置推理输出配置
    - Body: NotifyConfig JSON
    - 返回：更新后的配置

#### WebSocket 接口
11. **WebSocket `/ws/inference/results`** - 推理结果输出
    - 根据配置的模板发送推理结果
    - 格式化输出检测结果

12. **WebSocket `/ws/system/logs`** - 系统日志
    - 初次连接发送历史日志列表（JSON 数组）
    - 后续增量发送单条日志（JSON 对象）
    - 格式：`{sTimestamp, sLevel, sData}`

13. **WebSocket `/ws/system/terminal`** - 终端交互
    - 接收终端命令并返回模拟输出

## API 路径前缀
所有接口都使用统一的前缀：`/cgi-bin/entry.cgi`

## 主要改进

1. **完整实现模型管理功能**
   - 支持模型列表查询
   - 支持模型上传（分段上传和断点续传）
   - 支持模型删除
   - 支持模型信息的获取和配置

2. **推理配置分离**
   - 推理状态管理（GET/POST /model/inference）
   - 推理输出配置（GET/POST /notify/cfg）

3. **多种输出方式支持**
   - MQTT
   - HTTP
   - UART（串口）
   - 可配置的输出模板

4. **WebSocket 改进**
   - 推理结果使用配置的模板格式化输出
   - 系统日志支持初始历史日志和增量更新
   - 终端交互保持不变

## 数据格式示例

### 获取模型列表响应
```json
[
  {
    "model": "yolov5.rknn",
    "modelInfo": {
      "name": "yolov5",
      "framework": "rknn",
      "version": "1.0.0",
      "category": "Object Detection",
      "algorithm": "YOLOV5",
      "description": "YOLOv5 目标检测模型",
      "classes": ["person", "car", "bus", "truck"],
      "metrics": {
        "iou": 60,
        "confidence": 60,
        "topk": 100
      },
      "author": "Seeed Studio",
      "size": 1110,
      "md5sum": "b3312af49a5d59a2533c973695a2267a"
    }
  },
  {
    "model": "yolov8.rknn",
    "modelInfo": null
  }
]
```

### 推理状态响应
```json
{
  "iEnable": 1,
  "sStatus": "running",
  "sModel": "yolov5.rknn",
  "iFPS": 30
}
```

### 通知配置响应
```json
{
  "iMode": 1,
  "dTemplate": {
    "sDetection": "{timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
    "sClassification": "",
    "sSegmentation": "",
    "sTracking": "",
    "sKeypoint": "",
    "sOBB": ""
  },
  "dMqtt": {
    "sURL": "mqtt.example.com",
    "iPort": 1883,
    "sTopic": "results/data",
    "sUsername": "name",
    "sPassword": "root",
    "sClientId": "test"
  },
  "dUart": {
    "sPort": "/dev/ttyS0",
    "iBaudRate": 115200
  },
  "dHttp": {
    "sUrl": "http://192.168.1.111/results/data",
    "sToken": "admin xxx"
  }
}
```

## 注意事项

1. **认证要求**: 所有 REST API 都需要 JWT Token 认证（除了 WebSocket）
2. **模型上传**: 采用分段上传机制，支持断点续传，需要按照文档中的三步流程进行
3. **推理使能**: 只有当模型存在对应的模型信息文件时才能使能推理
4. **输出模式**: `iMode` 可选值：0=关闭, 1=MQTT, 2=HTTP, 3=UART
5. **WebSocket 日志格式**: 初次连接返回数组，后续返回单个对象

## 测试建议

1. 测试模型列表查询
2. 测试模型上传的三个阶段
3. 测试推理状态的获取和配置
4. 测试通知配置的获取和更新
5. 测试 WebSocket 推理结果输出
6. 测试 WebSocket 系统日志的初始和增量发送

## 前端更新

### Logs.js 组件
已更新前端日志组件以支持新的 WebSocket 日志格式：

1. **支持初始历史日志**：初次连接时接收日志数组
2. **支持增量更新**：后续接收单个日志对象
3. **添加日志级别**：从后端获取 `sLevel` 字段

```javascript
// 初次连接接收数组
[
  { sTimestamp: "xxx", sLevel: "INFO", sData: "系统启动" },
  { sTimestamp: "xxx", sLevel: "INFO", sData: "网络连接成功" }
]

// 后续增量发送单个对象
{ sTimestamp: "xxx", sLevel: "INFO", sData: "新日志条目" }
```

## 后续工作

1. 实现真实的模型文件存储和管理
2. 实现真实的推理引擎集成
3. 实现 MQTT/HTTP/UART 的实际输出功能
4. 添加更完善的错误处理
5. 添加文件上传进度跟踪
6. 在前端日志界面中显示日志级别（INFO/WARN/ERROR）

