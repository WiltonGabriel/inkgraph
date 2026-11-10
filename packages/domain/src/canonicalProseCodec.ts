export interface CanonicalDirective {
  readonly kind: 'beat' | 'epistemic-reveal';
  readonly attributes: Record<string, string>;
  readonly body: string;
}

export interface EpistemicRevealMarker {
  readonly entity: string;
  readonly secret: string;
  readonly mode: string;
  readonly body: string;
}

function parseAttributes(rawAttrs: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    if (match[1]) {
      attrs[match[1]] = match[2] ?? '';
    }
  }
  return attrs;
}

function formatAttributes(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${v.replace(/"/g, "'")}"`)
    .join(' ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

function unescapeInlineHtml(html: string): string {
  return html
    .replace(/<a[^>]*data-kb-id="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, id, label) => `[${stripTags(label)}](kb:${id})`)
    .replace(/<a[^>]*href="kb:([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, id, label) => `[${stripTags(label)}](kb:${id})`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, inner) => `**${unescapeInlineHtml(inner)}**`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, inner) => `**${unescapeInlineHtml(inner)}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, inner) => `*${unescapeInlineHtml(inner)}*`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, inner) => `*${unescapeInlineHtml(inner)}*`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${stripTags(inner)}\``)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function renderInlineMarkdownToHtml(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(
    /\[([^\]]+)\]\(kb:([a-zA-Z0-9_-]+)\)/g,
    '<a href="kb:$2" data-kb-id="$2" class="ig-kb-mention">$1</a>'
  );
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return out;
}

/**
 * Converts canonical InkGraph Markdown (including ::beat and ::epistemic-reveal blocks
 * and [Name](kb:id) mentions) cleanly to TipTap-editable HTML.
 */
export function canonicalMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Inline collapsible directive block: ::beat{...} ... :: or ::epistemic-reveal{...} ... ::
    const directiveMatch = /^::(beat|epistemic-reveal)\{([^}]*)\}\s*$/.exec(trimmed);
    if (directiveMatch) {
      const kind = directiveMatch[1] as 'beat' | 'epistemic-reveal';
      const attrs = directiveMatch[2] ?? '';
      const bodyLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i]!.trim() !== '::') {
        bodyLines.push(lines[i]!);
        i += 1;
      }
      i += 1; // skip closing '::'
      const bodyText = bodyLines.join('\n').trim();
      htmlParts.push(
        `<blockquote data-ink-directive="${kind}" data-ink-attrs="${escapeHtmlAttr(attrs)}">${renderInlineMarkdownToHtml(bodyText)}</blockquote>`
      );
      continue;
    }

    if (trimmed === '* * *' || trimmed === '---' || trimmed === '***') {
      htmlParts.push('<hr />');
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1]!.length;
      htmlParts.push(`<h${level}>${renderInlineMarkdownToHtml(headingMatch[2]!)}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('> ')) {
        quoteLines.push(lines[i]!.trim().slice(2));
        i += 1;
      }
      htmlParts.push(`<blockquote><p>${renderInlineMarkdownToHtml(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!.trim())) {
        items.push(`<li>${renderInlineMarkdownToHtml(lines[i]!.trim().replace(/^[-*]\s+/, ''))}</li>`);
        i += 1;
      }
      htmlParts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Collect contiguous paragraph lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !/^(#{1,3}\s+|>\s+|[-*]\s+|::(beat|epistemic-reveal)\{|(\*\s*\*\s*\*|---|\*\*\*)$)/.test(lines[i]!.trim())
    ) {
      paraLines.push(lines[i]!);
      i += 1;
    }
    htmlParts.push(`<p>${renderInlineMarkdownToHtml(paraLines.join('\n'))}</p>`);
  }

  return htmlParts.join('') || '<p></p>';
}

/**
 * Converts TipTap editor HTML deterministically back into canonical InkGraph Markdown,
 * preserving inline directives and kb:id semantic entity links.
 */
export function htmlToCanonicalMarkdown(html: string): string {
  const blocks: string[] = [];
  const blockRegex =
    /<(blockquote|h1|h2|h3|p|ul|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    if (match[0].toLowerCase().startsWith('<hr')) {
      blocks.push('* * *');
      continue;
    }

    const tag = match[1]!.toLowerCase();
    const attrsStr = match[2] ?? '';
    const inner = match[3] ?? '';

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const level = Number(tag[1]);
      blocks.push(`${'#'.repeat(level)} ${unescapeInlineHtml(inner).trim()}`);
    } else if (tag === 'blockquote') {
      const dirMatch = /data-ink-directive="(beat|epistemic-reveal)"[^>]*data-ink-attrs="([^"]*)"/i.exec(attrsStr);
      if (dirMatch) {
        const kind = dirMatch[1]!;
        const rawAttrs = dirMatch[2]!
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
        blocks.push(`::${kind}{${rawAttrs}}\n${unescapeInlineHtml(inner).trim()}\n::`);
      } else {
        const quoteText = unescapeInlineHtml(inner)
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `> ${l}`)
          .join('\n');
        if (quoteText) blocks.push(quoteText);
      }
    } else if (tag === 'ul') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const items: string[] = [];
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        items.push(`- ${unescapeInlineHtml(liMatch[1]!).trim()}`);
      }
      if (items.length > 0) blocks.push(items.join('\n'));
    } else if (tag === 'p') {
      const text = unescapeInlineHtml(inner).trimEnd();
      if (text) blocks.push(text);
    }
  }

  return blocks.join('\n\n');
}

/**
 * Extracts all inline ::epistemic-reveal directives anchored inside scene prose.
 */
export function extractEpistemicDirectives(markdown: string): EpistemicRevealMarker[] {
  const results: EpistemicRevealMarker[] = [];
  const regex = /^::epistemic-reveal\{([^}]*)\}\r?\n([\s\S]*?)\r?\n::$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const attrs = parseAttributes(match[1] ?? '');
    results.push({
      entity: attrs.entity ?? '',
      secret: attrs.secret ?? '',
      mode: attrs.mode ?? 'reveal',
      body: (match[2] ?? '').trim(),
    });
  }
  return results;
}

/**
 * Formats an inline directive block safely into canonical Markdown.
 */
export function formatCanonicalDirective(directive: CanonicalDirective): string {
  const attrText = formatAttributes(directive.attributes);
  return `::${directive.kind}{${attrText}}\n${directive.body.trim()}\n::`;
}

/**
 * Splits a scene cleanly into two halves at character offset (e.g., `/Split scene here`).
 */
export function splitSceneMarkdownAtOffset(
  markdown: string,
  offset: number
): { before: string; after: string } {
  const safeOffset = Math.max(0, Math.min(markdown.length, offset));
  return {
    before: markdown.slice(0, safeOffset).trimEnd(),
    after: markdown.slice(safeOffset).trimStart(),
  };
}
