import { useMemo, type ReactNode } from 'react';
import { Eye, Lock, StickyNote } from 'lucide-react';
import type { AppSettings, ProjectData } from '../../types/project';
import {
  formatSmartTypography,
  parseManuscriptMarkdown,
} from './markdownPreviewParser';

interface ManuscriptMarkdownPreviewProps {
  content: string;
  project: ProjectData;
  settings: AppSettings;
  onToggleChecklistLine?: (lineIndex: number) => void;
}

const PREVIEW_FONTS: Record<AppSettings['editorFont'], string> = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMentionRegex(project: ProjectData): RegExp {
  const tags: string[] = [];
  for (const c of project.characters) {
    if (c.name?.trim()) tags.push(`@${c.name.trim()}`);
  }
  for (const w of project.worlds) {
    for (const l of w.locations) {
      if (l.name?.trim()) tags.push(`#${l.name.trim()}`);
    }
  }
  for (const f of project.factions) {
    if (f.name?.trim()) tags.push(`&${f.name.trim()}`);
  }
  for (const o of project.objects) {
    if (o.name?.trim()) tags.push(`!${o.name.trim()}`);
  }

  const uniqueTags = Array.from(new Set(tags)).sort((a, b) => b.length - a.length);
  const entityAlternation =
    uniqueTags.length > 0 ? `${uniqueTags.map(escapeRegExp).join('|')}|` : '';
  const basePattern = `(\\*\\*[^*\\n]+\\*\\*|\\*[^*\\n]+\\*|\`[^\`\\n]+\`|${entityAlternation}[@#&!][\\p{L}\\p{N}_-]+)`;

  try {
    return new RegExp(basePattern, 'gu');
  } catch {
    return /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|[@#&!][\p{L}\p{N}_-]+)/gu;
  }
}

function renderInlineProse(
  rawText: string,
  mentionRegex: RegExp,
  smartTypography: boolean
): ReactNode[] {
  const text = formatSmartTypography(rawText, smartTypography);
  const nodes: ReactNode[] = [];
  let lastIdx = 0;
  mentionRegex.lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    const key = `tok_${keyCounter++}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          style={{
            fontFamily: PREVIEW_FONTS.mono,
            fontSize: '0.88em',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      const prefix = token[0];
      const badgeStyles: Record<string, { color: string; bg: string }> = {
        '@': { color: 'var(--accent-primary)', bg: 'var(--accent-soft)' },
        '#': { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 14%, transparent)' },
        '&': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
        '!': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.14)' },
      };
      const palette = badgeStyles[prefix] ?? badgeStyles['@'];
      nodes.push(
        <span
          key={key}
          style={{
            color: palette.color,
            backgroundColor: palette.bg,
            borderRadius: '4px',
            padding: '0 4px',
            fontWeight: 500,
          }}
        >
          {token}
        </span>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

export function ManuscriptMarkdownPreview({
  content,
  project,
  settings,
  onToggleChecklistLine,
}: ManuscriptMarkdownPreviewProps) {
  const blocks = useMemo(() => parseManuscriptMarkdown(content), [content]);
  const mentionRegex = useMemo(() => buildMentionRegex(project), [project]);
  const smart = settings.editorSmartTypography;
  const maxWidth = settings.zenMode ? '760px' : `${settings.editorMaxWidthCh || 74}ch`;
  const paragraphGap = `${settings.editorParagraphSpacingPx ?? 10}px`;

  return (
    <div
      aria-label="Pré-visualização literária da cena"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '28px 32px',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: PREVIEW_FONTS[settings.editorFont] ?? PREVIEW_FONTS.serif,
        fontSize: `${settings.editorFontSize || 17}px`,
        lineHeight: settings.editorLineHeight || 1.8,
        textAlign: settings.editorTextAlign || 'left',
      }}
    >
      <div style={{ maxWidth, margin: '0 auto' }}>
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Nenhum conteúdo escrito nesta cena ainda.
          </p>
        ) : (
          blocks.map((block, idx) => {
            if (block.kind === 'heading') {
              const sizes = { 1: '1.5em', 2: '1.25em', 3: '1.08em' };
              const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
              return (
                <Tag
                  key={idx}
                  style={{
                    fontSize: sizes[block.level],
                    fontWeight: 700,
                    margin: `0 0 ${paragraphGap} 0`,
                    marginTop: idx === 0 ? 0 : '0.8em',
                    color: 'var(--text-primary)',
                    textWrap: 'balance',
                  }}
                >
                  {renderInlineProse(block.text, mentionRegex, smart)}
                </Tag>
              );
            }

            if (block.kind === 'divider') {
              return (
                <div
                  key={idx}
                  role="separator"
                  aria-orientation="horizontal"
                  style={{
                    textAlign: 'center',
                    margin: '1.6em 0',
                    color: 'var(--accent-primary)',
                    letterSpacing: '0.45em',
                    fontSize: '0.9em',
                    opacity: 0.8,
                    userSelect: 'none',
                  }}
                >
                  ✦ ✦ ✦
                </div>
              );
            }

            if (block.kind === 'callout') {
              const isSecret = block.tone === 'secret';
              const accent = isSecret ? '#f59e0b' : 'var(--accent-primary)';
              const Icon = isSecret ? Lock : StickyNote;
              return (
                <aside
                  key={idx}
                  style={{
                    margin: `0 0 ${paragraphGap} 0`,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${accent}`,
                    fontFamily: 'var(--ui-font)',
                    fontSize: '0.88em',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      color: accent,
                      marginBottom: block.lines.length > 0 ? 4 : 0,
                      fontSize: '0.86em',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Icon size={13} aria-hidden="true" />
                    <span>{isSecret ? 'Segredo Epistêmico' : 'Nota do Autor'}</span>
                  </div>
                  {block.lines.map((line, lIdx) => (
                    <p key={lIdx} style={{ margin: '2px 0', color: 'var(--text-secondary)' }}>
                      {renderInlineProse(line, mentionRegex, smart)}
                    </p>
                  ))}
                </aside>
              );
            }

            if (block.kind === 'blockquote') {
              return (
                <blockquote
                  key={idx}
                  style={{
                    margin: `0 0 ${paragraphGap} 0`,
                    padding: '6px 16px',
                    borderLeft: '3px solid var(--accent-primary)',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  {block.lines.map((line, lIdx) => (
                    <p key={lIdx} style={{ margin: '2px 0', textWrap: 'pretty' }}>
                      {renderInlineProse(line, mentionRegex, smart)}
                    </p>
                  ))}
                </blockquote>
              );
            }

            if (block.kind === 'checklist') {
              return (
                <ul
                  key={idx}
                  style={{
                    listStyle: 'none',
                    margin: `0 0 ${paragraphGap} 0`,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {block.items.map((item) => (
                    <li key={item.lineIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled={!onToggleChecklistLine}
                        onChange={() => onToggleChecklistLine?.(item.lineIndex)}
                        aria-label={item.text}
                        style={{ accentColor: 'var(--accent-primary)', cursor: onToggleChecklistLine ? 'pointer' : 'default' }}
                      />
                      <span
                        style={{
                          textDecoration: item.checked ? 'line-through' : 'none',
                          color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {renderInlineProse(item.text, mentionRegex, smart)}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (block.kind === 'list') {
              const ListTag = block.ordered ? 'ol' : 'ul';
              return (
                <ListTag
                  key={idx}
                  style={{
                    margin: `0 0 ${paragraphGap} 0`,
                    paddingLeft: '1.5em',
                  }}
                >
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx} style={{ marginBottom: 4, textWrap: 'pretty' }}>
                      {renderInlineProse(item, mentionRegex, smart)}
                    </li>
                  ))}
                </ListTag>
              );
            }

            if (block.kind === 'directive') {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    margin: `0 0 ${paragraphGap} 0`,
                    padding: '3px 9px',
                    borderRadius: 999,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--ui-font)',
                    fontSize: '0.75em',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Eye size={12} aria-hidden="true" />
                  <span>
                    {block.kindName === 'epistemic-reveal' ? 'Revelação' : 'Batida'}:{' '}
                    {block.attrs}
                  </span>
                </div>
              );
            }

            return (
              <p
                key={idx}
                style={{
                  margin: `0 0 ${paragraphGap} 0`,
                  textIndent: settings.paragraphIndent ? '2em' : 0,
                  textWrap: 'pretty',
                }}
              >
                {renderInlineProse(block.text, mentionRegex, smart)}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}
