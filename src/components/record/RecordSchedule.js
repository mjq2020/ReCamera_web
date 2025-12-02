import React, { useState, useEffect, useCallback } from 'react';
import { RecordAPI } from '../../contexts/API';
import { toast } from '../base/Toast';
import './RecordPage.css';

const RecordSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState('add'); // 'add' or 'remove'

  const daysOfWeek = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' }
  ];

  // 生成时间段 (30分钟为单位)
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ hour, minute });
    }
  }

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await RecordAPI.getScheduleRuleConfig();
      setSchedules(response.data || []);
    } catch (error) {
      toast.error('获取日程配置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSaveSchedules = async () => {
    try {
      await RecordAPI.setScheduleRuleConfig(schedules);
      toast.success('日程配置保存成功');
    } catch (error) {
      toast.error('保存失败: ' + error.message);
    }
  };

  // 检查某个时间点是否在已有日程中
  const isTimeSlotActive = (day, hour, minute) => {
    return schedules.some(schedule => {
      if (schedule.dStart.iDay !== day || schedule.dEnd.iDay !== day) {
        return false;
      }

      const startMinutes = schedule.dStart.iHour * 60 + schedule.dStart.iMinute;
      const endMinutes = schedule.dEnd.iHour * 60 + schedule.dEnd.iMinute;
      const currentMinutes = hour * 60 + minute;

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  };

  // 切换时间段
  const toggleTimeSlot = (day, hour, minute) => {
    const isActive = isTimeSlotActive(day, hour, minute);

    if (isActive) {
      // 移除这个时间段
      removeTimeSlot(day, hour, minute);
    } else {
      // 添加这个时间段
      addTimeSlot(day, hour, minute);
    }
  };

  const addTimeSlot = (day, hour, minute) => {
    // 尝试合并到相邻的时间段
    const newSchedules = [...schedules];
    const currentMinutes = hour * 60 + minute;
    const endMinutes = currentMinutes + 30;

    // 查找是否可以与现有时间段合并
    let merged = false;
    for (let i = 0; i < newSchedules.length; i++) {
      const schedule = newSchedules[i];
      if (schedule.dStart.iDay !== day || schedule.dEnd.iDay !== day) continue;

      const schedStartMinutes = schedule.dStart.iHour * 60 + schedule.dStart.iMinute;
      const schedEndMinutes = schedule.dEnd.iHour * 60 + schedule.dEnd.iMinute;

      // 如果新时间段与现有时间段相邻
      if (schedEndMinutes === currentMinutes) {
        // 扩展现有时间段的结束时间
        newSchedules[i].dEnd = {
          iDay: day,
          iHour: Math.floor(endMinutes / 60),
          iMinute: endMinutes % 60,
          iSecond: 0
        };
        merged = true;
        break;
      } else if (schedStartMinutes === endMinutes) {
        // 扩展现有时间段的开始时间
        newSchedules[i].dStart = {
          iDay: day,
          iHour: hour,
          iMinute: minute,
          iSecond: 0
        };
        merged = true;
        break;
      }
    }

    if (!merged) {
      // 创建新的时间段
      newSchedules.push({
        dStart: {
          iDay: day,
          iHour: hour,
          iMinute: minute,
          iSecond: 0
        },
        dEnd: {
          iDay: day,
          iHour: Math.floor(endMinutes / 60),
          iMinute: endMinutes % 60,
          iSecond: 0
        }
      });
    }

    // 合并可能重叠的时间段
    setSchedules(mergeSchedules(newSchedules));
  };

  const removeTimeSlot = (day, hour, minute) => {
    const newSchedules = [];
    const currentMinutes = hour * 60 + minute;
    const endMinutes = currentMinutes + 30;

    schedules.forEach(schedule => {
      if (schedule.dStart.iDay !== day || schedule.dEnd.iDay !== day) {
        newSchedules.push(schedule);
        return;
      }

      const schedStartMinutes = schedule.dStart.iHour * 60 + schedule.dStart.iMinute;
      const schedEndMinutes = schedule.dEnd.iHour * 60 + schedule.dEnd.iMinute;

      // 如果当前时间段不在此日程中,保留原日程
      if (endMinutes <= schedStartMinutes || currentMinutes >= schedEndMinutes) {
        newSchedules.push(schedule);
        return;
      }

      // 如果移除的时间段在日程开始处
      if (currentMinutes === schedStartMinutes && endMinutes < schedEndMinutes) {
        newSchedules.push({
          ...schedule,
          dStart: {
            iDay: day,
            iHour: Math.floor(endMinutes / 60),
            iMinute: endMinutes % 60,
            iSecond: 0
          }
        });
      }
      // 如果移除的时间段在日程结束处
      else if (currentMinutes > schedStartMinutes && endMinutes === schedEndMinutes) {
        newSchedules.push({
          ...schedule,
          dEnd: {
            iDay: day,
            iHour: hour,
            iMinute: minute,
            iSecond: 0
          }
        });
      }
      // 如果移除的时间段在日程中间,需要分割成两段
      else if (currentMinutes > schedStartMinutes && endMinutes < schedEndMinutes) {
        newSchedules.push({
          dStart: schedule.dStart,
          dEnd: {
            iDay: day,
            iHour: hour,
            iMinute: minute,
            iSecond: 0
          }
        });
        newSchedules.push({
          dStart: {
            iDay: day,
            iHour: Math.floor(endMinutes / 60),
            iMinute: endMinutes % 60,
            iSecond: 0
          },
          dEnd: schedule.dEnd
        });
      }
    });

    setSchedules(newSchedules);
  };

  // 合并重叠的时间段
  const mergeSchedules = (schedules) => {
    const merged = [];
    const sorted = [...schedules].sort((a, b) => {
      if (a.dStart.iDay !== b.dStart.iDay) return a.dStart.iDay - b.dStart.iDay;
      const aMinutes = a.dStart.iHour * 60 + a.dStart.iMinute;
      const bMinutes = b.dStart.iHour * 60 + b.dStart.iMinute;
      return aMinutes - bMinutes;
    });

    let current = null;
    sorted.forEach(schedule => {
      if (!current) {
        current = { ...schedule };
        return;
      }

      const currentEndMinutes = current.dEnd.iHour * 60 + current.dEnd.iMinute;
      const schedStartMinutes = schedule.dStart.iHour * 60 + schedule.dStart.iMinute;
      const schedEndMinutes = schedule.dEnd.iHour * 60 + schedule.dEnd.iMinute;

      // 如果是同一天且时间段相邻或重叠
      if (current.dStart.iDay === schedule.dStart.iDay && schedStartMinutes <= currentEndMinutes) {
        // 合并时间段
        if (schedEndMinutes > currentEndMinutes) {
          current.dEnd = schedule.dEnd;
        }
      } else {
        merged.push(current);
        current = { ...schedule };
      }
    });

    if (current) {
      merged.push(current);
    }

    return merged;
  };

  const handleMouseDown = (day, hour, minute) => {
    setIsDragging(true);
    const isActive = isTimeSlotActive(day, hour, minute);
    setDragMode(isActive ? 'remove' : 'add');
    toggleTimeSlot(day, hour, minute);
  };

  const handleMouseEnter = (day, hour, minute, event) => {
    if (!isDragging) return;

    // 确保鼠标按钮仍然按下
    if (event.buttons !== 1) {
      setIsDragging(false);
      return;
    }

    const isActive = isTimeSlotActive(day, hour, minute);
    if (dragMode === 'add' && !isActive) {
      addTimeSlot(day, hour, minute);
    } else if (dragMode === 'remove' && isActive) {
      removeTimeSlot(day, hour, minute);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const clearSchedules = () => {
    toast.confirm('确定要清空所有日程吗?').then(confirmed => {
      if (confirmed) {
        setSchedules([]);
      }
    });
  };

  const addQuickSchedule = (type) => {
    let newSchedules = [];

    if (type === 'workday') {
      // 工作日 9:00-18:00 (替换现有配置)
      for (let day = 1; day <= 5; day++) {
        newSchedules.push({
          dStart: { iDay: day, iHour: 9, iMinute: 0, iSecond: 0 },
          dEnd: { iDay: day, iHour: 18, iMinute: 0, iSecond: 0 }
        });
      }
    } else if (type === 'fulltime') {
      // 全天24小时 (替换现有配置)
      for (let day = 0; day < 7; day++) {
        newSchedules.push({
          dStart: { iDay: day, iHour: 0, iMinute: 0, iSecond: 0 },
          dEnd: { iDay: day, iHour: 23, iMinute: 59, iSecond: 59 }
        });
      }
    } else if (type === 'night') {
      // 夜间 18:00-06:00 (替换现有配置)
      for (let day = 0; day < 7; day++) {
        newSchedules.push({
          dStart: { iDay: day, iHour: 18, iMinute: 0, iSecond: 0 },
          dEnd: { iDay: day, iHour: 23, iMinute: 59, iSecond: 59 }
        });
        newSchedules.push({
          dStart: { iDay: day, iHour: 0, iMinute: 0, iSecond: 0 },
          dEnd: { iDay: day, iHour: 6, iMinute: 0, iSecond: 0 }
        });
      }
    }

    // 直接替换而不是合并
    setSchedules(newSchedules);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="record-schedule" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="card content-card">
        <div className="card-header">
          <h3>录制日程管理</h3>
          <div className="quick-actions">
            <button className="btn btn-small" onClick={() => addQuickSchedule('workday')}>
              工作日 (9-18点)
            </button>
            <button className="btn btn-small" onClick={() => addQuickSchedule('night')}>
              夜间 (18-06点)
            </button>
            <button className="btn btn-small" onClick={() => addQuickSchedule('fulltime')}>
              全天24小时
            </button>
            <button className="btn btn-small btn-danger" onClick={clearSchedules}>
              清空
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="schedule-instructions">
            <p>💡 提示: 点击或拖动时间格来选择录制时间段,支持多段时间设置</p>
          </div>

          <div className="schedule-grid-container">
            {/* 时间轴表头 */}
            <div className="schedule-header">
              <div className="day-label"></div>
              <div className="time-axis">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="hour-label">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* 日程网格 */}
            <div className="schedule-grid">
              {daysOfWeek.map(day => (
                <div key={day.value} className="schedule-row">
                  <div className="day-label">{day.label}</div>
                  <div className="time-slots">
                    {timeSlots.map((slot, index) => {
                      const isActive = isTimeSlotActive(day.value, slot.hour, slot.minute);
                      const isHourStart = slot.minute === 0;
                      return (
                        <div
                          key={index}
                          className={`time-slot ${isActive ? 'active' : ''} ${isHourStart ? 'hour-start' : ''}`}
                          onMouseDown={() => handleMouseDown(day.value, slot.hour, slot.minute)}
                          onMouseEnter={(e) => handleMouseEnter(day.value, slot.hour, slot.minute, e)}
                          onMouseMove={(e) => handleMouseEnter(day.value, slot.hour, slot.minute, e)}
                          title={`${day.label} ${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={handleSaveSchedules}>
              保存日程配置
            </button>
            <button className="btn btn-secondary" onClick={fetchSchedules}>
              重新加载
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordSchedule;

