import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { DeviceInfoAPI } from '../contexts/API';
import './Login.css';

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sUserName: '',
    sPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.sUserName || !formData.sPassword) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        sUserName: formData.sUserName,
        sPassword: formData.sPassword
      }
      const result = await DeviceInfoAPI.login(data);
      console.log(result)
      // 检查后端返回的 iStatus，0 表示成功
      if (result.data && result.data.iStatus == 0) {
        // 登录成功，更新前端登录状态
        login(formData.sUserName);
        // 使用路由跳转到主页
        navigate('/', { replace: true });
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      console.error('登录错误:', err);
      if (err.response && err.response.status === 401) {
        setError('用户名或密码错误');
      } else {
        setError('登录失败，请检查网络连接或联系管理员');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>reCameraV2 WEB系统</h1>
          <p>请登录以继续</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="sUserName">用户名</label>
            <input
              type="text"
              id="sUserName"
              name="sUserName"
              value={formData.sUserName}
              onChange={handleChange}
              placeholder="请输入用户名"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sPassword">密码</label>
            <input
              type="password"
              id="sPassword"
              name="sPassword"
              value={formData.sPassword}
              onChange={handleChange}
              placeholder="请输入密码"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <p className="copyright">© 2025 RC2Web System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

