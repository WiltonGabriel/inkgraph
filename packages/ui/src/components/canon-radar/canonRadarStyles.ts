import type React from 'react';

export const canonCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: 'var(--card-shadow, none)',
};

export const canonCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

export const canonCardTitleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 13.5,
  fontWeight: 700,
  color: 'var(--text-primary, #f1f5f9)',
};

export const canonLinkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  background: 'transparent',
  border: 'none',
  color: 'var(--accent-primary, #3b82f6)',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
};
