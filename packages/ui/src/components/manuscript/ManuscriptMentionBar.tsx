import { AtSign, Box, Hash, Shield } from 'lucide-react';
import type { DetectedSceneMentions } from './manuscriptMentions';

interface ManuscriptMentionBarProps {
  mentions: DetectedSceneMentions;
}

export function ManuscriptMentionBar({ mentions }: ManuscriptMentionBarProps) {
  return (
    <div
      style={{
        padding: '6px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        minHeight: 32,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 2 }}>
        Menções (@Personagem #Local &Facção !Objeto):
      </span>
      {mentions.chars.map((c) => (
        <span
          key={c.id}
          style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 999,
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <AtSign size={10} aria-hidden="true" /> {c.name}
        </span>
      ))}
      {mentions.locs.map((l) => (
        <span
          key={l.id}
          style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 999,
            backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
            color: 'var(--success)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Hash size={10} aria-hidden="true" /> {l.name}
        </span>
      ))}
      {mentions.factions.map((f) => (
        <span
          key={f.id}
          style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 999,
            backgroundColor: 'rgba(245, 158, 11, 0.14)',
            color: '#f59e0b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Shield size={10} aria-hidden="true" /> {f.name}
        </span>
      ))}
      {mentions.objects.map((o) => (
        <span
          key={o.id}
          style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 999,
            backgroundColor: 'rgba(168, 85, 247, 0.14)',
            color: '#a855f7',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Box size={10} aria-hidden="true" /> {o.name}
        </span>
      ))}
    </div>
  );
}
