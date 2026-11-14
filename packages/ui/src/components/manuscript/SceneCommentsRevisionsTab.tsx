import { useState } from 'react';
import { CheckCircle2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  countWords,
  type Scene,
  type SceneComment,
  type SceneRevision,
} from '../../types/project';

function computeWordDiff(oldText: string, newText: string) {
  const oldWords = oldText.trim() ? oldText.trim().split(/\s+/) : [];
  const newWords = newText.trim() ? newText.trim().split(/\s+/) : [];
  const oldSet = new Set(oldWords);
  const newSet = new Set(newWords);
  return {
    added: newWords.filter((w) => !oldSet.has(w)).slice(0, 25),
    removed: oldWords.filter((w) => !newSet.has(w)).slice(0, 25),
  };
}

interface SceneCommentsTabProps {
  scene: Scene;
  onUpdateScene: (next: Scene) => void;
}

export function SceneCommentsTab({ scene, onUpdateScene }: SceneCommentsTabProps) {
  const [commentDraft, setCommentDraft] = useState('');

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
    onUpdateScene({ ...scene, comments: [newComment, ...scene.comments] });
    setCommentDraft('');
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddComment();
            }
          }}
          placeholder="Novo comentário na cena..."
          aria-label="Novo comentário na cena"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '6px 8px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
        />
        <button
          type="button"
          onClick={handleAddComment}
          aria-label="Adicionar comentário"
          style={{
            minWidth: 30,
            minHeight: 30,
            padding: '6px 10px',
            backgroundColor: 'var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>

      {scene.comments.length === 0 ? (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Nenhum comentário nesta cena.
        </p>
      ) : (
        scene.comments.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              opacity: c.resolved ? 0.62 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              <strong style={{ color: 'var(--text-secondary)' }}>{c.author}</strong>
              <span>{c.createdAt}</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
                marginBottom: 8,
                lineHeight: 1.45,
              }}
            >
              {c.text}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() =>
                  onUpdateScene({
                    ...scene,
                    comments: scene.comments.map((cm) =>
                      cm.id === c.id ? { ...cm, resolved: !cm.resolved } : cm
                    ),
                  })
                }
                style={{
                  background: 'none',
                  color: c.resolved ? 'var(--success)' : 'var(--accent-primary)',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <CheckCircle2 size={11} aria-hidden="true" />{' '}
                {c.resolved ? 'Reabrir' : 'Resolver'}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateScene({
                    ...scene,
                    comments: scene.comments.filter((cm) => cm.id !== c.id),
                  })
                }
                style={{
                  background: 'none',
                  color: 'var(--danger)',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Trash2 size={11} aria-hidden="true" /> Excluir
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface SceneRevisionsTabProps {
  scene: Scene;
  onUpdateScene: (next: Scene) => void;
}

export function SceneRevisionsTab({ scene, onUpdateScene }: SceneRevisionsTabProps) {
  const [revLabel, setRevLabel] = useState('');
  const [diffRevId, setDiffRevId] = useState<string | null>(null);

  const handleSaveCheckpoint = () => {
    const rev: SceneRevision = {
      id: `rev_${Date.now()}`,
      label: revLabel.trim() || `Ponto de verificação (${scene.revisions.length + 1})`,
      content: scene.content,
      wordCount: countWords(scene.content),
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    onUpdateScene({ ...scene, revisions: [rev, ...scene.revisions] });
    setRevLabel('');
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <input
        value={revLabel}
        onChange={(e) => setRevLabel(e.target.value)}
        placeholder="Rótulo da revisão (opcional)..."
        aria-label="Rótulo da revisão"
        style={{
          width: '100%',
          padding: '6px 8px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 12,
        }}
      />
      <button
        type="button"
        onClick={handleSaveCheckpoint}
        style={{
          width: '100%',
          minHeight: 30,
          padding: '7px 10px',
          backgroundColor: 'var(--success)',
          color: '#052e16',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Salvar ponto de verificação
      </button>

      {scene.revisions.map((rev) => {
        const showDiff = diffRevId === rev.id;
        const diff = showDiff ? computeWordDiff(rev.content, scene.content) : null;
        return (
          <div
            key={rev.id}
            style={{
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {rev.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
              {rev.wordCount.toLocaleString('pt-BR')} palavras · {rev.createdAt}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => onUpdateScene({ ...scene, content: rev.content })}
                style={{
                  flex: 1,
                  minHeight: 26,
                  padding: '4px 8px',
                  backgroundColor: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <RotateCcw size={11} aria-hidden="true" /> Restaurar
              </button>
              <button
                type="button"
                onClick={() => setDiffRevId(showDiff ? null : rev.id)}
                style={{
                  flex: 1,
                  minHeight: 26,
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                }}
              >
                {showDiff ? 'Ocultar Diff' : 'Ver Diff'}
              </button>
            </div>
            {diff && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ color: 'var(--success)' }}>
                  + Adicionado: {diff.added.join(' ') || 'nenhuma'}
                </div>
                <div style={{ color: 'var(--danger)', marginTop: 4 }}>
                  - Removido: {diff.removed.join(' ') || 'nenhuma'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
