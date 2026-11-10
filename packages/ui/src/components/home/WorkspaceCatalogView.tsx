import {
  Star,
  Copy,
  Download,
  Archive,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords, type ProjectData } from '../../types/project';
import type { WorkspaceViewMode } from './WorkspaceFilterBar';

interface WorkspaceCatalogViewProps {
  items: ProjectData[];
  viewMode: WorkspaceViewMode;
}

export function WorkspaceCatalogView({
  items,
  viewMode,
}: WorkspaceCatalogViewProps) {
  const {
    activeWorkspaceId,
    switchWorkspace,
    toggleFavoriteWorkspace,
    duplicateWorkspace,
    toggleArchiveWorkspace,
    deleteWorkspace,
    settings,
    t,
  } = useProject();

  const handleExportSingle = (ws: ProjectData) => {
    const blob = new Blob([JSON.stringify(ws, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ws.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (ws: ProjectData) => {
    if (settings.confirmDestructiveActions) {
      const msg =
        settings.language === 'en'
          ? `Delete workspace "${ws.title}"?`
          : `Excluir o workspace "${ws.title}"?`;
      if (!window.confirm(msg)) return;
    }
    deleteWorkspace(ws.id);
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#11151f',
          border: '1px solid #1e2433',
          borderRadius: 10,
          padding: 32,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        {t.home.noWorkspacesFound}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {items.map((ws) => {
          const words = ws.scenes.reduce((acc, s) => acc + countWords(s.content), 0);
          const isCurrent = ws.id === activeWorkspaceId;
          const accent = ws.accentColor || '#3b82f6';

          return (
            <div
              key={ws.id}
              style={{
                backgroundColor: isCurrent ? '#151b28' : '#11151f',
                border: isCurrent ? '1px solid #2e3b56' : '1px solid #1e2433',
                borderLeft: `4px solid ${accent}`,
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px' }}>
                <button
                  type="button"
                  onClick={() => toggleFavoriteWorkspace(ws.id)}
                  title={t.common.favorite}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: ws.isFavorite ? '#f59e0b' : '#4b5563',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  <Star size={15} fill={ws.isFavorite ? '#f59e0b' : 'none'} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f3f4f6' }}>
                      {ws.title}
                    </span>
                    {ws.genre && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: '#1b2232',
                          color: '#9ca3af',
                        }}
                      >
                        {ws.genre}
                      </span>
                    )}
                    {ws.folderOrTag && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#93c5fd',
                        }}
                      >
                        {ws.folderOrTag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                    {words.toLocaleString(settings.language)} {t.common.words} ·{' '}
                    {ws.scenes.length} {t.common.scenes} · {ws.characters.length}{' '}
                    {t.common.characters}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => switchWorkspace(ws.id)}
                  style={{
                    padding: '5px 11px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.home.openWorkspaceBtn}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateWorkspace(ws.id)}
                  title={t.common.duplicate}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSingle(ws)}
                  title={t.common.exportJson}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleArchiveWorkspace(ws.id)}
                  title={ws.isArchived ? t.common.unarchive : t.common.archive}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Archive size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ws)}
                  title={t.common.delete}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#f87171',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: 14,
      }}
    >
      {items.map((ws) => {
        const words = ws.scenes.reduce((acc, s) => acc + countWords(s.content), 0);
        const goal = Math.max(1, ws.wordCountGoal || 80000);
        const pct = Math.min(100, Math.round((words / goal) * 100));
        const isCurrent = ws.id === activeWorkspaceId;
        const accent = ws.accentColor || '#3b82f6';
        const updatedDate = ws.updatedAt
          ? new Date(ws.updatedAt).toLocaleDateString(settings.language)
          : '';

        return (
          <div
            key={ws.id}
            style={{
              backgroundColor: isCurrent ? '#151b28' : '#11151f',
              border: isCurrent ? '1px solid #31405e' : '1px solid #1e2433',
              borderTop: `3px solid ${accent}`,
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15.5,
                    fontWeight: 700,
                    color: '#f9fafb',
                  }}
                >
                  {ws.title}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleFavoriteWorkspace(ws.id)}
                  title={t.common.favorite}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: ws.isFavorite ? '#f59e0b' : '#4b5563',
                    padding: 2,
                  }}
                >
                  <Star size={15} fill={ws.isFavorite ? '#f59e0b' : 'none'} />
                </button>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {ws.genre && (
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '2px 7px',
                      borderRadius: 4,
                      backgroundColor: '#1b2232',
                      color: '#cbd5e1',
                    }}
                  >
                    {ws.genre}
                  </span>
                )}
                {ws.folderOrTag && (
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '2px 7px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#93c5fd',
                    }}
                  >
                    {ws.folderOrTag}
                  </span>
                )}
              </div>

              {/* Logline Preview */}
              {ws.logline && (
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: 12,
                    color: '#9ca3af',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ws.logline}
                </p>
              )}

              {/* Word Progress */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#9ca3af',
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {words.toLocaleString(settings.language)} {t.common.words}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div
                  style={{
                    height: 4,
                    backgroundColor: '#1c2333',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: accent,
                    }}
                  />
                </div>
              </div>

              {/* Entity Counts & Updated Date */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#6b7280',
                }}
              >
                <span>
                  {ws.scenes.length} {t.common.scenes} · {ws.characters.length}{' '}
                  {t.common.characters} · {ws.factions.length} {t.common.factions}
                </span>
                {updatedDate && <span>{updatedDate}</span>}
              </div>
            </div>

            {/* Quiet Card Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                paddingTop: 10,
                borderTop: '1px solid #1c2230',
              }}
            >
              <button
                type="button"
                onClick={() => switchWorkspace(ws.id)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FolderOpen size={13} />
                {t.home.openWorkspaceBtn}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => duplicateWorkspace(ws.id)}
                  title={t.common.duplicate}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSingle(ws)}
                  title={t.common.exportJson}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleArchiveWorkspace(ws.id)}
                  title={ws.isArchived ? t.common.unarchive : t.common.archive}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#9ca3af',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Archive size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ws)}
                  title={t.common.delete}
                  style={{
                    padding: 6,
                    backgroundColor: '#171c28',
                    color: '#f87171',
                    border: '1px solid #262e40',
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
