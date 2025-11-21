import React, { useState, useRef } from 'react';
import { X, Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { InferenceAPI } from '../../contexts/API';
import CryptoJS from 'crypto-js';
import toast from '../base/Toast';

export default function ModelUpload({ onClose, onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(''); // success, error, ''
    const fileInputRef = useRef(null);

    // 计算文件的 MD5（增量计算，适合大文件）
    const calculateMD5 = (file) => {
        return new Promise((resolve, reject) => {
            const chunkSize = 2 * 1024 * 1024; // 2MB per chunk for hash calculation
            const chunks = Math.ceil(file.size / chunkSize);
            let currentChunk = 0;
            const spark = CryptoJS.algo.MD5.create();
            const fileReader = new FileReader();

            fileReader.onload = (e) => {
                try {
                    // 将 ArrayBuffer 转换为 WordArray（正确的方式）
                    const arrayBuffer = e.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    const wordArray = CryptoJS.lib.WordArray.create(uint8Array);

                    spark.update(wordArray);
                    currentChunk++;

                    if (currentChunk < chunks) {
                        loadNext();
                    } else {
                        const md5Hash = spark.finalize().toString();
                        resolve(md5Hash);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            fileReader.onerror = () => reject(fileReader.error);

            function loadNext() {
                const start = currentChunk * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                fileReader.readAsArrayBuffer(file.slice(start, end));
            }

            loadNext();
        });
    };

    // 处理拖拽进入
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    // 处理拖拽离开
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // 处理拖拽悬停
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // 处理文件拖放
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // 处理文件选择
    const handleFileSelect = (file) => {
        // 验证文件类型
        const validExtensions = ['.rknn', '.rkllm', '.zip', '.tar', '.gz'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            toast.warning('请选择有效的模型文件（.rknn, .rkllm）或压缩包（.zip, .tar, .gz）');
            return;
        }

        setSelectedFile(file);
        setUploadStatus('');
    };

    // 打开文件选择器
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // 上传文件
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.warning('请先选择文件');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);
            setUploadStatus('');

            // 第一步：开始上传，获取文件ID
            const startResponse = await InferenceAPI.startModelUpload();
            console.log('完整响应对象:', startResponse);
            console.log('响应头:', startResponse.headers);
            console.log('响应体:', startResponse.data);
            console.log('所有响应头键名:', Object.keys(startResponse.headers));

            // 尝试从响应头或响应体中获取 File-Id
            let fileId = startResponse.headers['file-id'] ||
                startResponse.headers['File-Id'] ||
                startResponse.headers['fileid'];

            // 如果响应头中没有，尝试从响应体中获取
            if (!fileId && startResponse.data) {
                fileId = startResponse.data['File-Id'] ||
                    startResponse.data['file-id'] ||
                    startResponse.data.fileId ||
                    startResponse.data.fileid ||
                    startResponse.data.id;
            }

            console.log('获取到的 fileId:', fileId);

            if (!fileId) {
                throw new Error('获取文件ID失败，响应数据: ' + JSON.stringify(startResponse.data));
            }

            // 第二步：计算文件哈希值（用于验证文件完整性）
            console.log('开始计算文件哈希值...');
            console.log('文件名:', selectedFile.name);
            console.log('文件大小:', selectedFile.size, 'bytes');
            const fileHash = await calculateMD5(selectedFile);
            console.log('计算得到的 MD5 值:', fileHash);
            console.log('MD5 值长度:', fileHash.length, '字符（应该是32）');

            // 第三步：分段上传文件内容
            const chunkSize = 524288; // 512KB
            const totalChunks = Math.ceil(selectedFile.size / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, selectedFile.size);
                const chunk = selectedFile.slice(start, end);

                await InferenceAPI.uploadModelChunk(fileId, chunk, start, end - 1, selectedFile.size);

                // 更新进度
                const progress = Math.round(((i + 1) / totalChunks) * 100);
                setUploadProgress(progress);
            }

            // 第四步：完成上传
            await InferenceAPI.finishModelUpload(fileId, selectedFile.name, fileHash);

            setUploadStatus('success');
            setTimeout(() => {
                onUploadSuccess();
                onClose();
            }, 1500);

        } catch (error) {
            console.error('上传失败:', error);
            setUploadStatus('error');
            toast.error('模型上传失败：' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                {/* 对话框头部 */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                        <Upload size={24} />
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                            上传模型
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        style={{
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.2)',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'white',
                            transition: 'background 0.3s'
                        }}
                        onMouseOver={(e) => !uploading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                        onMouseOut={(e) => !uploading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 对话框内容 */}
                <div style={{ padding: '32px', flex: 1 }}>
                    {/* 拖拽上传区域 */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        style={{
                            border: `3px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`,
                            borderRadius: '16px',
                            padding: '48px 24px',
                            textAlign: 'center',
                            backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={!uploading ? handleBrowseClick : undefined}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".rknn,.rkllm,.zip,.tar,.gz"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            style={{ display: 'none' }}
                        />

                        {uploadStatus === 'success' ? (
                            <div style={{ color: '#16a34a' }}>
                                <CheckCircle size={64} style={{ margin: '0 auto 16px' }} />
                                <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                                    上传成功！
                                </p>
                            </div>
                        ) : uploadStatus === 'error' ? (
                            <div style={{ color: '#dc2626' }}>
                                <AlertCircle size={64} style={{ margin: '0 auto 16px' }} />
                                <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                                    上传失败
                                </p>
                            </div>
                        ) : (
                            <>
                                <FileUp
                                    size={64}
                                    style={{
                                        color: isDragging ? '#3b82f6' : '#94a3b8',
                                        margin: '0 auto 16px',
                                        display: 'block'
                                    }}
                                />
                                <p style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    margin: '0 0 8px 0'
                                }}>
                                    {isDragging ? '释放以上传文件' : '拖拽文件到此处'}
                                </p>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#64748b',
                                    margin: '0 0 16px 0'
                                }}>
                                    或
                                </p>
                                <button
                                    className="btn btn-primary"
                                    disabled={uploading}
                                    style={{
                                        pointerEvents: uploading ? 'none' : 'auto'
                                    }}
                                >
                                    浏览文件
                                </button>
                                <p style={{
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    margin: '16px 0 0 0'
                                }}>
                                    支持 .rknn, .rkllm 模型文件或 .zip, .tar, .gz 压缩包
                                </p>
                            </>
                        )}
                    </div>

                    {/* 已选择的文件 */}
                    {selectedFile && uploadStatus === '' && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <FileUp size={24} color="#3b82f6" />
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1e293b'
                                }}>
                                    {selectedFile.name}
                                </p>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: '#64748b'
                                }}>
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#64748b'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* 上传进度 */}
                    {uploading && (
                        <div style={{ marginTop: '24px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>
                                    上传中...
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                                    {uploadProgress}%
                                </span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${uploadProgress}%`,
                                    backgroundColor: '#3b82f6',
                                    transition: 'width 0.3s ease',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* 对话框底部 */}
                {uploadStatus === '' && (
                    <div style={{
                        padding: '20px 32px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        backgroundColor: '#f8fafc'
                    }}>
                        <button
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={uploading}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleUpload}
                            className="btn btn-primary"
                            disabled={!selectedFile || uploading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Upload size={16} />
                            {uploading ? '上传中...' : '开始上传'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

