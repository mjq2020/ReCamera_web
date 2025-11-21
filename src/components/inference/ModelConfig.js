import React, { useState, useEffect } from 'react';
import { InferenceAPI } from '../../contexts/API';
import { X, Save, Info } from 'lucide-react';
import { data } from 'autoprefixer';
import PostConfig from './AlgoPost';
import toast from './Toast';

export default function ModelConfig({ model, onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [supportAlgo, setSupportAlgo] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        framework: 'rknn',
        version: '',
        category: "Detection",
        algorithm: '',
        description: '',
        classes: [],
        metrics: {
            iou: 60,
            confidence: 60,
            topk: 100
        },
        author: '',
        size: 0,
        md5sum: ''
    });
    const [algoConfig, setalgoConfig] = useState({
        Detection: { iou: 60, confidence: 60, max_obj: 60 },
        Segmentation: { iou: 60, confidence: 60, max_obj: 60 },
        Classification: { confidence: 60, topk: 100 },
        Tracking: { iou: 60, confidence: 60, max_obj: 60, hight_thresh: 0.5, low_thresh: 0.1, match_thresh: 0.5 },
        OBB: { iou: 60, confidence: 60, max_obj: 60, angle_range: "le90" }
    })
    const [classInput, setClassInput] = useState('');
    const taskType = ["Detection", "Segmentation", "Classification", "Keypoint", "Tracking", "OBB"]

    useEffect(() => {
        setalgoConfig(algoConfig => ({ ...algoConfig, [formData.category]: { ...algoConfig[formData.category], ...formData.metrics } }))

    }, [])

    useEffect(() => {
        const getalgo = async () => {
            try {
                const response = await InferenceAPI.getAlgorithmSupport();
                if (response.status == 200) {
                    setSupportAlgo(response.data)
                    console.log(response.data)
                }
            } catch (err) {
                console.log(err);
            }
        };
        getalgo();

    }, [])

    // 加载模型信息
    useEffect(() => {
        const loadModelInfo = async () => {
            try {
                setLoading(true);
                if (model.modelInfo) {
                    // 如果已有模型信息，直接使用
                    setFormData({
                        name: model.model,
                        framework: 'rknn',
                        version: '',
                        category: "Detection",
                        algorithm: '',
                        description: '',
                        classes: [],
                        metrics: {
                            iou: 60,
                            confidence: 60,
                            topk: 100
                        },
                        author: '',
                        size: 0,
                        md5sum: '',
                        ...model.modelInfo,
                        metrics: model.modelInfo.metrics || { iou: 60, confidence: 60, topk: 100 }
                    });
                } else {
                    // 否则获取模型信息
                    try {
                        const response = await InferenceAPI.getModelInfo(model.model);
                        setFormData({
                            name: model.model,
                            framework: 'rknn',
                            version: '',
                            category: "Detection",
                            algorithm: '',
                            description: '',
                            classes: [],
                            metrics: {
                                iou: 60,
                                confidence: 60,
                                topk: 100
                            },
                            author: '',
                            size: 0,
                            md5sum: '',
                            ...response.data,
                            metrics: response.data.metrics || { iou: 60, confidence: 60, topk: 100 }
                        });
                    } catch (error) {
                        // 如果获取失败，使用默认值
                        console.log('模型信息不存在，使用默认值');
                        setFormData({
                            name: model.model,
                            framework: 'rknn',
                            version: '',
                            category: "Detection",
                            algorithm: '',
                            description: '',
                            classes: [],
                            metrics: {
                                iou: 60,
                                confidence: 60,
                                topk: 100
                            },
                            author: '',
                            size: 0,
                            md5sum: ''
                        });
                    }
                }
            } catch (error) {
                console.error('加载模型信息失败:', error);
                // 确保即使出错也设置默认值
                setFormData({
                    name: model.model,
                    framework: 'rknn',
                    version: '',
                    category: "Detection",
                    algorithm: '',
                    description: '',
                    classes: [],
                    metrics: {
                        iou: 60,
                        confidence: 60,
                        topk: 100
                    },
                    author: '',
                    size: 0,
                    md5sum: ''
                });
            } finally {
                setLoading(false);
            }
        };

        loadModelInfo();
    }, [model]);

    // 更新表单字段
    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            };
            // 如果改变的是 category，更新对应的 metrics
            if (field === 'category') {
                updated.metrics = algoConfig[value] || prev.metrics;
            }
            return updated;
        });
    };


    // 添加类别
    const handleAddClass = () => {
        const newClass = classInput.trim();
        if (newClass && !(formData.classes || []).includes(newClass)) {
            setFormData(prev => ({
                ...prev,
                classes: [...(prev.classes || []), newClass]
            }));
            setClassInput('');
        }
    };

    // 删除类别
    const handleRemoveClass = (index) => {
        setFormData(prev => ({
            ...prev,
            classes: (prev.classes || []).filter((_, i) => i !== index)
        }));
    };

    // 保存配置
    const handleSave = async () => {
        // 验证必填字段
        console.log(formData)
        if (!formData.name || !formData.algorithm || !formData.author) {
            toast.warning('请填写所有必填字段（模型名、算法、作者）');
            return;
        }

        try {
            setSaving(true);
            // 确保classes是数组
            const dataToSave = {
                ...formData,
                classes: formData.classes || []
            };
            await InferenceAPI.setModelInfo(model.model, dataToSave);
            toast.success('模型配置保存成功');
            onSaved();
        } catch (error) {
            console.error('保存模型配置失败:', error);
            toast.error('保存模型配置失败');
        } finally {
            setSaving(false);
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
                borderRadius: '12px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                {/* 对话框头部 */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Info size={24} color="#3b82f6" />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                                模型配置
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                {model.model}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#64748b'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 对话框内容 */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            加载中...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* 基本信息 */}
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                <div className="form-group">
                                    <label>模型名 <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="请输入模型名"
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label>框架</label>
                                    <select
                                        className="form-control"
                                        value={formData.framework}
                                        onChange={(e) => handleChange('framework', e.target.value)}
                                    >
                                        <option value="rknn">RKNN</option>
                                        <option value="rkllm">RKLLM</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>版本号</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.version}
                                        onChange={(e) => handleChange('version', e.target.value)}
                                        placeholder="例如: 1.0.0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>类型</label>
                                    <select
                                        className="form-control"
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        placeholder="例如: Object Detection"
                                    >
                                        {taskType?.map((item) => {
                                            return <option key={item} value={item}>{item}</option>
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>算法 <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        type="text"
                                        className="form-control"
                                        value={formData.algorithm}
                                        onChange={(e) => handleChange('algorithm', e.target.value)}
                                        placeholder="例如: YOLOV5"
                                    >
                                        <option value="">请选择算法</option>
                                        {supportAlgo && supportAlgo["l" + formData.category]?.map((item) => {
                                            return <option key={item} value={item}>{item}</option>
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>作者 <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.author}
                                        onChange={(e) => handleChange('author', e.target.value)}
                                        placeholder="请输入作者"
                                    />
                                </div>
                            </div>

                            {/* 描述 */}
                            <div className="form-group">
                                <label>描述</label>
                                <textarea
                                    className="form-control"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="请输入模型描述"
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* 类别 */}
                            <div className="form-group">
                                <label>检测类别</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={classInput}
                                        onChange={(e) => setClassInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                                        placeholder="输入类别名称，按回车添加"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        onClick={handleAddClass}
                                        className="btn btn-primary"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        添加
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {formData?.classes?.map((cls, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#e0f2fe',
                                                color: '#0369a1',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {cls}
                                            <button
                                                onClick={() => handleRemoveClass(index)}
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    padding: '0',
                                                    display: 'flex',
                                                    color: '#0369a1'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 评估指标 */}
                            <div>
                                <label style={{ marginBottom: '12px', display: 'block', fontWeight: '600' }}>
                                    后处理配置
                                </label>
                                <PostConfig formData={formData} setFormData={setFormData} setalgoConfig={setalgoConfig} algoConfig={algoConfig} />
                            </div>
                        </div>
                    )}
                </div>

                {/* 对话框底部 */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    backgroundColor: '#f8fafc'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={saving}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving || loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={16} />
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}

