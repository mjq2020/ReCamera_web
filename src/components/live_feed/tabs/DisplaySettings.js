import React, { useState, useEffect } from "react";
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
        console.log("保存显示设置:", settings);
    };
    // save settings
    const handleSave = async () => {

        try {
            await VideoAPI.postImageAll(settings);
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
                </div>
            </div>

            <div className="settings-section">
                <h4>图像基础调节</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>选择配置文件</label>
                        <select className="form-control"
                            value={currentProfile}
                            onChange={(e) => setCurrentProfile(Number(e.target.value))}
                        >
                            <option value="0">通用</option>
                            <option value="1">白天</option>
                            <option value="2">夜晚</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>亮度：{settings.profile[currentProfile].imageAdjustment.iBrightness}</label>
                        <input
                            type="range"
                            className="slider"
                            min="0"
                            max="100"
                            value={settings.profile[currentProfile].imageAdjustment.iBrightness}
                            onChange={(e) => handleProfileChange("imageAdjustment", "iBrightness", Number(e.target.value))}
                        />
                    </div>
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
                        />
                    </div>
                </div>
            </div>
            <div className="settings-section">
                <h4>相机设置</h4>
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
                        <label>{currentBLC}等级：{settings.profile[currentProfile].BLC[currentBLC]}</label>
                        <input
                            type="range"
                            className="slider"
                            min="0"
                            max="10"
                            value={settings.profile[currentProfile].BLC.iHDRLevel}
                            onChange={(e) => handleProfileChange("BLC", "iHDRLevel", Number(e.target.value))}
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
                            <option value="daylight">自然光</option>
                            <option value="streetlamp">路灯</option>
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
                            />
                        </div>
                    </div>}
                </div>
            </div>
            <div className="button-group">
                <button className="btn btn-primary" onClick={handleSave}>
                    保存设置
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                    恢复默认
                </button>
            </div>
        </div>
    );
}
