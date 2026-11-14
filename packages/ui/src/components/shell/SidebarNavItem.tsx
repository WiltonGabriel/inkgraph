import type { CSSProperties } from 'react';
import type { SidebarIndicatorStyle } from '../../types/project';
import type { SidebarNavItemData } from './sidebarGroups';

interface SidebarNavItemProps {
  item: SidebarNavItemData;
  isActive: boolean;
  collapsed: boolean;
  indicatorStyle: SidebarIndicatorStyle;
  onSelect: () => void;
}

function getIndicatorStyle(
  isActive: boolean,
  indicator: SidebarIndicatorStyle,
  collapsed: boolean
): CSSProperties {
  if (!isActive) {
    return {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary, #94a3b8)',
      borderLeft: indicator === 'bar' && !collapsed ? '3px solid transparent' : 'none',
    };
  }

  if (indicator === 'bar') {
    return {
      backgroundColor: 'var(--bg-hover, #1f273d)',
      color: 'var(--text-primary, #f1f5f9)',
      borderLeft: collapsed ? 'none' : '3px solid var(--accent-primary, #3b82f6)',
      boxShadow: collapsed ? 'inset 3px 0 0 var(--accent-primary, #3b82f6)' : undefined,
    };
  }

  if (indicator === 'dot') {
    return {
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #f1f5f9)',
      borderLeft: 'none',
    };
  }

  return {
    backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
    color: 'var(--accent-primary, #3b82f6)',
    borderLeft: 'none',
  };
}

export function SidebarNavItem({
  item,
  isActive,
  collapsed,
  indicatorStyle,
  onSelect,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const indStyle = getIndicatorStyle(isActive, indicatorStyle, collapsed);

  return (
    <button
      type="button"
      onClick={onSelect}
      title={item.label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '9px 0' : '7px 10px',
        border: 'none',
        borderRadius:
          indicatorStyle === 'bar' && !collapsed
            ? '0 var(--radius-sm, 6px) var(--radius-sm, 6px) 0'
            : 'var(--radius-sm, 6px)',
        fontWeight: isActive ? 600 : 400,
        fontSize: 12.5,
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        ...indStyle,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <Icon
          size={15}
          style={{
            flexShrink: 0,
            color: isActive ? 'var(--accent-primary, #3b82f6)' : undefined,
          }}
        />
        {!collapsed && (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </span>
        )}
      </span>

      {!collapsed && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {isActive && indicatorStyle === 'dot' && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary, #3b82f6)',
              }}
            />
          )}
          {item.badge !== undefined && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 999,
                backgroundColor: isActive
                  ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                  : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                color: isActive
                  ? 'var(--accent-primary, #3b82f6)'
                  : 'var(--text-muted, #64748b)',
                fontWeight: 600,
              }}
            >
              {item.badge}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
