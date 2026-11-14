import { useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { BreadcrumbPathEditor } from './BreadcrumbPathEditor';
import { BreadcrumbOverflowMenu } from './BreadcrumbOverflowMenu';
import {
  buildBreadcrumbSegments,
  resolveCanonicalBreadcrumbPath,
} from './breadcrumbSegments';

interface BreadcrumbBarProps {
  modeLabel?: string;
  onHomeSegmentClick?: () => void;
}

export function BreadcrumbBar({ modeLabel, onHomeSegmentClick }: BreadcrumbBarProps) {
  const {
    project,
    showPortal,
    setShowPortal,
    activeView,
    setActiveView,
    activeSubPath,
    setActiveSubPath,
    navigationHistory,
    navigateToBreadcrumbPath,
    settings,
    t,
  } = useProject();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [containerWidth, setContainerWidth] = useState(640);
  const [isEditing, setIsEditing] = useState(false);
  const [ellipsisOpen, setEllipsisOpen] = useState(false);

  const isEn = settings.language === 'en';

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    setContainerWidth(el.getBoundingClientRect().width || 640);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ellipsisOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEllipsisOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEllipsisOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ellipsisOpen]);

  const segments = useMemo(
    () =>
      buildBreadcrumbSegments({
        showPortal,
        modeLabel,
        onHomeSegmentClick,
        projectTitle: project.title,
        activeView,
        activeSubPath,
        t,
        onGoWorkspaceHome: () => {
          setShowPortal(false);
          setActiveView('dashboard');
        },
        onClearSubPath: () => setActiveSubPath(''),
      }),
    [
      showPortal,
      modeLabel,
      onHomeSegmentClick,
      project.title,
      activeView,
      activeSubPath,
      t,
      setShowPortal,
      setActiveView,
      setActiveSubPath,
    ]
  );

  const canonicalPath = useMemo(
    () =>
      resolveCanonicalBreadcrumbPath(
        showPortal,
        modeLabel,
        t.home.title,
        t.views,
        activeView,
        activeSubPath
      ),
    [showPortal, modeLabel, t.home.title, t.views, activeView, activeSubPath]
  );

  const enterEditMode = () => {
    setEllipsisOpen(false);
    setIsEditing(true);
  };

  const isNarrow = containerWidth > 0 && containerWidth < 460;
  const shouldCollapse =
    segments.length >= 3 && (isNarrow || segments.length > 3);
  const hiddenCount = shouldCollapse
    ? isNarrow
      ? segments.length - 1
      : segments.length - 2
    : 0;
  const hiddenSegments = hiddenCount > 0 ? segments.slice(0, hiddenCount) : [];
  const visibleSegments = hiddenCount > 0 ? segments.slice(hiddenCount) : segments;

  const tripleClickHint = isEn
    ? 'Triple-click to edit path directly'
    : 'Clique 3× para editar o caminho';

  return (
    <nav
      ref={containerRef}
      aria-label="Caminho de navegação"
      title={tripleClickHint}
      onClick={(e) => {
        if (e.detail === 3) {
          e.preventDefault();
          enterEditMode();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: '1 1 0%',
        minWidth: 0,
        position: 'relative',
        gap: 4,
      }}
    >
      {isEditing ? (
        <BreadcrumbPathEditor
          initialPath={canonicalPath}
          navigationHistory={navigationHistory}
          onSubmitPath={navigateToBreadcrumbPath}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 0,
            width: '100%',
            overflow: 'visible',
          }}
        >
          {hiddenSegments.length > 0 && (
            <BreadcrumbOverflowMenu
              hiddenSegments={hiddenSegments}
              isOpen={ellipsisOpen}
              isEn={isEn}
              onToggle={() => setEllipsisOpen((prev) => !prev)}
              onSelectSegment={(seg) => {
                setEllipsisOpen(false);
                seg.onClick?.();
              }}
            />
          )}

          {visibleSegments.map((seg, idx) => {
            const isLast = idx === visibleSegments.length - 1;
            const clickable = Boolean(seg.onClick);
            const showDivider = idx > 0 || hiddenSegments.length > 0;
            return (
              <div
                key={seg.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 0,
                  flexShrink: isLast ? 1 : 2,
                }}
              >
                {showDivider && <span style={separatorStyle}>/</span>}
                {clickable ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.detail === 3) {
                        e.preventDefault();
                        enterEditMode();
                        return;
                      }
                      seg.onClick?.();
                    }}
                    title={`${seg.label} (${tripleClickHint})`}
                    style={segmentBtnStyle(isLast, true)}
                  >
                    {seg.label}
                  </button>
                ) : (
                  <span
                    title={`${seg.label} (${tripleClickHint})`}
                    style={segmentBtnStyle(isLast, false)}
                  >
                    {seg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}

const separatorStyle: React.CSSProperties = {
  color: 'var(--text-muted, #64748b)',
  fontSize: 11.5,
  userSelect: 'none',
  flexShrink: 0,
};

const segmentBtnStyle = (isLast: boolean, clickable: boolean): React.CSSProperties => ({
  background: 'transparent',
  border: 'none',
  padding: '3px 5px',
  borderRadius: 'var(--radius-sm, 6px)',
  color: isLast
    ? 'var(--text-primary, #f1f5f9)'
    : 'var(--text-secondary, #94a3b8)',
  fontSize: 12,
  fontWeight: isLast ? 600 : 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
  cursor: clickable ? 'pointer' : 'default',
});
