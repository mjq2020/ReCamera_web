# Terminal 组件更新说明

## 概述
Terminal.js 组件已经根据 demo/html/src/components/terminal/xterm/index.ts 的实现进行了全面改进，实现了完整的 ttyd 协议支持。

## 主要改进

### 1. 完整的 ttyd 协议实现

#### 命令定义
```javascript
const Command = {
  // 服务器端命令
  OUTPUT: '0',           // 输出数据
  SET_WINDOW_TITLE: '1', // 设置窗口标题
  SET_PREFERENCES: '2',  // 设置偏好设置
  
  // 客户端命令
  INPUT: '0',            // 输入数据
  RESIZE_TERMINAL: '1',  // 调整终端大小
  PAUSE: '2',            // 暂停
  RESUME: '3',           // 恢复
};
```

### 2. 二进制数据处理
- 使用 `TextEncoder` 和 `TextDecoder` 进行编码和解码
- 正确处理 ArrayBuffer 格式的消息
- 支持命令前缀的协议格式

### 3. 流量控制机制
```javascript
flowControl: {
  limit: 100000,    // 写入限制
  highWater: 10,    // 高水位标记
  lowWater: 5,      // 低水位标记
  written: 0,       // 已写入字节数
  pending: 0        // 待处理数量
}
```
- 当写入数据超过限制时，使用回调机制
- 自动发送 PAUSE 和 RESUME 命令控制数据流

### 4. 改进的消息处理
- **OUTPUT 命令**: 输出数据到终端（带流量控制）
- **SET_WINDOW_TITLE 命令**: 设置浏览器标题
- **SET_PREFERENCES 命令**: 接收并应用服务器偏好设置

### 5. 正确的 WebSocket 连接
- 使用 `['tty']` 子协议
- 正确的 URL: `ws://192.168.1.66:5556/ws`
- 发送标准的认证和尺寸信息：
```javascript
{
  AuthToken: token || '',
  columns: cols,
  rows: rows
}
```

### 6. 终端大小调整
- 使用 Command.RESIZE_TERMINAL 发送调整命令
- 格式：`'1' + JSON.stringify({ columns, rows })`
- 监听终端的 onResize 事件

### 7. 输入数据发送
- 支持字符串和 Uint8Array 两种格式
- 使用 `encodeInto` 优化编码性能
- 正确添加命令前缀 '0'

### 8. 改进的重连机制
- 检测正常关闭（code 1000）和异常关闭
- 支持自动重连（5秒延迟）
- 支持手动重连（按 Enter 键）
- 支持密码认证检测

### 9. 更好的清理机制
- 清理所有事件处理器
- 重置流量控制状态
- 正常关闭 WebSocket 连接（code 1000）

## 配置

### WebSocket 地址
```javascript
const TTYD_URL = 'ws://192.168.1.66:5556/ws';
```

### 终端选项
```javascript
{
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  scrollback: 1000,
  tabStopWidth: 4,
  bellStyle: 'none',
  convertEol: false,
  scrollOnUserInput: true,
  rightClickSelectsWord: true
}
```

## 特性

1. ✅ 完整的 ttyd 协议支持
2. ✅ 二进制数据处理
3. ✅ 流量控制
4. ✅ 自动重连
5. ✅ 密码认证支持
6. ✅ 终端大小自适应
7. ✅ 自动复制选中文本
8. ✅ Web 链接支持
9. ✅ 连接状态显示
10. ✅ 详细的日志输出

## 使用方法

```javascript
import XtermTtydClient from '../components/terminal_logs/Terminal';

function MyComponent() {
  return <XtermTtydClient />;
}
```

## 调试

所有日志都带有 `[ttyd]` 前缀，方便过滤：
- `[ttyd] Initializing terminal...` - 终端初始化
- `[ttyd] WebSocket connection opened` - 连接成功
- `[ttyd] Terminal resized: 80 x 24` - 终端大小调整
- `[ttyd] Window title set: bash` - 标题设置
- `[ttyd] WebSocket connection closed with code: 1000` - 连接关闭

## 与 demo 的对应关系

| demo/html/index.ts | Terminal.js | 说明 |
|-------------------|-------------|------|
| Command enum | Command object | 命令定义 |
| writeData() | writeData() | 带流量控制的写入 |
| sendData() | sendData() | 发送数据到服务器 |
| onSocketOpen() | socket.onopen | 连接打开处理 |
| onSocketData() | socket.onmessage | 消息处理 |
| onSocketClose() | socket.onclose | 连接关闭处理 |
| applyPreferences() | - | 偏好设置应用（简化） |

## 注意事项

1. 确保后端 ttyd 服务运行在 `ws://192.168.1.66:5556/ws`
2. 如果需要密码认证，会自动显示密码输入框
3. 选中文本会自动复制到剪贴板
4. 终端会自动适应窗口大小变化
5. 连接断开后可以手动或自动重连

## 后续优化建议

1. 添加 Canvas/WebGL 渲染器支持（性能优化）
2. 添加 Zmodem 文件传输支持
3. 添加更多终端配置选项
4. 添加终端主题切换功能
5. 添加命令历史记录功能



