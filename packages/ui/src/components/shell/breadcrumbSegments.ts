import type { AppDictionary } from '../../i18n/translations';
import { BREADCRUMB_TARGETS } from '../../domain/breadcrumbResolver';
import type { ViewId } from '../../types/project';

export interface BreadcrumbSegment {
  id: string;
  label: string;
  onClick?: () => void;
}

interface BuildSegmentsParams {
  showPortal: boolean;
  modeLabel?: string;
  onHomeSegmentClick?: () => void;
  projectTitle: string;
  activeView: ViewId;
  activeSubPath: string;
  t: AppDictionary;
  onGoWorkspaceHome: () => void;
  onClearSubPath: () => void;
}

export function buildBreadcrumbSegments({
  showPortal,
  modeLabel,
  onHomeSegmentClick,
  projectTitle,
  activeView,
  activeSubPath,
  t,
  onGoWorkspaceHome,
  onClearSubPath,
}: BuildSegmentsParams): BreadcrumbSegment[] {
  if (showPortal) {
    const list: BreadcrumbSegment[] = [
      {
        id: 'home',
        label: t.home.title,
        onClick: modeLabel && onHomeSegmentClick ? onHomeSegmentClick : undefined,
      },
    ];
    if (modeLabel) {
      list.push({ id: 'mode', label: modeLabel });
    } else if (activeSubPath) {
      list.push({ id: 'sub', label: activeSubPath });
    }
    return list;
  }

  const list: BreadcrumbSegment[] = [
    {
      id: 'workspace',
      label: projectTitle || 'Workspace',
      onClick: onGoWorkspaceHome,
    },
    {
      id: 'view',
      label: t.views[activeView] ?? activeView,
      onClick: activeSubPath ? onClearSubPath : undefined,
    },
  ];

  if (activeSubPath) {
    list.push({ id: 'sub', label: activeSubPath });
  }

  return list;
}

export function resolveCanonicalBreadcrumbPath(
  showPortal: boolean,
  modeLabel: string | undefined,
  homeTitle: string,
  viewsDict: Record<string, string>,
  activeView: ViewId,
  activeSubPath: string
): string {
  if (showPortal) {
    return modeLabel
      ? `InkGraph / ${homeTitle} / ${modeLabel}`
      : `InkGraph / ${homeTitle}`;
  }

  const exact = BREADCRUMB_TARGETS.find(
    (item) => item.view === activeView && (item.subPath ?? '') === activeSubPath
  );
  if (exact) return exact.canonicalPath;

  const base = BREADCRUMB_TARGETS.find((item) => item.view === activeView && !item.subPath);
  if (base && activeSubPath) return `${base.canonicalPath} / ${activeSubPath}`;
  if (base) return base.canonicalPath;

  return ['InkGraph', viewsDict[activeView] ?? activeView, activeSubPath]
    .filter(Boolean)
    .join(' / ');
}
