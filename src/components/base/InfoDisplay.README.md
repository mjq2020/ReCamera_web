# InfoDisplay 组件使用说明

通用的信息展示组件，用于显示标签-值对格式的数据。

## 组件列表

### 1. InfoItem - 单个信息项

显示一个标签和对应的值。

**Props:**
- `label` (string, required): 标签文本
- `value` (string|number|ReactNode, optional): 显示的值，默认为 '-'
- `labelWidth` (number, optional): 标签最小宽度，默认 110px

**示例:**
```jsx
import { InfoItem } from '../base/InfoDisplay';

<InfoItem label="设备名称:" value={deviceName} />
<InfoItem label="IP地址:" value="192.168.1.100" />
<InfoItem label="端口号:" value={8080} labelWidth={120} />
```

---

### 2. InfoGrid - 信息网格容器

用于包裹多个 InfoItem，提供响应式网格布局。

**Props:**
- `children` (ReactNode, required): 子元素（通常是 InfoItem 组件）
- `minColWidth` (number, optional): 每列最小宽度，默认 280px
- `gap` (number, optional): 网格间距，默认 16px

**示例:**
```jsx
import { InfoGrid, InfoItem } from '../base/InfoDisplay';

<InfoGrid minColWidth={300} gap={20}>
    <InfoItem label="设备名称:" value={deviceName} />
    <InfoItem label="主板型号:" value={boardModel} />
    <InfoItem label="固件版本:" value={firmwareVersion} />
    <InfoItem label="序列号:" value={serialNumber} />
</InfoGrid>
```

---

### 3. InfoSection - 完整信息区块

包含标题和内容的完整信息卡片，接受数据数组自动渲染。

**Props:**
- `title` (string, optional): 区块标题
- `items` (Array, required): 信息项数组，格式: `[{key, label, value}, ...]`
  - `key` (string): 唯一标识（用于 React key）
  - `label` (string): 标签文本
  - `value` (any): 显示的值
- `minColWidth` (number, optional): 每列最小宽度，默认 280px
- `labelWidth` (number, optional): 标签宽度，默认 110px

**示例:**
```jsx
import { InfoSection } from '../base/InfoDisplay';

const deviceInfo = [
    { key: 'name', label: '设备名称:', value: deviceName },
    { key: 'model', label: '主板型号:', value: boardModel },
    { key: 'version', label: '固件版本:', value: firmwareVersion },
    { key: 'serial', label: '序列号:', value: serialNumber }
];

<InfoSection 
    title="设备基本信息" 
    items={deviceInfo}
    minColWidth={320}
    labelWidth={120}
/>
```

---

## 完整使用示例

### 示例 1: 基本用法（使用 InfoGrid + InfoItem）

```jsx
import React from 'react';
import { InfoGrid, InfoItem } from '../base/InfoDisplay';

function DeviceInfo({ device }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3>设备信息</h3>
            </div>
            <div className="card-body">
                <InfoGrid>
                    <InfoItem label="设备名称:" value={device?.name} />
                    <InfoItem label="IP地址:" value={device?.ip} />
                    <InfoItem label="端口:" value={device?.port} />
                    <InfoItem label="状态:" value={device?.status} />
                </InfoGrid>
            </div>
        </div>
    );
}
```

### 示例 2: 使用 InfoSection（推荐，更简洁）

```jsx
import React from 'react';
import { InfoSection } from '../base/InfoDisplay';

function DeviceInfo({ device }) {
    const deviceItems = [
        { key: 'name', label: '设备名称:', value: device?.name },
        { key: 'ip', label: 'IP地址:', value: device?.ip },
        { key: 'port', label: '端口:', value: device?.port },
        { key: 'status', label: '状态:', value: device?.status }
    ];

    return (
        <InfoSection 
            title="设备信息" 
            items={deviceItems} 
        />
    );
}
```

### 示例 3: 多个区块布局

```jsx
import React from 'react';
import { InfoSection } from '../base/InfoDisplay';

function SystemInfo({ system }) {
    const deviceItems = [
        { key: 'name', label: '设备名称:', value: system?.deviceName },
        { key: 'model', label: '主板型号:', value: system?.boardModel }
    ];

    const networkItems = [
        { key: 'ip', label: 'IP地址:', value: system?.ipAddress },
        { key: 'mac', label: 'MAC地址:', value: system?.macAddress }
    ];

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
            gap: '20px',
            padding: '10px'
        }}>
            <InfoSection title="设备信息" items={deviceItems} />
            <InfoSection title="网络信息" items={networkItems} />
        </div>
    );
}
```

---

## 样式说明

组件使用内联样式和 CSS 变量：
- `--text-tertiary`: 标签颜色
- `--text-secondary`: 值颜色

标签默认：
- 最小宽度: 110px
- 粗体显示
- 不换行
- 固定宽度（不会被压缩）

值默认：
- 自适应宽度
- 长文本自动换行

---

## 最佳实践

1. **使用 InfoSection 快速构建页面**：当你有简单的键值对数据时，使用 InfoSection 最简洁

2. **需要自定义布局时使用 InfoGrid + InfoItem**：当需要在 InfoItem 之间插入其他元素时

3. **设置合适的标签宽度**：
   - 中文短标签（如"端口:"）: 80-100px
   - 中文长标签（如"传感器型号:"）: 110-120px
   - 根据实际内容调整

4. **响应式设计**：
   - 网格容器会自动响应式布局
   - 默认 minColWidth=280px，可根据内容调整
   - 在大屏幕上自动多列，小屏幕上自动单列

---

## 迁移指南

### 从旧的 info-item 结构迁移

**旧代码：**
```jsx
<div className="info-grid">
    <div className="info-item">
        <label>设备名称:</label>
        <span>{deviceName || '-'}</span>
    </div>
    <div className="info-item">
        <label>IP地址:</label>
        <span>{ipAddress || '-'}</span>
    </div>
</div>
```

**新代码（方式1 - InfoGrid）：**
```jsx
<InfoGrid>
    <InfoItem label="设备名称:" value={deviceName} />
    <InfoItem label="IP地址:" value={ipAddress} />
</InfoGrid>
```

**新代码（方式2 - InfoSection，推荐）：**
```jsx
const items = [
    { key: 'name', label: '设备名称:', value: deviceName },
    { key: 'ip', label: 'IP地址:', value: ipAddress }
];

<InfoSection items={items} />
```

---

## 注意事项

1. `value` 为 `null` 或 `undefined` 时会自动显示 '-'
2. 组件使用 React 内联样式，确保样式不会被其他 CSS 覆盖
3. `key` 属性在 InfoSection 中用于 React 的列表渲染优化
4. 标签文本通常以冒号结尾，保持一致性

