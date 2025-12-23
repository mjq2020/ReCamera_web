import React, { useState, useRef, useEffect } from "react";
import "./OSDOverlay.css";

export default function OSDOverlay({ osdSettings, isOsdEditMode, onOsdUpdate, containerRef }) {
    const [draggingItem, setDraggingItem] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [editingItem, setEditingItem] = useState(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());

    // 实时更新时间
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 更新容器尺寸
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            const rect = containerRef?.current?.getBoundingClientRect();
            const newWidth = Math.round(rect?.width);
            const newHeight = Math.round(rect?.height);
            
            // 只在尺寸真正变化时更新，避免不必要的重新渲染
            setContainerSize(prev => {
                if (prev.width !== newWidth || prev.height !== newHeight) {
                    return { width: newWidth, height: newHeight };
                }
                return prev;
            });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        
        // 使用 ResizeObserver 监听容器大小变化
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateSize);
            resizeObserver.disconnect();
        };
    }, [containerRef]);

    // 添加全局鼠标事件监听（必须在所有hooks之后，return之前）
    useEffect(() => {
        if (draggingItem) {
            const handleGlobalMouseMove = (e) => {
                if (!osdSettings || !containerRef.current) return;

                const containerRect = containerRef.current.getBoundingClientRect();
                
                // 计算新的相对位置（0-1）
                const newX = (e.clientX - containerRect.left - dragOffset.x) / containerRect.width;
                const newY = (e.clientY - containerRect.top - dragOffset.y) / containerRect.height;

                // 限制在0-1范围内
                const clampedX = Math.max(0, Math.min(1, newX));
                const clampedY = Math.max(0, Math.min(1, newY));

                // 更新OSD设置
                const newSettings = {
                    ...osdSettings,
                    [draggingItem]: {
                        ...osdSettings[draggingItem],
                        iPositionX: parseFloat(clampedX.toFixed(3)),
                        iPositionY: parseFloat(clampedY.toFixed(3))
                    }
                };

                onOsdUpdate(newSettings);
            };

            const handleGlobalMouseUp = () => {
                setDraggingItem(null);
            };

            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [draggingItem, dragOffset, osdSettings, containerRef, onOsdUpdate]);

    if (!osdSettings || !containerSize.width) return null;

    const { attribute, channelNameOverlay, dateTimeOverlay, SNOverlay } = osdSettings;

    // 获取字体大小（像素）
    const getFontSize = () => {
        if (attribute?.iOSDFontSize === 0) {
            // 自适应：根据容器宽度计算
            return Math.max(16, Math.min(64, containerSize.width * 0.03));
        }
        return attribute?.iOSDFontSize;
    };

    const fontSize = getFontSize();
    const fontColor = `#${attribute?.sOSDFrontColor}`;

    // 格式化日期时间
    const formatDateTime = () => {
        const now = currentTime;
        let dateStr = '';
        let timeStr = '';

        // 日期格式
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        switch (dateTimeOverlay?.sDateStyle) {
            case 'CHR-YYYY-MM-DD':
                dateStr = `${year}-${month}-${day}`;
                break;
            case 'CHR-DD-MM-YYYY':
                dateStr = `${day}-${month}-${year}`;
                break;
            case 'CHR-MM-DD-YYYY':
                dateStr = `${month}-${day}-${year}`;
                break;
            case 'NUM-YYYY-MM-DD':
                dateStr = `${year}.${month}.${day}`;
                break;
            case 'NUM-DD-MM-YYYY':
                dateStr = `${day}.${month}.${year}`;
                break;
            case 'NUM-MM-DD-YYYY':
                dateStr = `${month}.${day}.${year}`;
                break;
            default:
                dateStr = `${year}-${month}-${day}`;
        }

        // 星期
        if (dateTimeOverlay?.iDisplayWeekEnabled === 1) {
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dateStr += ` ${weekDays[now.getDay()]}`;
        }

        // 时间格式
        const hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (dateTimeOverlay?.sTimeStyle === '12hour') {
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            timeStr = `${displayHours}:${minutes}:${seconds} ${period}`;
        } else {
            timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
        }

        return `${dateStr} ${timeStr}`;
    };

    // 处理鼠标按下事件
    const handleMouseDown = (e, overlayType) => {
        if (!isOsdEditMode) return;
        
        e.stopPropagation();
        e.preventDefault();

        const rect = e.currentTarget.getBoundingClientRect();

        setDraggingItem(overlayType);
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // 处理双击编辑
    const handleDoubleClick = (e, overlayType) => {
        if (!isOsdEditMode || overlayType !== 'channelNameOverlay') return;
        e.stopPropagation();
        setEditingItem(overlayType);
    };

    // 处理文本编辑
    const handleTextChange = (e) => {
        const newSettings = {
            ...osdSettings,
            channelNameOverlay: {
                ...osdSettings.channelNameOverlay,
                sChannelName: e.target.value
            }
        };
        onOsdUpdate(newSettings);
    };

    // 处理编辑完成
    const handleEditBlur = () => {
        setEditingItem(null);
    };

    // 获取文本阴影样式（增强可读性）
    const getTextShadow = () => {
        if (attribute?.sOSDFrontColorMode === 0) {
            // 黑白自动模式：使用对比色阴影
            return '1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.5)';
        }
        // 自定义模式：使用黑色阴影
        return '1px 1px 3px rgba(0, 0, 0, 0.9), 0 0 5px rgba(0, 0, 0, 0.5)';
    };

    const textStyle = {
        fontSize: `${fontSize}px`,
        color: fontColor,
        textShadow: getTextShadow(),
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        userSelect: 'none',
        whiteSpace: 'nowrap'
    };

    return (
        <>
            {/* 通道名称叠加 */}
            {channelNameOverlay?.iEnabled === 1 && (
                <div
                    className={`osd-overlay-item ${isOsdEditMode ? 'editable' : ''} ${draggingItem === 'channelNameOverlay' ? 'dragging' : ''}`}
                    style={{
                        ...textStyle,
                        left: `${channelNameOverlay?.iPositionX * 100}%`,
                        top: `${channelNameOverlay?.iPositionY * 100}%`,
                        cursor: isOsdEditMode ? 'move' : 'default'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'channelNameOverlay')}
                    onDoubleClick={(e) => handleDoubleClick(e, 'channelNameOverlay')}
                >
                    {editingItem === 'channelNameOverlay' ? (
                        <input
                            type="text"
                            className="osd-text-input"
                            value={channelNameOverlay?.sChannelName}
                            onChange={handleTextChange}
                            onBlur={handleEditBlur}
                            autoFocus
                            style={{
                                fontSize: `${fontSize}px`,
                                color: fontColor,
                                fontWeight: 'bold'
                            }}
                        />
                    ) : (
                        channelNameOverlay?.sChannelName
                    )}
                </div>
            )}

            {/* 日期时间叠加 */}
            {dateTimeOverlay?.iEnabled === 1 && (
                <div
                    className={`osd-overlay-item ${isOsdEditMode ? 'editable' : ''} ${draggingItem === 'dateTimeOverlay' ? 'dragging' : ''}`}
                    style={{
                        ...textStyle,
                        left: `${dateTimeOverlay?.iPositionX * 100}%`,
                        top: `${dateTimeOverlay?.iPositionY * 100}%`,
                        cursor: isOsdEditMode ? 'move' : 'default'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'dateTimeOverlay')}
                >
                    {formatDateTime()}
                </div>
            )}

            {/* 序列号叠加 */}
            {SNOverlay?.iEnabled === 1 && (
                <div
                    className={`osd-overlay-item ${isOsdEditMode ? 'editable' : ''} ${draggingItem === 'SNOverlay' ? 'dragging' : ''}`}
                    style={{
                        ...textStyle,
                        left: `${SNOverlay?.iPositionX * 100}%`,
                        top: `${SNOverlay?.iPositionY * 100}%`,
                        cursor: isOsdEditMode ? 'move' : 'default'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'SNOverlay')}
                >
                    SN: DEMO-12345678
                </div>
            )}
        </>
    );
}

