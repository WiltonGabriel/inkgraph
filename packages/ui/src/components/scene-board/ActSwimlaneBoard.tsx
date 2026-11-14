import { useState } from 'react';
import { Plus, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords, type Scene, type SceneStatus } from '../../types/project';

interface ActSwimlaneBoardProps {
  selectedSubplotId: string | null;
}

const ACTS: { act: 1 | 2 | 3; label: string }[] = [
  { act: 1, label: 'Ato 1 – Configuração' },
  { act: 2, label: 'Ato 2 – Conflito' },
  { act: 3, label: 'Ato 3 – Resolução' },
];

const STATUS_LABELS: Record<SceneStatus, string> = {
  outline: 'Esboço',
  draft: 'Rascunho',
  'first-draft': '1º Rascunho',
  revised: 'Revisado',
  final: 'Final',
};

export function ActSwimlaneBoard({ selectedSubplotId }: ActSwimlaneBoardProps) {
  const { project, settings, activeSceneId, setActiveSceneId, upsertScene } = useProject();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const reducedMotion = settings.reducedMotion || !settings.enableAnimations || settings.lowPowerMode;

  const toggleSceneSubplot = (scene: Scene, subplotId: string) => {
    const exists = scene.subplotIds.includes(subplotId);
    const nextIds = exists ? scene.subplotIds.filter((id) => id !== subplotId) : [...scene.subplotIds, subplotId];
    upsertScene({ ...scene, subplotIds: nextIds });
  };

  const handleAddScene = (act: 1 | 2 | 3) => {
    const nextNum = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      chapterNumber: nextNum,
      title: `Cena ${nextNum}`,
      summary: 'Resumo da nova cena...',
      content: '',
      act,
      status: 'outline',
      tension: 45,
      subplotIds: selectedSubplotId ? [selectedSubplotId] : [],
      characterIds: [],
      objectIds: [],
      secretsRevealed: [],
      notes: '',
      position: { x: 100 + (nextNum % 4) * 260, y: 100 + Math.floor(nextNum / 4) * 160 },
      comments: [],
      revisions: [],
      lastEditedAt: new Date().toISOString(),
    };
    upsertScene(newScene);
    setActiveSceneId(newScene.id);
  };

  return (
    <div style={boardGridStyle}>
      {ACTS.map(({ act, label }) => {
        const scenes = project.scenes.filter(
          (s) => s.act === act && (!selectedSubplotId || s.subplotIds.includes(selectedSubplotId))
        );
        return (
          <div key={act} style={columnStyle}>
            <div style={columnHeaderStyle}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {scenes.length === 1 ? '1 cena' : `${scenes.length} cenas`}
              </span>
            </div>

            <div style={columnBodyStyle}>
              {scenes.map((scene) => {
                const isSelected = scene.id === activeSceneId;
                const isHovered = hoveredId === scene.id;
                const pov = project.characters.find((c) => c.id === scene.povCharacterId);
                const words = countWords(scene.content);
                return (
                  <div
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    onMouseEnter={() => setHoveredId(scene.id)}
                    onMouseLeave={() => setHoveredId((p) => (p === scene.id ? null : p))}
                    style={{
                      padding: 12,
                      minWidth: 0,
                      width: '100%',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected
                        ? 'var(--bg-elevated)'
                        : isHovered
                        ? 'var(--bg-hover)'
                        : 'var(--bg-canvas)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                      overflowWrap: 'anywhere',
                      transition: reducedMotion ? 'none' : 'background-color 120ms ease, border-color 120ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', minWidth: 0 }}>
                        #{scene.chapterNumber} {scene.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {STATUS_LABELS[scene.status]}
                      </span>
                    </div>

                    <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {scene.summary}
                    </p>

                    <div style={{ height: 5, backgroundColor: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${scene.tension}%`,
                          height: '100%',
                          backgroundColor:
                            scene.tension > 70 ? '#ef4444' : scene.tension > 40 ? '#f59e0b' : 'var(--accent-primary)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <User size={11} /> {pov ? pov.name : 'Sem POV'}
                      </span>
                      <span>
                        {words} pal. • {scene.tension}% tensão
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
                        {project.subplots.map((sp) => {
                          const active = scene.subplotIds.includes(sp.id);
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSceneSubplot(scene, sp.id);
                              }}
                              title={`Alternar subtrama: ${sp.name}`}
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 999,
                                backgroundColor: active ? sp.color : 'transparent',
                                border: `1px solid ${sp.color}`,
                                color: active ? '#ffffff' : 'var(--text-secondary)',
                              }}
                            >
                              {sp.name}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {act > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              upsertScene({ ...scene, act: (act - 1) as 1 | 2 | 3 });
                            }}
                            title="Mover para ato anterior"
                            style={moveBtnStyle}
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                        {act < 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              upsertScene({ ...scene, act: (act + 1) as 1 | 2 | 3 });
                            }}
                            title="Mover para próximo ato"
                            style={moveBtnStyle}
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button type="button" onClick={() => handleAddScene(act)} style={addSceneBtnStyle}>
                <Plus size={14} /> Adicionar Cena
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const boardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 12,
  height: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'auto',
  alignItems: 'stretch',
};
const columnStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: 260,
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: 'var(--card-shadow)',
};
const columnHeaderStyle: React.CSSProperties = {
  padding: '10px 14px',
  backgroundColor: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border-subtle)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
};
const columnBodyStyle: React.CSSProperties = {
  padding: 10,
  overflowY: 'auto',
  overflowX: 'auto',
  minWidth: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};
const moveBtnStyle: React.CSSProperties = {
  padding: 3,
  borderRadius: 4,
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
};
const addSceneBtnStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 'var(--radius-sm)',
  border: '1px dashed var(--border-subtle)',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
};
