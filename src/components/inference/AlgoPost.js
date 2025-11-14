import { React, useEffect, useState } from "react";

export default function PostConfig({ formData, setFormData,setalgoConfig,algoConfig}) {




    // 更新metrics字段
    const handleMetricsChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            metrics: {
                ...prev.metrics,
                [field]: parseInt(value) || 0
            }
        }));
        setalgoConfig(algoConfig => ({ ...algoConfig, [formData.category]: formData.metrics }));

    };

    switch (formData.category) {

        case "Detection":
            return (
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                        <label>IOU</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Detection.iou}
                            onChange={(e) => handleMetricsChange('iou', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confidence</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Detection.confidence}
                            onChange={(e) => handleMetricsChange('confidence', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>max_obj</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Detection.max_obj}
                            onChange={(e) => handleMetricsChange('max_obj', e.target.value)}
                            min="1"
                        />
                    </div>
                </div>
            )
        case "Segmentation":
            return (
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                        <label>IOU</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Segmentation.iou}
                            onChange={(e) => handleMetricsChange('iou', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confidence</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Segmentation.confidence}
                            onChange={(e) => handleMetricsChange('confidence', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>max_obj</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Segmentation.max_obj}
                            onChange={(e) => handleMetricsChange('max_obj', e.target.value)}
                            min="1"
                        />
                    </div>
                </div>
            )

        case "Classification":
            return (
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                        <label>Confidence</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Classification.confidence}
                            onChange={(e) => handleMetricsChange('confidence', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Top K</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Classification.topk}
                            onChange={(e) => handleMetricsChange('topk', e.target.value)}
                            min="1"
                        />
                    </div>
                </div>
            )
        case "OBB":
            return (<div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                    <label>IOU</label>
                    <input
                        type="number"
                        className="form-control"
                        value={algoConfig.OBB.iou}
                        onChange={(e) => handleMetricsChange('iou', e.target.value)}
                        min="0"
                        max="100"
                    />
                </div>

                <div className="form-group">
                    <label>Confidence</label>
                    <input
                        type="number"
                        className="form-control"
                        value={algoConfig.OBB.confidence}
                        onChange={(e) => handleMetricsChange('confidence', e.target.value)}
                        min="0"
                        max="100"
                    />
                </div>

                <div className="form-group">
                    <label>max_obj</label>
                    <input
                        type="number"
                        className="form-control"
                        value={algoConfig.OBB.max_obj}
                        onChange={(e) => handleMetricsChange('max_obj', e.target.value)}
                        min="1"
                    />
                </div>
                <div className="form-group">
                    <label>angle_range</label>
                    <input
                        type="number"
                        className="form-control"
                        value={algoConfig.OBB.angle_range}
                        onChange={(e) => handleMetricsChange('angle_range', e.target.value)}
                    />
                </div>
            </div>)

        case "Tracking":
            return (
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                        <label>IOU</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.iou}
                            onChange={(e) => handleMetricsChange('iou', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confidence</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.confidence}
                            onChange={(e) => handleMetricsChange('confidence', e.target.value)}
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>max_obj</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.max_obj}
                            onChange={(e) => handleMetricsChange('max_obj', e.target.value)}
                            min="1"
                        />
                    </div>
                                        <div className="form-group">
                        <label>hight_thresh</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.hight_thresh}
                            onChange={(e) => handleMetricsChange('hight_thresh', e.target.value)}
                            min="1"
                        />
                    </div>
                                        <div className="form-group">
                        <label>low_thresh</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.low_thresh}
                            onChange={(e) => handleMetricsChange('low_thresh', e.target.value)}
                            min="1"
                        />
                    </div>
                                        <div className="form-group">
                        <label>match_thresh</label>
                        <input
                            type="number"
                            className="form-control"
                            value={algoConfig.Tracking.match_thresh}
                            onChange={(e) => handleMetricsChange('match_thresh', e.target.value)}
                            min="1"
                        />
                    </div>
                </div>
            )


    }




};