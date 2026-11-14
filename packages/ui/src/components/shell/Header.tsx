import { useId, useRef, useState } from 'react';
import {
  Search,
  Sparkles,
  GitBranch,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { BreadcrumbBar } from './BreadcrumbBar';
import { SaveVerifyButton } from './SaveVerifyButton';
import { GitBranchPopover } from './GitBranchPopover';
import { BranchMergeDiffModal } from '../publishing/BranchMergeDiffModal';

export function Header() {
  const {
    project,
    totalWordCount,
    setShowPortal,
    setShowCommandPalette,
    showCopilot,
    setShowCopilot,
    settings,
    t,
  } = useProject();

  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [mergeSourceBranchId, setMergeSourceBranchId] = useState<string | null>(null);
  const branchBtnRef = useRef<HTMLButtonElement | null>(null);
  const branchPopoverId = useId();

  const activeBranch =
    project.branches.find((b) => b.id === project.activeBranchId)?.name ?? 'Principal';
  const pendingCount = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;

  return (
    <header
      style={{
        height: 46,
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Left: My Space Quick Button & Flexible Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: '1 1 0%',
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setShowPortal(true)}
          title={t.common.mySpace}
          aria-label={t.common.mySpace}
          style={{
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            color: 'var(--text-primary, #f1f5f9)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '5px 8px',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0,
          }}
        >
          <LayoutGrid size={13} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <span>{t.common.mySpace}</span>
        </button>

        <BreadcrumbBar />
      </div>

      {/* Center: Command Palette Search + Immediate Save & Verify Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setShowCommandPalette(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            width: 'clamp(140px, 22vw, 260px)',
            padding: '5px 10px',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: 12,
            cursor: 'pointer',
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Search size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.common.searchPlaceholder}
            </span>
          </span>
          <kbd
            style={{
              fontSize: 10,
              padding: '1px 5px',
              backgroundColor: 'var(--bg-hover, #1f273d)',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              borderRadius: 4,
              color: 'var(--text-primary, #f1f5f9)',
              flexShrink: 0,
            }}
          >
            {settings.shortcuts.commandPalette}
          </kbd>
        </button>

        <SaveVerifyButton />
      </div>

      {/* Right: Metrics, Branch Popover & Copilot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-secondary, #94a3b8)',
            padding: '4px 8px',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>
            {totalWordCount.toLocaleString('pt-BR')}
          </strong>{' '}
          / {project.wordCountGoal.toLocaleString('pt-BR')} {t.common.words}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            ref={branchBtnRef}
            type="button"
            onClick={() => setBranchPopoverOpen((prev) => !prev)}
            aria-expanded={branchPopoverOpen}
            aria-controls={branchPopoverId}
            title={`${t.views.versions}: ${activeBranch}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 9px',
              backgroundColor: branchPopoverOpen
                ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                : 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: branchPopoverOpen
                ? '1px solid var(--accent-primary, #3b82f6)'
                : '1px solid var(--border-subtle, var(--border, #263046))',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <GitBranch size={13} style={{ color: 'var(--accent-primary, #3b82f6)', flexShrink: 0 }} />
            <span
              style={{
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeBranch}
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  color: '#f59e0b',
                  padding: '0 5px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {pendingCount}
              </span>
            )}
            <ChevronDown size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          </button>

          <GitBranchPopover
            popoverId={branchPopoverId}
            isOpen={branchPopoverOpen}
            triggerRef={branchBtnRef}
            onClose={() => setBranchPopoverOpen(false)}
            onOpenMergeDiff={(sourceId) => {
              setBranchPopoverOpen(false);
              setMergeSourceBranchId(sourceId);
            }}
          />
        </div>

        {settings.copilotEnabled && (
          <button
            type="button"
            onClick={() => setShowCopilot(!showCopilot)}
            title={t.common.copilot}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              backgroundColor: showCopilot
                ? 'var(--accent-primary, #3b82f6)'
                : 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--accent-primary, #3b82f6)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: showCopilot ? '#ffffff' : 'var(--accent-primary, #3b82f6)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={13} /> {t.common.copilot}
          </button>
        )}
      </div>

      <BranchMergeDiffModal
        isOpen={mergeSourceBranchId !== null}
        initialSourceBranchId={mergeSourceBranchId ?? ''}
        onClose={() => setMergeSourceBranchId(null)}
      />
    </header>
  );
}
