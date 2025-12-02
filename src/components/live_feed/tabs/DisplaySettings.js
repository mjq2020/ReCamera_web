import React, { useState, useEffect, useRef } from "react";
import { VideoAPI } from "../../../contexts/API";
import toast from "../../base/Toast";

const DEFAULT_SETTINGS = {
    "id": 0, // 摄像头通道ID（0 表示第一个摄像头）
    "videoAdjustment": { // 图像方向与防频闪
        "iImageRotation": 90, // 旋转角度：0/90/180/270，用于传感器安装方向
        "sImageFlip": "close", // 镜像翻转：close=无；mirror=水平；flip=垂直；centrosymmetric=水平+垂直
        "sPowerLineFrequencyMode": "NTSC(60HZ)" // 防闪频率：PAL(50HZ)=50Hz地区；NTSC(60HZ)=60Hz;
    },
    "nightToDay": { // 昼夜切换与补光
        "iMode": 0, // 转换模式, 0=自动转换, 1=定时转换, 2=保持不变
        "iNightToDayFilterLevel": 2, // 切换阈值灵敏度,自动转换模式使用,0=高，1=中，2=低
        "iNightToDayFilterTime": 5, // 切换滞后时间(s) 防抖,自动转换模式使用,1~60s
        "iDawnTime": 28800, // 晨曦时间(秒),定时转换模式使用,0~86400s
        "iDuskTime": 64800, // 黄昏时间(秒),需要大于iDawnTime时间，定时转换模式使用,0~86400s
        "iProfileSelect": 0, // 配置文件选择, 保持不变模式使用, 0=通用, 1=白天, 2=夜晚
        "iProfileCur": 0 // 当前使用的profile配置
    },
    "profile": [//0=通用, 1=白天, 2=夜晚
        {
            "imageAdjustment": { // 基础后处理调节
                "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
            },
            "exposure": { // 曝光控制
                "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
            },

            "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
            },
            "whiteBlance": { // 白平衡控制
                "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                "sWhiteBlanceStyle": "auto" // 可取的值为: auto,manual,daylight, streetlamp, outdoor
            },
            "imageEnhancement": { // 增强算法
                "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
            }
        },
        {
            "imageAdjustment": { // 基础后处理调节
                "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
            },
            "exposure": { // 曝光控制
                "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
            },

            "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
            },
            "whiteBlance": { // 白平衡控制
                "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                "sWhiteBlanceStyle": "manual" // 模式：autoWhiteBalance=自动； manualWhiteBalance=手动可调色温； 还有 自然光， 路灯，室外配置可选
            },
            "imageEnhancement": { // 增强算法
                "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
            }
        },
        {
            "imageAdjustment": { // 基础后处理调节
                "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
            },
            "exposure": { // 曝光控制
                "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
            },

            "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
            },
            "whiteBlance": { // 白平衡控制
                "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                "sWhiteBlanceStyle": "manual" // 模式：autoWhiteBalance=自动； manualWhiteBalance=手动可调色温； 还有 自然光， 路灯，室外配置可选
            },
            "imageEnhancement": { // 增强算法
                "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
            }
        }
    ]
}
const configNames = {
    0: "通用",
    1: "白天",
    2: "夜晚"
}

const BLCNAME2DISPLAY = {
    sHDR: "iHDRLevel",
    sBLCRegion: "iBLCStrength",
    sHLC: "iHLCLevel",
}

