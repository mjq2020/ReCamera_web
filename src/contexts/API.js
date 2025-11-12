import axios from 'axios'
import {urls} from './urls'

const axiosInstance = axios.create(
    {
        baseURL: "http://192.168.1.66:8000/cgi-bin/entry.cgi",
        timeout: 10000,
        withCredentials:true,
        responseType:'json',
        headers: {
            "Content-Type": 'application/json',
        // 'Cookie': 'token=6WzrB38mSelunPLRfK582OGLqZ6azeJQmFdK25T_Alo'
        },
        params:{}
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
        return  axiosInstance.get(urls.networkWlan)
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
        return axiosInstance.post(urls.networkWiFi,{}, {
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
        return axiosInstance.post(urls.webSetting,data)
    }

    static getFtpSetting() {
        return axiosInstance.get(urls.ftpSetting)
    }

    static postFtpSetting(data) {
        return axiosInstance.post(urls.ftpSetting, data)
    }

    static getConfig() {
        axiosInstance.get(urls.configExport,{responseType: 'json'})
    }

    static postConfig(data) {
        axiosInstance.post(urls.configUpload, data)

    }

    static postFirmware(data) {
        axiosInstance.post(urls.systemFirmwareUpgrade,data)
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


}


class TerminalLogAPI {


}

export { DeviceInfoAPI, GraphicsAPI, RecordAPI, InferenceAPI, TerminalLogAPI }
