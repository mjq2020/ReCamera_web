from __future__ import annotations

import secrets
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List,Union


@dataclass
class BackendState:
    tokens: Dict[str, str] = field(default_factory=dict)
    passwords: Dict[str, str] = field(
        default_factory=lambda: {
            # "admin": hashlib.sha256("password".encode()).hexdigest()
            "admin": "d6ee129defe0bda1b0b7ff1f40f57dcc9afdd85b67f3bf36c8dff5cff526baa9"
        }
    )
    device_info: Dict[str, str] = field(
        default_factory=lambda: {
            "sSerialNumber": "RC1126B-" + secrets.token_hex(4).upper(),
            "sFirmwareVersion": "V1.0.3_20250915",
            "sSensorModel": "SC850SL",
            "sBasePlateModel": "PoE",
        }
    )
    timezone: Dict[str, Union[str,dict]] = field(
        default_factory=lambda: {
            "iTimestamp": int(datetime.now(tz=timezone.utc).timestamp()),
            "sTimezone": "Asia",
            "sTz": "UTC+8",
            "sMethod":"manual",
            "dNtpConfig":{
                "sAddress":"pool.ntp.org",
                "sPort":"123"
            }
        }
    )
    resource_info: Dict[str, int] = field(
        default_factory=lambda: {
            "iCpuUsage": 20,
            "iNpuUsage": 15,
            "iMemUsage": 35,
            "iStorageUsage": 40,
        }
    )
    network_wlan: Dict[str, Dict] = field(
        default_factory=lambda: {
            "dIpv4": {
                "sV4Address": "192.168.1.100",
                "sV4Gateway": "192.168.1.1",
                "sV4Method": "manual",
                "sV4Netmask": "255.255.255.0",
            },
            "dLink": {
                "sDNS1": "8.8.8.8",
                "sDNS2": "8.8.4.4",
                "sAddress": "AA:BB:CC:DD:EE:FF",
                "sInterface": "eth0",
                "iPower": 1,
                "sNicSpeed": "100baseT/Full",
            },
        }
    )
    wifi_status: Dict[str, int] = field(
        default_factory=lambda: {
            "iPower": 1,
            "iId": 1,
            "sType": "wifi",
        }
    )
    wifi_list: List[Dict] = field(
        default_factory=lambda: [
            {
                "sBssid": "9a:bb:99:12:1b:61",
                "sFlags": "[WPA-PSK-CCMP+TKIP][WPA2-PSK-CCMP+TKIP][ESS]",
                "iFrequency": 2412,
                "iRssi": -21,
                "sSsid": "Freeland2",
                "sConnected":True
            },
            {
                "sBssid": "f0:b4:29:53:e4:15",
                "sFlags": "[WPA2-PSK-CCMP][ESS]",
                "iFrequency": 2417,
                "iRssi": -90,
                "sSsid": "Xiaomi_Youth",
                "sConnected":False
            },
            {
                "sBssid": "70:4d:7b:95:47:c0",
                "sFlags": "[WPA2-PSK-CCMP][ESS]",
                "iFrequency": 2462,
                "iRssi": -35,
                "sSsid": "asus_test",
                "sConnected":False
            },
        ]
    )
    wifi_connections: List[str] = field(default_factory=list)
    wifi_power: int = 1
    multicast: Dict[str, str] = field(
        default_factory=lambda: {
            "muticastAddress": "224.1.1.1",
            "muticastPort": "8868",
        }
    )
    http_setting: Dict[str, str] = field(
        default_factory=lambda: {
            "sApiPort": "8080",
            "sApiKey": secrets.token_hex(6),
            "sEnable":True
        }
    )
    ftp_setting: Dict[str, str] = field(
        default_factory=lambda: {
            "sFtpPort": "1234",
            "sFtpUser": "username",
            "sFtpPassword": secrets.token_hex(16),
            "sEnable":True
        }
    )
    config_blob: Dict[str, Dict] = field(default_factory=dict)
    firmware_tokens: Dict[str, Dict] = field(default_factory=dict)
    video_streams: Dict[int, Dict[str, Dict]] = field(
        default_factory=lambda: {
            0: {
                "encode": {
                    "id": 0,
                    "sStreamType": "mainStream",
                    "sResolution": "3840*2160",
                    "sOutputDataType": "H.265",
                    "sFrameRate": "30",
                    "iMaxRate": 8192,
                    "iGOP": 60,
                    "sRCMode": "VBR",
                    "sRCQuality": "highest",
                    "iMinRate": 0,
                    "iStreamSmooth": 50,
                    "iTargetRate": 0,
                    "sFrameRateIn": "30",
                    "sGOPMode": "normalP",
                    "sH264Profile": "high",
                    "sSmart": "open",
                },
                "osd-char": {
                    "attribute": {
                        "iOSDFontSize": 64,
                        "sOSDFrontColor": "fff799",
                        "sOSDFrontColorMode": "customize",
                    },
                    "channelNameOverlay": {
                        "iEnabled": 1,
                        "iPositionX": 528,
                        "iPositionY": 458,
                        "sChannelName": "reCamera 1126B",
                    },
                    "dateTimeOverlay": {
                        "iEnabled": 1,
                        "iDisplayWeekEnabled": 1,
                        "iPositionX": 50,
                        "iPositionY": 244,
                        "sDateStyle": "CHR-YYYY-MM-DD",
                        "sTimeStyle": "24hour",
                    },
                    "SNOverlay": {
                        "iEnabled": 1,
                        "iPositionX": 50,
                        "iPositionY": 244,
                    },
                },
                "osd-inference": {
                    "inferenceOverlay": {"iEnabled": 1}
                },
                "osd-mask": {
                    "iEnabled": 1,
                    "normalizedScreenSize": {
                        "iNormalizedScreenHeight": 608,
                        "iNormalizedScreenWidth": 1080,
                    },
                    "privacyMask": [
                        {
                            "id": 0,
                            "iMaskHeight": 77,
                            "iMaskWidth": 213,
                            "iPositionX": 53,
                            "iPositionY": 380,
                        }
                    ],
                },
                "stream": {
                    "streamProtocol": "rtsp",
                    "rtsp": {"iPort": 8554},
                    "rtmp": {
                        "sURL": "rtmp://example",
                        "iAuthType": 0,
                        "sSecretKey": "secret",
                        "sUserName": "admin",
                        "sPassword": "admin",
                    },
                    "onvif": {"sUserName": "admin", "sPassword": "admin"},
                },
            },
            1: {
                "encode": {
                    "id": 1,
                    "sStreamType": "subStream",
                    "sResolution": "1920*1080",
                    "sOutputDataType": "H.264",
                    "sFrameRate": "30",
                    "iMaxRate": 4096,
                    "iGOP": 60,
                    "sRCMode": "CBR",
                    "sRCQuality": "high",
                },
                "osd-char": {
                    "attribute": {
                        "iOSDFontSize": 32,
                        "sOSDFrontColor": "ffffff",
                        "sOSDFrontColorMode": "customize",
                    },
                    "channelNameOverlay": {
                        "iEnabled": 1,
                        "iPositionX": 100,
                        "iPositionY": 100,
                        "sChannelName": "sub stream",
                    },
                    "dateTimeOverlay": {
                        "iEnabled": 1,
                        "iDisplayWeekEnabled": 1,
                        "iPositionX": 120,
                        "iPositionY": 120,
                        "sDateStyle": "CHR-YYYY-MM-DD",
                        "sTimeStyle": "24hour",
                    },
                    "SNOverlay": {
                        "iEnabled": 1,
                        "iPositionX": 120,
                        "iPositionY": 160,
                    },
                },
                "osd-inference": {"inferenceOverlay": {"iEnabled": 0}},
                "osd-mask": {
                    "iEnabled": 0,
                    "normalizedScreenSize": {
                        "iNormalizedScreenHeight": 540,
                        "iNormalizedScreenWidth": 960,
                    },
                    "privacyMask": [],
                },
                "stream": {
                    "streamProtocol": "rtsp",
                    "rtsp": {"iPort": 8555},
                    "rtmp": {
                        "sURL": "rtmp://example/sub",
                        "iAuthType": 1,
                        "sUserName": "user",
                        "sPassword": "pass",
                    },
                    "onvif": {"sUserName": "user", "sPassword": "pass"},
                },
            },
        }
    )
    audio_streams: Dict[int, Dict] = field(
        default_factory=lambda: {
            0: {"iEnable": 1, "iBitRate": 32000, "sEncodeType": "G711A"},
            1: {"iEnable": 1, "iBitRate": 32000, "sEncodeType": "G711A"},
        }
    )
    image_config: Dict[int, Dict] = field(
        default_factory=lambda: {
            0: {
                "id": 0,
                "videoAdjustment": {
                    "iImageRotation": 0,
                    "sImageFlip": "close",
                    "sPowerLineFrequencyMode": "NTSC(60HZ)",
                },
                "nightToDay": {
                    "iMode": 0,
                    "iNightToDayFilterLevel": 5,
                    "iNightToDayFilterTime": 5,
                    "iDawnTime": 28800,
                    "iDuskTime": 64800,
                    "iProfileSelect": 0,
                    "iProfileCur": 0,
                },
                "profile": [
                    {
                        "imageAdjustment": {
                            "iBrightness": 57,
                            "iContrast": 50,
                            "iHue": 50,
                            "iSaturation": 50,
                            "iSharpness": 50,
                        },
                        "exposure": {
                            "iExposureGain": 1,
                            "sExposureMode": "auto",
                            "sExposureTime": "1/6",
                            "sGainMode": "auto",
                        },
                        "BLC": {
                            "iBLCStrength": 28,
                            "iDarkBoostLevel": 50,
                            "iHDRLevel": 1,
                            "iHLCLevel": 1,
                            "sBLCRegion": "open",
                            "sHDR": "close",
                            "sHLC": "close",
                        },
                        "whiteBlance": {
                            "iWhiteBalanceCT": 2800,
                            "sWhiteBlanceStyle": "manual",
                        },
                        "imageEnhancement": {
                            "iSpatialDenoiseLevel": 50,
                            "iTemporalDenoiseLevel": 50,
                            "sNoiseReduceMode": 0,
                        },
                    }
                    for _ in range(3)
                ],
            }
        }
    )
    record_control: Dict[str, object] = field(
        default_factory=lambda: {
            "sRecordCondition": "time",
            "sRecordType": "video",
            "iRecordTime": 60,
            "sRecordFormat": "jpg",
            "sTriggerMethod": "io",
            "iAntiShake": 5,
            "sIoPin": "gpio1",
            "sTriggerLevel": "height",
            "sTriggerComand": "record",
            "iPfTrigger": 7,
            "sTriggerMask": "base64adf",
            "lCondition": [
                {"sName": "条件名", "iFrmae": 5, "lLabel": ["person", "bus", "moto"]}
            ],
            "sCurrentModel": "YOLOv5",
            "sModelType": "det",
        }
    )
    record_schedule: Dict[str, List[Dict]] = field(
        default_factory=lambda: {day: [] for day in [
            "lMonday",
            "lTuesday",
            "lWednesday",
            "lThursday",
            "lFriday",
            "lSaturday",
            "lSunday",
        ]}
    )
    models: List[Dict] = field(
        default_factory=lambda: [
            {
                "sFileName": "yolov5s.rknn",
                "sModelNmae": "YOLOv5",
                "sModelType": "det",
                "iModelSize": 22421,
            }
        ]
    )
    model_configs: Dict[str, Dict] = field(
        default_factory=lambda: {
            "yolov5s.rknn": {
                "sFileName": "yolov5s.rknn",
                "sModelType": "det",
                "dConfig": {
                    "fThr": 0.25,
                    "fIouThr": 0.45,
                    "iMaxObject": 300,
                    "lLablel": ["person", "car"],
                },
            }
        }
    )
    inference_config: Dict[str, object] = field(
        default_factory=lambda: {
            "iFPS": 10,
            "sTemplate": "{timestamp}: 检测到 {class} 置信度 {confidence} 位置 ({x1},{y1},{x2},{y2})",
        }
    )
    inference_output: Dict[str, object] = field(
        default_factory=lambda: {
            "sOutputType": "mqtt",
            "dConfig": {
                "sAddress": "mqtt.example.com",
                "sPort": "1883",
                "sTopic": "results/data",
                "sUser": "name",
                "sPassword": secrets.token_hex(8),
            },
        }
    )


state = BackendState()


def reset_state() -> None:
    global state
    new_state = BackendState()
    state.__dict__.update(new_state.__dict__)
