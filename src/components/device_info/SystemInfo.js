import React, { useRef, useState, useEffect } from 'react';
import { DeviceInfoAPI } from '../../contexts/API';
import { toast } from '../base/Toast';
import SparkMD5 from 'spark-md5';

function SystemSetting() {
    const fileInputRef = useRef(null);
    const configFileInputRef = useRef(null); // 配置文件选择的ref
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(''); // 上传状态文本
    const [uploadingConfig, setUploadingConfig] = useState(false); // 配置上传状态

    // 在线固件更新相关状态
    const [searchFirmwareVersion, setSearchFirmwareVersion] = useState(false); // 搜索固件版本
    const [onlineUpdating, setOnlineUpdating] = useState(false); // 在线更新状态
    const [onlineUpdateProgress, setOnlineUpdateProgress] = useState(0); // 在线更新进度
    const [onlineUpdateStatus, setOnlineUpdateStatus] = useState(''); // 在线更新状态文本
    const [isUpgrading, setIsUpgrading] = useState(false); // 是否正在升级（页面锁定状态）
    const downloadProgressIntervalRef = useRef(null); // 下载进度轮询定时器
    const upgradeCheckIntervalRef = useRef(null); // 升级检查定时器
    const [originalFirmwareVersion, setOriginalFirmwareVersion] = useState(''); // 原始固件版本

    // 修改密码相关状态
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        satisfiedCount: 0
    });

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            clearIntervals();
        };
    }, []);

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

    // 清理定时器
    const clearIntervals = () => {
        if (downloadProgressIntervalRef.current) {
            clearInterval(downloadProgressIntervalRef.current);
            downloadProgressIntervalRef.current = null;
        }
        if (upgradeCheckIntervalRef.current) {
            clearInterval(upgradeCheckIntervalRef.current);
            upgradeCheckIntervalRef.current = null;
        }
    };

    // 查询下载进度
    const checkDownloadProgress = async () => {
        try {
            const response = await DeviceInfoAPI.getFirmwareNetworkStatus();
            const { sStatus, iPercent, iCurrent, iTotal } = response.data;

            if (sStatus === 'downloading') {
                // 下载中
                const currentMB = (iCurrent / (1024 * 1024)).toFixed(2);
                const totalMB = (iTotal / (1024 * 1024)).toFixed(2);
                setOnlineUpdateProgress(iPercent);
                setOnlineUpdateStatus(`正在下载固件: ${currentMB}MB / ${totalMB}MB (${iPercent}%)`);
            } else if (sStatus === 'success') {
                // 下载完成，准备升级
                clearIntervals();
                setOnlineUpdateProgress(100);
                setOnlineUpdateStatus('下载完成，正在准备升级...');
                toast.info('固件下载完成，设备即将开始升级...');

                // 进入升级阶段
                setTimeout(() => {
                    startUpgradeMonitoring();
                }, 2000);
            } else if (sStatus === 'error') {
                // 下载失败
                clearIntervals();
                setOnlineUpdating(false);
                setOnlineUpdateStatus('下载失败');
                toast.error('固件下载失败');
            }
        } catch (error) {
            console.error('查询下载进度失败:', error);
            // 不中断轮询，继续尝试
        }
    };

    // 开始升级监控
    const startUpgradeMonitoring = () => {
        setIsUpgrading(true);
        setOnlineUpdateStatus('正在升级固件，请勿断电或关闭页面...');
        toast.info('设备正在升级，请勿断电或关闭页面。升级期间设备将无响应，这是正常现象。');

        // 每5秒检查一次固件版本
        upgradeCheckIntervalRef.current = setInterval(async () => {
            try {
                const response = await DeviceInfoAPI.getDeviceInfo();
                const currentVersion = response.data.sFirmwareVersion;

                // 对比固件版本
                if (currentVersion !== originalFirmwareVersion) {
                    // 版本已更新，升级成功
                    clearIntervals();
                    setIsUpgrading(false);
                    setOnlineUpdating(false);
                    setOnlineUpdateStatus('升级成功！');
                    setOnlineUpdateProgress(100);
                    toast.success(`固件升级成功！版本已从 ${originalFirmwareVersion} 更新到 ${currentVersion}`);

                    // 2秒后清除状态
                    setTimeout(() => {
                        setOnlineUpdateStatus('');
                        setOnlineUpdateProgress(0);
                    }, 3000);
                }
            } catch (error) {
                // 升级期间设备无响应是正常的，继续轮询
                console.log('设备升级中，暂无响应...');
            }
        }, 5000);

        // 设置超时时间（10分钟）
        setTimeout(() => {
            if (isUpgrading) {
                clearIntervals();
                setIsUpgrading(false);
                setOnlineUpdating(false);
                toast.warning('升级超时，请手动检查设备状态');
                setOnlineUpdateStatus('升级超时');
            }
        }, 10 * 60 * 1000);
    };

    const handleOnlineFirmwareUpdate = async () => {
        if (onlineUpdating || isUpgrading) {
            toast.warning('固件更新正在进行中，请稍候...');
            return;
        }

        try {
            // 1. 获取当前固件版本
            setSearchFirmwareVersion(true);
            const deviceInfoResponse = await DeviceInfoAPI.getDeviceInfo();
            const currentFirmwareVersion = deviceInfoResponse.data.sFirmwareVersion;
            setOriginalFirmwareVersion(currentFirmwareVersion);
            console.log('当前固件版本:', currentFirmwareVersion);

            // 2. 第一次请求：检查更新并获取确认令牌
            setOnlineUpdateStatus('正在检查更新...');
            const response = await DeviceInfoAPI.postFirmwareNetwork();

            if (response.data.code !== 0) {
                toast.error('检查更新失败: ' + (response.data.message || '未知错误'));
                setSearchFirmwareVersion(false);
                return;
            }

            const { iUpdateAvailable, sCurrentVersion, sLatestVersion, sConfirmToken, sUpdating } = response.data;
            if (!sUpdating) {
                // 检查是否有可用更新
                if (!iUpdateAvailable) {
                    toast.info(`当前已是最新版本 (${sCurrentVersion})`);
                    setOnlineUpdateStatus('');
                    setSearchFirmwareVersion(false);
                    return;
                }

                // 3. 显示确认对话框
                const updateMessage = `检测到新版本！\n当前版本: ${sCurrentVersion}\n最新版本: ${sLatestVersion}\n\n确定要更新固件吗？`;
                const confirmed = await toast.confirm(updateMessage);

                if (!confirmed) {
                    setOnlineUpdateStatus('');
                    setSearchFirmwareVersion(false);
                    return;
                }

                // 4. 第二次请求：确认更新，开始下载
                setSearchFirmwareVersion(false);
                setOnlineUpdating(true);
                setOnlineUpdateProgress(0);
                setOnlineUpdateStatus('正在启动固件下载...');
                toast.info('开始下载固件...');

                const confirmResponse = await DeviceInfoAPI.postFirmwareNetwork({
                    sConfirmToken: sConfirmToken
                });

                if (confirmResponse.data.code !== 0) {
                    throw new Error(confirmResponse.data.message || '启动下载失败');
                }
            } else {
                setSearchFirmwareVersion(false);
            }

            // 5. 开始轮询下载进度
            toast.success('固件下载已启动！');
            setOnlineUpdateStatus('正在下载固件...');

            // 每2秒查询一次下载进度
            downloadProgressIntervalRef.current = setInterval(checkDownloadProgress, 2000);

            // 立即执行一次
            checkDownloadProgress();

        } catch (error) {
            console.error('固件更新失败:', error);
            clearIntervals();
            setOnlineUpdating(false);
            setOnlineUpdateStatus('');
            toast.error('固件更新失败: ' + (error.message || '未知错误'));
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
    const rebootDevice = async () => {
        try {
            await toast.confirm("确定要重启设备吗？").then(async (confirmed) => {
                if (!confirmed) {
                    return;
                }
                await DeviceInfoAPI.postReboot()
                toast.success("设备即将重启！");
            })

        } catch (error) { }
    };
    const updatePassword = async () => {
        setShowPasswordModal(true);
    };

    // 处理密码表单输入
    const handlePasswordChange = (field, value) => {
        setPasswordForm(prev => ({
            ...prev,
            [field]: value
        }));

        // 如果是新密码字段，实时更新密码强度检查
        if (field === 'newPassword') {
            const checks = {
                hasMinLength: value.length >= 6,
                hasUpperCase: /[A-Z]/.test(value),
                hasLowerCase: /[a-z]/.test(value),
                hasNumber: /[0-9]/.test(value),
                hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
            };
            // 计算字符类型满足的数量（不包括长度要求）
            const typeChecks = {
                hasUpperCase: checks.hasUpperCase,
                hasLowerCase: checks.hasLowerCase,
                hasNumber: checks.hasNumber,
                hasSpecialChar: checks.hasSpecialChar
            };
            const satisfiedCount = Object.values(typeChecks).filter(Boolean).length;
            setPasswordStrength({
                ...checks,
                satisfiedCount
            });
        }
    };

    // 验证密码强度
    const validatePasswordStrength = (password) => {
        const checks = {
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const satisfiedCount = Object.values(checks).filter(Boolean).length;

        return {
            isValid: satisfiedCount >= 3,
            satisfiedCount,
            checks
        };
    };

    // 提交密码修改
    const handlePasswordSubmit = async () => {
        try {
            const { oldPassword, newPassword, confirmPassword } = passwordForm;

            // 验证输入
            if (!oldPassword || !newPassword || !confirmPassword) {
                toast.error('请填写所有密码字段');
                return;
            }

            if (newPassword !== confirmPassword) {
                toast.error('两次输入的新密码不一致');
                return;
            }

            if (newPassword.length < 6) {
                toast.error('新密码长度不能少于6位');
                return;
            }

            if (oldPassword === newPassword) {
                toast.error('新密码不能与旧密码相同');
                return;
            }

            // 验证密码强度
            const strengthCheck = validatePasswordStrength(newPassword);
            if (!strengthCheck.isValid) {
                const checkDetails = [];
                if (!strengthCheck.checks.hasUpperCase) checkDetails.push('大写字母');
                if (!strengthCheck.checks.hasLowerCase) checkDetails.push('小写字母');
                if (!strengthCheck.checks.hasNumber) checkDetails.push('数字');
                if (!strengthCheck.checks.hasSpecialChar) checkDetails.push('特殊字符');

                toast.error(`密码强度不足！密码必须包含以下至少3种字符类型：大写字母、小写字母、数字、特殊字符。\n当前缺少：${checkDetails.join('、')}`);
                return;
            }

            // 计算SHA256哈希值
            // const oldPasswordHash = CryptoJS.SHA256(oldPassword).toString();
            // const newPasswordHash = CryptoJS.SHA256(newPassword).toString();

            // 获取用户名（从localStorage或其他地方）
            const username = localStorage.getItem('username') || 'admin';

            // 调用API
            const requestData = {
                sUserName: username,
                sOldPassword: oldPassword,
                sNewPassword: newPassword
            };

            const response = await DeviceInfoAPI.putPassword(requestData);

            if (response.data.code === 0) {
                toast.success('密码修改成功！');
                setShowPasswordModal(false);
                // 清空表单
                setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error('密码修改失败: ' + (response.data.message || '未知错误'));
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            toast.error('修改密码失败: ' + (error.message || '未知错误'));
        }
    };

    // 关闭密码弹窗
    const handlePasswordModalClose = () => {
        setShowPasswordModal(false);
        // 清空表单
        setPasswordForm({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        // 重置密码强度检查
        setPasswordStrength({
            hasMinLength: false,
            hasUpperCase: false,
            hasLowerCase: false,
            hasNumber: false,
            hasSpecialChar: false,
            satisfiedCount: 0
        });
    };
    const factoryReset = async () => {
        try {
            await toast.confirm("确定要恢复出厂设置吗？").then(async (confirmed) => {
                if (!confirmed) {
                    return;
                }
                const response = await DeviceInfoAPI.postFactoryReset()
                if (response.data.code === 0) {
                    const response_token = response.data.sConfirmToken
                    await toast.confirm("确定要恢复出厂设置吗？此操作将清除所有配置和数据，请谨慎操作！").then(async (confirmed) => {
                        if (!confirmed) {
                            return;
                        }
                        const payload = {
                            sConfirmToken: response_token
                        }
                        const response = await DeviceInfoAPI.postFactoryReset(payload)
                        if (response.data.code === 0) {
                            toast.success("恢复出厂设置成功！");
                        } else {
                            toast.error("恢复出厂设置失败: " + response.data.message);
                        }
                    })
                }
            })
        }
        catch (error) {
            console.error('恢复出厂设置失败:', error);
            toast.error('恢复出厂设置失败: ' + (error.message || '未知错误'));
        }
    }


    const exportConfig = async () => {
        try {
            toast.info('正在导出配置...');
            const response = await DeviceInfoAPI.getConfig();

            if (response.data && response.data.url) {
                const fileUrl = response.data.url;
                const size = response.data.size;

                // 获取基础URL
                const baseURL = window.location.origin;
                const downloadUrl = `${baseURL}${fileUrl}`;


                console.log('开始下载配置文件:', downloadUrl);
                toast.success('配置导出成功，开始下载...');
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'config.tar';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 使用 fetch API 下载文件，确保携带认证信息
                // const downloadResponse = await fetch(downloadUrl, {
                //     method: 'GET',
                //     credentials: 'include', // 携带 cookies
                //     headers: {
                //         'Cookie': `token=${localStorage.getItem('token')}`
                //     }
                // });

                // if (!downloadResponse.ok) {
                //     throw new Error(`下载失败: ${downloadResponse.status} ${downloadResponse.statusText}`);
                // }

                // // 将响应转换为 blob
                // const blob = await downloadResponse.blob();

                // // 创建 blob URL
                // const blobUrl = window.URL.createObjectURL(blob);

                // // 创建a标签来触发下载
                // const link = document.createElement('a');
                // link.href = blobUrl;
                // link.download = 'config.tar';
                // document.body.appendChild(link);
                // link.click();
                // document.body.removeChild(link);

                // 释放 blob URL
                // window.URL.revokeObjectURL(blobUrl);

                toast.success(`配置文件下载成功 (${(size / 1024 / 1024).toFixed(2)}MB)`);
            } else {
                throw new Error('未获取到下载链接');
            }
        }
        catch (error) {
            console.error('导出配置失败:', error);
            toast.error('导出配置失败: ' + (error.message || '未知错误'));
        }
    }

    // 处理配置文件上传
    const handleConfigUpload = async (file) => {
        if (!file) return;

        setUploadingConfig(true);
        setUploadProgress(0);
        setUploadStatus('准备上传配置...');

        try {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`准备上传配置文件: ${file.name}, 大小: ${fileSizeMB}MB`);

            // 1. 开始上传，获取File-Id
            setUploadStatus('初始化上传...');
            toast.info('开始上传配置文件...');
            const startResponse = await DeviceInfoAPI.startConfigUpload();
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

            // 3. 分块上传配置文件
            const chunkSize = 524288; // 512KB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const totalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

            setUploadStatus(`准备上传文件 (${totalSizeMB}MB)...`);
            toast.info(`开始上传配置文件，大小 ${totalSizeMB}MB`);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                await DeviceInfoAPI.uploadConfigChunk(
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
            setUploadStatus('正在验证配置...');
            toast.info('完成上传，正在验证配置...');
            await DeviceInfoAPI.finishConfigUpload(fileId, md5sum);

            setUploadStatus('配置导入成功！');
            toast.success('配置导入成功！设备将应用新配置...');
            setUploadProgress(100);

            // 2秒后清除状态
            setTimeout(() => {
                setUploadStatus('');
                setUploadProgress(0);
            }, 2000);
        } catch (error) {
            console.error('配置导入失败:', error);
            setUploadStatus('导入失败');
            toast.error('配置导入失败: ' + (error.message || '未知错误'));
        } finally {
            setUploadingConfig(false);
        }
    };

    // 触发配置文件选择
    const handleImportConfig = () => {
        if (uploading || uploadingConfig) {
            toast.warning('正在上传中，请稍候...');
            return;
        }
        configFileInputRef.current?.click();
    };

    // 配置文件选择后的处理
    const handleConfigFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // 验证文件类型
            if (!file.name.endsWith('.tar') && !file.name.endsWith('.tar.gz') && !file.name.endsWith('.tgz')) {
                toast.error('请选择正确的配置文件格式（.tar 或 .tar.gz）');
                e.target.value = '';
                return;
            }
            handleConfigUpload(file);
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
                        <button
                            className='btn btn-primary'
                            onClick={exportConfig}
                            disabled={uploadingConfig || isUpgrading}
                        >
                            导出设置
                        </button>
                        <button
                            className='btn btn-primary'
                            onClick={handleImportConfig}
                            disabled={uploadingConfig || isUpgrading}
                        >
                            {uploadingConfig ? '导入中...' : '导入设置'}
                        </button>
                    </div>
                    <input
                        ref={configFileInputRef}
                        type="file"
                        accept=".tar,.tar.gz,.tgz"
                        style={{ display: 'none' }}
                        onChange={handleConfigFileChange}
                    />
                    {uploadingConfig && (
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

            {/* 固件管理卡片 */}
            <div className='content-card' style={{ margin: 0 }}>
                <div className='card-header'>
                    <h3>固件管理</h3>
                </div>
                <div className='card-body'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button className='btn btn-primary'
                            onClick={handleOnlineFirmwareUpdate}
                            disabled={uploading || onlineUpdating || isUpgrading || searchFirmwareVersion}
                        >
                            {searchFirmwareVersion ? "搜索固件版本..." : onlineUpdating ? '更新中...' : '在线更新固件'}
                        </button>
                        <button
                            className='btn btn-primary'
                            onClick={handleLocalFirmwareUpdate}
                            disabled={uploading || onlineUpdating || isUpgrading || searchFirmwareVersion}
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
                    {/* 本地上传进度 */}
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
                    {/* 在线更新进度 */}
                    {(onlineUpdating || isUpgrading) && (
                        <div style={{ marginTop: "15px", width: "100%" }}>
                            <div style={{
                                marginBottom: "8px",
                                fontSize: "14px",
                                color: isUpgrading ? "#ff9800" : "#666",
                                textAlign: "center",
                                fontWeight: isUpgrading ? "bold" : "normal"
                            }}>
                                {onlineUpdateStatus || '处理中...'}
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
                                    width: `${onlineUpdateProgress}%`,
                                    height: "100%",
                                    backgroundColor: isUpgrading ? "#ff9800" : "#2196F3",
                                    transition: "width 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: "8px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                    animation: isUpgrading ? "pulse 2s ease-in-out infinite" : "none"
                                }}>
                                    {onlineUpdateProgress > 10 && !isUpgrading && (
                                        <span style={{
                                            color: "white",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}>
                                            {onlineUpdateProgress}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isUpgrading && (
                                <div style={{
                                    marginTop: "8px",
                                    fontSize: "12px",
                                    color: "#ff9800",
                                    textAlign: "center"
                                }}>
                                    ⚠️ 升级期间请勿关闭页面或断电
                                </div>
                            )}
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
                            onClick={rebootDevice}
                            disabled={isUpgrading}
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
                            onClick={updatePassword}
                            disabled={isUpgrading}
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
                            onClick={factoryReset}
                            disabled={isUpgrading}
                        >
                            恢复出厂设置
                        </button>
                    </div>
                </div>
            </div>

            {/* 修改密码弹窗 */}
            {showPasswordModal && (
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
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px',
                        minWidth: '400px',
                        maxWidth: '500px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
                            修改密码
                        </h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                旧密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="请输入旧密码"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                新密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="请输入新密码（至少6位）"
                            />
                            <div style={{
                                marginTop: '10px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '6px'
                                }}>
                                    字符类型（至少满足3种）：
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '6px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        color: passwordStrength.hasUpperCase ? '#28a745' : '#999',
                                        transition: 'color 0.2s'
                                    }}>
                                        <span style={{
                                            marginRight: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {passwordStrength.hasUpperCase ? '✓' : '○'}
                                        </span>
                                        包含大写字母
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        color: passwordStrength.hasLowerCase ? '#28a745' : '#999',
                                        transition: 'color 0.2s'
                                    }}>
                                        <span style={{
                                            marginRight: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {passwordStrength.hasLowerCase ? '✓' : '○'}
                                        </span>
                                        包含小写字母
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        color: passwordStrength.hasNumber ? '#28a745' : '#999',
                                        transition: 'color 0.2s'
                                    }}>
                                        <span style={{
                                            marginRight: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {passwordStrength.hasNumber ? '✓' : '○'}
                                        </span>
                                        包含数字
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        color: passwordStrength.hasSpecialChar ? '#28a745' : '#999',
                                        transition: 'color 0.2s'
                                    }}>
                                        <span style={{
                                            marginRight: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {passwordStrength.hasSpecialChar ? '✓' : '○'}
                                        </span>
                                        包含特殊字符
                                    </div>
                                </div>
                                {/* <div style={{ 
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid #e9ecef',
                                    fontSize: '12px',
                                    color: (passwordStrength.hasMinLength && passwordStrength.satisfiedCount >= 3) ? '#28a745' : '#dc3545',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}>
                                    {passwordForm.newPassword ? (
                                        (passwordStrength.hasMinLength && passwordStrength.satisfiedCount >= 3) ? 
                                        `✓ 密码强度合格` : 
                                        `✗ 密码强度不足（字符类型已满足 ${passwordStrength.satisfiedCount}/4 种，至少需要 3 种）`
                                    ) : (
                                        '请输入密码以检查强度'
                                    )}
                                </div> */}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                确认新密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="请再次输入新密码"
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                className='btn'
                                onClick={handlePasswordModalClose}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#f5f5f5',
                                    color: '#666',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                className='btn btn-primary'
                                onClick={handlePasswordSubmit}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#062fcfff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SystemSetting;