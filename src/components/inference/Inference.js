import React, { useState, useEffect } from "react";
import { InferenceAPI } from "../../contexts/API";
import ModelManage from "./Modelmanage";
import InferenceOutput from "./InferenceOuput";
import { Play, Square, Activity, Save } from 'lucide-react';
import './Inference.css';
import toast, { ToastProvider } from './Toast';

export default function InferencePage() {
    const [inferenceStatus, setInferenceStatus] = useState({
        iEnable: 0,
        sStatus: 'stop',
        sModel: '',
        iFPS: 30
    });
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 加载推理状态
    const loadInferenceStatus = async () => {
        try {
            const response = await InferenceAPI.getInferenceStatus();
            setInferenceStatus(response.data);
        } catch (error) {
            console.error('获取推理状态失败:', error);
        }
    };

    // 加载模型列表
    const loadModels = async () => {
        try {
            const response = await InferenceAPI.getModelList();
            setModels(response.data || []);
        } catch (error) {
            console.error('获取模型列表失败:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([loadInferenceStatus(), loadModels()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // 更新推理配置字段
    const handleChange = (field, value) => {
        setInferenceStatus(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 保存推理配置
    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            const configData = {
                iEnable: inferenceStatus.iEnable,
                sModel: inferenceStatus.sModel,
                iFPS: inferenceStatus.iFPS
            };
            await InferenceAPI.setInferenceConfig(configData);
            toast.success('推理配置保存成功');
            // 重新加载状态
            await loadInferenceStatus();
        } catch (error) {
            console.error('保存推理配置失败:', error);
            toast.error('保存推理配置失败');
        } finally {
            setSaving(false);
        }
    };

    // 获取状态显示
    const getStatusDisplay = () => {
        const statusConfig = {
            running: { text: '运行中', color: '#16a34a', icon: <Activity size={16} /> },
            stop: { text: '已停止', color: '#64748b', icon: <Square size={16} /> },
            error: { text: '错误', color: '#dc2626', icon: <AlertCircle size={16} /> }
        };
        
        const config = statusConfig[inferenceStatus.sStatus] || statusConfig.stop;
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: `${config.color}15`,
                color: config.color,
                fontWeight: '600',
                fontSize: '14px'
            }}>
                {config.icon}
                {config.text}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                加载中...
            </div>
        );
    }

    return (
        <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 模型管理 */}
                <ModelManage onModelDeleted={loadModels} />

                {/* 推理配置 */}
            <div className="content-card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Play size={20} color="#3b82f6" />
                        <div>
                            <h3>推理配置</h3>
                            <p style={{ 
                                margin: '4px 0 0 0', 
                                fontSize: '13px', 
                                color: 'var(--text-secondary)',
                                fontWeight: 'normal'
                            }}>
                                配置AI推理参数和运行模型
                            </p>
                        </div>
                    </div>
                    {getStatusDisplay()}
                </div>
                <div className="card-body">
                    <div className="form-grid">
                        {/* 使能推理 */}
                        <div className="form-group">
                            <label>推理使能</label>
                            <select
                                className="form-control"
                                value={inferenceStatus.iEnable}
                                onChange={(e) => handleChange('iEnable', parseInt(e.target.value))}
                            >
                                <option value={0}>关闭</option>
                                <option value={1}>开启</option>
                            </select>
                        </div>

                        {/* 选择模型 */}
                        <div className="form-group">
                            <label>运行模型</label>
                            <select
                                className="form-control"
                                value={inferenceStatus.sModel}
                                onChange={(e) => handleChange('sModel', e.target.value)}
                                disabled={models.length === 0}
                            >
                                {models
                                    .filter(item => item.modelInfo) // 只显示有配置信息的模型
                                    .map((item, index) => (
                                        <option key={index} value={item.model}>
                                            {item.model}
                                        </option>
                                    ))}
                            </select>
                            {models.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                                    暂无可用模型，请先上传并配置模型
                                </p>
                            )}
                            {models.length > 0 && models.filter(item => item.modelInfo).length === 0 && (
                                <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                                    所有模型均未配置信息，请先配置模型后再使用
                                </p>
                            )}
                        </div>

                        {/* FPS设置 */}
                        <div className="form-group">
                            <label>推理频率 (FPS)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="range"
                                    min="1"
                                    max="120"
                                    value={inferenceStatus.iFPS}
                                    onChange={(e) => handleChange('iFPS', parseInt(e.target.value))}
                                    className="slider"
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={inferenceStatus.iFPS}
                                    onChange={(e) => handleChange('iFPS', parseInt(e.target.value) || 1)}
                                    className="form-control"
                                    style={{ width: '80px' }}
                                />
                            </div>
                        </div>

                        {/* 当前状态 */}
                        <div className="form-group">
                            <label>推理状态</label>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                color: 'var(--text-secondary)'
                            }}>
                                {inferenceStatus.sStatus === 'running' ? '正在运行' : 
                                 inferenceStatus.sStatus === 'error' ? '运行错误' : '已停止'}
                            </div>
                        </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="button-group" style={{ marginTop: '20px' }}>
                        <button
                            onClick={handleSaveConfig}
                            className="btn btn-primary"
                            disabled={saving || !inferenceStatus.sModel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Save size={16} />
                            {saving ? '保存中...' : '保存配置'}
                        </button>
                    </div>

                    {/* 提示信息 */}
                    {!inferenceStatus.sModel && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fbbf24',
                            color: '#92400e',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            <span>请选择要运行的模型</span>
                        </div>
                    )}
                </div>
            </div>

                {/* 推理输出配置 */}
                <InferenceOutput />
            </div>
        </ToastProvider>
    );
}

function AlertCircle({ size }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}