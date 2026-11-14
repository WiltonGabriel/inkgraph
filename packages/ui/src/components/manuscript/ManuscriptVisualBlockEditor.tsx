import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Copy,
  Heading1,
  Heading2,
  Heading3,
  Lock,
  MessageSquare,
  Minus,
  Plus,
  Quote,
  Sparkles,
  StickyNote,
  Trash2,
  Type,
} from 'lucide-react';
import type { AppSettings, ProjectData } from '../../types/project';
import {
  parseMarkdownToEditableBlocks,
  serializeEditableBlocksToMarkdown,
  type EditableBlockKind,
  type EditableProseBlock,
} from '../../domain/proseStyleAnalyzer';

interface ManuscriptVisualBlockEditorProps {
  sceneId: string;
  content: string;
  onChange: (nextMarkdown: string) => void;
  project: ProjectData;
  settings: AppSettings;
}

const FONT_STACKS: Record<AppSettings['editorFont'], string> = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
};

const BLOCK_TYPE_OPTIONS: {
  kind: EditableBlockKind;
  label: string;
  shortLabel: string;
  icon: typeof Type;
  accent: string;
}[] = [
  { kind: 'paragraph', label: 'Parágrafo Narrativo', shortLabel: 'Parágrafo', icon: Type, accent: 'var(--text-secondary)' },
  { kind: 'dialogue', label: 'Fala / Diálogo (—)', shortLabel: 'Diálogo —', icon: MessageSquare, accent: '#38bdf8' },
  { kind: 'heading-1', label: 'Título Principal (H1)', shortLabel: 'Título H1', icon: Heading1, accent: 'var(--accent-primary)' },
  { kind: 'heading-2', label: 'Subtítulo de Seção (H2)', shortLabel: 'Subtítulo H2', icon: Heading2, accent: 'var(--accent-primary)' },
  { kind: 'heading-3', label: 'Subseção (H3)', shortLabel: 'Seção H3', icon: Heading3, accent: 'var(--accent-primary)' },
  { kind: 'epigraph', label: 'Epígrafe / Citação', shortLabel: 'Epígrafe', icon: Quote, accent: '#a855f7' },
  { kind: 'callout-note', label: 'Nota do Autor', shortLabel: 'Nota', icon: StickyNote, accent: '#3b82f6' },
  { kind: 'callout-secret', label: 'Segredo Epistêmico', shortLabel: 'Segredo', icon: Lock, accent: '#f59e0b' },
  { kind: 'checklist', label: 'Lista de Tarefas da Cena', shortLabel: 'Checklist', icon: CheckSquare, accent: '#10b981' },
  { kind: 'divider', label: 'Quebra de Cena (✦ ✦ ✦)', shortLabel: 'Quebra ✦', icon: Minus, accent: 'var(--accent-primary)' },
  { kind: 'comment', label: 'Comentário Oculto do Autor', shortLabel: 'Comentário', icon: Sparkles, accent: 'var(--text-muted)' },
];

