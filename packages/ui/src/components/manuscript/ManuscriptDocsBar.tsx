import { useEffect, useRef, useState } from 'react';
import {
  AlignJustify,
  AlignLeft,
  AtSign,
  Bold,
  BookmarkPlus,
  Box,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code,
  Hash,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  Quote,
  Redo2,
  Search,
  Shield,
  Sparkles,
  Strikethrough,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AppSettings } from '../../types/project';
import type {
  ActiveBlockStyle,
  CursorMarkdownState,
  MarkdownFormatCommand,
} from './cmMarkdownCommands';
import type { MentionCategoryKey } from './ManuscriptMentionBar';

export type ManuscriptMode = 'write' | 'markdown' | 'split' | 'read';

type MenuId = 'edit' | 'view' | 'insert' | 'format' | 'tools' | 'style' | 'font';

interface MenuEntry {
  id: string;
  label: string;
  hint?: string;
  checked?: boolean;
  dividerBefore?: boolean;
  onSelect: () => void;
}

const BLOCK_STYLE_LABELS: Record<ActiveBlockStyle, string> = {
  normal: 'Texto normal',
  h1: 'Título 1',
  h2: 'Título 2',
  h3: 'Subtítulo',
  quote: 'Citação',
};

const FONT_LABELS: Record<AppSettings['editorFont'], string> = {
  serif: 'Serifa',
  sans: 'Sem Serifa',
  mono: 'Monoespaçada',
};

interface ManuscriptDocsBarProps {
  mode: ManuscriptMode;
  onModeChange: (mode: ManuscriptMode) => void;
  cursorFormat: CursorMarkdownState;
  showFormatBar: boolean;
  onToggleFormatBar: () => void;
  showMentionBar: boolean;
  onToggleMentionBar: () => void;
  navigatorOpen: boolean;
  onToggleNavigator: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showWorkshop: boolean;
  onToggleWorkshop: () => void;
  readingSpeechActive: boolean;
  onToggleSpeech: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onOpenSearch: () => void;
  onFormatCommand: (cmd: MarkdownFormatCommand) => void;
  onBlockStyle: (style: ActiveBlockStyle) => void;
  onOpenMentionCategory: (cat: MentionCategoryKey) => void;
  onSnapshot: () => void;
  font: AppSettings['editorFont'];
  onFontChange: (font: AppSettings['editorFont']) => void;
  fontSize: number;
  onFontSizeDelta: (delta: number) => void;
  align: AppSettings['editorTextAlign'];
  onAlignChange: (align: AppSettings['editorTextAlign']) => void;
  paragraphIndent: boolean;
  onToggleParagraphIndent: () => void;
}

