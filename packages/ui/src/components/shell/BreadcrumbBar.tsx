import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
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
    notify,
    settings,
    t,
  } = useProject();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dblClickTimerRef = useRef<number | null>(null);

  const [containerWidth, setContainerWidth] = useState(640);
  const [isEditing, setIsEditing] = useState(false);
  const [ellipsisOpen, setEllipsisOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rootHovered, setRootHovered] = useState(false);

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
    return () => {
      if (dblClickTimerRef.current !== null) window.clearTimeout(dblClickTimerRef.current);
    };
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
    if (dblClickTimerRef.current !== null) {
      window.clearTimeout(dblClickTimerRef.current);
      dblClickTimerRef.current = null;
    }
    setEllipsisOpen(false);
    setIsEditing(true);
  };

  const handleRootClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (e.detail === 3) {
      e.preventDefault();
      e.stopPropagation();
      enterEditMode();
      return;
    }
    if (e.detail === 2) {
      if (dblClickTimerRef.current !== null) window.clearTimeout(dblClickTimerRef.current);
      dblClickTimerRef.current = window.setTimeout(() => {
        dblClickTimerRef.current = null;
        setShowPortal(true);
        onHomeSegmentClick?.();
      }, 210);
    }
  };

  const handleCopyPath = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(canonicalPath);
    setCopied(true);
    notify(isEn ? 'Path copied to clipboard' : 'Caminho copiado', 'info');
    window.setTimeout(() => setCopied(false), 1400);
  };

  const isNarrow = containerWidth > 0 && containerWidth < 560;
  const totalWithRoot = 1 + segments.length;
  const shouldCollapse =
    (totalWithRoot > 3 && segments.length >= 3) || (isNarrow && segments.length >= 2);
  const hiddenCount = shouldCollapse
    ? isNarrow
      ? segments.length - 1
      : segments.length - 2
    : 0;
  const hiddenSegments = hiddenCount > 0 ? segments.slice(0, hiddenCount) : [];
  const visibleSegments = hiddenCount > 0 ? segments.slice(hiddenCount) : segments;

  return (
    <nav
      ref={containerRef}
      aria-label="Caminho de navegação"
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
          <div
            onMouseEnter={() => setRootHovered(true)}
            onMouseLeave={() => setRootHovered(false)}
            style={rootCapsuleStyle}
          >
            <span
              onClick={handleRootClick}
              title={
                isEn
                  ? 'Double-click for My Space · Triple-click to edit path'
                  : 'Clique 2× para Meu Espaço · Clique 3× para editar caminho'
              }
              style={rootLabelStyle}
            >
              InkGraph
            </span>
            <button
              type="button"
              onClick={handleCopyPath}
              title={isEn ? 'Copy current path' : 'Copiar caminho atual'}
              aria-label={isEn ? 'Copy current path' : 'Copiar caminho atual'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                padding: 2,
                borderRadius: 4,
                color: copied ? '#10b981' : 'var(--text-muted, #64748b)',
                opacity: rootHovered || copied ? 1 : 0.38,
                transition: settings.reducedMotion ? 'none' : 'opacity 0.15s ease',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>

          {hiddenSegments.length > 0 && (
            <>
              <span style={separatorStyle}>/</span>
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
            </>
          )}

          {visibleSegments.map((seg, idx) => {
            const isLast = idx === visibleSegments.length - 1;
            const clickable = Boolean(seg.onClick);
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
                <span style={separatorStyle}>/</span>
                {clickable ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.detail === 3) {
                        enterEditMode();
                        return;
                      }
                      seg.onClick?.();
                    }}
                    title={seg.label}
                    style={segmentBtnStyle(isLast, true)}
                  >
                    {seg.label}
                  </button>
                ) : (
                  <span title={seg.label} style={segmentBtnStyle(isLast, false)}>
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

const rootCapsuleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 7px',
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  flexShrink: 0,
};

const rootLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: '0.03em',
  color: 'var(--text-primary, #f1f5f9)',
  userSelect: 'text',
  WebkitUserSelect: 'text',
  cursor: 'pointer',
};

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