export function ManuscriptVisualBlockEditor({
  sceneId,
  content,
  onChange,
  project,
  settings,
}: ManuscriptVisualBlockEditorProps) {
  const [blocks, setBlocks] = useState<EditableProseBlock[]>(() =>
    parseMarkdownToEditableBlocks(content)
  );
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [lastEmittedMarkdown, setLastEmittedMarkdown] = useState<string>(content);

  useEffect(() => {
    setBlocks(parseMarkdownToEditableBlocks(content));
    setLastEmittedMarkdown(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  useEffect(() => {
    if (content !== lastEmittedMarkdown) {
      setBlocks(parseMarkdownToEditableBlocks(content));
      setLastEmittedMarkdown(content);
    }
  }, [content, lastEmittedMarkdown]);

  const commitBlocks = (nextBlocks: EditableProseBlock[]) => {
    const normalized =
      nextBlocks.length > 0
        ? nextBlocks
        : [{ id: `blk_${Date.now()}`, kind: 'paragraph' as const, text: '' }];
    setBlocks(normalized);
    const nextMd = serializeEditableBlocksToMarkdown(normalized);
    setLastEmittedMarkdown(nextMd);
    onChange(nextMd);
  };

  const handleUpdateBlock = (id: string, patch: Partial<EditableProseBlock>) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    commitBlocks(next);
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    commitBlocks(copy);
  };

  const handleDuplicateBlock = (index: number) => {
    const source = blocks[index];
    if (!source) return;
    const clone: EditableProseBlock = {
      ...source,
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      checklistItems: source.checklistItems
        ? source.checklistItems.map((it) => ({ ...it }))
        : undefined,
    };
    const copy = [...blocks];
    copy.splice(index + 1, 0, clone);
    commitBlocks(copy);
    setFocusedBlockId(clone.id);
  };

  const handleDeleteBlock = (index: number) => {
    const copy = blocks.filter((_, idx) => idx !== index);
    commitBlocks(copy);
  };

  const handleInsertBlockAfter = (index: number, kind: EditableBlockKind) => {
    const newBlock: EditableProseBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind,
      text: kind === 'divider' ? '***' : '',
      checklistItems:
        kind === 'checklist'
          ? [{ checked: false, text: 'Novo objetivo narrativo da cena' }]
          : undefined,
    };
    const copy = [...blocks];
    copy.splice(index + 1, 0, newBlock);
    commitBlocks(copy);
    setFocusedBlockId(newBlock.id);
  };

  const handleAppendTokenToFocused = (token: string) => {
    const targetId = focusedBlockId ?? blocks[blocks.length - 1]?.id;
    if (!targetId) return;
    const next = blocks.map((b) => {
      if (b.id !== targetId || b.kind === 'divider') return b;
      const sep = b.text.length > 0 && !b.text.endsWith(' ') ? ' ' : '';
      return { ...b, text: `${b.text}${sep}${token}` };
    });
    commitBlocks(next);
  };

  const maxWidth = settings.zenMode ? '780px' : `${settings.editorMaxWidthCh || 74}ch`;
  const fontFamily = FONT_STACKS[settings.editorFont] ?? FONT_STACKS.serif;
  const fontSize = `${settings.editorFontSize || 17}px`;
  const lineHeight = settings.editorLineHeight || 1.8;

  const quickEntities = [
    ...project.characters.slice(0, 4).map((c) => ({ token: `@${c.name}`, color: 'var(--accent-primary)' })),
    ...project.worlds.flatMap((w) => w.locations).slice(0, 3).map((l) => ({ token: `#${l.name}`, color: 'var(--success)' })),
    ...project.factions.slice(0, 2).map((f) => ({ token: `&${f.name}`, color: '#f59e0b' })),
    ...project.objects.slice(0, 2).map((o) => ({ token: `!${o.name}`, color: '#a855f7' })),
  ];

  return (
    <div
      aria-label="Editor em Interface Visual de Blocos Literários"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '20px 28px 48px',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ maxWidth, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Barra rápida de inserção visual sem código */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 11.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 11 }}>
              Interface Visual (Sem Código):
            </span>
            {(
              [
                { label: '“Aspas”', token: '“”' },
                { label: '— Travessão', token: '— ' },
                { label: '… Reticências', token: '…' },
              ] as const
            ).map((sym) => (
              <button
                key={sym.label}
                type="button"
                onClick={() => handleAppendTokenToFocused(sym.token)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {sym.label}
              </button>
            ))}
          </div>

          {quickEntities.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Inserir vínculo:</span>
              {quickEntities.slice(0, 6).map((ent) => (
                <button
                  key={ent.token}
                  type="button"
                  onClick={() => handleAppendTokenToFocused(ent.token)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 999,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: ent.color,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {ent.token}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Blocos Visuais */}
        {blocks.map((block, index) => {
          const isFocused = focusedBlockId === block.id;
          const isDimmed = settings.focusMode && focusedBlockId !== null && !isFocused;
          const meta =
            BLOCK_TYPE_OPTIONS.find((opt) => opt.kind === block.kind) ??
            BLOCK_TYPE_OPTIONS[0];

          return (
            <div
              key={block.id}
              onFocus={() => setFocusedBlockId(block.id)}
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  block.kind === 'callout-note' || block.kind === 'callout-secret'
                    ? 'var(--bg-surface)'
                    : isFocused
                    ? 'var(--bg-surface)'
                    : 'transparent',
                border: isFocused
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                borderLeft:
                  block.kind === 'dialogue'
                    ? '3px solid #38bdf8'
                    : block.kind === 'epigraph'
                    ? '3px solid #a855f7'
                    : block.kind === 'callout-note'
                    ? '3px solid #3b82f6'
                    : block.kind === 'callout-secret'
                    ? '3px solid #f59e0b'
                    : undefined,
                padding: '10px 14px',
                opacity: isDimmed ? 0.45 : 1,
                transition: 'opacity 150ms ease, border-color 150ms ease',
              }}
            >
              {/* Cabeçalho do Bloco Visual */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: block.kind === 'divider' ? 0 : 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select
                    aria-label={`Tipo do bloco ${index + 1}`}
                    value={block.kind}
                    onChange={(e) =>
                      handleUpdateBlock(block.id, {
                        kind: e.target.value as EditableBlockKind,
                        checklistItems:
                          e.target.value === 'checklist' && !block.checklistItems
                            ? [{ checked: false, text: block.text || 'Item da cena' }]
                            : block.checklistItems,
                      })
                    }
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: meta.accent,
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 7px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {BLOCK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.kind} value={opt.kind}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {block.kind === 'dialogue' && (
                    <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                      — Travessão automático
                    </span>
                  )}
                  {block.kind === 'callout-secret' && (
                    <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                      Segredo rastreado pelo Cânone
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(index, -1)}
                    disabled={index === 0}
                    title="Subir bloco"
                    aria-label="Subir bloco"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      opacity: index === 0 ? 0.35 : 1,
                      cursor: index === 0 ? 'default' : 'pointer',
                      padding: 3,
                    }}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(index, 1)}
                    disabled={index === blocks.length - 1}
                    title="Descer bloco"
                    aria-label="Descer bloco"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color:
                        index === blocks.length - 1
                          ? 'var(--text-muted)'
                          : 'var(--text-secondary)',
                      opacity: index === blocks.length - 1 ? 0.35 : 1,
                      cursor: index === blocks.length - 1 ? 'default' : 'pointer',
                      padding: 3,
                    }}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateBlock(index)}
                    title="Duplicar bloco"
                    aria-label="Duplicar bloco"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 3,
                    }}
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(index)}
                    title="Remover bloco"
                    aria-label="Remover bloco"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger, #ef4444)',
                      cursor: 'pointer',
                      padding: 3,
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Corpo do Bloco Visual */}
              {block.kind === 'divider' ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '6px 0',
                    color: 'var(--accent-primary)',
                    letterSpacing: '0.45em',
                    fontSize: 13,
                    fontWeight: 700,
                    userSelect: 'none',
                  }}
                >
                  ✦ ✦ ✦
                </div>
              ) : block.kind === 'checklist' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(block.checklistItems ?? [{ checked: false, text: block.text }]).map(
                    (item, itemIdx) => (
                      <div
                        key={itemIdx}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => {
                            const list = [
                              ...(block.checklistItems ?? [{ checked: false, text: block.text }]),
                            ];
                            list[itemIdx] = { ...list[itemIdx], checked: e.target.checked };
                            handleUpdateBlock(block.id, {
                              checklistItems: list,
                              text: list.map((i) => i.text).join('\n'),
                            });
                          }}
                          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const list = [
                              ...(block.checklistItems ?? [{ checked: false, text: block.text }]),
                            ];
                            list[itemIdx] = { ...list[itemIdx], text: e.target.value };
                            handleUpdateBlock(block.id, {
                              checklistItems: list,
                              text: list.map((i) => i.text).join('\n'),
                            });
                          }}
                          placeholder="Descreva o item da lista..."
                          style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: '1px dashed var(--border-subtle)',
                            color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: item.checked ? 'line-through' : 'none',
                            fontSize: 13.5,
                            padding: '3px 4px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const list = [
                        ...(block.checklistItems ?? [{ checked: false, text: block.text }]),
                        { checked: false, text: '' },
                      ];
                      handleUpdateBlock(block.id, {
                        checklistItems: list,
                        text: list.map((i) => i.text).join('\n'),
                      });
                    }}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border-subtle)',
                      backgroundColor: 'transparent',
                      color: 'var(--accent-primary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Adicionar item
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {block.kind === 'dialogue' && (
                    <span
                      style={{
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '1.2em',
                        lineHeight,
                        userSelect: 'none',
                      }}
                    >
                      —
                    </span>
                  )}
                  <textarea
                    value={block.text}
                    onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                    rows={Math.max(
                      block.kind.startsWith('heading') ? 1 : 2,
                      Math.ceil((block.text.length || 1) / 72)
                    )}
                    placeholder={
                      block.kind === 'dialogue'
                        ? 'Escreva a fala do personagem...'
                        : block.kind.startsWith('heading')
                        ? 'Título da seção ou capítulo...'
                        : block.kind === 'epigraph'
                        ? 'Escreva a epígrafe ou citação...'
                        : block.kind === 'callout-secret'
                        ? 'Descreva o segredo epistêmico presente nesta cena...'
                        : block.kind === 'callout-note'
                        ? 'Nota de bastidor do autor...'
                        : 'Escreva o parágrafo da cena...'
                    }
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color:
                        block.kind === 'epigraph'
                          ? 'var(--text-secondary)'
                          : 'var(--text-primary)',
                      fontFamily:
                        block.kind === 'comment' ? FONT_STACKS.mono : fontFamily,
                      fontSize:
                        block.kind === 'heading-1'
                          ? '1.45em'
                          : block.kind === 'heading-2'
                          ? '1.22em'
                          : block.kind === 'heading-3'
                          ? '1.08em'
                          : fontSize,
                      fontWeight: block.kind.startsWith('heading') ? 700 : 400,
                      fontStyle: block.kind === 'epigraph' ? 'italic' : 'normal',
                      lineHeight,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Barra de Adição Rápida de Blocos no Final */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginRight: 4,
            }}
          >
            <Plus size={13} />
            Adicionar bloco:
          </span>
          {(
            [
              { kind: 'paragraph', label: '+ Parágrafo' },
              { kind: 'dialogue', label: '+ Diálogo (—)' },
              { kind: 'heading-2', label: '+ Subtítulo' },
              { kind: 'epigraph', label: '+ Epígrafe' },
              { kind: 'divider', label: '+ Quebra de Cena ✦' },
              { kind: 'callout-note', label: '+ Nota do Autor' },
              { kind: 'callout-secret', label: '+ Segredo Epistêmico' },
              { kind: 'checklist', label: '+ Checklist' },
            ] as { kind: EditableBlockKind; label: string }[]
          ).map((btn) => (
            <button
              key={btn.kind}
              type="button"
              onClick={() => handleInsertBlockAfter(blocks.length - 1, btn.kind)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