// 双滑块时间范围选择器组件
function DualTimeSlider({ dawnTime, duskTime, onChange }) {
    const sliderRef = useRef(null);
    const [dragging, setDragging] = useState(null); // 'dawn' or 'dusk'

    const secondsToTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const getPositionFromSeconds = (seconds) => {
        return (seconds / 86400) * 100;
    };

    const getSecondsFromPosition = (clientX) => {
        if (!sliderRef.current) return 0;
        const rect = sliderRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const seconds = Math.round(position * 86400 / 600) * 600; // 10分钟间隔
        return Math.max(0, Math.min(86400, seconds));
    };

    const handleMouseDown = (type) => (e) => {
        e.preventDefault();
        setDragging(type);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const newSeconds = getSecondsFromPosition(e.clientX);

        if (dragging === 'dawn') {
            if (newSeconds < duskTime) {
                onChange(newSeconds, duskTime);
            }
        } else if (dragging === 'dusk') {
            if (newSeconds > dawnTime) {
                onChange(dawnTime, newSeconds);
            }
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragging, dawnTime, duskTime]);

    const dawnPos = getPositionFromSeconds(dawnTime);
    const duskPos = getPositionFromSeconds(duskTime);

    return (
        <div style={{ padding: '20px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#3b82f6' }}>
                    晨曦: {secondsToTime(dawnTime)}
                </span>
                <span style={{ fontSize: '14px', color: '#ef4444' }}>
                    黄昏: {secondsToTime(duskTime)}
                </span>
            </div>
            <div
                ref={sliderRef}
                style={{
                    position: 'relative',
                    height: '40px',
                    cursor: 'pointer'
                }}
            >
                {/* 滑轨背景 */}
                <div style={{
                    position: 'absolute',
                    top: '18px',
                    left: '0',
                    right: '0',
                    height: '4px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2px'
                }} />

                {/* 选中范围 */}
                <div style={{
                    position: 'absolute',
                    top: '18px',
                    left: `${dawnPos}%`,
                    width: `${duskPos - dawnPos}%`,
                    height: '4px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '2px'
                }} />

                {/* 晨曦滑块 */}
                <div
                    onMouseDown={handleMouseDown('dawn')}
                    style={{
                        position: 'absolute',
                        left: `${dawnPos}%`,
                        top: '10px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        cursor: 'grab',
                        transform: 'translateX(-50%)',
                        zIndex: dragging === 'dawn' ? 10 : 5
                    }}
                />

                {/* 黄昏滑块 */}
                <div
                    onMouseDown={handleMouseDown('dusk')}
                    style={{
                        position: 'absolute',
                        left: `${duskPos}%`,
                        top: '10px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        cursor: 'grab',
                        transform: 'translateX(-50%)',
                        zIndex: dragging === 'dusk' ? 10 : 5
                    }}
                />
            </div>

            {/* 时间刻度 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '5px',
                fontSize: '12px',
                color: '#6b7280'
            }}>
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
            </div>
        </div>
    );
}

export default function DisplaySettings() {
    const [currentProfile, setCurrentProfile] = useState(0);
    const [settings, setSettings] = useState({
        "id": 0, // 摄像头通道ID（0 表示第一个摄像头）
        "videoAdjustment": { // 图像方向与防频闪
            "iImageRotation": 90, // 旋转角度：0/90/180/270，用于传感器安装方向
            "sImageFlip": "close", // 镜像翻转：close=无；mirror=水平；flip=垂直；centrosymmetric=水平+垂直
            "sPowerLineFrequencyMode": "NTSC(60HZ)" // 防闪频率：PAL(50HZ)=50Hz地区；NTSC(60HZ)=60Hz;
        },
        "nightToDay": { // 昼夜切换与补光
            "iMode": 0, // 转换模式, 0=自动转换, 1=定时转换, 2=保持不变
            "iNightToDayFilterLevel": 2, // 切换阈值灵敏度,自动转换模式使用,0=高，1=中，2=低
            "iNightToDayFilterTime": 5, // 切换滞后时间(s) 防抖,自动转换模式使用,1~60s
            "iDawnTime": 28800, // 晨曦时间(秒),定时转换模式使用,0~86400s
            "iDuskTime": 64800, // 黄昏时间(秒),需要大于iDawnTime时间，定时转换模式使用,0~86400s
            "iProfileSelect": 0, // 配置文件选择, 保持不变模式使用, 0=通用, 1=白天, 2=夜晚
            "iProfileCur": 0 // 当前使用的profile配置
        },
        "profile": [//0=通用, 1=白天, 2=夜晚
            {
                "imageAdjustment": { // 基础后处理调节
                    "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                    "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                    "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                    "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                    "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
                },
                "exposure": { // 曝光控制
                    "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                    "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                    "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                    "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
                },

                "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                    "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                    "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                    "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                    "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                    "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                    "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                    "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
                },
                "whiteBlance": { // 白平衡控制
                    "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                    "sWhiteBlanceStyle": "auto" // 可取的值为: auto,manual,daylight, streetlamp, outdoor
                },
                "imageEnhancement": { // 增强算法
                    "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                    "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                    "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
                }
            },
            {
                "imageAdjustment": { // 基础后处理调节
                    "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                    "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                    "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                    "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                    "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
                },
                "exposure": { // 曝光控制
                    "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                    "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                    "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                    "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
                },

                "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                    "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                    "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                    "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                    "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                    "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                    "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                    "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
                },
                "whiteBlance": { // 白平衡控制
                    "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                    "sWhiteBlanceStyle": "manual" // 模式：autoWhiteBalance=自动； manual=手动可调色温； 还有 自然光， 路灯，室外配置可选
                },
                "imageEnhancement": { // 增强算法
                    "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                    "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                    "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
                }
            },
            {
                "imageAdjustment": { // 基础后处理调节
                    "iBrightness": 57, // 亮度 0-100 -> 内部 *2.55 到 0-255；过高泛灰
                    "iContrast": 50, // 对比度 0-100 -> *2.55；过高丢失中间层次
                    "iHue": 50, // 色调 0-100 -> *2.55；通常保持 50
                    "iSaturation": 50, // 饱和度 0-100 -> *2.55；高会鲜艳失真，低会发灰
                    "iSharpness": 50 // 锐度 0-100（直接传值）；高易出现振铃/噪点放大
                },
                "exposure": { // 曝光控制
                    "iExposureGain": 1, // 手动增益值 (整型，范围依 sensor 一般 1-128+)，自动模式下读取当前值
                    "sExposureMode": "auto", // 曝光模式：auto=自动；manual=手动；
                    "sExposureTime": "1/6", // 曝光时间 \"分子/分母\" 或小数秒；手动需<=帧周期 (1/FPS)
                    "sGainMode": "auto" // 增益模式：auto=自动；manual=手动，配合 iExposureGain
                },

                "BLC": { // 背光 / 高亮 / 暗区增强相关模块
                    "iBLCStrength": 28, // 背光补偿强度 0-100，越大逆光场景前景被提亮，但可能噪声提升
                    "iDarkBoostLevel": 50, // 暗部增强等级 1-100，提高暗区亮度，过高易噪点放大
                    "iHDRLevel": 1, // HDR宽动态强度等级（ISP3.0 tmo未直接用；常用 0-3 或 0-10）
                    "iHLCLevel": 1, // 高亮抑制(HLC)强度 1-100，压制强点光源；0 在驱动中会被修正为 1
                    "sBLCRegion": "open", // 背光补偿区域开关：open=开启自动区域；close=关闭；
                    "sHDR": "close", // HDR 宽动态开关：open=开启；close=关闭；可能扩展 auto
                    "sHLC": "close" // 高亮抑制开关：open=启用；close=关闭
                },
                "whiteBlance": { // 白平衡控制
                    "iWhiteBalanceCT": 2800, // color temperature value [2800, 7500]K
                    "sWhiteBlanceStyle": "manual" // 模式：autoWhiteBalance=自动； manual=手动可调色温； 还有 自然光， 路灯，室外配置可选
                },
                "imageEnhancement": { // 增强算法
                    "iSpatialDenoiseLevel": 50, // 空域降噪 0-100；若 noise_reduce_mode=close 或 3dnr 会被强制回 50
                    "iTemporalDenoiseLevel": 50, // 时域降噪 0-100；若 noise_reduce_mode=close 或 2dnr 会被强制回 50；过高拖影
                    "sNoiseReduceMode": 0 // 降噪模式：0 表示关闭, 为1 表示开启图像增强
                }
            }
        ]
    });
    const [prevblc, setPrevblc] = useState("close");
    const [currentBLC, setCurrentBLC] = useState("close");
    const [isEditing, setIsEditing] = useState(false);

    const loadSettings = async () => {
        try {
            const response = await VideoAPI.getImageAll();

            setSettings(response.data);
        } catch (err) {
            toast.error("加载设置失败:", err);
        }
    };
    // loading current config
    useEffect(() => {
        loadSettings();
    }, []);

    // computer current blc
    useEffect(() => {
        Object.entries(settings.profile[currentProfile].BLC).forEach(([key, value]) => {
            if (value == "open") {
                setCurrentBLC(key);
                setPrevblc(key);
                return;
            }
        });
    }, [currentProfile, settings]);

    const handleSaveVideoAdjustment = async () => {
        try {
            await VideoAPI.putVideoAdjustment(settings.videoAdjustment);
            toast.success("画面设置保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleSaveNightToDay = async () => {
        try {

            await VideoAPI.putNightToDay(settings.nightToDay);
            toast.success("日夜设置保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleEditProfile = async (profileId) => {
        try {
            const data = {
                "iProfile": isEditing ? -1 : profileId
            }
            await VideoAPI.putScene(data);
            toast.success("日夜设置保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
        setIsEditing(!isEditing);
    }

    const handleSaveAdjustment = async (profileId) => {
        try {
            await VideoAPI.putAdjustment(profileId, settings.profile[profileId].imageAdjustment);
            toast.success("图像基础调节保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleSaveExposure = async (data = null) => {
        try {
            if (data === null) {
                await VideoAPI.putExposure(currentProfile, settings.profile[currentProfile].exposure);
            } else {
                await VideoAPI.putExposure(currentProfile, data);
            }
            toast.success("曝光参数保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleSaveBLC = async (data = null) => {
        try {
            if (data === null) {
                await VideoAPI.putBLC(currentProfile, settings.profile[currentProfile].BLC);
            } else {
                await VideoAPI.putBLC(currentProfile, data);
            }
            toast.success("背光参数保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleSaveWhiteBlance = async (data = null) => {
        try {
            if (data === null) {
                await VideoAPI.putWhiteBlance(currentProfile, settings.profile[currentProfile].whiteBlance);
            } else {
                await VideoAPI.putWhiteBlance(currentProfile, data);
            }
            toast.success("白平衡参数保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }

    const handleSaveImageEnhancement = async (data=null) => {
        try {
            if (data === null) {
                await VideoAPI.putEnhancement(currentProfile, settings.profile[currentProfile].imageEnhancement);
            } else {
                await VideoAPI.putEnhancement(currentProfile, data);
            }
            toast.success("增强算法参数保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
    }


    // 当 currentBLC 变化时更新 BLC 设置
    useEffect(() => {
        if (prevblc !== currentBLC) {
            const newProfile = settings.profile.map((profile, index) => {
                return (index === currentProfile) ? {
                    ...profile, BLC: {
                        ...profile.BLC,
                        ...((currentBLC !== "close") && { [currentBLC]: "open" }),
                        ...((prevblc !== "close") && { [prevblc]: "close" })
                    }
                } : profile;
            });
            setSettings(prev => ({ ...prev, profile: newProfile }));
            handleSaveBLC(newProfile[currentProfile].BLC);
        }
    }, [currentBLC]);

    const handleBlcChange = (value) => {
        setPrevblc(currentBLC);
        setCurrentBLC(value);
    };

    const handleAttributeChange = (field0, field1 = null, value) => {
        if (field1 === null) {
            setSettings(prev => ({ ...prev, [field0]: value }));
        } else {
            setSettings(prev => ({ ...prev, [field0]: { ...prev[field0], [field1]: value } }));
        }
    };

    const handleProfileChange = (category, field, value) => {
        const newProfile = settings.profile.map((profile, index) =>
            index === currentProfile
                ? { ...profile, [category]: { ...profile[category], [field]: value } }
                : profile
        );
        setSettings(prev => ({ ...prev, profile: newProfile }));
        if (category === "exposure" && field !== "iExposureGain") {
            handleSaveExposure(newProfile[currentProfile].exposure);
        } else if (category === "whiteBlance" && field === "sWhiteBlanceStyle") {
            handleSaveWhiteBlance(newProfile[currentProfile].whiteBlance);
        }else if (category === "imageEnhancement" && field === "sNoiseReduceMode") {
            handleSaveImageEnhancement(newProfile[currentProfile].imageEnhancement);
        }
    };
    // save settings
    const handleSave = async () => {

        try {
            await VideoAPI.postSceneSave();
            const data = {
                "iProfile": -1
            }
            await VideoAPI.putScene(data);
            toast.success("显示设置保存成功！");
        } catch (err) {
            toast.error("保存失败：" + err.message);
        }
        console.log("保存显示设置:", settings);
    };
    // reset settings
    const handleReset = () => {
        toast.confirm("确定要恢复默认设置吗？").then(confirmed => {
            if (!confirmed) {
                return;
            }
            setSettings(DEFAULT_SETTINGS);
            loadSettings();
            toast.success("恢复默认设置成功！");
        }).catch(err => {
            toast.error("恢复默认设置失败：" + err.message);
        });
    };

    return (
        <div className="settings-tab">
            <div className="settings-section">
                <h4>画面设置</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>画面翻转</label>
                        <select
                            className="form-control"
                            value={settings.videoAdjustment.sImageFlip}
                            onChange={(e) => handleAttributeChange("videoAdjustment", "sImageFlip", e.target.value)}
                        >
                            <option value="close">原始画面</option>
                            <option value="flip">垂直镜像</option>
                            <option value="mirror">水平镜像</option>
                            <option value="centrosymmetric">水平+垂直镜像</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>画面旋转</label>
                        <select
                            className="form-control"
                            value={settings.videoAdjustment.iImageRotation}
                            onChange={(e) => handleAttributeChange("videoAdjustment", "iImageRotation", Number(e.target.value))}
                        >
                            <option value={0}>0°</option>
                            <option value={90}>90°</option>
                            <option value={180}>180°</option>
                            <option value={270}>270°</option>

                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>视频制式</label>
                        <select
                            className="form-control"
                            value={settings.videoAdjustment.sPowerLineFrequencyMode}
                            onChange={(e) => handleAttributeChange("videoAdjustment", "sPowerLineFrequencyMode", e.target.value)}
                        >
                            <option value="PAL(50HZ)">PAL(50HZ)</option>
                            <option value="NTSC(60HZ)">NTSC(60HZ)</option>

                        </select>
                    </div>
                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button className="btn btn-primary" onClick={handleSaveVideoAdjustment}>
                            保存画面设置
                        </button>
                    </div>
                </div>


            </div>
            <div className="settings-section">
                <h4>日夜参数转换</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>转换模式</label>
                        <select
                            className="form-control"
                            value={settings.nightToDay.iMode}
                            onChange={(e) => handleAttributeChange("nightToDay", "iMode", Number(e.target.value))}
                        >
                            <option value="0">自动转换</option>
                            <option value="1">定时转换</option>
                            <option value="2">保持不变</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>转换阈值灵敏度</label>
                        <select className="form-control"
                            value={settings.nightToDay.iNightToDayFilterLevel}
                            onChange={(e) => handleAttributeChange("nightToDay", "iNightToDayFilterLevel", Number(e.target.value))}
                        >
                            <option value="0">高</option>
                            <option value="1">中</option>
                            <option value="2">低</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>转换滞后时间</label>
                        <input
                            type="number"
                            className="form-control"
                            min="1"
                            max="60"
                            value={settings.nightToDay.iNightToDayFilterTime}
                            onChange={(e) => handleAttributeChange("nightToDay", "iNightToDayFilterTime", Number(e.target.value))}
                        />
                    </div>
                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button className="btn btn-primary" onClick={handleSaveNightToDay}>
                            保存日夜设置
                        </button>
                    </div>
                </div>
                {settings.nightToDay.iMode === 1 && (
                    <div className="form-group" style={{ width: '100%' }}>
                        <DualTimeSlider
                            dawnTime={settings.nightToDay.iDawnTime}
                            duskTime={settings.nightToDay.iDuskTime}
                            onChange={(newDawn, newDusk) => {
                                setSettings(prev => ({
                                    ...prev,
                                    nightToDay: {
                                        ...prev.nightToDay,
                                        iDawnTime: newDawn,
                                        iDuskTime: newDusk
                                    }
                                }));
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="settings-section">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                    <h4>图像基础调节</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>正在使用配置:
                        <span style={{ fontSize: '12px', color: 'rgb(35, 164, 67)', backgroundColor: 'rgb(252, 250, 250)', borderRadius: '4px' }}> {configNames[currentProfile]}</span>
                    </span>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>选择配置文件</label>
                        <select className="form-control"
                            value={currentProfile}
                            onChange={(e) => setCurrentProfile(Number(e.target.value))}
                            disabled={isEditing}
                        >
                            <option value="0">通用</option>
                            <option value="1">白天</option>
                            <option value="2">夜晚</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <button className="btn btn-custom"
                            style={isEditing ? { backgroundColor: '#3b82f6', color: 'white' } : { backgroundColor: '#2b0050', color: 'white' }}
                            onClick={(e) => handleEditProfile(currentProfile)}>
                            {isEditing ? "退出编辑" : "编辑配置"}
                        </button>
                        {/* <label>&nbsp;</label> */}

                        {isEditing && (<button className="btn btn-primary" onClick={handleSave}>
                            保存设置
                        </button>)}
                    </div>

                </div>

            </div>
            {isEditing && (
                <div className="settings-section">
                    <h4>相机设置</h4>
                    <div className="form-group">
                        <label>亮度：{settings.profile[currentProfile].imageAdjustment.iBrightness}</label>
                        <input
                            type="range"
                            className="slider"
                            min="0"
                            max="100"
                            value={settings.profile[currentProfile].imageAdjustment.iBrightness}
                            onChange={(e) => handleProfileChange("imageAdjustment", "iBrightness", Number(e.target.value))}
                            onMouseUp={() => handleSaveAdjustment(currentProfile)}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>对比度：{settings.profile[currentProfile].imageAdjustment.iContrast}</label>
                            <input
                                type="range"
                                className="slider"
                                min="0"
                                max="100"
                                value={settings.profile[currentProfile].imageAdjustment.iContrast}
                                onChange={(e) => handleProfileChange("imageAdjustment", "iContrast", Number(e.target.value))}
                                onMouseUp={() => handleSaveAdjustment(currentProfile)}
                            />
                        </div>
                        <div className="form-group">
                            <label>饱和度：{settings.profile[currentProfile].imageAdjustment.iSaturation}</label>
                            <input
                                type="range"
                                className="slider"
                                min="0"
                                max="100"
                                value={settings.profile[currentProfile].imageAdjustment.iSaturation}
                                onChange={(e) => handleProfileChange("imageAdjustment", "iSaturation", Number(e.target.value))}
                                onMouseUp={() => handleSaveAdjustment(currentProfile)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>锐度：{settings.profile[currentProfile].imageAdjustment.iSharpness}</label>
                            <input
                                type="range"
                                className="slider"
                                min="0"
                                max="100"
                                value={settings.profile[currentProfile].imageAdjustment.iSharpness}
                                onChange={(e) => handleProfileChange("imageAdjustment", "iSharpness", Number(e.target.value))}
                                onMouseUp={() => handleSaveAdjustment(currentProfile)}
                            />
                        </div>
                        <div className="form-group">
                            <label>色调：{settings.profile[currentProfile].imageAdjustment.iHue}</label>
                            <input
                                type="range"
                                className="slider"
                                min="0"
                                max="100"
                                value={settings.profile[currentProfile].imageAdjustment.iHue}
                                onChange={(e) => handleProfileChange("imageAdjustment", "iHue", Number(e.target.value))}
                                onMouseUp={() => handleSaveAdjustment(currentProfile)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>曝光模式</label>
                            <select
                                className="form-control"
                                value={settings.profile[currentProfile].exposure.sExposureMode}
                                onChange={(e) => handleProfileChange("exposure", "sExposureMode", e.target.value)}
                            >
                                <option value="auto">自动</option>
                                <option value="manual">手动</option>
                            </select>
                        </div>
                        {settings.profile[currentProfile].exposure.sExposureMode === "manual" && <div className="form-group">
                            <label>曝光时间</label>
                            <select
                                className="form-control"
                                value={settings.profile[currentProfile].exposure.sExposureTime}
                                onChange={(e) => handleProfileChange("exposure", "sExposureTime", e.target.value)}

                            >
                                <option value="1/2">1/2</option>
                                <option value="1/3">1/3</option>
                                <option value="1/4">1/4</option>
                                <option value="1/5">1/5</option>
                                <option value="1/6">1/6</option>
                                <option value="1/7">1/7</option>
                                <option value="1/8">1/8</option>
                                <option value="1/9">1/9</option>
                                <option value="1/10">1/10</option>
                            </select>
                        </div>}
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>增益模式</label>
                            <select
                                className="form-control"
                                value={settings.profile[currentProfile].exposure.sGainMode}
                                onChange={(e) => handleProfileChange("exposure", "sGainMode", e.target.value)}
                            >
                                <option value="auto">自动</option>
                                <option value="manual">手动</option>
                            </select>
                        </div>
                        {settings.profile[currentProfile].exposure.sGainMode === "manual" && <div className="form-group">
                            <label>曝光增益值：{settings.profile[currentProfile].exposure.iExposureGain}</label>
                            <input
                                type="range"
                                className="slider"
                                min="1"
                                max="128"
                                value={settings.profile[currentProfile].exposure.iExposureGain}
                                onChange={(e) => handleProfileChange("exposure", "iExposureGain", Number(e.target.value))}
                                onMouseUp={() => handleSaveExposure()}
                            />
                        </div>}
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>背光补偿模式</label>
                            <select
                                className="form-control"
                                value={currentBLC}
                                onChange={(e) => handleBlcChange(e.target.value)}
                            >
                                <option value="close">关闭</option>
                                <option value="sHLC">强光抑制(HLC)</option>
                                <option value="sBLCRegion">背光补偿</option>
                                <option value="sHDR">宽动态(HDR)</option>
                            </select>
                        </div>
                        {currentBLC != "close" && currentBLC != "sHDR" && <div className="form-group">
                            <label>{currentBLC}等级：{settings.profile[currentProfile].BLC[BLCNAME2DISPLAY[currentBLC]]}</label>
                            <input
                                type="range"
                                className="slider"
                                min="0"
                                max="100"
                                value={settings.profile[currentProfile].BLC[BLCNAME2DISPLAY[currentBLC]]}
                                onChange={(e) => handleProfileChange("BLC", BLCNAME2DISPLAY[currentBLC], Number(e.target.value))}
                                onMouseUp={() => handleSaveBLC()}
                            />
                        </div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>白平衡模式</label>
                            <select
                                className="form-control"
                                value={settings.profile[currentProfile].whiteBlance.sWhiteBlanceStyle}
                                onChange={(e) => handleProfileChange("whiteBlance", "sWhiteBlanceStyle", e.target.value)}
                            >
                                <option value="auto">自动</option>
                                <option value="manual">手动</option>
                                <option value="natural">自然光</option>
                                <option value="streetlight">路灯</option>
                                <option value="outdoor">室外</option>
                            </select>
                        </div>
                        {settings.profile[currentProfile].whiteBlance.sWhiteBlanceStyle === "manual" && <div className="form-group">
                            <label>色温(K)：{settings.profile[currentProfile].whiteBlance.iWhiteBalanceCT}</label>
                            <input
                                type="range"
                                className="slider"
                                min="2800"
                                max="7500"
                                value={settings.profile[currentProfile].whiteBlance.iWhiteBalanceCT}
                                onChange={(e) => handleProfileChange("whiteBlance", "iWhiteBalanceCT", Number(e.target.value))}
                                onMouseUp={() => handleSaveWhiteBlance()}
                            />
                        </div>}
                    </div>

                    <div className="form-group">
                        <label>降噪模式</label>
                        <select
                            className="form-control"
                            value={settings.profile[currentProfile].imageEnhancement.sNoiseReduceMode}
                            onChange={(e) => handleProfileChange("imageEnhancement", "sNoiseReduceMode", Number(e.target.value))}
                        >
                            <option value={0}>关闭</option>
                            <option value={1}>专家模式(mixnr)</option>
                        </select>
                        {settings.profile[currentProfile].imageEnhancement.sNoiseReduceMode === 1 && <div className="form-row">
                            <div className="form-group">
                                <label>空域降噪：{settings.profile[currentProfile].imageEnhancement.iSpatialDenoiseLevel}</label>
                                <input
                                    type="range"
                                    className="slider"
                                    min="0"
                                    max="100"
                                    value={settings.profile[currentProfile].imageEnhancement.iSpatialDenoiseLevel}
                                    onChange={(e) => handleProfileChange("imageEnhancement", "iSpatialDenoiseLevel", Number(e.target.value))}
                                    onMouseUp={() => handleSaveImageEnhancement()}
                                />
                            </div>
                            <div className="form-group">
                                <label>时域降噪：{settings.profile[currentProfile].imageEnhancement.iTemporalDenoiseLevel}</label>
                                <input
                                    type="range"
                                    className="slider"
                                    min="0"
                                    max="100"
                                    value={settings.profile[currentProfile].imageEnhancement.iTemporalDenoiseLevel}
                                    onChange={(e) => handleProfileChange("imageEnhancement", "iTemporalDenoiseLevel", Number(e.target.value))}
                                    onMouseUp={() => handleSaveImageEnhancement()}
                                />
                            </div>
                        </div>}
                    </div>
                </div>)}
            <div className="button-group">
                <button className="btn btn-secondary" onClick={handleReset}>
                    恢复默认
                </button>
            </div>
        </div>
    );
}
