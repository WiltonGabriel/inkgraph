import type { CSSProperties } from 'react';

export const COPILOT_VAR = {
  bgCanvas: 'var(--bg-canvas, var(--bg-primary, #0b0e16))',
  bgSurface: 'var(--bg-surface, var(--bg-secondary, #111623))',
  bgElevated: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  borderSubtle: 'var(--border-subtle, var(--border, #263046))',
  textPrimary: 'var(--text-primary, #f1f5f9)',
  textSecondary: 'var(--text-secondary, #94a3b8)',
  textMuted: 'var(--text-muted, #64748b)',
  accentPrimary: 'var(--accent-primary, #3b82f6)',
  accentSoft: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
  radiusSm: 'var(--radius-sm, 6px)',
  radiusMd: 'var(--radius-md, 8px)',
} as const;

export const TONE = {
  successBg: 'color-mix(in srgb, #10b981 14%, transparent)',
  successBorder: 'color-mix(in srgb, #10b981 36%, transparent)',
  successText: 'color-mix(in srgb, #10b981 74%, var(--text-primary, #f1f5f9))',
  warnBg: 'color-mix(in srgb, #f59e0b 15%, transparent)',
  warnBorder: 'color-mix(in srgb, #f59e0b 40%, transparent)',
  warnText: 'color-mix(in srgb, #d97706 72%, var(--text-primary, #f1f5f9))',
  dangerBg: 'color-mix(in srgb, #ef4444 15%, transparent)',
  dangerBorder: 'color-mix(in srgb, #ef4444 40%, transparent)',
  dangerText: 'color-mix(in srgb, #ef4444 74%, var(--text-primary, #f1f5f9))',
} as const;

export interface StatusTone {
  label: string;
  bg: string;
  border: string;
  text: string;
}

const STATUS_MAP: Record<string, StatusTone> = {
  canon: { label: 'Cânone', bg: TONE.successBg, border: TONE.successBorder, text: TONE.successText },
  final: { label: 'Final', bg: TONE.successBg, border: TONE.successBorder, text: TONE.successText },
  provisional: { label: 'Provisório', bg: TONE.warnBg, border: TONE.warnBorder, text: TONE.warnText },
  warning: { label: 'Alerta', bg: TONE.dangerBg, border: TONE.dangerBorder, text: TONE.dangerText },
  draft: { label: 'Rascunho', bg: COPILOT_VAR.bgSurface, border: COPILOT_VAR.borderSubtle, text: COPILOT_VAR.textSecondary },
  outline: { label: 'Esboço', bg: COPILOT_VAR.bgSurface, border: COPILOT_VAR.borderSubtle, text: COPILOT_VAR.textMuted },
  'first-draft': { label: '1º Rascunho', bg: COPILOT_VAR.accentSoft, border: 'color-mix(in srgb, var(--accent-primary, #3b82f6) 35%, transparent)', text: COPILOT_VAR.accentPrimary },
  revised: { label: 'Revisado', bg: COPILOT_VAR.accentSoft, border: 'color-mix(in srgb, var(--accent-primary, #3b82f6) 35%, transparent)', text: COPILOT_VAR.accentPrimary },
};

export function getStatusTone(status: string): StatusTone {
  return (
    STATUS_MAP[status] ?? {
      label: status,
      bg: COPILOT_VAR.bgSurface,
      border: COPILOT_VAR.borderSubtle,
      text: COPILOT_VAR.textSecondary,
    }
  );
}

export const detailsCardStyle: CSSProperties = {
  backgroundColor: COPILOT_VAR.bgElevated,
  border: `1px solid ${COPILOT_VAR.borderSubtle}`,
  borderRadius: COPILOT_VAR.radiusSm,
  overflow: 'hidden',
};

export const summaryRowStyle: CSSProperties = {
  listStyle: 'none',
  cursor: 'pointer',
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
  userSelect: 'none',
};
