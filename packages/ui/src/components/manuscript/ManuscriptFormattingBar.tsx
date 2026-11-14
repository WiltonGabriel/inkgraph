import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import {
  AlignCenter,
  Bold,
  Camera,
  CheckSquare,
  Columns,
  Eye,
  Focus,
  Heading1,
  Heading2,
  Italic,
  Lock,
  Maximize2,
  MessageSquareCode,
  Minus,
  PenLine,
  Quote,
  Search,
  StickyNote,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MarkdownFormatCommand } from './cmMarkdownCommands';

export type ManuscriptEditorMode = 'write' | 'split' | 'read';

interface ManuscriptFormattingBarProps {
  editorMode: ManuscriptEditorMode;
  onChangeEditorMode: (mode: ManuscriptEditorMode) => void;
  onFormatCommand: (command: MarkdownFormatCommand) => void;
  onOpenSearch: () => void;
  typewriterMode: boolean;
  onToggleTypewriter: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
  speaking: boolean;
  onToggleSpeech: () => void;
  onQuickSnapshot: () => void;
}

const baseBtnStyle: CSSProperties = {
  minWidth: 28,
  minHeight: 28,
  padding: '4px 7px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: '11.5px',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

function getToggleStyle(active: boolean): CSSProperties {
  if (!active) return baseBtnStyle;
  return {
    ...baseBtnStyle,
    backgroundColor: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
    color: '#ffffff',
    fontWeight: 600,
  };
}

const separatorStyle: CSSProperties = {
  width: 1,
  height: 18,
  borderLeft: '1px solid var(--border-subtle)',
  margin: '0 2px',
  flexShrink: 0,
};

const groupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 4,
};

