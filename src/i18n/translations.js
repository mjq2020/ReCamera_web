// 国际化翻译文件
export const translations = {
  zh: {
    // 应用标题
    appTitle: 'ReCamera2',

    // 侧边栏菜单
    sidebar: {
      preview: '实时预览',
      deviceInfo: '设备信息',
      liveView: '画面设置',
      recordSettings: '录制设置',
      aiInference: 'AI推理',
      terminal: '终端'
    },

    // 设备信息页面
    deviceInfo: {
      title: '设备信息',
      description: '查看和管理设备的基本信息',
      basicInfo: '基本信息',
      deviceName: '设备名称',
      model: '设备型号',
      firmwareVersion: '固件版本',
      serialNumber: '序列号',
      ipAddress: 'IP地址',
      macAddress: 'MAC地址',
      status: '设备状态',
      uptime: '运行时间',
      online: '在线',
      offline: '离线',
      systemResources: '系统资源',
      cpuUsage: 'CPU使用率',
      memoryUsage: '内存使用率',
      storageSpace: '存储空间',
      saveConfig: '保存配置',
      restartDevice: '重启设备',
      factoryReset: '恢复出厂设置'
    },

    // 画面设置页面
    liveView: {
      title: '画面设置',
      description: '查看摄像头实时视频流',
      playing: '实时视频流',
      stopped: '点击播放按钮开始预览',
      play: '播放',
      pause: '暂停',
      screenshot: '截图',
      record: '录制',
      resolution: '分辨率',
      videoParams: '视频参数',
      framerate: '帧率（FPS）',
      bitrate: '比特率（Mbps）',
      encodingFormat: '编码格式',
      imageQuality: '图像质量',
      high: '高',
      medium: '中',
      low: '低',
      applySettings: '应用设置'
    },

    // 录制设置页面
    recordSettings: {
      title: '录制设置',
      description: '配置视频录制参数和存储选项',
      recordMode: '录制模式',
      enableAutoRecord: '启用自动录制',
      mode: '录制模式',
      continuous: '连续录制',
      schedule: '定时录制',
      motion: '运动检测触发',
      aiTrigger: 'AI事件触发',
      schedulePlan: '定时录制计划',
      startTime: '开始时间',
      endTime: '结束时间',
      storageSettings: '存储设置',
      storagePath: '存储路径',
      segmentDuration: '文件分段（分钟）',
      maxStorage: '最大存储空间（GB）',
      loopOverwrite: '循环覆盖',
      enable: '启用',
      disable: '禁用',
      recordFileList: '录制文件列表',
      fileName: '文件名',
      dateTime: '日期时间',
      size: '大小',
      duration: '时长',
      actions: '操作',
      play: '播放',
      download: '下载',
      delete: '删除',
      saveSettings: '保存设置',
      reset: '重置'
    },

    // AI推理页面
    aiInference: {
      title: 'AI推理配置',
      description: '配置AI模型和推理参数',
      aiSettings: 'AI功能设置',
      enableAI: '启用AI推理',
      taskType: 'AI任务类型',
      detection: '目标检测 (Object Detection)',
      segmentation: '图像分割 (Segmentation)',
      keypoint: '关键点检测 (Keypoint Detection)',
      classification: '图像分类 (Classification)',

      // 目标检测
      detectionConfig: '目标检测配置',
      modelSelect: '模型选择',
      confidenceThreshold: '置信度阈值',
      iouThreshold: 'IOU阈值',
      detectionClasses: '检测类别',
      showBoxes: '显示检测框',
      showLabels: '显示标签',
      showConfidence: '显示置信度',

      // 图像分割
      segmentationConfig: '图像分割配置',
      segmentationModel: '分割模型',
      maskOpacity: '掩码透明度',
      segmentationType: '分割类型',
      instanceSeg: '实例分割',
      semanticSeg: '语义分割',

      // 关键点检测
      keypointConfig: '关键点检测配置',
      keypointModel: '关键点模型',
      scenario: '应用场景',
      poseEstimation: '人体姿态估计',
      facialKeypoint: '面部关键点',
      handKeypoint: '手部关键点',
      keypointCount: '关键点数量',
      showSkeleton: '显示骨架连接',
      showKeypoints: '显示关键点',

      // 图像分类
      classificationConfig: '图像分类配置',
      classificationModel: '分类模型',
      topK: 'Top-K结果',
      dataset: '分类数据集',
      imagenet: 'ImageNet-1K',
      customDataset: '自定义数据集',

      // 推理性能
      inferencePerformance: '推理性能',
      inferenceDevice: '推理设备',
      inputSize: '输入尺寸',
      batchSize: '批处理大小',
      inferenceInterval: '推理间隔（帧）',

      // 实时统计
      realtimeStats: '实时统计',
      inferenceSpeed: '推理速度',
      avgLatency: '平均延迟',
      detectedObjects: '检测对象数',
      gpuUsage: 'GPU占用率',

      saveConfig: '保存配置',
      testInference: '测试推理',
      exportModel: '导出模型'
    },

    // 终端页面
    terminal: {
      title: '终端控制台',
      description: '通过命令行管理和监控设备',
      quickActions: '快捷操作',
      viewStatus: '查看状态',
      viewLogs: '查看日志',
      networkInfo: '网络信息',
      aiStatus: 'AI状态',
      clearTerminal: '清空终端',
      inputPlaceholder: '输入命令...',
      welcomeMessage: 'ReCamera2 终端 v1.0.0',
      helpMessage: '输入 "help" 查看可用命令'
    },

    // 通用
    common: {
      language: '语言',
      theme: '主题',
      light: '亮色',
      dark: '暗色'
    }
  },

  en: {
    // App title
    appTitle: 'ReCamera2',

    // Sidebar menu
    sidebar: {
      preview: 'Live Preview',
      deviceInfo: 'Device Info',
      liveView: 'Live View',
      recordSettings: 'Record Settings',
      aiInference: 'AI Inference',
      terminal: 'Terminal'
    },

    // Device Info page
    deviceInfo: {
      title: 'Device Information',
      description: 'View and manage basic device information',
      basicInfo: 'Basic Information',
      deviceName: 'Device Name',
      model: 'Model',
      firmwareVersion: 'Firmware Version',
      serialNumber: 'Serial Number',
      ipAddress: 'IP Address',
      macAddress: 'MAC Address',
      status: 'Status',
      uptime: 'Uptime',
      online: 'Online',
      offline: 'Offline',
      systemResources: 'System Resources',
      cpuUsage: 'CPU Usage',
      memoryUsage: 'Memory Usage',
      storageSpace: 'Storage Space',
      saveConfig: 'Save Config',
      restartDevice: 'Restart Device',
      factoryReset: 'Factory Reset'
    },

    // Live View page
    liveView: {
      title: 'Live View',
      description: 'View camera real-time video stream',
      playing: 'Live Video Stream',
      stopped: 'Click play button to start preview',
      play: 'Play',
      pause: 'Pause',
      screenshot: 'Screenshot',
      record: 'Record',
      resolution: 'Resolution',
      videoParams: 'Video Parameters',
      framerate: 'Frame Rate (FPS)',
      bitrate: 'Bitrate (Mbps)',
      encodingFormat: 'Encoding Format',
      imageQuality: 'Image Quality',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      applySettings: 'Apply Settings'
    },

    // Record Settings page
    recordSettings: {
      title: 'Record Settings',
      description: 'Configure video recording parameters and storage options',
      recordMode: 'Record Mode',
      enableAutoRecord: 'Enable Auto Record',
      mode: 'Mode',
      continuous: 'Continuous',
      schedule: 'Schedule',
      motion: 'Motion Detection',
      aiTrigger: 'AI Trigger',
      schedulePlan: 'Schedule Plan',
      startTime: 'Start Time',
      endTime: 'End Time',
      storageSettings: 'Storage Settings',
      storagePath: 'Storage Path',
      segmentDuration: 'Segment Duration (min)',
      maxStorage: 'Max Storage (GB)',
      loopOverwrite: 'Loop Overwrite',
      enable: 'Enable',
      disable: 'Disable',
      recordFileList: 'Record File List',
      fileName: 'File Name',
      dateTime: 'Date Time',
      size: 'Size',
      duration: 'Duration',
      actions: 'Actions',
      play: 'Play',
      download: 'Download',
      delete: 'Delete',
      saveSettings: 'Save Settings',
      reset: 'Reset'
    },

    // AI Inference page
    aiInference: {
      title: 'AI Inference',
      description: 'Configure AI models and inference parameters',
      aiSettings: 'AI Settings',
      enableAI: 'Enable AI Inference',
      taskType: 'Task Type',
      detection: 'Object Detection',
      segmentation: 'Segmentation',
      keypoint: 'Keypoint Detection',
      classification: 'Classification',

      // Detection
      detectionConfig: 'Detection Configuration',
      modelSelect: 'Model',
      confidenceThreshold: 'Confidence Threshold',
      iouThreshold: 'IOU Threshold',
      detectionClasses: 'Detection Classes',
      showBoxes: 'Show Boxes',
      showLabels: 'Show Labels',
      showConfidence: 'Show Confidence',

      // Segmentation
      segmentationConfig: 'Segmentation Configuration',
      segmentationModel: 'Model',
      maskOpacity: 'Mask Opacity',
      segmentationType: 'Segmentation Type',
      instanceSeg: 'Instance Segmentation',
      semanticSeg: 'Semantic Segmentation',

      // Keypoint
      keypointConfig: 'Keypoint Configuration',
      keypointModel: 'Model',
      scenario: 'Scenario',
      poseEstimation: 'Pose Estimation',
      facialKeypoint: 'Facial Keypoint',
      handKeypoint: 'Hand Keypoint',
      keypointCount: 'Keypoint Count',
      showSkeleton: 'Show Skeleton',
      showKeypoints: 'Show Keypoints',

      // Classification
      classificationConfig: 'Classification Configuration',
      classificationModel: 'Model',
      topK: 'Top-K Results',
      dataset: 'Dataset',
      imagenet: 'ImageNet-1K',
      customDataset: 'Custom Dataset',

      // Performance
      inferencePerformance: 'Inference Performance',
      inferenceDevice: 'Device',
      inputSize: 'Input Size',
      batchSize: 'Batch Size',
      inferenceInterval: 'Inference Interval (frames)',

      // Stats
      realtimeStats: 'Realtime Statistics',
      inferenceSpeed: 'Inference Speed',
      avgLatency: 'Avg Latency',
      detectedObjects: 'Detected Objects',
      gpuUsage: 'GPU Usage',

      saveConfig: 'Save Config',
      testInference: 'Test Inference',
      exportModel: 'Export Model'
    },

    // Terminal page
    terminal: {
      title: 'Terminal Console',
      description: 'Manage and monitor device via command line',
      quickActions: 'Quick Actions',
      viewStatus: 'View Status',
      viewLogs: 'View Logs',
      networkInfo: 'Network Info',
      aiStatus: 'AI Status',
      clearTerminal: 'Clear',
      inputPlaceholder: 'Enter command...',
      welcomeMessage: 'ReCamera2 Terminal v1.0.0',
      helpMessage: 'Type "help" to see available commands'
    },

    // Common
    common: {
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark'
    }
  }
};

