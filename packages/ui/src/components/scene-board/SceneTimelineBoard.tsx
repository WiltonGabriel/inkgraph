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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: '8px 14px',
          backgroundColor: '#111622',
          border: '1px solid #242f44',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#f1f5f9' }}>
          <Clock size={15} color="#6366f1" /> Auditoria Cronológica das Cenas
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {missingDatesCount === 0 && overlaps.length === 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#10b981', fontWeight: 600 }}>
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
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 6,
            fontSize: 11.5,
            color: '#fca5a5',
          }}
        >
          {overlaps.map((msg, i) => (
            <div key={i}>• {msg}</div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scenes.map((scene) => {
          const isSelected = scene.id === activeSceneId;
          const missingDate = !scene.sceneStart?.trim();
          return (
            <div
              key={scene.id}
              onClick={() => setActiveSceneId(scene.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 190px 160px',
                gap: 12,
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: isSelected ? '#182030' : '#111622',
                border: `1px solid ${isSelected ? '#6366f1' : '#242f44'}`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    #{scene.chapterNumber} {scene.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Ato {scene.act}</span>
                  {missingDate && (
                    <span style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 600 }}>• Data ausente</span>
                  )}
                </div>
                <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{scene.summary}</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: '#94a3b8', marginBottom: 3 }}>
                  Início (ISO / Data)
                </label>
                <input
                  type="text"
                  placeholder="Ex.: 2026-05-01T08:00"
                  value={scene.sceneStart ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => upsertScene({ ...scene, sceneStart: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: '#94a3b8', marginBottom: 3 }}>
                  Duração
                </label>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0a0d14',
  border: '1px solid #242f44',
  borderRadius: 5,
  padding: '5px 8px',
  fontSize: 11.5,
  color: '#f1f5f9',
};
