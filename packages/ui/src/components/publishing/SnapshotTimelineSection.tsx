import { useState, type FormEvent } from 'react';
import { Camera, RotateCcw, ShieldAlert } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface SnapshotTimelineSectionProps {
  selectedSnapshotId: string;
  onSelectSnapshot: (snapshotId: string) => void;
}

export function SnapshotTimelineSection({
  selectedSnapshotId,
  onSelectSnapshot,
}: SnapshotTimelineSectionProps) {
  const { project, createSnapshot, restoreSnapshot, requestConfirm, notify } =
    useProject();
  const [snapLabel, setSnapLabel] = useState('');

  const handleAddSnapshot = (e: FormEvent) => {
    e.preventDefault();
    const finalLabel =
      snapLabel.trim() || `Instantâneo (${new Date().toLocaleTimeString('pt-BR')})`;
    createSnapshot(finalLabel);
    notify(`Instantâneo "${finalLabel}" salvo.`, 'success');
    setSnapLabel('');
  };

  const handleRestore = async (snapshotId: string, label: string) => {
    const confirmed = await requestConfirm({
      title: 'Restaurar Instantâneo (Viagem no Tempo)',
      message: `Restaurar o manuscrito para "${label}"?\n\nUm backup automático do estado atual será criado antes da restauração para evitar perda de texto.`,
      confirmLabel: 'Criar Backup e Restaurar',
      cancelLabel: 'Cancelar',
      tone: 'neutral',
    });
    if (!confirmed) return;
    restoreSnapshot(snapshotId);
    notify(`Instantâneo "${label}" restaurado com backup automático prévio.`, 'success');
  };

  return (
    <section
      aria-label="Instantâneos de Versão"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Camera size={16} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Instantâneos de Versão
          </h3>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {project.snapshots.length} salvo(s)
        </span>
      </div>

      {/* Time-Travel Auto-Backup Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '0.55rem 0.7rem',
          fontSize: 11.5,
          lineHeight: 1.45,
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldAlert size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>
            Viagem no Tempo com proteção:
          </strong>{' '}
          ao restaurar qualquer instantâneo, um backup automático do manuscrito atual é criado antes da substituição.
        </span>
      </div>

      <form onSubmit={handleAddSnapshot} style={{ display: 'flex', gap: '0.4rem' }}>
        <input
          type="text"
          value={snapLabel}
          onChange={(e) => setSnapLabel(e.target.value)}
          placeholder="Rótulo do instantâneo..."
          aria-label="Rótulo do instantâneo"
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.38rem 0.65rem',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.38rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Salvar Instantâneo
        </button>
      </form>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          maxHeight: 175,
          overflowY: 'auto',
        }}
      >
        {project.snapshots.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '0.85rem',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Nenhum instantâneo salvo ainda. Crie um ponto de restauração acima.
          </div>
        ) : (
          project.snapshots.map((snap) => {
            const isSelected = snap.id === selectedSnapshotId;
            return (
              <div
                key={snap.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: isSelected
                    ? 'var(--accent-soft)'
                    : 'var(--bg-elevated)',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: isSelected
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectSnapshot(snap.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong style={{ display: 'block' }}>{snap.label}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {snap.wordCount.toLocaleString('pt-BR')} palavras · {snap.createdAt}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleRestore(snap.id, snap.label)}
                  title="Criar backup automático e restaurar esta versão"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.32)',
                    padding: '0.28rem 0.55rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <RotateCcw size={12} /> Restaurar
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
