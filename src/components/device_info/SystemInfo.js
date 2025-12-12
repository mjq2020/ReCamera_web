import React, { useRef, useState } from 'react';
import { DeviceInfoAPI } from '../../contexts/API';
import { toast } from '../base/Toast';
import SparkMD5 from 'spark-md5';

function SystemSetting() {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(''); // 上传状态文本

    // 分块计算文件的MD5（支持大文件）
    const calculateMD5 = (file, onProgress) => {
        return new Promise((resolve, reject) => {
            const chunkSize = 2 * 1024 * 1024; // 2MB 每块
            const chunks = Math.ceil(file.size / chunkSize);
            let currentChunk = 0;
            const spark = new SparkMD5.ArrayBuffer();
            const fileReader = new FileReader();

            fileReader.onload = (e) => {
                try {
                    spark.append(e.target.result);
                    currentChunk++;

                    // 报告进度
                    if (onProgress) {
                        const progress = Math.round((currentChunk / chunks) * 100);
                        onProgress(progress);
                    }

                    if (currentChunk < chunks) {
                        loadNextChunk();
                    } else {
                        const md5Hash = spark.end();
                        console.log(`MD5计算完成: ${md5Hash}`);
                        resolve(md5Hash);
                    }
                } catch (error) {
                    console.error('MD5计算错误:', error);
                    reject('MD5计算失败: ' + error.message);
                }
            };

            fileReader.onerror = (error) => {
                console.error('文件读取错误:', error);
                reject('文件读取失败');
            };

            const loadNextChunk = () => {
                const start = currentChunk * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const blob = file.slice(start, end);
                fileReader.readAsArrayBuffer(blob);
            };

            // 开始读取第一个块
            loadNextChunk();
        });
    };

    // 处理文件上传
    const handleFileUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('准备上传...');

        try {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`准备上传文件: ${file.name}, 大小: ${fileSizeMB}MB`);

            // 1. 开始上传，获取File-Id
            setUploadStatus('初始化上传...');
            toast.info('开始上传固件...');
            const startResponse = await DeviceInfoAPI.startFirmwareUpload();
            const fileId = startResponse.headers['file-id'];
            
            if (!fileId) {
                throw new Error('未获取到File-Id');
            }
            console.log('获取到File-Id:', fileId);

            // 2. 计算MD5（分块计算，支持大文件）
            setUploadStatus('正在计算文件MD5...');
            toast.info('正在计算文件MD5，请稍候...');
            
            const md5sum = await calculateMD5(file, (progress) => {
                setUploadProgress(progress);
                setUploadStatus(`计算MD5: ${progress}%`);
            });
            
            console.log('MD5计算完成:', md5sum);
            toast.success('MD5计算完成！');

            // 3. 分块上传固件文件
            const chunkSize = 524288; // 512KB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const totalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            setUploadStatus(`准备上传文件 (${totalSizeMB}MB)...`);
            toast.info(`开始上传固件文件，大小 ${totalSizeMB}MB`);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                await DeviceInfoAPI.uploadFirmwareChunk(
                    fileId,
                    chunk,
                    start,
                    end - 1
                );

                const progress = Math.round(((i + 1) / totalChunks) * 100);
                const uploadedBytes = Math.min(end, file.size);
                const uploadedMB = (uploadedBytes / (1024 * 1024)).toFixed(2);
                
                setUploadProgress(progress);
                setUploadStatus(`上传中: ${uploadedMB}MB / ${totalSizeMB}MB (${progress}%)`);
                
                // 每10个块或最后一块输出日志
                if ((i + 1) % 10 === 0 || i === totalChunks - 1) {
                    console.log(`上传进度: ${uploadedMB}MB / ${totalSizeMB}MB (${progress}%)`);
                }
            }

            // 4. 完成上传
            setUploadStatus('正在验证...');
            toast.info('完成上传，正在验证...');
            await DeviceInfoAPI.finishFirmwareUpload(fileId, md5sum);

            setUploadStatus('上传成功！');
            toast.success('固件上传成功！设备将开始更新...');
            setUploadProgress(100);
            
            // 2秒后清除状态
            setTimeout(() => {
                setUploadStatus('');
                setUploadProgress(0);
            }, 2000);
        } catch (error) {
            console.error('固件上传失败:', error);
            setUploadStatus('上传失败');
            toast.error('固件上传失败: ' + (error.message || '未知错误'));
        } finally {
            setUploading(false);
        }
    };

    // 触发文件选择
    const handleLocalFirmwareUpdate = () => {
        if (uploading) {
            toast.warning('正在上传中，请稍候...');
            return;
        }
        fileInputRef.current?.click();
    };

    // 文件选择后的处理
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
        // 清空input，以便可以重复选择同一文件
        e.target.value = '';
    };

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
            gap: '20px',
            padding: '10px'
        }}>
            {/* 配置管理卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>配置管理</h3>
                </div>
                <div className='card-body'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button className='btn btn-primary'>导出设置</button>
                        <button className='btn btn-primary'>导入设置</button>
                    </div>
                </div>
            </div>

            {/* 固件管理卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>固件管理</h3>
                </div>
                <div className='card-body'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button className='btn btn-primary'>在线更新固件</button>
                        <button 
                            className='btn btn-primary'
                            onClick={handleLocalFirmwareUpdate}
                            disabled={uploading}
                        >
                            {uploading ? '上传中...' : '本地更新固件'}
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".bin,.img,.zip"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    {uploading && (
                        <div style={{ marginTop: "15px", width: "100%" }}>
                            <div style={{ 
                                marginBottom: "8px",
                                fontSize: "14px",
                                color: "#666",
                                textAlign: "center"
                            }}>
                                {uploadStatus || '处理中...'}
                            </div>
                            <div style={{ 
                                width: "100%", 
                                height: "24px", 
                                backgroundColor: "#e0e0e0", 
                                borderRadius: "12px",
                                overflow: "hidden",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                            }}>
                                <div style={{
                                    width: `${uploadProgress}%`,
                                    height: "100%",
                                    backgroundColor: "#4CAF50",
                                    transition: "width 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: "8px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                }}>
                                    {uploadProgress > 10 && (
                                        <span style={{ 
                                            color: "white", 
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}>
                                            {uploadProgress}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 系统设置卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>系统设置</h3>
                </div>
                <div className='card-body'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button 
                            className='btn btn-primary' 
                            style={{ 
                                background: "#0a0909ff",
                                flex: '1 1 calc(50% - 5px)',
                                minWidth: '120px'
                            }}
                        >
                            重启设备
                        </button>
                        <button 
                            className='btn btn-primary' 
                            style={{ 
                                background: "#062fcfff",
                                flex: '1 1 calc(50% - 5px)',
                                minWidth: '120px'
                            }}
                        >
                            修改密码
                        </button>
                        <button 
                            className='btn btn-primary' 
                            style={{ 
                                background: "#bc1313ff",
                                flex: '1 1 100%',
                                minWidth: '120px'
                            }}
                        >
                            恢复出厂设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SystemSetting;