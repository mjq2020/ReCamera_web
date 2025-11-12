import React, { useState } from 'react';
import './PageStyles.css';

const LiveView = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolution, setResolution] = useState('1920x1080');

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>实时画面</h2>
        <p className="page-description">查看摄像头实时视频流</p>
      </div>

      <div className="card">
        <div className="card-body">
          {/* 视频播放器区域 */}
          <div className="video-container">
            <div className="video-placeholder">
              {isPlaying ? '🎥 实时视频流' : '📷 点击播放按钮开始预览'}
            </div>
          </div>

          {/* 视频控制栏 */}
          <div className="video-controls">
            <button 
              className="btn btn-primary"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ 暂停' : '▶️ 播放'}
            </button>
            <button className="btn btn-secondary">📸 截图</button>
            <button className="btn btn-secondary">⏺️ 录制</button>
            
            <div className="control-group">
              <label>分辨率：</label>
              <select 
                value={resolution} 
                onChange={(e) => setResolution(e.target.value)}
                className="select-input"
              >
                <option value="3840x2160">4K (3840x2160)</option>
                <option value="1920x1080">1080P (1920x1080)</option>
                <option value="1280x720">720P (1280x720)</option>
                <option value="640x480">480P (640x480)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>视频参数</h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>帧率（FPS）</label>
              <input type="number" className="input-field" defaultValue="30" />
            </div>
            <div className="form-group">
              <label>比特率（Mbps）</label>
              <input type="number" className="input-field" defaultValue="8" />
            </div>
            <div className="form-group">
              <label>编码格式</label>
              <select className="select-input">
                <option>H.264</option>
                <option>H.265</option>
                <option>MJPEG</option>
              </select>
            </div>
            <div className="form-group">
              <label>图像质量</label>
              <select className="select-input">
                <option>高</option>
                <option>中</option>
                <option>低</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary">应用设置</button>
        </div>
      </div>
    </div>
  );
};

export default LiveView;

