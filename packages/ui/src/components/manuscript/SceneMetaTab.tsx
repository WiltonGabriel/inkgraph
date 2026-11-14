import type { CSSProperties } from 'react';
import { Users } from 'lucide-react';
import type { ProjectData, Scene, SceneStatus } from '../../types/project';
import { ACT_LABELS, SCENE_STATUS_LABELS } from './manuscriptMentions';
import { SceneEpistemicChecklist } from './SceneEpistemicChecklist';

interface SceneMetaTabProps {
  project: ProjectData;
  scene: Scene;
  onUpdateScene: (next: Scene) => void;
}

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 3,
  fontWeight: 500,
};

const STATUS_OPTIONS: SceneStatus[] = [
  'outline',
  'draft',
  'first-draft',
  'revised',
  'final',
];

export function SceneMetaTab({ project, scene, onUpdateScene }: SceneMetaTabProps) {
  const allLocations = project.worlds.flatMap((w) => w.locations);

  const toggleCharacterInScene = (charId: string) => {
    const present = scene.characterIds.includes(charId);
    const nextIds = present
      ? scene.characterIds.filter((id) => id !== charId)
      : [...scene.characterIds, charId];
    onUpdateScene({ ...scene, characterIds: nextIds });
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label htmlFor="ink-scene-status" style={labelStyle}>
            Status
          </label>
          <select
            id="ink-scene-status"
            value={scene.status}
            onChange={(e) =>
              onUpdateScene({ ...scene, status: e.target.value as SceneStatus })
            }
            style={fieldStyle}
          >
            {STATUS_OPTIONS.map((statusKey) => (
              <option key={statusKey} value={statusKey}>
                {SCENE_STATUS_LABELS[statusKey]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ink-scene-act" style={labelStyle}>
            Ato
          </label>
          <select
            id="ink-scene-act"
            value={scene.act}
            onChange={(e) =>
              onUpdateScene({ ...scene, act: Number(e.target.value) as 1 | 2 | 3 })
            }
            style={fieldStyle}
          >
            <option value={1}>{ACT_LABELS[1]}</option>
            <option value={2}>{ACT_LABELS[2]}</option>
            <option value={3}>{ACT_LABELS[3]}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="ink-scene-pov" style={labelStyle}>
          Personagem POV
        </label>
        <select
          id="ink-scene-pov"
          value={scene.povCharacterId ?? ''}
          onChange={(e) =>
            onUpdateScene({ ...scene, povCharacterId: e.target.value || undefined })
          }
          style={fieldStyle}
        >
          <option value="">Sem POV fixo</option>
          {project.characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ink-scene-location" style={labelStyle}>
          Local da Cena
        </label>
        <select
          id="ink-scene-location"
          value={scene.locationId ?? ''}
          onChange={(e) =>
            onUpdateScene({ ...scene, locationId: e.target.value || undefined })
          }
          style={fieldStyle}
        >
          <option value="">Local não especificado</option>
          {allLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div
          style={{
            ...labelStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 5,
          }}
        >
          <Users size={11} aria-hidden="true" />
          <span>Personagens Presentes</span>
        </div>
        {project.characters.length === 0 ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Nenhum personagem cadastrado.
          </span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {project.characters.map((char) => {
              const active = scene.characterIds.includes(char.id);
              return (
                <button
                  key={char.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCharacterInScene(char.id)}
                  style={{
                    minHeight: 24,
                    padding: '3px 8px',
                    borderRadius: 999,
                    border: active
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: active
                      ? 'var(--accent-soft)'
                      : 'var(--bg-elevated)',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {char.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label htmlFor="ink-scene-start" style={labelStyle}>
            Início (ISO)
          </label>
          <input
            id="ink-scene-start"
            value={scene.sceneStart ?? ''}
            onChange={(e) => onUpdateScene({ ...scene, sceneStart: e.target.value })}
            placeholder="2026-11-10T08:00"
            style={{ ...fieldStyle, fontSize: 11.5 }}
          />
        </div>
        <div>
          <label htmlFor="ink-scene-duration" style={labelStyle}>
            Duração
          </label>
          <input
            id="ink-scene-duration"
            value={scene.sceneDuration ?? ''}
            onChange={(e) =>
              onUpdateScene({ ...scene, sceneDuration: e.target.value })
            }
            placeholder="PT2H / 3 horas"
            style={{ ...fieldStyle, fontSize: 11.5 }}
          />
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginBottom: 3,
          }}
        >
          <span>Tensão Dramática</span>
          <strong style={{ color: '#f59e0b' }}>{scene.tension}%</strong>
        </div>
        <input
          type="range"
          aria-label="Tensão dramática"
          min={0}
          max={100}
          value={scene.tension}
          onChange={(e) =>
            onUpdateScene({ ...scene, tension: Number(e.target.value) })
          }
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label htmlFor="ink-scene-notes" style={labelStyle}>
          Notas da Cena
        </label>
        <textarea
          id="ink-scene-notes"
          value={scene.notes}
          onChange={(e) => onUpdateScene({ ...scene, notes: e.target.value })}
          rows={4}
          placeholder="Notas de continuidade, subtexto e lembretes..."
          style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.45 }}
        />
      </div>

      <SceneEpistemicChecklist
        project={project}
        scene={scene}
        onUpdateScene={onUpdateScene}
      />
    </div>
  );
}
