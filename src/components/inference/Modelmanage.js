import React, { useState, useEffect } from 'react';
import { InferenceAPI } from '../../contexts/API';
import ModelConfig from './ModelConfig';
import ModelUpload from './ModelUpload';
import { Trash2, Settings, Box, AlertCircle, Upload, Square, SquareCheckBig, CheckCheck, Check } from 'lucide-react';
import toast from '../base/Toast';

export default function ModelManage({ onModelDeleted }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState(null);
    const [currentInferModel, setCurrentInferModel] = useState(null);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    const getCurrentModel = async () => {
        try {
            const response = await InferenceAPI.getInferenceStatus();
            if (response.status == 200) {
                setCurrentInferModel(response.data);
            }
        } catch (err) {

        };
    };

    // 加载模型列表
    const loadModels = async () => {
        try {
            setLoading(true);
            const response = await InferenceAPI.getModelList();
            setModels(response.data || []);

        } catch (error) {
            console.error('获取模型列表失败:', error);
            toast.error('获取模型列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadModels();
        getCurrentModel();
    }, []);

    // 删除模型
    const handleDeleteModel = async (modelName) => {
        const confirmed = await toast.confirm(`确定要删除模型 "${modelName}" 吗？此操作不可撤销。`);
        if (!confirmed) {
            return;
        }

        try {
            await InferenceAPI.deleteModel(modelName);
            toast.success('模型删除成功');
            loadModels(); // 重新加载列表
            if (onModelDeleted) {
                onModelDeleted();
            }
        } catch (error) {
            console.error('删除模型失败:', error);
            toast.error('删除模型失败');
        }
    };
    // 使能/取消推理
    const handleInferModel = (model) => {
        const requests = async () => {
            if ((currentInferModel && 1 == currentInferModel.iEnable && currentInferModel.sModel == model)) {
                setCurrentInferModel(currentInferModel => ({ ...currentInferModel, iEnable: 1 - currentInferModel.iEnable }))
            } else { return }
            const response = await InferenceAPI.setInferenceConfig(currentInferModel);
            if (response.status == 200) {
                console.log("model config success!")
            }
        }
        requests();
        getCurrentModel();

    }

    // 打开配置对话框
    const handleConfigModel = (model) => {
        setSelectedModel(model);
        setShowConfigDialog(true);
    };

    // 配置保存成功后的回调
    const handleConfigSaved = () => {
        setShowConfigDialog(false);
        setSelectedModel(null);
        loadModels(); // 重新加载列表
    };

    if (loading) {
        return (
            <div className="content-card">
                <div className="card-header">
                    <h3>模型管理</h3>
                </div>
                <div className="card-body">
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        加载中...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="content-card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Box size={20} color="#3b82f6" />
                        <div>
                            <h3>模型管理</h3>
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                fontWeight: 'normal'
                            }}>
                                共 {models.length} 个模型
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUploadDialog(true)}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            fontSize: '14px'
                        }}
                    >
                        <Upload size={18} />
                        上传模型
                    </button>
                </div>
                <div className="card-body">
                    {models.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <AlertCircle size={48} style={{ opacity: 0.5 }} />
                            <p>暂无模型</p>
                        </div>
                    ) : (
                        <div className="data-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>模型文件</th>
                                        <th>模型名称</th>
                                        <th>框架</th>
                                        <th>算法</th>
                                        <th>类型</th>
                                        <th>版本</th>
                                        <th>大小</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: '600' }}>{item.model}</td>
                                            <td>{item.modelInfo?.name || '-'}</td>
                                            <td>
                                                {item.modelInfo?.framework && (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        background: item.modelInfo.framework === 'rknn' ? '#e0f2fe' : '#fce7f3',
                                                        color: item.modelInfo.framework === 'rknn' ? '#0369a1' : '#9f1239'
                                                    }}>
                                                        {item.modelInfo.framework.toUpperCase()}
                                                    </span>
                                                )}
                                            </td>
                                            <td>{item.modelInfo?.algorithm || '-'}</td>
                                            <td>{item.modelInfo?.category || '-'}</td>
                                            <td>{item.modelInfo?.version || '-'}</td>
                                            <td>{item.modelInfo?.size ? `${item.modelInfo.size}KB` : '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleConfigModel(item)}
                                                        className="btn-small"
                                                        title="配置模型信息"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <Settings size={14} />
                                                        配置
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteModel(item.model)}
                                                        className="btn-small btn-danger"
                                                        title="删除模型"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        删除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 模型配置对话框 */}
            {showConfigDialog && selectedModel && (
                <ModelConfig
                    model={selectedModel}
                    onClose={() => {
                        setShowConfigDialog(false);
                        setSelectedModel(null);
                    }}
                    onSaved={handleConfigSaved}
                />
            )}

            {/* 模型上传对话框 */}
            {showUploadDialog && (
                <ModelUpload
                    onClose={() => setShowUploadDialog(false)}
                    onUploadSuccess={() => {
                        setShowUploadDialog(false);
                        loadModels();
                        if (onModelDeleted) {
                            onModelDeleted();
                        }
                    }}
                />
            )}
        </>
    );
}

