import { countWords, type ActDefinition, type Scene, type SceneStatus } from '../../types/project';
import { DEFAULT_ACTS } from '../../data/defaultWorkspaceConfig';
import { ACT_META, SCENE_STATUS_META } from './dashboardTheme';

export interface CompositionBreakdownItem {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  softBg: string;
  scenes: Scene[];
  words: number;
  pctManuscript: number;
  xPercent: number;
  targetView: 'plotboard' | 'manuscript';
}

const STATUS_ORDER: SceneStatus[] = [
  'outline',
  'draft',
  'first-draft',
  'revised',
  'final',
];

export function buildActBreakdowns(
  scenes: Scene[],
  totalWordCount: number,
  acts: ActDefinition[] = DEFAULT_ACTS
): CompositionBreakdownItem[] {
  const orderedActs = [...acts].sort((a, b) => a.number - b.number);
  const count = Math.max(1, orderedActs.length);
  return orderedActs.map((actDef, idx) => {
    const filtered = scenes.filter((s) => s.act === actDef.number);
    const words = filtered.reduce((acc, s) => acc + countWords(s.content), 0);
    const pctManuscript =
      totalWordCount > 0
        ? Math.round((words / totalWordCount) * 100)
        : scenes.length > 0
          ? Math.round((filtered.length / scenes.length) * 100)
          : 0;
    const meta = ACT_META[actDef.number as 1 | 2 | 3];
    const color = actDef.color || meta?.color || '#6366f1';
    return {
      key: `act-${actDef.number}`,
      title: actDef.title || meta?.label || `Ato ${actDef.number}`,
      subtitle: `${meta?.shortLabel ?? `Ato ${actDef.number}`} (${filtered.length})`,
      color,
      softBg: meta?.softBg ?? 'rgba(99, 102, 241, 0.14)',
      scenes: filtered,
      words,
      pctManuscript,
      xPercent: ((idx + 0.5) / count) * 100,
      targetView: 'plotboard',
    };
  });
}

export function buildStatusBreakdowns(
  scenes: Scene[],
  totalWordCount: number
): CompositionBreakdownItem[] {
  return STATUS_ORDER.map((status, idx) => {
    const filtered = scenes.filter((s) => s.status === status);
    const words = filtered.reduce((acc, s) => acc + countWords(s.content), 0);
    const pctManuscript =
      totalWordCount > 0
        ? Math.round((words / totalWordCount) * 100)
        : scenes.length > 0
          ? Math.round((filtered.length / scenes.length) * 100)
          : 0;
    const meta = SCENE_STATUS_META[status];
    return {
      key: `status-${status}`,
      title: `Status: ${meta.label}`,
      subtitle: meta.label,
      color: meta.color,
      softBg: meta.softBg,
      scenes: filtered,
      words,
      pctManuscript,
      xPercent: ((idx + 0.5) / STATUS_ORDER.length) * 100,
      targetView: filtered.length > 0 ? 'manuscript' : 'plotboard',
    };
  });
}
