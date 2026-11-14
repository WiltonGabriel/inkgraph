import { useMemo, useState } from 'react';
import { Eye, Lock, Plus, Sparkles } from 'lucide-react';
import type { ProjectData, Scene } from '../../types/project';
import { collectProjectSecrets } from './manuscriptMentions';

interface SceneEpistemicChecklistProps {
  project: ProjectData;
  scene: Scene;
  onUpdateScene: (next: Scene) => void;
}

function dispatchInsertProse(snippet: string): void {
  window.dispatchEvent(new CustomEvent('inkgraph:insert-prose', { detail: { snippet } }));
}

export function SceneEpistemicChecklist({
  project,
  scene,
  onUpdateScene,
}: SceneEpistemicChecklistProps) {
  const [beatLabel, setBeatLabel] = useState('');
  const secrets = useMemo(() => collectProjectSecrets(project), [project]);

  const toggleSecretReveal = (secretId: string) => {
    const exists = scene.secretsRevealed.includes(secretId);
    const nextSecrets = exists
      ? scene.secretsRevealed.filter((id) => id !== secretId)
      : [...scene.secretsRevealed, secretId];
    onUpdateScene({ ...scene, secretsRevealed: nextSecrets });
  };

  const handleInsertBeat = () => {
    const label = beatLabel.trim() || 'Ponto de virada da cena';
    const sanitized = label.replace(/"/g, "'");
    dispatchInsertProse(`::beat{kind="cena" label="${sanitized}"}\n`);
    setBeatLabel('');
  };

  const handleInsertEpistemicMarker = (ownerId: string, secretText: string) => {
    const cleanSecret = secretText.replace(/"/g, "'").slice(0, 90);
    dispatchInsertProse(
      `::epistemic-reveal{entity="${ownerId}" secret="${cleanSecret}"}\n`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Quick Inline Beat & Epistemic Marker Insertion */}
      <div
        style={{
          padding: 9,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Sparkles size={12} color="var(--accent-primary)" aria-hidden="true" />
          <span>Marcadores Inline na Prosa</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={beatLabel}
            onChange={(e) => setBeatLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInsertBeat();
              }
            }}
            placeholder="Rótulo da batida..."
            aria-label="Rótulo da batida narrativa"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '5px 8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 11.5,
            }}
          />
          <button
            type="button"
            onClick={handleInsertBeat}
            title="Inserir marcador ::beat{...} na cena"
            style={{
              minHeight: 26,
              padding: '4px 8px',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0,
            }}
          >
            <Plus size={11} aria-hidden="true" /> Batida
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            handleInsertEpistemicMarker(
              scene.povCharacterId || 'pov',
              'Segredo revelado em cena'
            )
          }
          style={{
            width: '100%',
            minHeight: 26,
            padding: '4px 8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Eye size={11} aria-hidden="true" /> Inserir ::epistemic-reveal
        </button>
      </div>

      {/* Epistemic Secrets & Reveals Checklist */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Lock size={12} color="#f59e0b" aria-hidden="true" />
          <span>Segredos & Revelações Epistêmicas</span>
        </div>

        {secrets.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Nenhum segredo cadastrado nas entidades do projeto.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {secrets.map((entry) => {
              const revealedHere =
                scene.secretsRevealed.includes(entry.id) ||
                entry.revealedInSceneId === scene.id;
              const povKnows =
                !scene.povCharacterId ||
                scene.povCharacterId === entry.ownerId ||
                entry.knownByIds.includes(scene.povCharacterId);

              return (
                <div
                  key={entry.id}
                  style={{
                    padding: 8,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: revealedHere
                      ? 'var(--accent-soft)'
                      : 'var(--bg-elevated)',
                    border: revealedHere
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 7,
                      cursor: 'pointer',
                      fontSize: 11.5,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={revealedHere}
                      onChange={() => toggleSecretReveal(entry.id)}
                      style={{
                        marginTop: 2,
                        accentColor: 'var(--accent-primary)',
                        flexShrink: 0,
                      }}
                    />
                    <span>{entry.secret}</span>
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 4,
                      fontSize: 10,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      {entry.ownerKind}: {entry.ownerName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: 999,
                          backgroundColor: povKnows
                            ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                            : 'rgba(245, 158, 11, 0.16)',
                          color: povKnows ? 'var(--success)' : '#f59e0b',
                          fontWeight: 600,
                        }}
                      >
                        {povKnows ? 'POV sabe' : 'POV desconhece'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertEpistemicMarker(entry.ownerId, entry.secret)
                        }
                        title="Inserir revelação deste segredo no texto"
                        style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: 10,
                        }}
                      >
                        Inserir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
