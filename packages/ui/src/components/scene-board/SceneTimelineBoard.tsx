import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface SceneTimelineBoardProps {
  selectedSubplotId: string | null;
}

export function SceneTimelineBoard({ selectedSubplotId }: SceneTimelineBoardProps) {
  const { project, activeSceneId, setActiveSceneId, upsertScene } = useProject();

  const scenes = project.scenes.filter(
    (s) => !selectedSubplotId || s.subplotIds.includes(selectedSubplotId)
  );

  const missingDatesCount = scenes.filter((s) => !s.sceneStart?.trim()).length;

  const overlaps: string[] = [];
  for (let i = 1; i < scenes.length; i++) {
    const prev = scenes[i - 1].sceneStart?.trim();
    const curr = scenes[i].sceneStart?.trim();
    if (prev && curr && curr < prev) {
      overlaps.push(
        `Cena #${scenes[i].chapterNumber} (${curr}) ocorre antes da Cena #${scenes[i - 1].chapterNumber} (${prev})`
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          <Clock size={15} color="var(--accent-primary)" /> Auditoria Cronológica das Cenas
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {missingDatesCount === 0 && overlaps.length === 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--success)', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Cronologia íntegra
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontWeight: 600 }}>
              <AlertTriangle size={14} />
              {missingDatesCount > 0 && `${missingDatesCount} cena(s) sem data inicial`}
              {missingDatesCount > 0 && overlaps.length > 0 && ' • '}
              {overlaps.length > 0 && `${overlaps.length} inversão(ões) temporal(is)`}
            </span>
          )}
        </div>
      </div>

      {overlaps.length > 0 && (
        <div style={alertBannerStyle}>
          {overlaps.map((msg, i) => (
            <div key={i}>• {msg}</div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scenes.map((scene) => {
          const isSelected = scene.id === activeSceneId;
          const missingDate = !scene.sceneStart?.trim();
          return (
            <div
              key={scene.id}
              onClick={() => setActiveSceneId(scene.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(145px, 190px) minmax(125px, 160px)',
                gap: 12,
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    #{scene.chapterNumber} {scene.title}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ato {scene.act}</span>
                  {missingDate && (
                    <span style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 600 }}>• Data ausente</span>
                  )}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{scene.summary}</p>
              </div>

              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Início (ISO / Data)</label>
                <input
                  type="text"
                  placeholder="Ex.: 2026-05-01T08:00"
                  value={scene.sceneStart ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => upsertScene({ ...scene, sceneStart: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Duração</label>
                <input
                  type="text"
                  placeholder="Ex.: PT2H, 3 dias"
                  value={scene.sceneDuration ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => upsertScene({ ...scene, sceneDuration: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
  padding: '8px 14px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--card-shadow)',
};
const alertBannerStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.35)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 11.5,
  color: 'var(--danger)',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  color: 'var(--text-muted)',
  marginBottom: 3,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-canvas)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '5px 8px',
  fontSize: 11.5,
  color: 'var(--text-primary)',
};
