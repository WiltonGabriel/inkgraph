import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  FileEdit,
  LayoutTemplate,
  ListTree,
  Kanban,
  FileText,
  Users,
  MessageSquare,
  Globe,
  Shield,
  Network,
  Package,
  Share2,
  ShieldAlert,
  Feather,
  Eye,
  TrendingUp,
  GitBranch,
  Download,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import type { ViewId } from '../../types/project';

interface NavGroup {
  label: string;
  items: { id: ViewId; label: string; icon: typeof LayoutDashboard; badge?: number }[];
}

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    project,
    settings,
    showMobileSidebar,
    setShowMobileSidebar,
    t,
  } = useProject();
  const { isMobile } = useViewport();
  const [collapsed, setCollapsed] = useState(() => settings.sidebarDefaultCollapsed);
  const aiActive = isAiGenerativeEnabled(settings.aiMode);

  if (isMobile && !showMobileSidebar) {
    return null;
  }

  const handleSelectView = (view: ViewId) => {
    setActiveView(view);
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const pendingProposals = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;

  const groups: NavGroup[] = [
    {
      label: t.sidebarGroups.writing,
      items: [
        { id: 'dashboard', label: t.views.dashboard, icon: LayoutDashboard },
        { id: 'manuscript', label: t.views.manuscript, icon: BookOpen, badge: project.scenes.length },
        { id: 'writer', label: t.views.writer, icon: aiActive ? Sparkles : FileEdit },
      ],
    },
    {
      label: t.sidebarGroups.planning,
      items: [
        { id: 'templates', label: t.views.templates, icon: LayoutTemplate },
        { id: 'outline', label: t.views.outline, icon: ListTree },
        { id: 'plotboard', label: t.views.plotboard, icon: Kanban },
        { id: 'scenario', label: t.views.scenario, icon: FileText },
      ],
    },
    {
      label: t.sidebarGroups.universe,
      items: [
        { id: 'characters', label: t.views.characters, icon: Users, badge: project.characters.length },
        { id: 'interviews', label: t.views.interviews, icon: MessageSquare },
        { id: 'factions', label: t.views.factions, icon: Shield, badge: project.factions.length },
        { id: 'worlds', label: t.views.worlds, icon: Globe },
        { id: 'graph', label: t.views.graph, icon: Network },
        { id: 'objects', label: t.views.objects, icon: Package, badge: project.objects.length },
        { id: 'mindmap', label: t.views.mindmap, icon: Share2 },
      ],
    },
    {
      label: t.sidebarGroups.review,
      items: [
        { id: 'consistency', label: t.views.consistency, icon: ShieldAlert },
        { id: 'critic', label: t.views.critic, icon: Feather },
        { id: 'preview', label: t.views.preview, icon: Eye },
        { id: 'progress', label: t.views.progress, icon: TrendingUp },
        { id: 'versions', label: t.views.versions, icon: GitBranch, badge: pendingProposals || undefined },
        { id: 'export', label: t.views.export, icon: Download },
      ],
    },
  ];

  const effectiveCollapsed = !isMobile && collapsed;

  const asideElement = (
    <aside
      aria-label="Barra lateral principal"
      style={{
        width: isMobile ? 270 : effectiveCollapsed ? 58 : 228,
        height: '100%',
        backgroundColor: '#0c0e14',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: settings.reducedMotion ? 'none' : 'width 0.15s ease',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Top Collapse Toggle & Brand */}
      <div
        style={{
          height: 46,
          padding: '0 12px',
          borderBottom: '1px solid #1b202c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: effectiveCollapsed ? 'center' : 'space-between',
        }}
      >
        {!effectiveCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: settings.accentColor || '#10b981',
                boxShadow: `0 0 8px ${settings.accentColor || '#10b981'}`,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.05em',
                color: '#f3f4f6',
              }}
            >
              INKGRAPH
            </span>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={() => setShowMobileSidebar(false)}
            aria-label={t.common.close}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 6 }}
          >
            <X size={17} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={effectiveCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {effectiveCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: effectiveCollapsed ? '8px 6px' : '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {groups.map((grp) => (
          <div key={grp.label}>
            {!effectiveCollapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#4b5563',
                  padding: '0 8px 4px',
                }}
              >
                {grp.label}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    title={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: effectiveCollapsed ? 'center' : 'space-between',
                      padding: effectiveCollapsed ? '9px 0' : '8px 10px',
                      minHeight: isMobile ? 42 : undefined,
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: isActive ? '#171f30' : 'transparent',
                      color: isActive ? '#60a5fa' : '#9ca3af',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Icon size={15} />
                      {!effectiveCollapsed && <span>{item.label}</span>}
                    </span>
                    {!effectiveCollapsed && item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 999,
                          backgroundColor: isActive ? 'rgba(59,130,246,0.2)' : '#161a24',
                          color: isActive ? '#93c5fd' : '#6b7280',
                          fontWeight: 600,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Secondary Nav */}
      <div
        style={{
          padding: effectiveCollapsed ? '8px 6px' : '8px',
          borderTop: '1px solid #1b202c',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <button
          onClick={() => handleSelectView('settings')}
          title={t.views.settings}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            gap: 9,
            padding: effectiveCollapsed ? '8px 0' : '8px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: activeView === 'settings' ? '#171f30' : 'transparent',
            color: activeView === 'settings' ? '#60a5fa' : '#9ca3af',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <Settings size={15} />
          {!effectiveCollapsed && <span>{t.views.settings}</span>}
        </button>
        <button
          onClick={() => handleSelectView('help')}
          title={t.views.help}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            gap: 9,
            padding: effectiveCollapsed ? '8px 0' : '8px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: activeView === 'help' ? '#171f30' : 'transparent',
            color: activeView === 'help' ? '#60a5fa' : '#9ca3af',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <HelpCircle size={15} />
          {!effectiveCollapsed && <span>{t.views.help}</span>}
        </button>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 190,
          backgroundColor: 'rgba(6, 8, 13, 0.72)',
          display: 'flex',
        }}
        onClick={() => setShowMobileSidebar(false)}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ height: '100%' }}>
          {asideElement}
        </div>
      </div>
    );
  }

  return asideElement;
}
