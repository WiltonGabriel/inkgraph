import { useState } from 'react';
import { Sliders, MessageSquare, History, Plus, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { computeWordDiff } from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { countWords, type SceneStatus, type SceneComment, type SceneRevision } from '../../types/project';

export function SceneInspectorDrawer({ fullWidth = false }: { fullWidth?: boolean }) {
  const { project, activeSceneId, upsertScene } = useProject();
  const [tab, setTab] = useState<'meta' | 'comments' | 'revisions'>('meta');
  const [commentDraft, setCommentDraft] = useState('');
  const [revLabel, setRevLabel] = useState('');
  const [diffRevId, setDiffRevId] = useState<string | null>(null);

  const scene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  if (!scene) return null;

  const allLocations = project.worlds.flatMap((w) => w.locations);

  const handleAddComment = () => {
    if (!commentDraft.trim()) return;
    const newComment: SceneComment = {
      id: `cmt_${Date.now()}`,
      author: 'Autor',
      text: commentDraft.trim(),
      createdAt: new Date().toLocaleString('pt-BR'),
      resolved: false,
      replies: [],
    };
    upsertScene({ ...scene, comments: [newComment, ...scene.comments] });
    setCommentDraft('');
  };

  const handleSaveCheckpoint = () => {
    const rev: SceneRevision = {
      id: `rev_${Date.now()}`,
      label: revLabel.trim() || `Ponto de verificação (${scene.revisions.length + 1})`,
      content: scene.content,
      wordCount: countWords(scene.content),
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    upsertScene({ ...scene, revisions: [rev, ...scene.revisions] });
    setRevLabel('');
  };

  return (
    <aside
      style={{
        width: fullWidth ? '100%' : 310,
        height: '100%',
        backgroundColor: '#0e1118',
        borderLeft: fullWidth ? 'none' : '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #1b202c', padding: 6, gap: 4 }}>
        <button onClick={() => setTab('meta')} style={{ flex: 1, padding: '6px 4px', borderRadius: 5, border: 'none', backgroundColor: tab === 'meta' ? '#1e2638' : 'transparent', color: tab === 'meta' ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Sliders size={12} /> Metadados & Lore
        </button>
        <button onClick={() => setTab('comments')} style={{ flex: 1, padding: '6px 4px', borderRadius: 5, border: 'none', backgroundColor: tab === 'comments' ? '#1e2638' : 'transparent', color: tab === 'comments' ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <MessageSquare size={12} /> Comentários ({scene.comments.length})
        </button>
        <button onClick={() => setTab('revisions')} style={{ flex: 1, padding: '6px 4px', borderRadius: 5, border: 'none', backgroundColor: tab === 'revisions' ? '#1e2638' : 'transparent', color: tab === 'revisions' ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <History size={12} /> Revisões ({scene.revisions.length})
        </button>
      </div>

      {tab === 'meta' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Status</label>
              <select
                value={scene.status}
                onChange={(e) => upsertScene({ ...scene, status: e.target.value as SceneStatus })}
                style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 12 }}
              >
                <option value="outline">outline</option>
                <option value="draft">draft</option>
                <option value="first-draft">first-draft</option>
                <option value="revised">revised</option>
                <option value="final">final</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Ato</label>
              <select
                value={scene.act}
                onChange={(e) => upsertScene({ ...scene, act: Number(e.target.value) as 1 | 2 | 3 })}
                style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 12 }}
              >
                <option value={1}>Ato 1</option>
                <option value={2}>Ato 2</option>
                <option value={3}>Ato 3</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Personagem POV</label>
            <select
              value={scene.povCharacterId ?? ''}
              onChange={(e) => upsertScene({ ...scene, povCharacterId: e.target.value || undefined })}
              style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 12 }}
            >
              <option value="">Sem POV fixo</option>
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Local da Cena</label>
            <select
              value={scene.locationId ?? ''}
              onChange={(e) => upsertScene({ ...scene, locationId: e.target.value || undefined })}
              style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 12 }}
            >
              <option value="">Local não especificado</option>
              {allLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Início (ISO)</label>
              <input
                value={scene.sceneStart ?? ''}
                onChange={(e) => upsertScene({ ...scene, sceneStart: e.target.value })}
                placeholder="2026-11-10T08:00"
                style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 11.5 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Duração</label>
              <input
                value={scene.sceneDuration ?? ''}
                onChange={(e) => upsertScene({ ...scene, sceneDuration: e.target.value })}
                placeholder="PT2H / 3 horas"
                style={{ width: '100%', padding: 6, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#e5e7eb', fontSize: 11.5 }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
              <span>Tensão Dramática</span>
              <strong style={{ color: '#f59e0b' }}>{scene.tension}%</strong>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={scene.tension}
              onChange={(e) => upsertScene({ ...scene, tension: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Notas da Cena</label>
            <textarea
              value={scene.notes}
              onChange={(e) => upsertScene({ ...scene, notes: e.target.value })}
              rows={5}
              placeholder="Notas de continuidade, subtexto e lembretes..."
              style={{ width: '100%', padding: 8, backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 6, color: '#d1d5db', fontSize: 12, resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {tab === 'comments' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Novo comentário na cena..."
              style={{ flex: 1, padding: '6px 8px', backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#fff', fontSize: 12 }}
            />
            <button onClick={handleAddComment} style={{ padding: '6px 10px', backgroundColor: '#2563eb', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer' }}>
              <Plus size={13} />
            </button>
          </div>
          {scene.comments.map((c) => (
            <div key={c.id} style={{ padding: 10, borderRadius: 6, backgroundColor: '#131824', border: '1px solid #1f2637', opacity: c.resolved ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                <strong>{c.author}</strong>
                <span>{c.createdAt}</span>
              </div>
              <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 8 }}>{c.text}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() =>
                    upsertScene({
                      ...scene,
                      comments: scene.comments.map((cm) => (cm.id === c.id ? { ...cm, resolved: !cm.resolved } : cm)),
                    })
                  }
                  style={{ background: 'none', border: 'none', color: c.resolved ? '#10b981' : '#60a5fa', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <CheckCircle2 size={11} /> {c.resolved ? 'Reabrir' : 'Resolver'}
                </button>
                <button
                  onClick={() => upsertScene({ ...scene, comments: scene.comments.filter((cm) => cm.id !== c.id) })}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <Trash2 size={11} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'revisions' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={revLabel}
            onChange={(e) => setRevLabel(e.target.value)}
            placeholder="Rótulo da revisão (opcional)..."
            style={{ width: '100%', padding: '6px 8px', backgroundColor: '#141926', border: '1px solid #262f42', borderRadius: 5, color: '#fff', fontSize: 12 }}
          />
          <button
            onClick={handleSaveCheckpoint}
            style={{ width: '100%', padding: '7px 10px', backgroundColor: '#10b981', color: '#052e16', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Salvar ponto de verificação
          </button>
          {scene.revisions.map((rev) => {
            const showDiff = diffRevId === rev.id;
            const diff = showDiff ? computeWordDiff(rev.content, scene.content) : null;
            return (
              <div key={rev.id} style={{ padding: 10, borderRadius: 6, backgroundColor: '#131824', border: '1px solid #1f2637' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f3f4f6' }}>{rev.label}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 8px' }}>
                  {rev.wordCount} palavras · {rev.createdAt}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => upsertScene({ ...scene, content: rev.content })}
                    style={{ flex: 1, padding: '4px 8px', backgroundColor: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <RotateCcw size={11} /> Restaurar
                  </button>
                  <button
                    onClick={() => setDiffRevId(showDiff ? null : rev.id)}
                    style={{ flex: 1, padding: '4px 8px', backgroundColor: '#19202e', border: '1px solid #2c3548', borderRadius: 4, color: '#d1d5db', fontSize: 11, cursor: 'pointer' }}
                  >
                    {showDiff ? 'Ocultar Diff' : 'Ver Diff'}
                  </button>
                </div>
                {diff && (
                  <div style={{ marginTop: 8, padding: 8, backgroundColor: '#0c0f17', borderRadius: 5, fontSize: 11, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 4 }}>
                      +{diff.addedWords} / -{diff.removedWords} palavras
                    </div>
                    {diff.segments.map((seg, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor:
                            seg.type === 'added'
                              ? 'rgba(16,185,129,0.22)'
                              : seg.type === 'removed'
                                ? 'rgba(239,68,68,0.22)'
                                : 'transparent',
                          color:
                            seg.type === 'added'
                              ? '#6ee7b7'
                              : seg.type === 'removed'
                                ? '#fca5a5'
                                : '#cbd5e1',
                          textDecoration: seg.type === 'removed' ? 'line-through' : 'none',
                        }}
                      >
                        {seg.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
