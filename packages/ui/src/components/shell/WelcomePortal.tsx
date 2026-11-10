import { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { MySpaceTopBar } from '../home/MySpaceTopBar';
import { GlobalCatalogMetricsBar } from '../home/GlobalCatalogMetricsBar';
import { LastWorkspaceBanner } from '../home/LastWorkspaceBanner';
import { QuickCreationBar } from '../home/QuickCreationBar';
import { GlobalWorkspaceSearch } from '../home/GlobalWorkspaceSearch';
import {
  WorkspaceFilterBar,
  type WorkspaceFilterTab,
  type WorkspaceViewMode,
} from '../home/WorkspaceFilterBar';
import { WorkspaceCatalogView } from '../home/WorkspaceCatalogView';
import { SettingsView } from '../../views/SettingsView';

export function HomeMySpaceView() {
  const { workspaces, t } = useProject();

  const [activeMode, setActiveMode] = useState<'catalog' | 'settings'>('catalog');
  const [filterTab, setFilterTab] = useState<WorkspaceFilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const ws of workspaces) {
      if (ws.folderOrTag?.trim()) set.add(ws.folderOrTag.trim());
      if (ws.genre?.trim()) set.add(ws.genre.trim());
    }
    return Array.from(set);
  }, [workspaces]);

  const filteredWorkspaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = workspaces.filter((ws) => {
      if (filterTab === 'archived') {
        if (!ws.isArchived) return false;
      } else {
        if (ws.isArchived) return false;
        if (filterTab === 'favorites' && !ws.isFavorite) return false;
      }

      if (
        selectedCategory !== 'all' &&
        ws.folderOrTag !== selectedCategory &&
        ws.genre !== selectedCategory
      ) {
        return false;
      }

      if (q) {
        const hay = `${ws.title} ${ws.genre ?? ''} ${ws.folderOrTag ?? ''} ${ws.logline ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filterTab === 'recent') {
      return [...filtered].sort((a, b) =>
        (b.lastOpenedAt || b.updatedAt || '').localeCompare(
          a.lastOpenedAt || a.updatedAt || ''
        )
      );
    }
    return filtered;
  }, [workspaces, filterTab, selectedCategory, searchQuery]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: '#090c12',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <MySpaceTopBar activeMode={activeMode} onToggleMode={setActiveMode} />

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px clamp(14px, 3vw, 28px) 40px',
          maxWidth: 1240,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {activeMode === 'settings' ? (
          <SettingsView />
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f3f4f6',
                }}
              >
                {t.home.title}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
                {t.home.subtitle}
              </p>
            </div>

            <GlobalCatalogMetricsBar />
            <GlobalWorkspaceSearch />
            <LastWorkspaceBanner />
            <QuickCreationBar />
            <WorkspaceFilterBar
              activeTab={filterTab}
              onTabChange={setFilterTab}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <WorkspaceCatalogView items={filteredWorkspaces} viewMode={viewMode} />
          </>
        )}
      </main>
    </div>
  );
}

export const WelcomePortal = HomeMySpaceView;
