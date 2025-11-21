import axios from 'axios'
import { urls } from './urls'

const axiosInstance = axios.create(
    {
        baseURL: "http://192.168.1.66:8000/cgi-bin/entry.cgi/",
        timeout: 10000,
        withCredentials: true,
        responseType: 'json',
        headers: {
            "Content-Type": 'application/json',
        },
        params: {}
    }

)

class DeviceInfoAPI {

    static login(data) {
        return axiosInstance.post(urls.systemLogin, data)
    }

    static getDeviceInfo() {
        return axiosInstance.get(urls.systemInfo)
    }

    static getSystemTime() {
        return axiosInstance.get(urls.systemTime)
    }

    static putSystemTime(data) {
        return axiosInstance.put(urls.systemTime, data)
    }

    static getSystemResourceInfo() {
        return axiosInstance.get(urls.systemResourceInfo)
    }

    static getWlanInfo() {
        return axiosInstance.get(urls.networkWlan)
    }

    static putWlanInfo(data) {
        return axiosInstance.put(urls.networkWlan, data)
    }

    static getWifiInfo() {
        return axiosInstance.get(urls.networkWiFi)
    }

    static postWifiInfo(data) {
        return axiosInstance.post(urls.networkWiFi, data)
    }
    static getWifiList() {
        return axiosInstance.get(urls.networkWiFiList)
    }

    static postScanWifi(scan) {
        return axiosInstance.post(urls.networkWiFi, {}, {
            params: {
                scan: scan
            }
        })
    }
    static deleteWifi(ssid) {
        return axiosInstance.delete(urls.networkWiFi, {
            params: {
                service: ssid
            }
        })
    }

    static postWifiPower(power) {
        return axiosInstance.post(urls.networkWiFi, {
            params: {
                power: power
            }
        })
    }

    static getMultiCastInfo() {
        return axiosInstance.get(urls.networkMultiCast)
    }

    static postMutiCast(data) {
        return axiosInstance.post(urls.networkMultiCast, data)

    }

    static getWebSetting() {
        return axiosInstance.get(urls.webSetting)
    }

    static postWebSetting(data) {
        return axiosInstance.post(urls.webSetting, data)
    }

    static getFtpSetting() {
        return axiosInstance.get(urls.ftpSetting)
    }

    static postFtpSetting(data) {
        return axiosInstance.post(urls.ftpSetting, data)
    }

    static getConfig() {
        axiosInstance.get(urls.configExport, { responseType: 'json' })
    }

    static postConfig(data) {
        axiosInstance.post(urls.configUpload, data)

    }

    static postFirmware(data) {
        axiosInstance.post(urls.systemFirmwareUpgrade, data)
    }

    static postFirmwareNetwork(data) {
        axiosInstance.post(urls.systemFirmwareNetwork, data)
    }

    static postReboot() {
        return axiosInstance.post(urls.systemReboot)
    }

    static postFactoryReset() {
        return axiosInstance.post(urls.systemFactoryReset)
    }

    static putPassword(data) {
        return axiosInstance.put(urls.systemPassword, data)
    }

}

class VideoAPI {
    // 视频编码配置
    static getVideoEncode(streamId) {
        return axiosInstance.get(urls.videoEncode(streamId))
    }

    static putVideoEncode(streamId, data) {
        return axiosInstance.put(urls.videoEncode(streamId), data)
    }

    // OSD 字符配置
    static getVideoOsdChar(streamId) {
        return axiosInstance.get(urls.videoOsdChar(streamId))
    }

    static putVideoOsdChar(streamId, data) {
        return axiosInstance.put(urls.videoOsdChar(streamId), data)
    }

    // AI 推理结果显示配置
    static getVideoOsdInference(streamId) {
        return axiosInstance.get(urls.videoOsdInference(streamId))
    }

    static postVideoOsdInference(streamId, data) {
        return axiosInstance.post(urls.videoOsdInference(streamId), data)
    }

    // 视频遮盖配置
    static getVideoOsdMask(streamId) {
        return axiosInstance.get(urls.videoOsdMask(streamId))
    }

    static postVideoOsdMask(streamId, data) {
        return axiosInstance.post(urls.videoOsdMask(streamId), data)
    }

    // 推流配置
    static getVideoStream(streamId) {
        return axiosInstance.get(urls.videoStream(streamId))
    }

    static postVideoStream(streamId, data) {
        return axiosInstance.post(urls.videoStream(streamId), data)
    }

