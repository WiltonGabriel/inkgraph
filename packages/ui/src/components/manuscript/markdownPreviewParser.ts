export type PreviewBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'divider' }
  | { kind: 'callout'; tone: 'note' | 'secret'; lines: string[] }
  | { kind: 'blockquote'; lines: string[] }
  | { kind: 'checklist'; items: { lineIndex: number; checked: boolean; text: string }[] }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'directive'; kindName: string; attrs: string }
  | { kind: 'paragraph'; text: string };

/** Applies smart literary typography (em-dashes and curly quotes) when enabled. */
export function formatSmartTypography(text: string, enabled: boolean): string {
  if (!enabled) return text;
  return text
    .replace(/\s--\s/g, ' — ')
    .replace(/--/g, '—')
    .replace(/(^|[\s(\[—])"([^\n"]*?)"/g, '$1“$2”');
}

/**
 * Strips author comments (%%...%%) while keeping line numbers mapped cleanly
 * for checklist toggling when possible.
 */
function stripAuthorComments(source: string): string {
  const withoutMultiLine = source.replace(/%%[\s\S]*?%%/g, (match) => {
    const newlines = match.match(/\n/g)?.length ?? 0;
    return '\n'.repeat(newlines);
  });
  return withoutMultiLine;
}

/** Parses literary Markdown prose into structured blocks for Formatted Reading & Split preview. */
export function parseManuscriptMarkdown(source: string): PreviewBlock[] {
  const cleaned = stripAuthorComments(source);
  const rawLines = cleaned.split(/\r?\n/);
  const blocks: PreviewBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: 'divider' });
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        kind: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      i += 1;
      continue;
    }

    const directiveMatch = trimmed.match(/^::(beat|epistemic-reveal)\{(.*)\}$/);
    if (directiveMatch) {
      blocks.push({
        kind: 'directive',
        kindName: directiveMatch[1],
        attrs: directiveMatch[2],
      });
      i += 1;
      continue;
    }

    const standaloneCallout = trimmed.match(/^\[!(NOTA|SEGREDO)\]\s*(.*)$/i);
    if (standaloneCallout) {
      const tone = standaloneCallout[1].toUpperCase() === 'SEGREDO' ? 'secret' : 'note';
      const lines: string[] = [];
      if (standaloneCallout[2]) lines.push(standaloneCallout[2]);
      i += 1;
      while (i < rawLines.length && rawLines[i].trim() && !/^(#{1,3}\s|>|\*{3}|-{3}|-\s\[[ xX]\])/.test(rawLines[i].trim())) {
        lines.push(rawLines[i].trim());
        i += 1;
      }
      blocks.push({ kind: 'callout', tone, lines });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const firstLine = quoteLines[0] ?? '';
      const calloutHeader = firstLine.match(/^\[!(NOTA|SEGREDO)\]\s*(.*)$/i);
      if (calloutHeader) {
        const tone = calloutHeader[1].toUpperCase() === 'SEGREDO' ? 'secret' : 'note';
        const bodyLines = [
          ...(calloutHeader[2] ? [calloutHeader[2]] : []),
          ...quoteLines.slice(1),
        ];
        blocks.push({ kind: 'callout', tone, lines: bodyLines });
      } else {
        blocks.push({ kind: 'blockquote', lines: quoteLines });
      }
      continue;
    }

    if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items: { lineIndex: number; checked: boolean; text: string }[] = [];
      while (i < rawLines.length) {
        const match = rawLines[i].trim().match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
        if (!match) break;
        items.push({
          lineIndex: i,
          checked: match[1].toLowerCase() === 'x',
          text: match[2],
        });
        i += 1;
      }
      blocks.push({ kind: 'checklist', items });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const match = rawLines[i].trim().match(/^[-*]\s+(.*)$/);
        if (!match || /^\[[ xX]\]\s+/.test(match[1])) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ kind: 'list', ordered: false, items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const match = rawLines[i].trim().match(/^\d+\.\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ kind: 'list', ordered: true, items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < rawLines.length) {
      const candidate = rawLines[i].trim();
      if (
        !candidate ||
        /^(#{1,3}\s|>|\[!(?:NOTA|SEGREDO)\]|::(?:beat|epistemic-reveal)\{|(\*{3,}|-{3,}|_{3,})$|[-*]\s+|\d+\.\s+)/i.test(
          candidate
        )
      ) {
        break;
      }
      paraLines.push(candidate);
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}
