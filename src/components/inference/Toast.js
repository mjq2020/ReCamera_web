import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast容器组件
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

// 单个Toast组件
const Toast = ({ type = 'info', message, duration = 3000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300); // 等待退出动画完成
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle size={20} />,
                    bgColor: '#10b981',
                    lightBg: '#d1fae5',
                    borderColor: '#6ee7b7'
                };
            case 'error':
                return {
                    icon: <AlertCircle size={20} />,
                    bgColor: '#ef4444',
                    lightBg: '#fee2e2',
                    borderColor: '#fca5a5'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={20} />,
                    bgColor: '#f59e0b',
                    lightBg: '#fef3c7',
                    borderColor: '#fde047'
                };
            default:
                return {
                    icon: <Info size={20} />,
                    bgColor: '#3b82f6',
                    lightBg: '#dbeafe',
                    borderColor: '#93c5fd'
                };
        }
    };

    const config = getConfig();

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: `2px solid ${config.borderColor}`,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '400px',
                animation: isExiting ? 'slideOut 0.3s ease-in-out' : 'slideIn 0.3s ease-in-out',
                transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
                opacity: isExiting ? 0 : 1,
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* 左侧彩色条 */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: config.bgColor
            }}></div>

            {/* 图标 */}
            <div style={{
                marginLeft: '8px',
                color: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
            }}>
                {config.icon}
            </div>

            {/* 消息文本 */}
            <div style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b',
                wordBreak: 'break-word',
                lineHeight: '1.5'
            }}>
                {message}
            </div>

            {/* 关闭按钮 */}
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(onClose, 300);
                }}
                style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                }}
            >
                <X size={16} />
            </button>

            {/* 进度条 */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: config.lightBg,
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    backgroundColor: config.bgColor,
                    animation: `progress ${duration}ms linear`,
                    transformOrigin: 'left'
                }}></div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                }

                @keyframes progress {
                    from {
                        transform: scaleX(1);
                    }
                    to {
                        transform: scaleX(0);
                    }
                }
            `}</style>
        </div>
    );
};

// 确认对话框组件
const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-in-out'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                minWidth: '350px',
                maxWidth: '400px',
                animation: 'slideInConfirm 0.3s ease-in-out'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}>
                            确认操作
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#64748b',
                            lineHeight: '1.6'
                        }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#d97706';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f59e0b';
                        }}
                    >
                        确定
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInConfirm {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

// Toast管理器
class ToastManager {
    constructor() {
        this.listeners = [];
        this.toasts = [];
        this.confirmDialog = null;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.toasts, this.confirmDialog));
    }

    show(type, message, duration = 3000) {
        const id = Date.now() + Math.random();
        this.toasts.push({ id, type, message, duration });
        this.notify();
    }

    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
    }

    confirm(message) {
        return new Promise((resolve) => {
            this.confirmDialog = {
                message,
                onConfirm: () => {
                    this.confirmDialog = null;
                    this.notify();
                    resolve(true);
                },
                onCancel: () => {
                    this.confirmDialog = null;
                    this.notify();
                    resolve(false);
                }
            };
            this.notify();
        });
    }

    success(message, duration) {
        this.show('success', message, duration);
    }

    error(message, duration) {
        this.show('error', message, duration);
    }

    warning(message, duration) {
        this.show('warning', message, duration);
    }

    info(message, duration) {
        this.show('info', message, duration);
    }
}

export const toast = new ToastManager();

// Toast Provider组件
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    useEffect(() => {
        const unsubscribe = toast.subscribe((newToasts, newConfirmDialog) => {
            setToasts([...newToasts]);
            setConfirmDialog(newConfirmDialog);
        });
        return unsubscribe;
    }, []);

    return (
        <>
            {children}
            <ToastContainer toasts={toasts} removeToast={(id) => toast.remove(id)} />
            {confirmDialog && <ConfirmDialog {...confirmDialog} />}
        </>
    );
};

export default toast;

