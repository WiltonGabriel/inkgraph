import { BookOpen, Network, FolderOpen, Clock, Play } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function LastWorkspaceBanner() {
  const { project, workspaces, sessionCursor, resumeLastSession, totalWordCount, switchWorkspace, settings, t } = useProject();

  const cursorWorkspace = sessionCursor
    ? workspaces.find((w) => w.id === sessionCursor.lastWorkspaceId)
    : undefined;
  const cursorScene = cursorWorkspace?.scenes.find((s) => s.id === sessionCursor?.lastSceneId);

  const goal = Math.max(1, project.wordCountGoal || 80000);
  const progressPct = Math.min(100, Math.round((totalWordCount / goal) * 100));
  const accent = project.accentColor || '#3b82f6';

  const lastScene =
    project.scenes.length > 0
      ? [...project.scenes].sort((a, b) =>
          (b.lastEditedAt || '').localeCompare(a.lastEditedAt || '')
        )[0]
      : null;

  return (
    <section
      style={{
        backgroundColor: '#121621',
        border: '1px solid #242b3d',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        padding: '18px 22px',
        marginBottom: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Workspace Identity & Logline */}
        <div style={{ flex: '1 1 420px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#60a5fa',
              }}
            >
              {t.home.activeSessionLabel}
            </span>
            {project.genre && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: '#1b2232',
                  color: '#d1d5db',
                  border: '1px solid #2b354b',
                }}
              >
                {project.genre}
              </span>
            )}
            {project.folderOrTag && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                {project.folderOrTag}
              </span>
            )}
          </div>

          <h2
            style={{
              margin: '0 0 4px',
              fontSize: 20,
              fontWeight: 700,
              color: '#f9fafb',
            }}
          >
            {project.title}
          </h2>

          {project.logline && (
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: '#9ca3af',
                lineHeight: 1.5,
                maxWidth: 740,
              }}
            >
              {project.logline}
            </p>
          )}
        </div>

        {/* Quiet Functional Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {cursorWorkspace && (
            <button
              type="button"
              onClick={resumeLastSession}
              style={{
                padding: '8px 14px',
                backgroundColor: '#10b981',
                color: '#062016',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={
                cursorScene
                  ? `${cursorScene.title} (${sessionCursor?.deviceName ?? ''})`
                  : cursorWorkspace.title
              }
            >
              <Play size={13} />
              {t.home.resumeSceneBtn}
              {cursorScene ? `: ${cursorScene.title}` : ''}
            </button>
          )}
          <button
            type="button"
            onClick={() => switchWorkspace(project.id, 'dashboard')}
            style={{
              padding: '8px 14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FolderOpen size={14} />
            {t.home.openWorkspaceBtn}
          </button>

          <button
            type="button"
            onClick={() => switchWorkspace(project.id, 'manuscript')}
            style={{
              padding: '8px 13px',
              backgroundColor: '#1a202e',
              color: '#e5e7eb',
              border: '1px solid #2e374d',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <BookOpen size={14} />
            {t.home.openLastSceneBtn}
          </button>

          <button
            type="button"
            onClick={() => switchWorkspace(project.id, 'graph')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#161b26',
              color: '#cbd5e1',
              border: '1px solid #262e40',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            title={t.views.graph}
          >
            <Network size={14} />
            {t.views.graph}
          </button>
        </div>
      </div>

      {/* Bottom Row: Word Progress Bar + Entity Counts + Last Edited Scene */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          paddingTop: 10,
          borderTop: '1px solid #1d2331',
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        {/* Word Count Progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 240,
            flex: '1 1 260px',
            maxWidth: 380,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#d1d5db', fontWeight: 600 }}>
                {totalWordCount.toLocaleString(settings.language)} /{' '}
                {goal.toLocaleString(settings.language)} {t.common.words}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div
              style={{
                height: 5,
                backgroundColor: '#1d2433',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>
        </div>

        {/* Counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span>
            <strong style={{ color: '#e5e7eb' }}>{project.scenes.length}</strong>{' '}
            {t.common.scenes}
          </span>
          <span>
            <strong style={{ color: '#e5e7eb' }}>{project.characters.length}</strong>{' '}
            {t.common.characters}
          </span>
          <span>
            <strong style={{ color: '#e5e7eb' }}>{project.factions.length}</strong>{' '}
            {t.common.factions}
          </span>
          <span>
            <strong style={{ color: '#e5e7eb' }}>{project.worlds.length}</strong>{' '}
            {t.common.worlds}
          </span>
        </div>

        {/* Last Edited Scene */}
        {lastScene && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: '#9ca3af',
            }}
          >
            <Clock size={12} color="#60a5fa" />
            <span>{lastScene.title}</span>
          </div>
        )}
      </div>
    </section>
  );
}
