import { useMemo } from 'react';
import { FolderKanban, FileText, Star, History, Server } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';

export function GlobalCatalogMetricsBar() {
  const { workspaces, settings, t } = useProject();

  const metrics = useMemo(() => {
    const activeCount = workspaces.filter((w) => !w.isArchived).length;
    const favoritesCount = workspaces.filter((w) => w.isFavorite).length;
    let totalWords = 0;
    let totalSnapshots = 0;

    for (const ws of workspaces) {
      totalSnapshots += ws.snapshots?.length ?? 0;
      for (const scene of ws.scenes ?? []) {
        totalWords += countWords(scene.content);
      }
    }

    return {
      activeCount,
      favoritesCount,
      totalWords,
      totalSnapshots,
    };
  }, [workspaces]);

  const statusText = settings.language === 'en' ? 'Active' : 'Ativo';

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: 18,
      }}
    >
      {/* Active Workspaces */}
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
            {t.home.globalSummaryWorkspaces}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f3f4f6' }}>
            {metrics.activeCount}
          </div>
        </div>
        <FolderKanban size={18} color="#60a5fa" />
      </div>

      {/* Total Catalog Words */}
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
            {t.home.globalSummaryWords}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f3f4f6' }}>
            {metrics.totalWords.toLocaleString(settings.language)}
          </div>
        </div>
        <FileText size={18} color="#10b981" />
      </div>

      {/* Favorites Count */}
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
            {t.common.favorites}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f3f4f6' }}>
            {metrics.favoritesCount}
          </div>
        </div>
        <Star size={18} color="#f59e0b" />
      </div>

      {/* Saved Snapshots */}
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
            {t.home.globalSummarySnapshots}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f3f4f6' }}>
            {metrics.totalSnapshots}
          </div>
        </div>
        <History size={18} color="#a855f7" />
      </div>

      {/* Local MCP Status */}
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
            {t.home.mcpStatusLabel}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#d1d5db',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
              }}
            />
            {statusText} · :{settings.mcpServerPort}
          </div>
        </div>
        <Server size={18} color="#06b6d4" />
      </div>
    </section>
  );
}
