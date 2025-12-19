export const urls = {
    // base info
    systemLogin: '/system/login',
    systemInfo: '/system/device-info',
    systemTime: "/system/time",
    systemResourceInfo: "/system/resource-info",
    systemFirmwareUpgrade: "/system/firmware-upgrade",
    systemFirmwareNetwork: "/system/firmware-network",
    systemReboot: "/system/reboot",
    systemFactoryReset: "/system/factory-reset",
    systemPassword: "/system/password",

    networkWlan: "/network/lan",
    networkWiFi: "/network/wifi",
    networkWiFiList: "/network/wifi-list",
    networkMultiCast: "/network/multicast",

    webSetting: "/web/setting",

    ftpSetting: "/ftp/setting",

    configExport: "/config/export",
    configUpload: "/config/upload",

    // log and Terminal
    wsSystemTerminal: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + "/ws/system/terminal",
    wsSystemLogs: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + "/ws/system/logs",
    wsTtyd: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + "/ws/",

    // AI inference
    modelList: "/model/list",
    modelUpload: "/model/upload",
    modelDelete: "/model/delete",
    modelInfo: "/model/info",
    modelAlgo: "/model/algorithm",
    modelInference: "/model/inference",
    wsInferenceResults: "/ws/inference/results",
    nofifyConfig: "/notify/cfg",

    // Live Settings - Video
    videoEncode: (streamId) => `/video/${streamId}/encode`,
    videoOsdChar: (streamId) => `/video/${streamId}/osd-char`,
    videoOsdInference: (streamId) => `/video/${streamId}/osd-inference`,
    videoOsdMask: (streamId) => `/video/${streamId}/osd-mask`,
    videoStream: (streamId) => `/video/${streamId}/stream`,
    videoOsdConfig: "/osd/cfg",

    // Live Settings - Audio
    audio: (id) => `/audio/${id}`,

    // Image Settings
    imageAll: "/image/0",
    imageVideoAdjustment: "/image/0/video-adjustment",
    imageNightToDay: "/image/0/night-to-day",
    imageScene: "/image/0/scene",
    imageSceneSave: "/image/0/scene-save",
    imageAdjustment: (sceneId) => `/image/0/${sceneId}/adjustment`,
    imageExposure: (sceneId) => `/image/0/${sceneId}/exposure`,
    imageWhiteBlance: (sceneId) => `/image/0/${sceneId}/white-blance`,
    imageBLC: (sceneId) => `/image/0/${sceneId}/blc`,
    imageEnhancement: (sceneId) => `/image/0/${sceneId}/enhancement`,
    imageAF: (sceneId) => `/image/0/${sceneId}/af`,

    // record
    recordConfig: "/vigil/rule/config",
    recordScheduleConfig: "/vigil/rule/schedule-rule-config",
    recordRecordRuleConfig: "/vigil/rule/record-rule-config",
    recordStorageConfig: "/vigil/storage/config",
    recordStorageStatus: "/vigil/storage/status",
    recordStorageControl: "/vigil/storage/control",
    recordRelay: (relayUuid, path) => `/vigil/relay/${relayUuid}${path ? '/' + path : ''}`,

    // Sensecraft 第三方平台
    sensecraftParseToken: "/api/v1/user/login_token",
    sensecraftCreateTask: "/v1/api/create_task",
    sensecraftTaskStatus: "/v1/api/train_status",
    sensecraftModelList: "/v1/api/get_training_records",
    sensecraftDownloadModel: "/v1/api/get_model",
    sensecraftDeleteModel: "/v1/api/del_model",
};
