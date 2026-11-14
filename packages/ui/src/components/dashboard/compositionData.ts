import { countWords, type Scene, type SceneStatus } from '../../types/project';
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
  totalWordCount: number
): CompositionBreakdownItem[] {
  const acts: (1 | 2 | 3)[] = [1, 2, 3];
  return acts.map((act, idx) => {
    const filtered = scenes.filter((s) => s.act === act);
    const words = filtered.reduce((acc, s) => acc + countWords(s.content), 0);
    const pctManuscript =
      totalWordCount > 0
        ? Math.round((words / totalWordCount) * 100)
        : scenes.length > 0
          ? Math.round((filtered.length / scenes.length) * 100)
          : 0;
    const meta = ACT_META[act];
    return {
      key: `act-${act}`,
      title: meta.label,
      subtitle: `${meta.shortLabel} (${filtered.length})`,
      color: meta.color,
      softBg: meta.softBg,
      scenes: filtered,
      words,
      pctManuscript,
      xPercent: ((idx + 0.5) / 3) * 100,
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
