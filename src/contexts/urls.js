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

    networkWlan: "/network/wlan",
    networkWiFi: "/network/wifi",
    networkWiFiList: "/network/wifi-list",
    networkMultiCast: "/network/multicast",

    webSetting: "/web/setting",

    ftpSetting: "/ftp/setting",

    configExport: "/config/export",
    configUpload: "/config/upload",

    // log and Terminal
    wsTerminal: "/ws/system/terminal",
    wsLogs: "/ws/system/wslogs",
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

};
