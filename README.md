# ReCamera2 Web

这是一个基于React的AI摄像头配置前端应用，支持传统IP摄像头功能以及AI推理功能。

## ✨ 特色功能

- 🌐 **国际化支持**：中英文双语切换
- 🎨 **主题切换**：亮色/暗色主题，保护视力
- 📱 **响应式设计**：支持桌面和移动设备
- 🤖 **AI推理**：支持目标检测、分割、关键点检测、分类等多种任务
- 🎥 **实时监控**：视频流预览和录制管理
- 💻 **终端控制**：命令行方式管理设备

## 功能模块

### 1. 设备信息
- 查看设备基本信息（名称、型号、序列号等）
- 监控系统资源使用情况（CPU、内存、存储）
- 设备管理操作（保存配置、重启、恢复出厂设置）

### 2. 实时画面
- 实时视频流预览
- 视频控制（播放、暂停、截图、录制）
- 视频参数调整（分辨率、帧率、比特率、编码格式）

### 3. 录制设置
- 多种录制模式（连续录制、定时录制、运动检测触发、AI事件触发）
- 存储配置（路径、文件分段、循环覆盖）
- 录制文件管理（查看、播放、下载、删除）

### 4. AI推理
支持四种AI任务类型：
- **目标检测 (Object Detection)**：使用YOLO系列模型进行实时目标检测
- **图像分割 (Segmentation)**：实例分割和语义分割
- **关键点检测 (Keypoint Detection)**：人体姿态估计、面部和手部关键点检测
- **图像分类 (Classification)**：使用ResNet、EfficientNet等模型进行分类

每个任务都可以配置：
- 模型选择
- 推理参数（置信度阈值、批处理大小等）
- 推理设备（GPU、CPU、NPU）
- 可视化选项

### 5. 终端
- 命令行界面管理设备
- 支持常用命令（status、logs、network、ai-status等）
- 快捷操作按钮

## 🚀 快速开始

### 方式一：只看前端（最简单）
```bash
npm install
npm start
```
访问 http://localhost:3000 （使用模拟数据）

### 方式二：前后端完整体验

**终端1（后端）：**
```bash
pip install -r requirements.txt
python backend_example.py
```

**终端2（前端）：**
```bash
npm install
npm start
```

📖 **详细步骤请查看：[QUICKSTART.md](./QUICKSTART.md)**

## 🔌 后端API集成

### 快速启动后端服务

设备信息页面需要后端API支持。我们提供了一个完整的Python Flask后端示例。

#### 1. 安装Python依赖
```bash
pip install -r requirements.txt
```

#### 2. 启动后端服务
```bash
python backend_example.py
```

后端服务将在 http://localhost:8080 运行

#### 3. 功能说明
- ✅ 自动每5秒刷新设备信息
- ✅ 显示实时CPU、内存、存储使用率
- ✅ 支持手动刷新
- ✅ 可以开关自动刷新
- ✅ 显示最后更新时间
- ✅ 错误处理（后端不可用时使用模拟数据）

详细说明请查看：
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - 后端启动指南
- [API_EXAMPLE.md](./API_EXAMPLE.md) - API接口文档

### 不启动后端也可以测试

如果不启动后端服务，前端会自动使用模拟数据，数据会每5秒随机变化，方便测试UI效果。

应用将在 http://localhost:3000 运行

### 构建生产版本
```bash
npm build
```

## 项目结构

```
RC2Web/
├── public/
│   └── index.html              # HTML模板
├── src/
│   ├── components/             # 可复用组件
│   │   ├── Header.js           # 顶部导航栏（含语言和主题切换）
│   │   ├── Header.css
│   │   ├── Sidebar.js          # 侧边栏导航
│   │   └── Sidebar.css
│   ├── contexts/               # React Context
│   │   └── AppContext.js       # 全局状态（语言、主题）
│   ├── i18n/                   # 国际化
│   │   └── translations.js     # 中英文翻译文件
│   ├── pages/                  # 页面组件
│   │   ├── DeviceInfo.js       # 设备信息页面
│   │   ├── LiveView.js         # 实时画面页面
│   │   ├── RecordSettings.js   # 录制设置页面
│   │   ├── AIInference.js      # AI推理配置页面
│   │   ├── Terminal.js         # 终端页面
│   │   └── PageStyles.css      # 页面通用样式（支持主题）
│   ├── App.js                  # 主应用组件
│   ├── App.css                 # 主应用样式
│   ├── index.js                # 应用入口
│   └── index.css               # 全局样式（CSS变量定义）
├── package.json
├── README.md                   # 项目说明
├── FEATURES.md                 # 新功能详细说明
├── UPDATE_GUIDE.md             # 组件更新指南
└── .gitignore
```

## 技术栈

- **React 18** - 前端框架
- **React Context API** - 全局状态管理（语言、主题）
- **CSS3 + CSS Variables** - 样式设计和主题系统
- **国际化 (i18n)** - 多语言支持
- **现代化UI** - 响应式设计，适配移动端和桌面端

## 🌐 语言和主题

### 语言切换
应用支持中文和英文双语。点击页面右上角的 **🌐 语言** 按钮即可切换。

### 主题切换
应用支持亮色和暗色两种主题。点击页面右上角的 **主题** 按钮即可切换。

更多详情请查看 [FEATURES.md](./FEATURES.md)

## 📋 开发状态

### 已完成 ✅
- [x] 基础框架和页面结构
- [x] 国际化系统（中英文）
- [x] 主题切换（亮色/暗色）
- [x] 响应式设计
- [x] Header组件（含语言和主题控制）
- [x] Sidebar组件（支持国际化）
- [x] DeviceInfo页面（支持国际化）
- [x] CSS主题系统（CSS变量）
- [x] **后端API集成示例**（设备信息自动刷新）
- [x] **Python Flask后端示例**（可直接运行）

### 进行中 🚧
- [ ] 更新其他页面组件支持国际化（LiveView、RecordSettings、AIInference、Terminal）
  - 翻译文本已定义好，需要更新组件代码
  - 参考 [UPDATE_GUIDE.md](./UPDATE_GUIDE.md) 进行更新

### 后续扩展建议 💡

1. **后端集成**：连接实际的摄像头API和AI推理服务
2. **WebSocket**：实现实时视频流和AI推理结果的实时更新
3. **路由**：如需要独立URL，可添加React Router
4. **图表库**：集成Chart.js或ECharts显示统计数据
5. **视频播放器**：集成Video.js或其他专业视频播放器
6. **更多语言**：添加日语、韩语等其他语言支持
7. **更多主题**：添加自定义主题色

## 📚 文档导航

- **[QUICKSTART.md](./QUICKSTART.md)** - 🚀 5分钟快速上手指南
- **[FEATURES.md](./FEATURES.md)** - ✨ 功能特性详细说明
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 📐 系统架构和技术细节
- **[API_EXAMPLE.md](./API_EXAMPLE.md)** - 🔌 后端API接口文档
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - 🔧 后端服务配置指南
- **[UPDATE_GUIDE.md](./UPDATE_GUIDE.md)** - 📝 组件国际化更新指南

## 许可证

MIT License

