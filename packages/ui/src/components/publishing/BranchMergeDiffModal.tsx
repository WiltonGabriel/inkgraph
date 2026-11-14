import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { computeWorkspaceBranchDiff, parseBranchState } from '../../domain/gitEngine';
import type { Scene } from '../../types/project';
import { BranchSceneDiffInspector } from './BranchSceneDiffInspector';
import { MergeConflictList } from './MergeConflictList';
import { MergeModalHeader } from './MergeModalHeader';
import { MergeSummaryBar } from './MergeSummaryBar';

interface BranchMergeDiffModalProps {
  isOpen: boolean;
  initialSourceBranchId: string;
  onClose: () => void;
}

export function BranchMergeDiffModal({
  isOpen,
  initialSourceBranchId,
  onClose,
}: BranchMergeDiffModalProps) {
  const { project, mergeBranch, notify } = useProject();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const selectId = useId();

  const otherBranches = useMemo(
    () => project.branches.filter((b) => b.id !== project.activeBranchId),
    [project.branches, project.activeBranchId]
  );

  const [sourceBranchId, setSourceBranchId] = useState<string>(initialSourceBranchId);
  const [conflictResolutions, setConflictResolutions] = useState<
    Record<string, 'ours' | 'theirs'>
  >({});

  useEffect(() => {
    if (!isOpen) return;
    const validInitial = otherBranches.some((b) => b.id === initialSourceBranchId)
      ? initialSourceBranchId
      : otherBranches[0]?.id ?? '';
    setSourceBranchId(validInitial);
    setConflictResolutions({});
  }, [isOpen, initialSourceBranchId, otherBranches]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const activeBranch = useMemo(
    () => project.branches.find((b) => b.id === project.activeBranchId),
    [project.branches, project.activeBranchId]
  );

  const sourceBranch = useMemo(
    () => otherBranches.find((b) => b.id === sourceBranchId) ?? null,
    [otherBranches, sourceBranchId]
  );

  const diff = useMemo(
    () => computeWorkspaceBranchDiff(project, sourceBranch?.id ?? ''),
    [project, sourceBranch]
  );

  const sourceScenes = useMemo<Scene[]>(() => {
    if (!sourceBranch) return [];
    const parsed = parseBranchState(sourceBranch.snapshotData);
    return parsed?.scenes ?? sourceBranch.scenesBackup ?? [];
  }, [sourceBranch]);

  const resolvedMap = useMemo(() => {
    const map: Record<string, 'ours' | 'theirs'> = {};
    for (const conflict of diff.conflicts) {
      map[conflict.sceneId] = conflictResolutions[conflict.sceneId] ?? 'theirs';
    }
    return map;
  }, [diff.conflicts, conflictResolutions]);

  const hasMergeableChanges =
    diff.scenesAdded.length > 0 ||
    diff.scenesModified.length > 0 ||
    diff.entitiesChanged > 0;

  const isPointerOutside = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  const handleDialogClose = () => {
    if (dialogRef.current) dialogRef.current.returnValue = '';
    onClose();
  };

  const handleConfirmMerge = () => {
    if (!sourceBranch || !hasMergeableChanges) return;
    mergeBranch(sourceBranch.id, resolvedMap);
    notify(
      `Mesclagem de "${sourceBranch.name}" aplicada em "${activeBranch?.name ?? 'Principal'}".`,
      'success'
    );
    dialogRef.current?.close();
  };

  const setAllConflicts = (choice: 'ours' | 'theirs') => {
    const next: Record<string, 'ours' | 'theirs'> = {};
    for (const conflict of diff.conflicts) {
      next[conflict.sceneId] = choice;
    }
    setConflictResolutions(next);
  };

  return (
    <>
      <style>{`
        dialog.ink-merge-dialog {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg, 12px);
          background-color: var(--bg-surface);
          color: var(--text-primary);
          width: min(880px, calc(100vw - 24px));
          max-height: min(88vh, 820px);
          margin: auto;
          padding: 0;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.48);
          overflow: hidden;
        }
        dialog.ink-merge-dialog[open] { display: flex; flex-direction: column; }
        dialog.ink-merge-dialog:modal { overscroll-behavior: contain; }
        dialog.ink-merge-dialog::backdrop {
          background-color: rgba(5, 7, 11, 0.62);
          backdrop-filter: blur(3px);
          overflow: hidden;
          overscroll-behavior: contain;
        }
      `}</style>

      <dialog
        ref={dialogRef}
        className="ink-merge-dialog"
        aria-labelledby={titleId}
        onClose={handleDialogClose}
        onPointerDown={(e) => {
          if ('closedBy' in HTMLDialogElement.prototype) return;
          const dialog = dialogRef.current;
          pressedOutsideRef.current = Boolean(dialog && e.target === dialog && isPointerOutside(e, dialog));
        }}
        onPointerUp={(e) => {
          if ('closedBy' in HTMLDialogElement.prototype) return;
          const dialog = dialogRef.current;
          if (dialog && pressedOutsideRef.current && isPointerOutside(e, dialog)) dialog.close();
          pressedOutsideRef.current = false;
        }}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <MergeModalHeader
          titleId={titleId}
          selectId={selectId}
          otherBranches={otherBranches}
          sourceBranchId={sourceBranch?.id ?? ''}
          activeBranchName={activeBranch?.name ?? 'Ramo Ativo'}
          onChangeSource={(id) => {
            setSourceBranchId(id);
            setConflictResolutions({});
          }}
          onClose={() => dialogRef.current?.close()}
        />

        <div style={bodyStyle}>
          <MergeSummaryBar diff={diff} />

          {!sourceBranch ? (
            <EmptyDiffNotice text="Crie ao menos uma ramificação adicional para comparar e mesclar alterações." />
          ) : !hasMergeableChanges && diff.scenesRemoved.length === 0 ? (
            <EmptyDiffNotice text="Nenhuma divergência detectada entre as duas ramificações selecionadas." />
          ) : (
            <>
              {diff.scenesRemoved.length > 0 && (
                <div style={noteBoxStyle}>
                  Nota: {diff.scenesRemoved.length}{' '}
                  {diff.scenesRemoved.length === 1
                    ? 'cena exclusiva do ramo atual será preservada'
                    : 'cenas exclusivas do ramo atual serão preservadas'}{' '}
                  durante a mesclagem não destrutiva.
                </div>
              )}

              <MergeConflictList
                conflicts={diff.conflicts}
                activeBranchName={activeBranch?.name ?? 'Atual'}
                sourceBranchName={sourceBranch.name}
                resolvedMap={resolvedMap}
                onSelectChoice={(sceneId, choice) =>
                  setConflictResolutions((prev) => ({ ...prev, [sceneId]: choice }))
                }
                onSelectAll={setAllConflicts}
              />

              <BranchSceneDiffInspector
                diff={diff}
                activeScenes={project.scenes}
                sourceScenes={sourceScenes}
              />
            </>
          )}
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={() => dialogRef.current?.close()} style={cancelBtnStyle}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!sourceBranch || !hasMergeableChanges}
            onClick={handleConfirmMerge}
            style={confirmBtnStyle(!sourceBranch || !hasMergeableChanges)}
          >
            <CheckCircle2 size={14} />
            <span>Confirmar Mesclagem</span>
          </button>
        </div>
      </dialog>
    </>
  );
}

function EmptyDiffNotice({ text }: { text: string }) {
  return <div style={emptyNoticeStyle}>{text}</div>;
}

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '1rem 1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const emptyNoticeStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px dashed var(--border-subtle)',
  borderRadius: 'var(--radius-md, 8px)',
  padding: '1.25rem',
  textAlign: 'center',
  fontSize: 12.5,
  color: 'var(--text-secondary)',
};

const noteBoxStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '0.55rem 0.75rem',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '0.8rem 1.1rem',
  backgroundColor: 'var(--bg-elevated)',
  borderTop: '1px solid var(--border-subtle)',
  flexShrink: 0,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  fontSize: 12.5,
  fontWeight: 600,
};

const confirmBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: disabled ? 'var(--bg-hover)' : 'var(--accent-primary)',
  color: disabled ? 'var(--text-muted)' : '#ffffff',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
});