export function ManuscriptFormattingBar({
  editorMode,
  onChangeEditorMode,
  onFormatCommand,
  onOpenSearch,
  typewriterMode,
  onToggleTypewriter,
  focusMode,
  onToggleFocus,
  zenMode,
  onToggleZen,
  speaking,
  onToggleSpeech,
  onQuickSnapshot,
}: ManuscriptFormattingBarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const isReadOnlyMode = editorMode === 'read';

  // Roving-tabindex fallback only when native focusgroup is unsupported.
  useEffect(() => {
    const bar = toolbarRef.current;
    if (!bar || 'focusGroup' in HTMLElement.prototype) return;
    const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button'));
    buttons.forEach((btn, idx) => {
      btn.tabIndex = idx === 0 ? 0 : -1;
    });
  }, []);

  const handleToolbarKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    const bar = toolbarRef.current;
    if (!bar || 'focusGroup' in HTMLElement.prototype) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)) return;

    const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button'));
    if (buttons.length === 0) return;

    const activeIdx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (activeIdx === -1) return;

    const isRtl = getComputedStyle(bar).direction === 'rtl';
    let nextIdx = activeIdx;

    if (ev.key === 'Home') nextIdx = 0;
    else if (ev.key === 'End') nextIdx = buttons.length - 1;
    else if (ev.key === 'ArrowRight') {
      nextIdx = (activeIdx + (isRtl ? -1 : 1) + buttons.length) % buttons.length;
    } else if (ev.key === 'ArrowLeft') {
      nextIdx = (activeIdx + (isRtl ? 1 : -1) + buttons.length) % buttons.length;
    }

    ev.preventDefault();
    buttons.forEach((b, idx) => {
      b.tabIndex = idx === nextIdx ? 0 : -1;
    });
    buttons[nextIdx]?.focus();
  };

  const handleToolbarFocusIn = (ev: React.FocusEvent<HTMLDivElement>) => {
    const bar = toolbarRef.current;
    if (!bar || 'focusGroup' in HTMLElement.prototype) return;
    const target = ev.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button'));
    buttons.forEach((b) => {
      b.tabIndex = b === target ? 0 : -1;
    });
  };

  const formatButtons: {
    cmd: MarkdownFormatCommand;
    label: string;
    shortLabel?: string;
    icon: typeof Heading1;
  }[] = [
    { cmd: 'h1', label: 'Título H1', shortLabel: 'H1', icon: Heading1 },
    { cmd: 'h2', label: 'Subtítulo H2', shortLabel: 'H2', icon: Heading2 },
    { cmd: 'bold', label: 'Negrito', icon: Bold },
    { cmd: 'italic', label: 'Itálico', icon: Italic },
    { cmd: 'epigraph', label: 'Epígrafe', icon: Quote },
    { cmd: 'checklist', label: 'Checklist', icon: CheckSquare },
    { cmd: 'divider', label: 'Divisor ***', shortLabel: '***', icon: Minus },
    { cmd: 'noteCallout', label: 'Inserir [!NOTA]', shortLabel: '[!NOTA]', icon: StickyNote },
    { cmd: 'secretCallout', label: 'Inserir [!SEGREDO]', shortLabel: '[!SEGREDO]', icon: Lock },
    { cmd: 'comment', label: 'Comentário %%', shortLabel: '%%', icon: MessageSquareCode },
  ];

  const modeOptions: { id: ManuscriptEditorMode; label: string; icon: typeof PenLine }[] = [
    { id: 'write', label: 'Escrever', icon: PenLine },
    { id: 'split', label: 'Dividido', icon: Columns },
    { id: 'read', label: 'Leitura', icon: Eye },
  ];

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Formatação e modos do manuscrito"
      onKeyDown={handleToolbarKeyDown}
      onFocus={handleToolbarFocusIn}
      {...({ focusgroup: 'toolbar wrap' } as Record<string, string>)}
      style={{
        padding: '6px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      }}
    >
      <div role="group" aria-label="Formatação Markdown" style={groupStyle}>
        {formatButtons.map(({ cmd, label, shortLabel, icon: Icon }) => (
          <button
            key={cmd}
            type="button"
            aria-label={label}
            title={isReadOnlyMode ? `${label} (disponível no modo Escrever/Dividido)` : label}
            aria-disabled={isReadOnlyMode}
            onClick={() => {
              if (!isReadOnlyMode) onFormatCommand(cmd);
            }}
            style={{
              ...baseBtnStyle,
              opacity: isReadOnlyMode ? 0.45 : 1,
              cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon size={13} aria-hidden="true" />
            {shortLabel && <span>{shortLabel}</span>}
          </button>
        ))}

        <span role="separator" aria-orientation="vertical" style={separatorStyle} />

        <button
          type="button"
          aria-label="Localizar e substituir"
          title="Localizar e substituir (Ctrl+F / Ctrl+H)"
          aria-disabled={isReadOnlyMode}
          onClick={() => {
            if (!isReadOnlyMode) onOpenSearch();
          }}
          style={{
            ...baseBtnStyle,
            opacity: isReadOnlyMode ? 0.45 : 1,
            cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
          }}
        >
          <Search size={13} aria-hidden="true" />
          <span>Localizar</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <div role="group" aria-label="Modo de visualização" style={groupStyle}>
          {modeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={editorMode === id}
              onClick={() => onChangeEditorMode(id)}
              style={getToggleStyle(editorMode === id)}
            >
              <Icon size={13} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <span role="separator" aria-orientation="vertical" style={separatorStyle} />

        <div role="group" aria-label="Controles de foco e estúdio" style={groupStyle}>
          <button
            type="button"
            aria-pressed={typewriterMode}
            title="Modo Máquina de Escrever"
            onClick={onToggleTypewriter}
            style={getToggleStyle(typewriterMode)}
          >
            <AlignCenter size={13} aria-hidden="true" />
            <span>Máquina</span>
          </button>

          <button
            type="button"
            aria-pressed={focusMode}
            title="Modo Foco (atenua parágrafos inativos)"
            onClick={onToggleFocus}
            style={getToggleStyle(focusMode)}
          >
            <Focus size={13} aria-hidden="true" />
            <span>Foco</span>
          </button>

          <button
            type="button"
            aria-pressed={zenMode}
            title="Modo Zen (oculta painéis laterais)"
            onClick={onToggleZen}
            style={getToggleStyle(zenMode)}
          >
            <Maximize2 size={13} aria-hidden="true" />
            <span>Zen</span>
          </button>

          <button
            type="button"
            aria-pressed={speaking}
            title="Ler cena em voz alta"
            onClick={onToggleSpeech}
            style={
              speaking
                ? {
                    ...baseBtnStyle,
                    backgroundColor: 'var(--success)',
                    borderColor: 'var(--success)',
                    color: '#052e16',
                    fontWeight: 700,
                  }
                : baseBtnStyle
            }
          >
            {speaking ? (
              <VolumeX size={13} aria-hidden="true" />
            ) : (
              <Volume2 size={13} aria-hidden="true" />
            )}
            <span>{speaking ? 'Parar' : 'Ouvir'}</span>
          </button>

          <button
            type="button"
            title="Salvar instantâneo rápido do manuscrito"
            onClick={onQuickSnapshot}
            style={baseBtnStyle}
          >
            <Camera size={13} aria-hidden="true" />
            <span>Instantâneo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