function DropdownList({
  entries,
  onClose,
  width = 230,
}: {
  entries: MenuEntry[];
  onClose: () => void;
  width?: number;
}) {
  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        width,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 14px 32px rgba(0, 0, 0, 0.34)',
        padding: 4,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {entries.map((entry) => (
        <div key={entry.id}>
          {entry.dividerBefore && (
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--border-subtle)',
                margin: '4px 6px',
              }}
            />
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              entry.onSelect();
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span
                style={{
                  width: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                }}
              >
                {entry.checked ? <Check size={12} aria-hidden="true" /> : null}
              </span>
              <span>{entry.label}</span>
            </span>
            {entry.hint && (
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{entry.hint}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

function RibbonIconButton({
  active = false,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      style={{
        height: 26,
        minWidth: 26,
        padding: '0 6px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11.5,
        backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function ManuscriptDocsBar({
  mode,
  onModeChange,
  cursorFormat,
  showFormatBar,
  onToggleFormatBar,
  showMentionBar,
  onToggleMentionBar,
  navigatorOpen,
  onToggleNavigator,
  inspectorOpen,
  onToggleInspector,
  fullscreen,
  onToggleFullscreen,
  showWorkshop,
  onToggleWorkshop,
  readingSpeechActive,
  onToggleSpeech,
  onUndo,
  onRedo,
  onSelectAll,
  onOpenSearch,
  onFormatCommand,
  onBlockStyle,
  onOpenMentionCategory,
  onSnapshot,
  font,
  onFontChange,
  fontSize,
  onFontSizeDelta,
  align,
  onAlignChange,
  paragraphIndent,
  onToggleParagraphIndent,
}: ManuscriptDocsBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onMouseDown = (ev: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(ev.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const toggleMenu = (id: MenuId) => setOpenMenu((prev) => (prev === id ? null : id));

  const menus: Record<'edit' | 'view' | 'insert' | 'format' | 'tools', { label: string; entries: MenuEntry[] }> = {
    edit: {
      label: 'Editar',
      entries: [
        { id: 'undo', label: 'Desfazer', hint: 'Ctrl+Z', onSelect: onUndo },
        { id: 'redo', label: 'Refazer', hint: 'Ctrl+Y', onSelect: onRedo },
        {
          id: 'find',
          label: 'Localizar e substituir',
          hint: 'Ctrl+F',
          dividerBefore: true,
          onSelect: onOpenSearch,
        },
        { id: 'selectall', label: 'Selecionar tudo', hint: 'Ctrl+A', onSelect: onSelectAll },
      ],
    },
    view: {
      label: 'Ver',
      entries: [
        {
          id: 'mode-write',
          label: 'Documento (Markdown visual)',
          checked: mode === 'write',
          onSelect: () => onModeChange('write'),
        },
        {
          id: 'mode-md',
          label: 'Markdown (código)',
          checked: mode === 'markdown',
          onSelect: () => onModeChange('markdown'),
        },
        {
          id: 'mode-split',
          label: 'Dividido (Editor + Leitura)',
          checked: mode === 'split',
          onSelect: () => onModeChange('split'),
        },
        {
          id: 'mode-read',
          label: 'Leitura (produto final)',
          checked: mode === 'read',
          onSelect: () => onModeChange('read'),
        },
        {
          id: 'toggle-bar',
          label: 'Barra de formatação',
          checked: showFormatBar,
          dividerBefore: true,
          onSelect: onToggleFormatBar,
        },
        {
          id: 'toggle-mentions',
          label: 'Barra de menções',
          checked: showMentionBar,
          onSelect: onToggleMentionBar,
        },
        {
          id: 'toggle-nav',
          label: 'Painel de capítulos',
          checked: navigatorOpen,
          onSelect: onToggleNavigator,
        },
        {
          id: 'toggle-insp',
          label: 'Inspetor da cena',
          checked: inspectorOpen,
          onSelect: onToggleInspector,
        },
        {
          id: 'toggle-fs',
          label: fullscreen ? 'Sair da tela cheia' : 'Tela cheia',
          checked: fullscreen,
          dividerBefore: true,
          onSelect: onToggleFullscreen,
        },
      ],
    },
    insert: {
      label: 'Inserir',
      entries: [
        {
          id: 'ins-char',
          label: 'Personagem (@)',
          onSelect: () => onOpenMentionCategory('char'),
        },
        {
          id: 'ins-loc',
          label: 'Local (#)',
          onSelect: () => onOpenMentionCategory('loc'),
        },
        {
          id: 'ins-fac',
          label: 'Facção (&)',
          onSelect: () => onOpenMentionCategory('faction'),
        },
        {
          id: 'ins-obj',
          label: 'Objeto (!)',
          onSelect: () => onOpenMentionCategory('obj'),
        },
        {
          id: 'ins-div',
          label: 'Divisor de cena',
          hint: '***',
          dividerBefore: true,
          onSelect: () => onFormatCommand('divider'),
        },
        {
          id: 'ins-quote',
          label: 'Bloco de citação',
          hint: '>',
          onSelect: () => onFormatCommand('epigraph'),
        },
        {
          id: 'ins-ul',
          label: 'Lista com marcadores',
          hint: '- ',
          onSelect: () => onFormatCommand('bulletList'),
        },
        {
          id: 'ins-ol',
          label: 'Lista numerada',
          hint: '1. ',
          onSelect: () => onFormatCommand('orderedList'),
        },
        {
          id: 'ins-check',
          label: 'Checklist de revisão',
          hint: '- [ ]',
          onSelect: () => onFormatCommand('checklist'),
        },
        {
          id: 'ins-note',
          label: 'Nota editorial',
          hint: '[!NOTA]',
          dividerBefore: true,
          onSelect: () => onFormatCommand('noteCallout'),
        },
        {
          id: 'ins-secret',
          label: 'Segredo de cânone',
          hint: '[!SEGREDO]',
          onSelect: () => onFormatCommand('secretCallout'),
        },
        {
          id: 'ins-comment',
          label: 'Comentário do autor',
          hint: '%% ... %%',
          onSelect: () => onFormatCommand('comment'),
        },
      ],
    },
    format: {
      label: 'Formatar',
      entries: [
        {
          id: 'fmt-bold',
          label: 'Negrito',
          hint: 'Ctrl+B',
          checked: cursorFormat.bold,
          onSelect: () => onFormatCommand('bold'),
        },
        {
          id: 'fmt-italic',
          label: 'Itálico',
          hint: 'Ctrl+I',
          checked: cursorFormat.italic,
          onSelect: () => onFormatCommand('italic'),
        },
        {
          id: 'fmt-strike',
          label: 'Tachado',
          hint: '~~',
          checked: cursorFormat.strikethrough,
          onSelect: () => onFormatCommand('strikethrough'),
        },
        {
          id: 'fmt-code',
          label: 'Código inline',
          hint: '`',
          checked: cursorFormat.inlineCode,
          onSelect: () => onFormatCommand('inlineCode'),
        },
        {
          id: 'style-normal',
          label: 'Texto normal',
          dividerBefore: true,
          checked: cursorFormat.blockStyle === 'normal',
          onSelect: () => onBlockStyle('normal'),
        },
        {
          id: 'style-h1',
          label: 'Título 1',
          hint: '#',
          checked: cursorFormat.blockStyle === 'h1',
          onSelect: () => onBlockStyle('h1'),
        },
        {
          id: 'style-h2',
          label: 'Título 2',
          hint: '##',
          checked: cursorFormat.blockStyle === 'h2',
          onSelect: () => onBlockStyle('h2'),
        },
        {
          id: 'style-h3',
          label: 'Subtítulo',
          hint: '###',
          checked: cursorFormat.blockStyle === 'h3',
          onSelect: () => onBlockStyle('h3'),
        },
        {
          id: 'style-quote',
          label: 'Citação',
          hint: '>',
          checked: cursorFormat.blockStyle === 'quote',
          onSelect: () => onBlockStyle('quote'),
        },
        {
          id: 'align-left',
          label: 'Alinhar à esquerda',
          dividerBefore: true,
          checked: align === 'left',
          onSelect: () => onAlignChange('left'),
        },
        {
          id: 'align-justify',
          label: 'Justificar texto',
          checked: align === 'justify',
          onSelect: () => onAlignChange('justify'),
        },
        {
          id: 'indent-toggle',
          label: 'Recuo de primeira linha',
          checked: paragraphIndent,
          onSelect: onToggleParagraphIndent,
        },
      ],
    },
    tools: {
      label: 'Ferramentas',
      entries: [
        {
          id: 'tool-workshop',
          label: 'Oficina do Escritor',
          checked: showWorkshop,
          onSelect: onToggleWorkshop,
        },
        {
          id: 'tool-tts',
          label: readingSpeechActive ? 'Parar leitura em voz alta' : 'Ouvir cena em voz alta',
          checked: readingSpeechActive,
          onSelect: onToggleSpeech,
        },
        {
          id: 'tool-snap',
          label: 'Salvar instantâneo da cena',
          dividerBefore: true,
          onSelect: onSnapshot,
        },
      ],
    },
  };

  return (
    <div
      ref={barRef}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Row 1: Calm Menu Bar + Primary Mode Switcher + Panel/Fullscreen Controls */}
      <div
        style={{
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(['edit', 'view', 'insert', 'format', 'tools'] as const).map((id) => {
            const active = openMenu === id;
            return (
              <div key={id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-expanded={active}
                  onClick={() => toggleMenu(id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {menus[id].label}
                </button>
                {active && (
                  <DropdownList
                    entries={menus[id].entries}
                    onClose={() => setOpenMenu(null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div
            role="tablist"
            aria-label="Modo de edição do manuscrito"
            style={{
              display: 'inline-flex',
              padding: 2,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              gap: 2,
            }}
          >
            {(
              [
                { id: 'write', label: 'Documento' },
                { id: 'markdown', label: 'Markdown' },
                { id: 'read', label: 'Leitura' },
              ] as const
            ).map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onModeChange(m.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11.5,
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: 'var(--border-subtle)',
            }}
          />

          <RibbonIconButton
            active={navigatorOpen}
            title={navigatorOpen ? 'Minimizar painel de capítulos' : 'Mostrar painel de capítulos'}
            onClick={onToggleNavigator}
          >
            <PanelLeft size={13} aria-hidden="true" />
          </RibbonIconButton>

          <RibbonIconButton
            active={inspectorOpen}
            title={inspectorOpen ? 'Minimizar inspetor da cena' : 'Mostrar inspetor da cena'}
            onClick={onToggleInspector}
          >
            <PanelRight size={13} aria-hidden="true" />
          </RibbonIconButton>

          <RibbonIconButton
            active={fullscreen}
            title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? (
              <Minimize2 size={13} aria-hidden="true" />
            ) : (
              <Maximize2 size={13} aria-hidden="true" />
            )}
            <span>{fullscreen ? 'Sair' : 'Tela cheia'}</span>
          </RibbonIconButton>
        </div>
      </div>

      {/* Row 2: Markdown-Backed Formatting Ribbon */}
      {showFormatBar && mode !== 'read' && (
        <div
          style={{
            padding: '4px 12px 6px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <RibbonIconButton title="Desfazer (Ctrl+Z)" onClick={onUndo}>
              <Undo2 size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton title="Refazer (Ctrl+Y)" onClick={onRedo}>
              <Redo2 size={13} aria-hidden="true" />
            </RibbonIconButton>

            <div
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'var(--border-subtle)',
                margin: '0 4px',
              }}
            />

            {/* Block Style Dropdown (Texto normal / Títulos / Citação) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-expanded={openMenu === 'style'}
                onClick={() => toggleMenu('style')}
                title="Estilo de parágrafo (Markdown)"
                style={{
                  height: 26,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    openMenu === 'style' ? 'var(--bg-elevated)' : 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 114,
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>{BLOCK_STYLE_LABELS[cursorFormat.blockStyle]}</span>
                <ChevronDown size={11} aria-hidden="true" style={{ opacity: 0.7 }} />
              </button>
              {openMenu === 'style' && (
                <DropdownList
                  width={185}
                  onClose={() => setOpenMenu(null)}
                  entries={[
                    {
                      id: 'bs-normal',
                      label: 'Texto normal',
                      checked: cursorFormat.blockStyle === 'normal',
                      onSelect: () => onBlockStyle('normal'),
                    },
                    {
                      id: 'bs-h1',
                      label: 'Título 1',
                      hint: '#',
                      checked: cursorFormat.blockStyle === 'h1',
                      onSelect: () => onBlockStyle('h1'),
                    },
                    {
                      id: 'bs-h2',
                      label: 'Título 2',
                      hint: '##',
                      checked: cursorFormat.blockStyle === 'h2',
                      onSelect: () => onBlockStyle('h2'),
                    },
                    {
                      id: 'bs-h3',
                      label: 'Subtítulo',
                      hint: '###',
                      checked: cursorFormat.blockStyle === 'h3',
                      onSelect: () => onBlockStyle('h3'),
                    },
                    {
                      id: 'bs-quote',
                      label: 'Citação',
                      hint: '>',
                      checked: cursorFormat.blockStyle === 'quote',
                      onSelect: () => onBlockStyle('quote'),
                    },
                  ]}
                />
              )}
            </div>

            {/* Font Family Selector */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-expanded={openMenu === 'font'}
                onClick={() => toggleMenu('font')}
                title="Família tipográfica do texto"
                style={{
                  height: 26,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    openMenu === 'font' ? 'var(--bg-elevated)' : 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 11.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 108,
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>{FONT_LABELS[font]}</span>
                <ChevronDown size={11} aria-hidden="true" style={{ opacity: 0.7 }} />
              </button>
              {openMenu === 'font' && (
                <DropdownList
                  width={170}
                  onClose={() => setOpenMenu(null)}
                  entries={(['serif', 'sans', 'mono'] as const).map((f) => ({
                    id: `font-${f}`,
                    label: FONT_LABELS[f],
                    checked: font === f,
                    onSelect: () => onFontChange(f),
                  }))}
                />
              )}
            </div>

            {/* Font Size Stepper */}
            <div
              style={{
                height: 26,
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                title="Diminuir tamanho da fonte"
                aria-label="Diminuir tamanho da fonte"
                onClick={() => onFontSizeDelta(-1)}
                style={{
                  width: 22,
                  height: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <Minus size={11} aria-hidden="true" />
              </button>
              <span
                style={{
                  fontSize: 11,
                  minWidth: 24,
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {fontSize}
              </span>
              <button
                type="button"
                title="Aumentar tamanho da fonte"
                aria-label="Aumentar tamanho da fonte"
                onClick={() => onFontSizeDelta(1)}
                style={{
                  width: 22,
                  height: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <Plus size={11} aria-hidden="true" />
              </button>
            </div>

            <div
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'var(--border-subtle)',
                margin: '0 4px',
              }}
            />

            {/* Inline Markdown Formatting */}
            <RibbonIconButton
              active={cursorFormat.bold}
              title="Negrito (**texto**)"
              onClick={() => onFormatCommand('bold')}
            >
              <Bold size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              active={cursorFormat.italic}
              title="Itálico (*texto*)"
              onClick={() => onFormatCommand('italic')}
            >
              <Italic size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              active={cursorFormat.strikethrough}
              title="Tachado (~~texto~~)"
              onClick={() => onFormatCommand('strikethrough')}
            >
              <Strikethrough size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              active={cursorFormat.inlineCode}
              title="Código inline (`texto`)"
              onClick={() => onFormatCommand('inlineCode')}
            >
              <Code size={13} aria-hidden="true" />
            </RibbonIconButton>

            <div
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'var(--border-subtle)',
                margin: '0 4px',
              }}
            />

            {/* Alignment & Lists & Scene Elements */}
            <RibbonIconButton
              active={align === 'justify'}
              title={align === 'justify' ? 'Alinhar à esquerda' : 'Justificar texto'}
              onClick={() => onAlignChange(align === 'justify' ? 'left' : 'justify')}
            >
              {align === 'justify' ? (
                <AlignJustify size={13} aria-hidden="true" />
              ) : (
                <AlignLeft size={13} aria-hidden="true" />
              )}
            </RibbonIconButton>
            <RibbonIconButton
              title="Lista com marcadores (- )"
              onClick={() => onFormatCommand('bulletList')}
            >
              <List size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Lista numerada (1. )"
              onClick={() => onFormatCommand('orderedList')}
            >
              <ListOrdered size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Checklist de revisão (- [ ])"
              onClick={() => onFormatCommand('checklist')}
            >
              <CheckSquare size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              active={cursorFormat.blockStyle === 'quote'}
              title="Citação / Epígrafe (>)"
              onClick={() => onFormatCommand('epigraph')}
            >
              <Quote size={13} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Divisor de cena (***)"
              onClick={() => onFormatCommand('divider')}
            >
              <Minus size={13} aria-hidden="true" />
            </RibbonIconButton>

            <div
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'var(--border-subtle)',
                margin: '0 4px',
              }}
            />

            <RibbonIconButton
              title="Inserir Personagem (@)"
              onClick={() => onOpenMentionCategory('char')}
            >
              <AtSign size={12} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Inserir Local (#)"
              onClick={() => onOpenMentionCategory('loc')}
            >
              <Hash size={12} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Inserir Facção (&)"
              onClick={() => onOpenMentionCategory('faction')}
            >
              <Shield size={12} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Inserir Objeto (!)"
              onClick={() => onOpenMentionCategory('obj')}
            >
              <Box size={12} aria-hidden="true" />
            </RibbonIconButton>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RibbonIconButton title="Localizar na cena (Ctrl+F)" onClick={onOpenSearch}>
              <Search size={12} aria-hidden="true" />
              <span>Localizar</span>
            </RibbonIconButton>
            <RibbonIconButton
              active={showWorkshop}
              title="Oficina do Escritor"
              onClick={onToggleWorkshop}
            >
              <Sparkles size={12} aria-hidden="true" />
              <span>Oficina</span>
            </RibbonIconButton>
            <RibbonIconButton
              active={readingSpeechActive}
              title={readingSpeechActive ? 'Parar leitura em voz alta' : 'Ouvir cena em voz alta'}
              onClick={onToggleSpeech}
            >
              {readingSpeechActive ? (
                <VolumeX size={12} aria-hidden="true" />
              ) : (
                <Volume2 size={12} aria-hidden="true" />
              )}
            </RibbonIconButton>
            <RibbonIconButton title="Salvar instantâneo da cena" onClick={onSnapshot}>
              <BookmarkPlus size={12} aria-hidden="true" />
            </RibbonIconButton>
            <RibbonIconButton
              title="Minimizar barra de formatação"
              onClick={onToggleFormatBar}
            >
              <ChevronUp size={13} aria-hidden="true" />
            </RibbonIconButton>
          </div>
        </div>
      )}
    </div>
  );
}
