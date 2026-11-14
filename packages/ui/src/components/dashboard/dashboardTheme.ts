import type { CSSProperties } from 'react';
import type { AppSettings, SceneStatus } from '../../types/project';

export function isMotionEnabled(settings: Pick<AppSettings, 'reducedMotion' | 'enableAnimations' | 'lowPowerMode'>): boolean {
  return !settings.reducedMotion && settings.enableAnimations && !settings.lowPowerMode;
}

export function formatIsoDate(
  isoDate: string,
  dateFormat: AppSettings['dateFormat'] = 'DD/MM/YYYY'
): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  if (dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  return `${day}/${month}/${year}`;
}

export function formatShortDate(
  isoDate: string,
  dateFormat: AppSettings['dateFormat'] = 'DD/MM/YYYY'
): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [, month, day] = parts;
  if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}`;
  return `${day}/${month}`;
}

export interface VelocityBadge {
  label: string;
  color: string;
  softBg: string;
}

export function getVelocityBadge(words: number, dailyGoal: number): VelocityBadge {
  const goal = Math.max(1, dailyGoal);
  const ratio = words / goal;
  if (words <= 0) {
    return {
      label: 'Sem escrita',
      color: 'var(--text-muted, #64748b)',
      softBg: 'var(--bg-hover, rgba(100, 116, 139, 0.14))',
    };
  }
  if (ratio >= 1.2) {
    return {
      label: 'Meta superada',
      color: 'var(--success, #10b981)',
      softBg: 'color-mix(in srgb, var(--success, #10b981) 15%, transparent)',
    };
  }
  if (ratio >= 1) {
    return {
      label: 'Meta atingida',
      color: 'var(--success, #10b981)',
      softBg: 'color-mix(in srgb, var(--success, #10b981) 14%, transparent)',
    };
  }
  return {
    label: 'Em ritmo',
    color: 'var(--accent-primary, #3b82f6)',
    softBg: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
  };
}

export const SCENE_STATUS_META: Record<
  SceneStatus,
  { label: string; color: string; softBg: string }
> = {
  outline: {
    label: 'Contorno',
    color: 'var(--text-secondary, #94a3b8)',
    softBg: 'color-mix(in srgb, var(--text-secondary, #94a3b8) 14%, transparent)',
  },
  draft: {
    label: 'Rascunho',
    color: '#d97706',
    softBg: 'color-mix(in srgb, #f59e0b 16%, transparent)',
  },
  'first-draft': {
    label: '1º Rascunho',
    color: 'var(--accent-primary, #3b82f6)',
    softBg: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
  },
  revised: {
    label: 'Revisado',
    color: 'var(--success, #10b981)',
    softBg: 'color-mix(in srgb, var(--success, #10b981) 16%, transparent)',
  },
  final: {
    label: 'Final',
    color: '#8b5cf6',
    softBg: 'color-mix(in srgb, #8b5cf6 16%, transparent)',
  },
};

export const ACT_META: Record<
  1 | 2 | 3,
  { label: string; shortLabel: string; color: string; softBg: string }
> = {
  1: {
    label: 'Ato I — Preparação',
    shortLabel: 'Ato I',
    color: 'var(--accent-primary, #3b82f6)',
    softBg: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
  },
  2: {
    label: 'Ato II — Confronto',
    shortLabel: 'Ato II',
    color: '#d97706',
    softBg: 'color-mix(in srgb, #f59e0b 16%, transparent)',
  },
  3: {
    label: 'Ato III — Resolução',
    shortLabel: 'Ato III',
    color: 'var(--success, #10b981)',
    softBg: 'color-mix(in srgb, var(--success, #10b981) 16%, transparent)',
  },
};

export const DASHBOARD_CARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: 18,
  boxShadow: 'var(--card-shadow, none)',
};

export const DASHBOARD_SUBCARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md, 8px)',
};
