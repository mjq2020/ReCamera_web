import React, { useState } from 'react';
import './PageStyles.css';

const RecordSettings = () => {
  const [autoRecord, setAutoRecord] = useState(false);
  const [recordMode, setRecordMode] = useState('continuous');

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>录制设置</h2>
        <p className="page-description">配置视频录制参数和存储选项</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>录制模式</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={autoRecord}
                onChange={(e) => setAutoRecord(e.target.checked)}
              />
              <span>启用自动录制</span>
            </label>
          </div>

          <div className="form-group">
            <label>录制模式</label>
            <select 
              className="select-input"
              value={recordMode}
              onChange={(e) => setRecordMode(e.target.value)}
            >
              <option value="continuous">连续录制</option>
              <option value="schedule">定时录制</option>
              <option value="motion">运动检测触发</option>
              <option value="ai">AI事件触发</option>
            </select>
          </div>

          {recordMode === 'schedule' && (
            <div className="schedule-section">
              <h4>定时录制计划</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>开始时间</label>
                  <input type="time" className="input-field" defaultValue="08:00" />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input type="time" className="input-field" defaultValue="18:00" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>存储设置</h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>存储路径</label>
              <input 
                type="text" 
                className="input-field" 
                defaultValue="/mnt/storage/recordings" 
              />
            </div>
            <div className="form-group">
              <label>文件分段（分钟）</label>
              <input type="number" className="input-field" defaultValue="10" />
            </div>
            <div className="form-group">
              <label>最大存储空间（GB）</label>
              <input type="number" className="input-field" defaultValue="500" />
            </div>
            <div className="form-group">
              <label>循环覆盖</label>
              <select className="select-input">
                <option>启用</option>
                <option>禁用</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>录制文件列表</h3>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>日期时间</th>
                <th>大小</th>
                <th>时长</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>record_20251010_120530.mp4</td>
                <td>2025-10-10 12:05:30</td>
                <td>1.2 GB</td>
                <td>00:10:00</td>
                <td>
                  <button className="btn-small">播放</button>
                  <button className="btn-small">下载</button>
                  <button className="btn-small btn-danger">删除</button>
                </td>
              </tr>
              <tr>
                <td>record_20251010_115520.mp4</td>
                <td>2025-10-10 11:55:20</td>
                <td>1.2 GB</td>
                <td>00:10:00</td>
                <td>
                  <button className="btn-small">播放</button>
                  <button className="btn-small">下载</button>
                  <button className="btn-small btn-danger">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary">保存设置</button>
        <button className="btn btn-secondary">重置</button>
      </div>
    </div>
  );
};

export default RecordSettings;

