import { useEffect, useState } from 'react';
import {
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { buildSidebarGroups } from './sidebarGroups';
import { SidebarNavItem } from './SidebarNavItem';

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    project,
    settings,
    toggleSidebarGroup,
    t,
  } = useProject();
  const [collapsed, setCollapsed] = useState(() => settings.sidebarDefaultCollapsed);

  useEffect(() => {
    setCollapsed(settings.sidebarDefaultCollapsed);
  }, [settings.sidebarDefaultCollapsed]);

  useEffect(() => {
    const onShortcut = (ev: Event) => {
      const custom = ev as CustomEvent<{ action?: string }>;
      if (custom.detail?.action === 'toggleSidebar') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('inkgraph:shortcut', onShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', onShortcut);
  }, []);

  const indicatorStyle = settings.sidebarIndicator ?? 'pill';
  const groups = buildSidebarGroups(t, project, settings.hiddenSidebarViews ?? []);

  return (
    <aside
      aria-label="Barra lateral principal"
      style={{
        width: collapsed ? 58 : 232,
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        borderRight: '1px solid var(--border-subtle, var(--border, #263046))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: settings.reducedMotion ? 'none' : 'width 0.15s ease',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          height: 46,
          padding: '0 12px',
          borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary, #3b82f6)',
                boxShadow: '0 0 8px var(--accent-soft, rgba(59, 130, 246, 0.35))',
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.05em',
                color: 'var(--text-primary, #f1f5f9)',
              }}
            >
              INKGRAPH
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '8px 6px' : '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: collapsed ? 8 : 6,
        }}
      >
        {groups.map((grp, grpIdx) => {
          const isGroupCollapsed = Boolean(settings.sidebarCollapsedGroups?.[grp.key]);
          const groupHasActive = grp.items.some((item) => item.id === activeView);

          return (
            <div key={grp.key}>
              {collapsed ? (
                grpIdx > 0 && (
                  <div
                    style={{
                      height: 1,
                      backgroundColor: 'var(--border-subtle, var(--border, #263046))',
                      margin: '0 6px 8px',
                    }}
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSidebarGroup(grp.key)}
                  aria-expanded={!isGroupCollapsed}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748b)',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{grp.label}</span>
                    {isGroupCollapsed && groupHasActive && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary, #3b82f6)',
                        }}
                      />
                    )}
                  </span>
                  {isGroupCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              )}

              {(collapsed || !isGroupCollapsed) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    marginTop: collapsed ? 0 : 2,
                  }}
                >
                  {grp.items.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      isActive={activeView === item.id}
                      collapsed={collapsed}
                      indicatorStyle={indicatorStyle}
                      onSelect={() => setActiveView(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: collapsed ? '8px 6px' : '8px',
          borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <SidebarNavItem
          item={{ id: 'settings', label: t.views.settings, icon: Settings }}
          isActive={activeView === 'settings'}
          collapsed={collapsed}
          indicatorStyle={indicatorStyle}
          onSelect={() => setActiveView('settings')}
        />
        <SidebarNavItem
          item={{ id: 'help', label: t.views.help, icon: HelpCircle }}
          isActive={activeView === 'help'}
          collapsed={collapsed}
          indicatorStyle={indicatorStyle}
          onSelect={() => setActiveView('help')}
        />
      </div>
    </aside>
  );
}
