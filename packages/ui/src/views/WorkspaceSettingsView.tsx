import { useState } from 'react';
import { SlidersHorizontal, BookOpen, Boxes, Puzzle, ShieldCheck } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { WorkspaceGeneralAndModelTab } from '../components/workspaceSettings/WorkspaceGeneralAndModelTab';
import { WorkspaceEntitiesTab } from '../components/workspaceSettings/WorkspaceEntitiesTab';
import { WorkspaceModulesAndPluginsTab } from '../components/workspaceSettings/WorkspaceModulesAndPluginsTab';
import { WorkspaceTemplatesAndCanonTab } from '../components/workspaceSettings/WorkspaceTemplatesAndCanonTab';
import { THEME_VAR } from '../components/settings/settingsStyles';

type WorkspaceTab = 'general' | 'entities' | 'modules' | 'templates';

const TABS: { id: WorkspaceTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'general', label: 'Geral & Modelo', icon: BookOpen },
  { id: 'entities', label: 'Entidades & Campos', icon: Boxes },
  { id: 'modules', label: 'Módulos & Plugins', icon: Puzzle },
  { id: 'templates', label: 'Cânone & Exportação', icon: ShieldCheck },
];

export function WorkspaceSettingsView() {
  const { project } = useProject();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('general');

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '1.5rem 2rem 3rem',
        background: THEME_VAR.bgCanvas,
      }}
    >
      <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.8rem',
            paddingBottom: '0.85rem',
            borderBottom: `1px solid ${THEME_VAR.borderSubtle}`,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: THEME_VAR.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                margin: 0,
              }}
            >
              <SlidersHorizontal size={20} style={{ color: THEME_VAR.accentPrimary }} />
              Configurações do Workspace
            </h1>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: THEME_VAR.textSecondary }}>
              Personalize estrutura de atos, objetos de lore, módulos visíveis e plugins exclusivos para{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>{project.title}</strong>.
            </p>
          </div>
        </header>

        <nav
          aria-label="Abas de configuração do workspace"
          style={{
            display: 'flex',
            gap: '0.45rem',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${THEME_VAR.borderSubtle}`,
            paddingBottom: '0.65rem',
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: THEME_VAR.radiusSm,
                  border: `1px solid ${isActive ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle}`,
                  background: isActive ? THEME_VAR.accentSoft : THEME_VAR.bgSurface,
                  color: isActive ? THEME_VAR.accentPrimary : THEME_VAR.textSecondary,
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'general' && <WorkspaceGeneralAndModelTab />}
        {activeTab === 'entities' && <WorkspaceEntitiesTab />}
        {activeTab === 'modules' && <WorkspaceModulesAndPluginsTab />}
        {activeTab === 'templates' && <WorkspaceTemplatesAndCanonTab />}
      </div>
    </div>
  );
}