    // 获取音频编码配置
    static getAudioConfig(id) {
        return axiosInstance.get(urls.audio(id))
    }

    // 配置音频编码
    static putAudioConfig(id, data) {
        return axiosInstance.put(urls.audio(id), data)
    }

    // 获取当前画面所有参数
    static getImageAll() {
        return axiosInstance.get(urls.imageAll)
    }

    // 配置当前画面所有参数（恢复默认值）
    static postImageAll(data) {
        return axiosInstance.post(urls.imageAll, data)
    }

    // 视频画面调节（镜像、旋转等）
    static putVideoAdjustment(data) {
        return axiosInstance.put(urls.imageVideoAdjustment, data)
    }

    // 日夜参数
    static putNightToDay(data) {
        return axiosInstance.put(urls.imageNightToDay, data)
    }

    // 切换场景（进入/退出指定场景配置模式）
    static putScene(data) {
        return axiosInstance.put(urls.imageScene, data)
    }

    // 图像基础调节（亮度、对比度、饱和度、锐度、色调）
    static putAdjustment(sceneId, data) {
        return axiosInstance.put(urls.imageAdjustment(sceneId), data)
    }

    // 曝光参数
    static putExposure(sceneId, data) {
        return axiosInstance.put(urls.imageExposure(sceneId), data)
    }

    // 白平衡参数
    static putWhiteBlance(sceneId, data) {
        return axiosInstance.put(urls.imageWhiteBlance(sceneId), data)
    }

    // 背光参数
    static putBLC(sceneId, data) {
        return axiosInstance.put(urls.imageBLC(sceneId), data)
    }

    // 图像增强
    static putEnhancement(sceneId, data) {
        return axiosInstance.put(urls.imageEnhancement(sceneId), data)
    }

    // 对焦
    static putAF(sceneId, data) {
        return axiosInstance.put(urls.imageAF(sceneId), data)
    }
}


class RecordAPI {


}

class InferenceAPI {
    // 获取模型列表
    static getModelList() {
        return axiosInstance.get(urls.modelList)
    }

    // 开始上传模型
    static startModelUpload() {
        return axiosInstance.post(urls.modelUpload, null, {
            params: {
                'upload-type': 'resumable'
            },
            headers: {
                'Content-Type': 'text/plain'
            }
        })
    }

    // 上传模型分块
    static uploadModelChunk(fileId, chunk, start, end, totalSize) {
        return axiosInstance.post(urls.modelUpload, chunk, {
            params: {
                id: fileId
            },
            headers: {
                'Content-Type': 'text/plain',
                'Content-Range': `bytes ${start}-${end}/${totalSize}`
            }
        })
    }

    // 完成模型上传
    static finishModelUpload(fileId, fileName, md5sum) {
        return axiosInstance.post(urls.modelUpload, null, {
            params: {
                start: fileId,
                'File-name': fileName,
                md5sum: md5sum
            },
            headers: {
                'Content-Type': 'text/plain'
            }
        })
    }
    //
    // 删除模型
    static deleteModel(fileName) {
        return axiosInstance.delete(urls.modelDelete, {
            params: {
                'File-name': fileName
            }
        })
    }

    // 获取模型信息
    static getModelInfo(fileName) {
        return axiosInstance.get(urls.modelInfo, {
            params: {
                'File-name': fileName
            }
        })
    }

    // 配置模型信息
    static setModelInfo(fileName, data) {
        return axiosInstance.post(urls.modelInfo, data, {
            params: {
                'File-name': fileName
            }
        })
    }

    // 获取支持的算法
    static getAlgorithmSupport() {
        return axiosInstance.get(urls.modelAlgo)
    }

    // 获取推理状态
    static getInferenceStatus(id = 0) {
        return axiosInstance.get(urls.modelInference, {
            params: { id }
        })
    }

    // 配置推理
    static setInferenceConfig(data, id = 0) {
        return axiosInstance.post(urls.modelInference, data, {
            params: { id }
        })
    }

    // 获取推理输出配置
    static getNotifyConfig() {
        return axiosInstance.get(urls.nofifyConfig)
    }

    // 设置推理输出配置
    static setNotifyConfig(data) {
        return axiosInstance.post(urls.nofifyConfig, data)
    }
}


class TerminalLogAPI {


}

export { DeviceInfoAPI, VideoAPI, RecordAPI, InferenceAPI, TerminalLogAPI }
