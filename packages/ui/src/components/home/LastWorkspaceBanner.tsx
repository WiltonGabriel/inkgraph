import { BookOpen, Network, FolderOpen, Clock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function LastWorkspaceBanner() {
  const { project, totalWordCount, switchWorkspace, settings, t } = useProject();

  const goal = Math.max(1, project.wordCountGoal || 80000);
  const progressPct = Math.min(100, Math.round((totalWordCount / goal) * 100));
  const accent =
    project.accentColor && project.accentColor !== '#3b82f6'
      ? project.accentColor
      : 'var(--accent-primary, #3b82f6)';

  const lastScene =
    project.scenes.length > 0
      ? [...project.scenes].sort((a, b) =>
          (b.lastEditedAt || '').localeCompare(a.lastEditedAt || '')
        )[0]
      : null;

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface, #111623)',
        border: '1px solid var(--border-subtle, #263046)',
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
                color: 'var(--accent-primary, #3b82f6)',
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
                  backgroundColor: 'var(--bg-elevated, #171d2e)',
                  color: 'var(--text-secondary, #94a3b8)',
                  border: '1px solid var(--border-subtle, #263046)',
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
                  backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
                  color: 'var(--accent-primary, #3b82f6)',
                  border: '1px solid color-mix(in srgb, var(--accent-primary, #3b82f6) 35%, transparent)',
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
              color: 'var(--text-primary, #f1f5f9)',
            }}
          >
            {project.title}
          </h2>

          {project.logline && (
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: 'var(--text-secondary, #94a3b8)',
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
          <button
            type="button"
            onClick={() => switchWorkspace(project.id, 'dashboard')}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--accent-primary, #3b82f6)',
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
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              color: 'var(--text-primary, #f1f5f9)',
              border: '1px solid var(--border-subtle, #263046)',
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
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              color: 'var(--text-primary, #f1f5f9)',
              border: '1px solid var(--border-subtle, #263046)',
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
          borderTop: '1px solid var(--border-subtle, #263046)',
          fontSize: 12,
          color: 'var(--text-secondary, #94a3b8)',
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
              <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 600 }}>
                {totalWordCount.toLocaleString(settings.language)} /{' '}
                {goal.toLocaleString(settings.language)} {t.common.words}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div
              style={{
                height: 5,
                backgroundColor: 'var(--bg-hover, #1f273d)',
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
            <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{project.scenes.length}</strong>{' '}
            {t.common.scenes}
          </span>
          <span>
            <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{project.characters.length}</strong>{' '}
            {t.common.characters}
          </span>
          <span>
            <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{project.factions.length}</strong>{' '}
            {t.common.factions}
          </span>
          <span>
            <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{project.worlds.length}</strong>{' '}
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
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            <Clock size={12} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
            <span>{lastScene.title}</span>
          </div>
        )}
      </div>
    </section>
  );
}
