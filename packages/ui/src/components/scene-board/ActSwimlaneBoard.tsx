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
  const { project, activeSceneId, setActiveSceneId, setActiveView, upsertScene } = useProject();

  const toggleSceneSubplot = (scene: Scene, subplotId: string) => {
    const exists = scene.subplotIds.includes(subplotId);
    const nextIds = exists
      ? scene.subplotIds.filter((id) => id !== subplotId)
      : [...scene.subplotIds, subplotId];
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, height: '100%', overflowY: 'auto' }}>
      {ACTS.map(({ act, label }) => {
        const scenes = project.scenes.filter(
          (s) => s.act === act && (!selectedSubplotId || s.subplotIds.includes(selectedSubplotId))
        );
        return (
          <div
            key={act}
            style={{
              backgroundColor: '#111622',
              border: '1px solid #242f44',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#182030',
                borderBottom: '1px solid #242f44',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{scenes.length} cenas</span>
            </div>

            <div style={{ padding: 10, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scenes.map((scene) => {
                const isSelected = scene.id === activeSceneId;
                const pov = project.characters.find((c) => c.id === scene.povCharacterId);
                const words = countWords(scene.content);
                return (
                  <div
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    onDoubleClick={() => {
                      setActiveSceneId(scene.id);
                      setActiveView('manuscript');
                    }}
                    title="Clique para selecionar · Duplo-clique para abrir no Manuscrito"
                    style={{
                      padding: 12,
                      borderRadius: 7,
                      backgroundColor: isSelected ? '#182030' : '#0d121d',
                      border: `1px solid ${isSelected ? '#6366f1' : '#242f44'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f8fafc' }}>
                        #{scene.chapterNumber} {scene.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: '#1e293b',
                          color: '#93c5fd',
                          fontWeight: 600,
                        }}
                      >
                        {STATUS_LABELS[scene.status]}
                      </span>
                    </div>

                    <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4 }}>{scene.summary}</p>

                    <div style={{ height: 5, backgroundColor: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${scene.tension}%`,
                          height: '100%',
                          backgroundColor: scene.tension > 70 ? '#ef4444' : scene.tension > 40 ? '#f59e0b' : '#3b82f6',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <User size={11} /> {pov ? pov.name : 'Sem POV'}
                      </span>
                      <span>{words} pal. • {scene.tension}% tensão</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {project.subplots.map((sp) => {
                          const active = scene.subplotIds.includes(sp.id);
                          return (
                            <button
                              key={sp.id}
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
                                color: active ? '#fff' : '#94a3b8',
                              }}
                            >
                              {sp.name}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        {act > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              upsertScene({ ...scene, act: (act - 1) as 1 | 2 | 3 });
                            }}
                            title="Mover para ato anterior"
                            style={{ padding: 3, borderRadius: 4, backgroundColor: '#1e293b', color: '#cbd5e1' }}
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                        {act < 3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              upsertScene({ ...scene, act: (act + 1) as 1 | 2 | 3 });
                            }}
                            title="Mover para próximo ato"
                            style={{ padding: 3, borderRadius: 4, backgroundColor: '#1e293b', color: '#cbd5e1' }}
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => handleAddScene(act)}
                style={{
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px dashed #334155',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <Plus size={14} /> + Adicionar Cena
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
