import { useState, type CSSProperties } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import type { EpistemicSecret, Scene } from '../../types/project';
import type { GraphNode } from './graphDataBuilder';

interface GraphInspectorEpistemicProps {
  entityId: string;
  secrets: EpistemicSecret[];
  allEntities: GraphNode[];
  scenes: Scene[];
  onUpdateSecrets: (next: EpistemicSecret[]) => void;
}

export function GraphInspectorEpistemic({
  entityId,
  secrets,
  allEntities,
  scenes,
  onUpdateSecrets,
}: GraphInspectorEpistemicProps) {
  const [newSecret, setNewSecret] = useState('');
  const [revealedInSceneId, setRevealedInSceneId] = useState('');
  const [selectedKnowerIds, setSelectedKnowerIds] = useState<string[]>([]);

  const toggleKnower = (id: string) => {
    setSelectedKnowerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSecret = () => {
    if (!newSecret.trim()) return;
    const knownSet = new Set([entityId, ...selectedKnowerIds]);
    const entry: EpistemicSecret = {
      id: `sec_${Date.now()}`,
      secret: newSecret.trim(),
      knownByIds: Array.from(knownSet),
      revealedInSceneId: revealedInSceneId || undefined,
    };
    onUpdateSecrets([...secrets, entry]);
    setNewSecret('');
    setRevealedInSceneId('');
    setSelectedKnowerIds([]);
  };

  const handleDeleteSecret = (secretId: string) => {
    onUpdateSecrets(secrets.filter((s) => s.id !== secretId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        <Lock size={14} color="var(--accent-primary)" aria-hidden="true" />
        Segredos Epistêmicos & Conhecimento Restrito ({secrets.length})
      </div>

      {secrets.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Nenhum segredo epistêmico restrito registrado para esta entidade.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {secrets.map((sec) => {
            const scene = scenes.find((s) => s.id === sec.revealedInSceneId);
            return (
              <div
                key={sec.id}
                style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    “{sec.secret}”
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Conhecido por:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {sec.knownByIds
                        .map((id) => allEntities.find((e) => e.id === id)?.name ?? id)
                        .join(', ')}
                    </strong>
                  </div>
                  {sec.revealedInSceneId && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--accent-primary)',
                        marginTop: 3,
                      }}
                    >
                      Revelado na cena:{' '}
                      {scene ? `#${scene.chapterNumber} ${scene.title}` : sec.revealedInSceneId}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSecret(sec.id)}
                  aria-label="Excluir segredo"
                  title="Excluir segredo"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger, #ef4444)',
                    cursor: 'pointer',
                    minWidth: 24,
                    minHeight: 24,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          padding: 12,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
          + Registrar Segredo Epistêmico
        </div>
        <textarea
          aria-label="Descrição do segredo"
          rows={2}
          value={newSecret}
          onChange={(e) => setNewSecret(e.target.value)}
          placeholder="O que esta entidade oculta ou resguarda..."
          style={{ ...controlStyle, resize: 'vertical' }}
        />

        <select
          aria-label="Cena de revelação"
          value={revealedInSceneId}
          onChange={(e) => setRevealedInSceneId(e.target.value)}
          style={controlStyle}
        >
          <option value="">Cena de revelação (opcional)...</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.chapterNumber} {s.title}
            </option>
          ))}
        </select>

        {allEntities.length > 1 && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginBottom: 4,
              }}
            >
              Também conhecido por:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {allEntities
                .filter((e) => e.id !== entityId)
                .slice(0, 12)
                .map((e) => {
                  const active = selectedKnowerIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleKnower(e.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        border: active
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {e.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddSecret}
          disabled={!newSecret.trim()}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12,
            fontWeight: 600,
            cursor: !newSecret.trim() ? 'not-allowed' : 'pointer',
            opacity: !newSecret.trim() ? 0.55 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Registrar Segredo
        </button>
      </div>
    </div>
  );
}

const controlStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '7px 10px',
  color: 'var(--text-primary)',
  fontSize: 12,
};
