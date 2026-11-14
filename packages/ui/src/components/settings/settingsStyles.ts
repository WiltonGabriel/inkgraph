import type { CSSProperties } from 'react';

export const THEME_VAR = {
  bgCanvas: 'var(--bg-canvas, var(--bg-primary))',
  bgSurface: 'var(--bg-surface, var(--bg-secondary))',
  bgElevated: 'var(--bg-elevated, var(--bg-card))',
  bgHover: 'var(--bg-hover, var(--bg-card))',
  borderSubtle: 'var(--border-subtle, var(--border))',
  textPrimary: 'var(--text-primary, var(--text-main))',
  textSecondary: 'var(--text-secondary, var(--text-muted))',
  textMuted: 'var(--text-muted)',
  accentPrimary: 'var(--accent-primary, var(--accent))',
  accentSoft: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
  radiusSm: 'var(--radius-sm, 6px)',
  radiusMd: 'var(--radius-md, 8px)',
  radiusLg: 'var(--radius-lg, 12px)',
  cardShadow: 'var(--card-shadow, none)',
} as const;

export const sectionCardStyle: CSSProperties = {
  background: THEME_VAR.bgSurface,
  border: `1px solid ${THEME_VAR.borderSubtle}`,
  borderRadius: THEME_VAR.radiusMd,
  boxShadow: THEME_VAR.cardShadow,
  padding: '1.15rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
};

export const innerCardStyle: CSSProperties = {
  background: THEME_VAR.bgElevated,
  border: `1px solid ${THEME_VAR.borderSubtle}`,
  borderRadius: THEME_VAR.radiusSm,
  padding: '0.7rem 0.85rem',
};

export const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontWeight: 600,
  fontSize: '0.88rem',
  color: THEME_VAR.textPrimary,
};

export const fieldColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontSize: '0.8rem',
};

export const fieldLabelTextStyle: CSSProperties = {
  color: THEME_VAR.textSecondary,
  fontWeight: 500,
};

export const controlInputStyle: CSSProperties = {
  background: THEME_VAR.bgElevated,
  border: `1px solid ${THEME_VAR.borderSubtle}`,
  borderRadius: THEME_VAR.radiusSm,
  padding: '0.48rem 0.65rem',
  color: THEME_VAR.textPrimary,
  fontSize: '0.82rem',
  width: '100%',
};

export const checkboxLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.55rem',
  fontSize: '0.82rem',
  color: THEME_VAR.textPrimary,
  cursor: 'pointer',
};

export const checkboxInputStyle: CSSProperties = {
  accentColor: THEME_VAR.accentPrimary,
  width: 15,
  height: 15,
  cursor: 'pointer',
  flexShrink: 0,
};

export const secondaryButtonStyle: CSSProperties = {
  background: THEME_VAR.bgElevated,
  border: `1px solid ${THEME_VAR.borderSubtle}`,
  borderRadius: THEME_VAR.radiusSm,
  padding: '0.45rem 0.85rem',
  fontSize: '0.79rem',
  fontWeight: 600,
  color: THEME_VAR.textPrimary,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

export const primaryButtonStyle: CSSProperties = {
  background: THEME_VAR.accentPrimary,
  border: '1px solid transparent',
  borderRadius: THEME_VAR.radiusSm,
  padding: '0.45rem 0.95rem',
  fontSize: '0.79rem',
  fontWeight: 600,
  color: '#ffffff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};
