import React from 'react';

/**
 * InfoItem - 单个信息项组件
 * @param {string} label - 标签文本
 * @param {string|number|React.ReactNode} value - 显示的值
 * @param {number} labelWidth - 标签最小宽度，默认110px
 */
export function InfoItem({ label, value, labelWidth = 110 }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            <label style={{
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                minWidth: `${labelWidth}px`,
                whiteSpace: 'nowrap',
                flexShrink: 0
            }}>
                {label}
            </label>
            <span style={{
                color: 'var(--text-secondary)',
                flex: 1,
                wordBreak: 'break-word'
            }}>
                {value ?? '-'}
            </span>
        </div>
    );
}

/**
 * InfoGrid - 信息网格容器组件
 * @param {React.ReactNode} children - 子元素（通常是 InfoItem 组件）
 * @param {number} minColWidth - 每列最小宽度，默认280px
 * @param {number} gap - 网格间距，默认16px
 */
export function InfoGrid({ children, minColWidth = 280, gap = 16 }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
            gap: `${gap}px`
        }}>
            {children}
        </div>
    );
}

/**
 * InfoSection - 完整的信息区块组件（包含标题和内容）
 * @param {string} title - 区块标题
 * @param {Array} items - 信息项数组 [{label, value}, ...]
 * @param {number} minColWidth - 每列最小宽度
 * @param {number} labelWidth - 标签宽度
 */
export function InfoSection({ title, items, minColWidth = 280, labelWidth = 110 }) {
    return (
        <div className="card" style={{ margin: 0 }}>
            {title && (
                <div className="card-header">
                    <h3>{title}</h3>
                </div>
            )}
            <div className="card-body">
                <InfoGrid minColWidth={minColWidth}>
                    {items.map((item, index) => (
                        <InfoItem
                            key={item.key || index}
                            label={item.label}
                            value={item.value}
                            labelWidth={labelWidth}
                        />
                    ))}
                </InfoGrid>
            </div>
        </div>
    );
}

export function InfoResource({ label, value }) {
    return (
        <div>
            {value !== undefined && (<div className="resource-item">
                <label>{label}</label>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${value}%`,
                            background: value >= 80 ? '#ee0a1dff' : '#0fe464ff'
                        }}
                    >
                        {value}%
                    </div>
                </div>
            </div>)}
        </div>
    )
};


export default { InfoItem, InfoGrid, InfoSection };

