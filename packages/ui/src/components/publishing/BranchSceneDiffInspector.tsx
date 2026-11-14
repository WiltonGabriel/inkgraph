import { useMemo, useState } from 'react';
import { FileDiff } from 'lucide-react';
import type { BranchDiffSummary } from '../../domain/gitEngine';
import type { Scene } from '../../types/project';
import { VisualDiffViewer } from './VisualDiffViewer';

interface ChangedSceneEntry {
  sceneId: string;
  title: string;
  kind: 'added' | 'modified' | 'removed';
  hasConflict: boolean;
  baseContent: string;
  targetContent: string;
}

interface BranchSceneDiffInspectorProps {
  diff: BranchDiffSummary;
  activeScenes: Scene[];
  sourceScenes: Scene[];
}

export function BranchSceneDiffInspector({
  diff,
  activeScenes,
  sourceScenes,
}: BranchSceneDiffInspectorProps) {
  const entries = useMemo<ChangedSceneEntry[]>(() => {
    const activeMap = new Map(activeScenes.map((s) => [s.id, s]));
    const sourceMap = new Map(sourceScenes.map((s) => [s.id, s]));
    const conflictIds = new Set(diff.conflicts.map((c) => c.sceneId));
    const list: ChangedSceneEntry[] = [];

    for (const id of diff.scenesModified) {
      const a = activeMap.get(id);
      const s = sourceMap.get(id);
      list.push({
        sceneId: id,
        title: s?.title || a?.title || id,
        kind: 'modified',
        hasConflict: conflictIds.has(id),
        baseContent: a?.content ?? '',
        targetContent: s?.content ?? '',
      });
    }
    for (const id of diff.scenesAdded) {
      const s = sourceMap.get(id);
      list.push({
        sceneId: id,
        title: s?.title || id,
        kind: 'added',
        hasConflict: false,
        baseContent: '',
        targetContent: s?.content ?? '',
      });
    }
    for (const id of diff.scenesRemoved) {
      const a = activeMap.get(id);
      list.push({
        sceneId: id,
        title: a?.title || id,
        kind: 'removed',
        hasConflict: false,
        baseContent: a?.content ?? '',
        targetContent: '',
      });
    }
    return list;
  }, [diff, activeScenes, sourceScenes]);

  const [selectedId, setSelectedId] = useState<string>('');
  const activeEntry = entries.find((e) => e.sceneId === selectedId) ?? entries[0] ?? null;

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Diferenças por cena"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        <FileDiff size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>Inspeção de Cenas ({entries.length})</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {entries.map((entry) => {
          const isSelected = activeEntry?.sceneId === entry.sceneId;
          const badgeColor =
            entry.kind === 'added'
              ? '#10b981'
              : entry.kind === 'removed'
                ? '#ef4444'
                : entry.hasConflict
                  ? '#f59e0b'
                  : 'var(--accent-primary)';
          const kindLabel =
            entry.kind === 'added'
              ? 'Nova'
              : entry.kind === 'removed'
                ? 'Ausente no fonte'
                : entry.hasConflict
                  ? 'Conflito'
                  : 'Modificada';
          return (
            <button
              key={entry.sceneId}
              type="button"
              onClick={() => setSelectedId(entry.sceneId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 9px',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: 11.5,
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                border: isSelected
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <span>{entry.title}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: badgeColor,
                  padding: '1px 5px',
                  borderRadius: 999,
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {kindLabel}
              </span>
            </button>
          );
        })}
      </div>

      {activeEntry && (
        <VisualDiffViewer
          baseText={activeEntry.baseContent}
          targetText={activeEntry.targetContent}
          precomputedLines={diff.lineDiffBySceneId[activeEntry.sceneId]}
          defaultMode="lines"
          maxHeight={260}
          emptyMessage="Metadados da cena alterados (título, resumo ou status), sem mudança no corpo textual."
        />
      )}
    </section>
  );
}
