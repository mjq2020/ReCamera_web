import axios from 'axios'
import { urls } from './urls'
import { toast } from '../components/base/Toast'

const axiosInstance = axios.create(
    {
        baseURL: "http://192.168.66.48/cgi-bin/entry.cgi/",
        // baseURL: "http://192.168.1.66:8000/cgi-bin/entry.cgi/",
        timeout: 10000,
        withCredentials: true,
        responseType: 'json',
        headers: {
            "Content-Type": 'application/json',
        },
    }
)
axiosInstance.interceptors.request.use(config => {
    config.headers.Cookie = `token=${localStorage.getItem('token')}`
    console.log(config.baseURL, localStorage.baseURL)
    console.log(config.url)
    if (config.url.includes("/relay")) {
        console.log(">>", config.baseURL)
        config.baseURL = config.baseURL.replace("/cgi-bin/entry.cgi", "")
        console.log("<<", config.baseURL)
    }
    return config
})

axiosInstance.interceptors.response.use(
    response => {
        if (response.config.method != 'get') {
            console.log(response.status)
            if (response.status === 200) {
                const data = response.data
                if ('code' in data) {
                    if (data.code === SUCCESS_CODE) {
                        return response
                    } else {
                        toast.error('请求失败: 错误码' + data.code + ' ' + data.message)
                        return Promise.reject(data)
                    }

                } else {
                    return response
                }
            } else {
                toast.error('请求失败: 错误码' + response.status + ' ' + response.statusText)
                return Promise.reject(response)
            }
        }
        return response
    },
    error => {
        if (error.response) {
            const { status, data } = error.response;

            // 根据不同状态码处理
            switch (status) {
                case 400:
                    toast.error(data?.message || '请求参数错误');
                    break;
                case 401:
                    toast.error('未授权，请重新登录');
                    // 可以跳转到登录页
                    // router.push('/login');
                    break;
                case 403:
                    toast.error('拒绝访问');
                    break;
                case 404:
                    toast.error('请求资源不存在');
                    break;
                case 500:
                    toast.error('服务器内部错误');
                    break;
                default:
                    toast.error(data?.message || `请求失败: ${status}`);
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            toast.error('网络错误，请检查网络连接');
        } else {
            // 其他错误
            toast.error('请求失败: ' + error.message);
        }

        return Promise.reject(error);
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
        // 添加时间戳参数来绕过浏览器缓存
        return axiosInstance.get(urls.configExport,

            // {params: {
            //     _t: Date.now()
            // }}
        )
    }

    static postConfig(data) {
        axiosInstance.post(urls.configUpload, data)
    }

    // 开始上传配置
    static startConfigUpload() {
        return axiosInstance.post(urls.configUpload, null, {
            params: {
                'upload-type': 'resumable'
            },
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': '0'
            }
        })
    }

    // 上传配置分块
    static uploadConfigChunk(fileId, chunk, start, end) {
        return axiosInstance.post(urls.configUpload, chunk, {
            params: {
                id: fileId
            },
            headers: {
                'Content-Type': 'text/plain',
                'Content-Range': `bytes ${start}-${end}`
            }
        })
    }

    // 完成配置上传
    static finishConfigUpload(fileId, md5sum) {
        return axiosInstance.post(urls.configUpload, null, {
            params: {
                start: fileId,
                md5sum: md5sum
            },
            headers: {
                'Content-Type': 'text/plain'
            }
        })
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

    static postFactoryReset(data=null) {
        if(data){
            return axiosInstance.post(urls.systemFactoryReset, data)
        }else{
            return axiosInstance.post(urls.systemFactoryReset)
        }
    }

    static putPassword(data) {
        return axiosInstance.put(urls.systemPassword, data)
    }

    // 开始上传固件
    static startFirmwareUpload() {
        return axiosInstance.post(urls.systemFirmwareUpgrade, null, {
            params: {
                'upload-type': 'resumable'
            },
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': '0'
            }
        })
    }

    // 上传固件分块
    static uploadFirmwareChunk(fileId, chunk, start, end) {
        return axiosInstance.post(urls.systemFirmwareUpgrade, chunk, {
            params: {
                id: fileId
            },
            headers: {
                'Content-Type': 'text/plain',
                'Content-Range': `bytes ${start}-${end}`
            }
        })
    }

    // 完成固件上传
    static finishFirmwareUpload(fileId, md5sum) {
        return axiosInstance.post(urls.systemFirmwareUpgrade, null, {
            params: {
                start: fileId,
                md5sum: md5sum
            },
            headers: {
                'Content-Type': 'text/plain'
            }
        })
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
    // OSD 配置
    static getVideoOsdConfig() {
        return axiosInstance.get(urls.videoOsdConfig)
    }
    static putVideoOsdConfig(data) {
        return axiosInstance.put(urls.videoOsdConfig, data)
    }
    static postVideoOsdConfig(data) {
        return axiosInstance.post(urls.videoOsdConfig, data)
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

    // 配置当前画面所有参数（恢复默认值）f
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

    // 保存场景配置
    static postSceneSave() {
        return axiosInstance.post(urls.imageSceneSave)
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

    // 获取录制规则配置
    static getRecordRuleConfig() {
        return axiosInstance.get(urls.recordRecordRuleConfig)
    }

    // 设置录制规则配置
    static setRecordRuleConfig(data) {
        return axiosInstance.post(urls.recordRecordRuleConfig, data)
    }

    // 获取计划规则配置
    static getScheduleRuleConfig() {
        return axiosInstance.get(urls.recordScheduleConfig)
    }

    // 设置计划规则配置
    static setScheduleRuleConfig(data) {
        return axiosInstance.post(urls.recordScheduleConfig, data)
    }

    // 获取全局规则配置
    static getRuleConfig() {
        return axiosInstance.get(urls.recordConfig)
    }

    // 设置全局规则配置
    static setRuleConfig(data) {
        return axiosInstance.post(urls.recordConfig, data)
    }

    // 获取存储配置
    static getStorageConfig() {
        return axiosInstance.get(urls.recordStorageConfig)
    }

    // 设置存储配置
    static setStorageConfig(data) {
        return axiosInstance.post(urls.recordStorageConfig, data)
    }

    // 获取存储状态
    static getStorageStatus() {
        return axiosInstance.get(urls.recordStorageStatus)
    }

    // 设置存储状态
    static setStorageStatus(data) {
        return axiosInstance.post(urls.recordStorageStatus, data)
    }

    // 获取存储控制
    static getStorageControl() {
        return axiosInstance.get(urls.recordStorageControl)
    }

    // 设置存储控制
    static setStorageControl(data) {
        return axiosInstance.post(urls.recordStorageControl, data)
    }

    // 获取文件列表（通过中继）
    static getFileList(relayUuid, path = '') {
        const url = urls.recordRelay(relayUuid, path);
        return axiosInstance.get(url);
    }

    // 获取文件URL（用于下载和预览）
    static getFileUrl(relayUuid, filePath) {
        const baseURL = axiosInstance.defaults.baseURL.replace("/cgi-bin/entry.cgi", "");
        return `${baseURL}${urls.recordRelay(relayUuid, filePath)}`;
    }

    // 获取视频缩略图（第一帧）
    static getVideoThumbnail(relayUuid, filePath) {
        const url = urls.recordRelay(relayUuid, filePath);
        return axiosInstance.get(url, {
            headers: {
                'Range': 'bytes=0-102400' // 获取前100KB用于缩略图
            },
            responseType: 'blob'
        });
    }

    // 删除文件或文件夹
    static deleteFiles(slotDevPath, filesToRemove) {
        return axiosInstance.post(urls.recordStorageControl, {
            sAction: 'remove_files_or_directories',
            sSlotDevPath: slotDevPath,
            lFilesOrDirectoriesToRemove: filesToRemove
        });
    }
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

const SUCCESS_CODE = 0


export { DeviceInfoAPI, VideoAPI, RecordAPI, InferenceAPI, TerminalLogAPI, SUCCESS_CODE }
