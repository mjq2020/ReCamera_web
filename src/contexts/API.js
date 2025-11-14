import axios from 'axios'
import { urls } from './urls'

const axiosInstance = axios.create(
    {
        baseURL: "http://192.168.66.48/cgi-bin/entry.cgi",
        timeout: 10000,
        withCredentials: true,
        responseType: 'json',
        headers: {
            "Content-Type": 'application/json',
            // 'Cookie': 'token=6WzrB38mSelunPLRfK582OGLqZ6azeJQmFdK25T_Alo'
        },
        params: {}
    }

)

class DeviceInfoAPI {

    // 方式1：不使用 async/await，直接返回 Promise
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

class GraphicsAPI {



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

export { DeviceInfoAPI, GraphicsAPI, RecordAPI, InferenceAPI, TerminalLogAPI }
