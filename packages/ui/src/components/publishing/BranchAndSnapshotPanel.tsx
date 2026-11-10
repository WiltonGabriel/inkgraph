import { useState, useMemo } from 'react';
import { GitBranch, Camera, RotateCcw, SplitSquareVertical } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';

export function BranchAndSnapshotPanel() {
  const { project, createBranch, switchBranch, createSnapshot, restoreSnapshot } = useProject();
  const [branchName, setBranchName] = useState('');
  const [branchDesc, setBranchDesc] = useState('');
  const [snapLabel, setSnapLabel] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(project.snapshots[0]?.id ?? '');

  const selectedSnapshot = useMemo(
    () => project.snapshots.find((s) => s.id === selectedSnapshotId) ?? project.snapshots[0],
    [project.snapshots, selectedSnapshotId]
  );

  const handleAddBranch = () => {
    if (!branchName.trim()) return;
    createBranch(branchName, branchDesc || 'Ramificação narrativa');
    setBranchName('');
    setBranchDesc('');
  };

  const handleAddSnapshot = () => {
    createSnapshot(snapLabel || `Instantâneo (${new Date().toLocaleTimeString('pt-BR')})`);
    setSnapLabel('');
  };

  const currentTotalWords = project.scenes.reduce((acc, s) => acc + countWords(s.content), 0);
  const wordDelta = selectedSnapshot ? currentTotalWords - selectedSnapshot.wordCount : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Branches */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <GitBranch size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Ramificações (Branches)</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {project.branches.map((b) => {
              const active = b.id === project.activeBranchId;
              return (
                <button
                  key={b.id}
                  onClick={() => switchBranch(b.id)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    background: active ? 'var(--accent)' : 'var(--bg-card)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
            <input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="Nome da ramificação..."
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
            />
            <button onClick={handleAddBranch} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 600 }}>
              Criar Ramificação
            </button>
          </div>
        </div>

        {/* Snapshots */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Camera size={16} color="#10b981" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Instantâneos de Versão (Snapshots)</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              value={snapLabel}
              onChange={(e) => setSnapLabel(e.target.value)}
              placeholder="Rótulo do instantâneo..."
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
            />
            <button onClick={handleAddSnapshot} style={{ background: '#10b981', color: '#fff', borderRadius: '5px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>
              Salvar Instantâneo
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '110px', overflowY: 'auto' }}>
            {project.snapshots.map((snap) => (
              <div key={snap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '5px', border: selectedSnapshot?.id === snap.id ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                <button onClick={() => setSelectedSnapshotId(snap.id)} style={{ textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                  <strong>{snap.label}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({snap.wordCount} pal. • {snap.createdAt})</span>
                </button>
                <button onClick={() => restoreSnapshot(snap.id)} title="Restaurar versão" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                  <RotateCcw size={12} /> Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-side Diff */}
      {selectedSnapshot && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <SplitSquareVertical size={16} color="var(--accent)" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Comparação Lado a Lado: {selectedSnapshot.label} vs Rascunho Atual</h4>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: wordDelta >= 0 ? '#10b981' : '#ef4444' }}>
              Diferença: {wordDelta >= 0 ? `+${wordDelta}` : wordDelta} palavras
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.7rem', fontSize: '0.78rem', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Instantâneo ({selectedSnapshot.wordCount} palavras)</div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#94a3b8' }}>
                {selectedSnapshot.scenesBackup.map((s) => `# ${s.title}\n${s.content}`).join('\n\n')}
              </pre>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.7rem', fontSize: '0.78rem', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Rascunho Atual ({currentTotalWords} palavras)</div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#e2e8f0' }}>
                {project.scenes.map((s) => `# ${s.title}\n${s.content}`).join('\n\n')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
