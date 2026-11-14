import { useMemo, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { BranchListSection } from './BranchListSection';
import { SnapshotTimelineSection } from './SnapshotTimelineSection';
import { SnapshotDiffPreview } from './SnapshotDiffPreview';
import { BranchMergeDiffModal } from './BranchMergeDiffModal';

export function BranchAndSnapshotPanel() {
  const { project } = useProject();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    project.snapshots[0]?.id ?? ''
  );
  const [mergeSourceBranchId, setMergeSourceBranchId] = useState<string | null>(null);

  const selectedSnapshot = useMemo(
    () =>
      project.snapshots.find((s) => s.id === selectedSnapshotId) ??
      project.snapshots[0] ??
      null,
    [project.snapshots, selectedSnapshotId]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        <BranchListSection
          onOpenMergeDiff={(sourceId) => setMergeSourceBranchId(sourceId)}
        />
        <SnapshotTimelineSection
          selectedSnapshotId={selectedSnapshot?.id ?? ''}
          onSelectSnapshot={setSelectedSnapshotId}
        />
      </div>

      {selectedSnapshot && (
        <SnapshotDiffPreview
          snapshot={selectedSnapshot}
          currentScenes={project.scenes}
        />
      )}

      <BranchMergeDiffModal
        isOpen={mergeSourceBranchId !== null}
        initialSourceBranchId={mergeSourceBranchId ?? ''}
        onClose={() => setMergeSourceBranchId(null)}
      />
    </div>
  );
}
