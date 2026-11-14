import { useMemo, useState } from 'react';
import { SplitSquareVertical } from 'lucide-react';
import { computeLineDiff } from '../../domain/gitEngine';
import type { Scene, Snapshot } from '../../types/project';
import { countWords } from '../../types/project';
import { VisualDiffViewer } from './VisualDiffViewer';

interface SnapshotDiffPreviewProps {
  snapshot: Snapshot;
  currentScenes: Scene[];
}

interface SnapshotSceneComparison {
  sceneId: string;
  title: string;
  status: 'changed' | 'added' | 'removed' | 'equal';
  snapshotContent: string;
  currentContent: string;
}

export function SnapshotDiffPreview({
  snapshot,
  currentScenes,
}: SnapshotDiffPreviewProps) {
  const comparisons = useMemo<SnapshotSceneComparison[]>(() => {
    const snapMap = new Map(snapshot.scenesBackup.map((s) => [s.id, s]));
    const currMap = new Map(currentScenes.map((s) => [s.id, s]));
    const result: SnapshotSceneComparison[] = [];

    for (const curr of currentScenes) {
      const prev = snapMap.get(curr.id);
      if (!prev) {
        result.push({
          sceneId: curr.id,
          title: curr.title,
          status: 'added',
          snapshotContent: '',
          currentContent: curr.content,
        });
      } else {
        result.push({
          sceneId: curr.id,
          title: curr.title || prev.title,
          status: prev.content === curr.content ? 'equal' : 'changed',
          snapshotContent: prev.content,
          currentContent: curr.content,
        });
      }
    }

    for (const prev of snapshot.scenesBackup) {
      if (!currMap.has(prev.id)) {
        result.push({
          sceneId: prev.id,
          title: prev.title,
          status: 'removed',
          snapshotContent: prev.content,
          currentContent: '',
        });
      }
    }
    return result;
  }, [snapshot, currentScenes]);

  const changedCount = comparisons.filter((c) => c.status !== 'equal').length;
  const defaultScene =
    comparisons.find((c) => c.status !== 'equal') ?? comparisons[0] ?? null;

  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const activeComparison =
    comparisons.find((c) => c.sceneId === selectedSceneId) ?? defaultScene;

  const precomputedLines = useMemo(() => {
    if (!activeComparison) return [];
    return computeLineDiff(
      activeComparison.snapshotContent,
      activeComparison.currentContent
    );
  }, [activeComparison]);

  const currentTotalWords = currentScenes.reduce(
    (acc, s) => acc + countWords(s.content),
    0
  );
  const wordDelta = currentTotalWords - snapshot.wordCount;

  return (
    <section
      aria-label="Comparação do instantâneo com o rascunho atual"
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <SplitSquareVertical size={16} style={{ color: 'var(--accent-primary)' }} />
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Diff do Instantâneo: {snapshot.label} → Rascunho Atual
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.76rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {changedCount}{' '}
            {changedCount === 1 ? 'cena modificada' : 'cenas modificadas'}
          </span>
          <span
            style={{
              fontWeight: 700,
              color: wordDelta >= 0 ? '#10b981' : '#ef4444',
            }}
          >
            {wordDelta >= 0 ? `+${wordDelta}` : wordDelta} palavras
          </span>
        </div>
      </div>

      {comparisons.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {comparisons.map((item) => {
            const selected = activeComparison?.sceneId === item.sceneId;
            const dotColor =
              item.status === 'added'
                ? '#10b981'
                : item.status === 'removed'
                  ? '#ef4444'
                  : item.status === 'changed'
                    ? '#f59e0b'
                    : 'var(--text-muted)';
            return (
              <button
                key={item.sceneId}
                type="button"
                onClick={() => setSelectedSceneId(item.sceneId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  fontSize: 11.5,
                  fontWeight: selected ? 700 : 500,
                  backgroundColor: selected
                    ? 'var(--accent-soft)'
                    : 'var(--bg-elevated)',
                  border: selected
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: dotColor,
                    flexShrink: 0,
                  }}
                />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeComparison ? (
        <VisualDiffViewer
          baseText={activeComparison.snapshotContent}
          targetText={activeComparison.currentContent}
          precomputedLines={precomputedLines}
          defaultMode="lines"
          maxHeight={260}
        />
      ) : (
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.85rem',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Nenhuma cena encontrada para comparação neste instantâneo.
        </div>
      )}
    </section>
  );
}
