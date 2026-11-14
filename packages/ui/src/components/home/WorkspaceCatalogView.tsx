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

  const isEn = settings.language === 'en';

  const formatSceneCount = (count: number) =>
    `${count} ${count === 1 ? (isEn ? 'scene' : 'cena') : t.common.scenes}`;

  const formatCharacterCount = (count: number) =>
    `${count} ${count === 1 ? (isEn ? 'character' : 'personagem') : t.common.characters}`;

  const formatFactionCount = (count: number) =>
    `${count} ${count === 1 ? (isEn ? 'faction' : 'facção') : t.common.factions}`;

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

  if (items.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
          border: '1px solid var(--border-subtle, var(--border, #263046))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: 32,
          textAlign: 'center',
          color: 'var(--text-secondary, #94a3b8)',
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
          const accent = ws.accentColor || 'var(--accent-primary, #3b82f6)';

          return (
            <div
              key={ws.id}
              style={{
                backgroundColor: isCurrent
                  ? 'var(--bg-elevated, var(--bg-card, #171d2e))'
                  : 'var(--bg-surface, var(--bg-secondary, #111623))',
                border: isCurrent
                  ? '1px solid var(--accent-primary, #3b82f6)'
                  : '1px solid var(--border-subtle, var(--border, #263046))',
                borderLeft: `4px solid ${accent}`,
                borderRadius: 'var(--radius-md, 8px)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: 'var(--card-shadow, none)',
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
                    color: ws.isFavorite ? '#f59e0b' : 'var(--text-muted, #64748b)',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  <Star size={15} fill={ws.isFavorite ? '#f59e0b' : 'none'} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary, #f1f5f9)',
                      }}
                    >
                      {ws.title}
                    </span>
                    {ws.genre && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-hover, #1f273d)',
                          color: 'var(--text-secondary, #94a3b8)',
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
                          backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
                          color: 'var(--accent-primary, #3b82f6)',
                        }}
                      >
                        {ws.folderOrTag}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted, #64748b)',
                      marginTop: 2,
                    }}
                  >
                    {words.toLocaleString(settings.language)} {t.common.words} ·{' '}
                    {formatSceneCount(ws.scenes.length)} ·{' '}
                    {formatCharacterCount(ws.characters.length)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => switchWorkspace(ws.id)}
                  style={{
                    padding: '5px 11px',
                    backgroundColor: 'var(--accent-primary, #3b82f6)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm, 6px)',
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
                  style={iconActionBtnStyle}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSingle(ws)}
                  title={t.common.exportJson}
                  style={iconActionBtnStyle}
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleArchiveWorkspace(ws.id)}
                  title={ws.isArchived ? t.common.unarchive : t.common.archive}
                  style={iconActionBtnStyle}
                >
                  <Archive size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteWorkspace(ws.id)}
                  title={t.common.delete}
                  style={{ ...iconActionBtnStyle, color: '#ef4444' }}
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
        const accent = ws.accentColor || 'var(--accent-primary, #3b82f6)';
        const updatedDate = ws.updatedAt
          ? new Date(ws.updatedAt).toLocaleDateString(settings.language)
          : '';

        return (
          <div
            key={ws.id}
            style={{
              backgroundColor: isCurrent
                ? 'var(--bg-elevated, var(--bg-card, #171d2e))'
                : 'var(--bg-surface, var(--bg-secondary, #111623))',
              border: isCurrent
                ? '1px solid var(--accent-primary, #3b82f6)'
                : '1px solid var(--border-subtle, var(--border, #263046))',
              borderTop: `3px solid ${accent}`,
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              boxShadow: 'var(--card-shadow, none)',
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
                    color: 'var(--text-primary, #f1f5f9)',
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
                    color: ws.isFavorite ? '#f59e0b' : 'var(--text-muted, #64748b)',
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
                      backgroundColor: 'var(--bg-hover, #1f273d)',
                      color: 'var(--text-secondary, #94a3b8)',
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
                      backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
                      color: 'var(--accent-primary, #3b82f6)',
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
                    color: 'var(--text-secondary, #94a3b8)',
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
                    color: 'var(--text-secondary, #94a3b8)',
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
                    backgroundColor: 'var(--bg-hover, #1f273d)',
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
                  color: 'var(--text-muted, #64748b)',
                }}
              >
                <span>
                  {formatSceneCount(ws.scenes.length)} ·{' '}
                  {formatCharacterCount(ws.characters.length)} ·{' '}
                  {formatFactionCount(ws.factions.length)}
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
                borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
              }}
            >
              <button
                type="button"
                onClick={() => switchWorkspace(ws.id)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 6px)',
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
                  style={iconActionBtnStyle}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSingle(ws)}
                  title={t.common.exportJson}
                  style={iconActionBtnStyle}
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleArchiveWorkspace(ws.id)}
                  title={ws.isArchived ? t.common.unarchive : t.common.archive}
                  style={iconActionBtnStyle}
                >
                  <Archive size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteWorkspace(ws.id)}
                  title={t.common.delete}
                  style={{ ...iconActionBtnStyle, color: '#ef4444' }}
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

const iconActionBtnStyle: React.CSSProperties = {
  padding: 6,
  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  color: 'var(--text-secondary, #94a3b8)',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  borderRadius: 'var(--radius-sm, 6px)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
