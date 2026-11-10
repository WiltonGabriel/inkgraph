import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
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
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { ViewId } from '../../types/project';

interface NavGroup {
  label: string;
  items: { id: ViewId; label: string; icon: typeof LayoutDashboard; badge?: number }[];
}

export function Sidebar() {
  const { activeView, setActiveView, project } = useProject();
  const [collapsed, setCollapsed] = useState(false);

  const pendingProposals = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;

  const groups: NavGroup[] = [
    {
      label: 'Escrita',
      items: [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'manuscript', label: 'Manuscrito', icon: BookOpen, badge: project.scenes.length },
        { id: 'writer', label: 'Estúdio de Redação', icon: Sparkles },
      ],
    },
    {
      label: 'Planejamento',
      items: [
        { id: 'templates', label: 'Modelos', icon: LayoutTemplate },
        { id: 'outline', label: 'Gerador de Contorno', icon: ListTree },
        { id: 'plotboard', label: 'Quadro de Cenas', icon: Kanban },
        { id: 'scenario', label: 'Cenário / Roteiro', icon: FileText },
      ],
    },
    {
      label: 'Universo & Lore',
      items: [
        { id: 'characters', label: 'Personagens', icon: Users, badge: project.characters.length },
        { id: 'interviews', label: 'Entrevistas', icon: MessageSquare },
        { id: 'factions', label: 'Facções', icon: Shield, badge: project.factions.length },
        { id: 'worlds', label: 'Construção Mundial', icon: Globe },
        { id: 'graph', label: 'Grafo de Relações', icon: Network },
        { id: 'objects', label: 'Objetos de História', icon: Package, badge: project.objects.length },
        { id: 'mindmap', label: 'Mapas Mentais', icon: Share2 },
      ],
    },
    {
      label: 'Revisão & Saída',
      items: [
        { id: 'consistency', label: 'Consistência', icon: ShieldAlert },
        { id: 'critic', label: 'Crítico Literário', icon: Feather },
        { id: 'preview', label: 'Visualização do Livro', icon: Eye },
        { id: 'progress', label: 'Progresso', icon: TrendingUp },
        { id: 'versions', label: 'Versões & Staging', icon: GitBranch, badge: pendingProposals || undefined },
        { id: 'export', label: 'Exportar', icon: Download },
      ],
    },
  ];

  return (
    <aside
      aria-label="Barra lateral principal"
      style={{
        width: collapsed ? 58 : 228,
        backgroundColor: '#0c0e14',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.15s ease',
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
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
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
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
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
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '8px 6px' : '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {groups.map((grp) => (
          <div key={grp.label}>
            {!collapsed && (
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
                    onClick={() => setActiveView(item.id)}
                    title={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      padding: collapsed ? '9px 0' : '7px 10px',
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
                      {!collapsed && <span>{item.label}</span>}
                    </span>
                    {!collapsed && item.badge !== undefined && (
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
          padding: collapsed ? '8px 6px' : '8px',
          borderTop: '1px solid #1b202c',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <button
          onClick={() => setActiveView('settings')}
          title="Configurações"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 9,
            padding: collapsed ? '8px 0' : '7px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: activeView === 'settings' ? '#171f30' : 'transparent',
            color: activeView === 'settings' ? '#60a5fa' : '#9ca3af',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <Settings size={15} />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={() => setActiveView('help')}
          title="Ajuda"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 9,
            padding: collapsed ? '8px 0' : '7px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: activeView === 'help' ? '#171f30' : 'transparent',
            color: activeView === 'help' ? '#60a5fa' : '#9ca3af',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <HelpCircle size={15} />
          {!collapsed && <span>Ajuda</span>}
        </button>
      </div>
    </aside>
  );
}
