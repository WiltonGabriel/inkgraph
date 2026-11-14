import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import type { ProjectData } from '../../types/project';

const SLASH_COMMANDS: readonly Completion[] = [
  { label: '/h1', detail: 'Título Principal (#)', type: 'keyword', apply: '# ' },
  { label: '/h2', detail: 'Subtítulo de Seção (##)', type: 'keyword', apply: '## ' },
  { label: '/divisor', detail: 'Divisor ornamental (***)', type: 'keyword', apply: '\n***\n\n' },
  { label: '/epigrafe', detail: 'Epígrafe ou citação (>)', type: 'keyword', apply: '> ' },
  { label: '/nota', detail: 'Bloco de nota do autor', type: 'keyword', apply: '> [!NOTA]\n> ' },
  { label: '/segredo', detail: 'Bloco de segredo epistêmico', type: 'keyword', apply: '> [!SEGREDO]\n> ' },
  {
    label: '/comentario',
    detail: 'Comentário oculto (%%...%%)',
    type: 'keyword',
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      view.dispatch({
        changes: { from, to, insert: '%%  %%' },
        selection: { anchor: from + 3 },
      });
    },
  },
  { label: '/checklist', detail: 'Lista de verificação (- [ ])', type: 'keyword', apply: '- [ ] ' },
];

interface EntityCandidate {
  label: string;
  detail: string;
  aliases: string[];
  type: string;
}

function getEntityCandidates(trigger: string, project: ProjectData): EntityCandidate[] {
  if (trigger === '@') {
    return project.characters.map((c) => ({
      label: `@${c.name}`,
      detail: c.role || 'Personagem',
      aliases: c.aliases,
      type: 'variable',
    }));
  }
  if (trigger === '#') {
    return project.worlds
      .flatMap((w) => w.locations)
      .map((loc) => ({
        label: `#${loc.name}`,
        detail: loc.type || 'Local',
        aliases: loc.aliases ?? [],
        type: 'keyword',
      }));
  }
  if (trigger === '&') {
    return project.factions.map((f) => ({
      label: `&${f.name}`,
      detail: f.subtype || 'Facção',
      aliases: f.aliases,
      type: 'class',
    }));
  }
  if (trigger === '!') {
    return project.objects.map((o) => ({
      label: `!${o.name}`,
      detail: o.type || 'Objeto',
      aliases: o.aliases ?? [],
      type: 'constant',
    }));
  }
  return [];
}

function matchesCandidate(candidate: EntityCandidate, query: string): boolean {
  if (!query) return true;
  const nameWithoutPrefix = candidate.label.slice(1).toLowerCase();
  if (nameWithoutPrefix.includes(query)) return true;
  return candidate.aliases.some((alias) => alias.toLowerCase().includes(query));
}

/**
 * Builds an autocompletion source for canon entity triggers (@, #, &, !)
 * and quick slash insertion commands (/h1, /h2, /divisor, etc.).
 */
export function createInkGraphCompletionSource(
  getProject: () => ProjectData
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const beforeCursor = line.text.slice(0, context.pos - line.from);

    const slashMatch = beforeCursor.match(/(?:^|\s)(\/[\p{L}\p{N}_-]*)$/u);
    if (slashMatch) {
      const token = slashMatch[1];
      const query = token.slice(1).toLowerCase();
      const options = SLASH_COMMANDS.filter(
        (cmd) =>
          cmd.label.slice(1).toLowerCase().includes(query) ||
          (cmd.detail ?? '').toLowerCase().includes(query)
      );
      if (options.length === 0) return null;
      return {
        from: context.pos - token.length,
        to: context.pos,
        options,
        filter: false,
      };
    }

    const mentionMatch = beforeCursor.match(/(?:^|[\s([{"'—–])([@#&!][^\n@#&!/]{0,36})$/u);
    if (!mentionMatch) return null;

    const token = mentionMatch[1];
    const trigger = token[0];
    // Dismiss immediately on "# " (Markdown H1), "##" (Markdown H2), or "! " prose punctuation.
    if (token.length > 1 && (/\s/.test(token[1]) || token[1] === '#')) {
      return null;
    }

    const query = token.slice(1).trim().toLowerCase();
    const candidates = getEntityCandidates(trigger, getProject());
    const matched = candidates.filter((item) => matchesCandidate(item, query));
    if (matched.length === 0) return null;

    const options: Completion[] = matched.map((item) => ({
      label: item.label,
      detail: item.detail,
      type: item.type,
      apply: item.label,
    }));

    return {
      from: context.pos - token.length,
      to: context.pos,
      options,
      filter: false,
    };
  };
}
