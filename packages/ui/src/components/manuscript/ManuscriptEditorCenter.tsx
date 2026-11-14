import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { PanelRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';
import { CodeMirrorEditorSurface } from './CodeMirrorEditorSurface';
import {
  insertBlockSnippet,
  openEditorSearch,
  runMarkdownFormatCommand,
} from './cmMarkdownCommands';
import {
  ManuscriptFormattingBar,
  type ManuscriptEditorMode,
} from './ManuscriptFormattingBar';
import { ManuscriptMarkdownPreview } from './ManuscriptMarkdownPreview';
import { ManuscriptMentionBar } from './ManuscriptMentionBar';
import { ManuscriptTelemetryFooter } from './ManuscriptTelemetryFooter';
import { extractSceneMentions } from './manuscriptMentions';

interface ManuscriptEditorCenterProps {
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

const MODE_ORDER: ManuscriptEditorMode[] = ['write', 'split', 'read'];

export function ManuscriptEditorCenter({
  inspectorOpen,
  onToggleInspector,
}: ManuscriptEditorCenterProps) {
  const {
    project,
    settings,
    updateSettings,
    activeSceneId,
    upsertScene,
    createSnapshot,
    notify,
  } = useProject();

  const [speaking, setSpeaking] = useState(false);
  const [editorMode, setEditorMode] = useState<ManuscriptEditorMode>(
    () => settings.markdownEditorDefaultMode || 'write'
  );
  const cmViewRef = useRef<EditorView | null>(null);

  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  useEffect(() => {
    setEditorMode(settings.markdownEditorDefaultMode || 'write');
  }, [settings.markdownEditorDefaultMode]);

  useEffect(() => {
    const handleAppShortcut = (ev: Event) => {
      const detail = (ev as CustomEvent<{ action?: string }>).detail;
      if (detail?.action === 'cycleEditorMode') {
        setEditorMode((prev) => {
          const nextIdx = (MODE_ORDER.indexOf(prev) + 1) % MODE_ORDER.length;
          return MODE_ORDER[nextIdx];
        });
      }
    };
    window.addEventListener('inkgraph:shortcut', handleAppShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', handleAppShortcut);
  }, []);

  useEffect(() => {
    const handleInsertProse = (ev: Event) => {
      const snippet = (ev as CustomEvent<{ snippet?: string }>).detail?.snippet;
      if (!snippet || !activeScene) return;

      if (cmViewRef.current && editorMode !== 'read') {
        insertBlockSnippet(cmViewRef.current, snippet);
        return;
      }

      const separator =
        activeScene.content.trim().length > 0 && !activeScene.content.endsWith('\n')
          ? '\n\n'
          : '';
      upsertScene({
        ...activeScene,
        content: `${activeScene.content}${separator}${snippet}`,
        lastEditedAt: new Date().toISOString(),
      });
    };

    window.addEventListener('inkgraph:insert-prose', handleInsertProse);
    return () => window.removeEventListener('inkgraph:insert-prose', handleInsertProse);
  }, [activeScene, editorMode, upsertScene]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
    };
  }, [activeScene?.id]);

  const mentions = useMemo(() => {
    if (!activeScene) return { chars: [], locs: [], factions: [], objects: [] };
    return extractSceneMentions(activeScene.content, project);
  }, [activeScene, project]);

  const handleContentChange = useCallback(
    (nextContent: string) => {
      if (!activeScene) return;
      upsertScene({
        ...activeScene,
        content: nextContent,
        lastEditedAt: new Date().toISOString(),
      });
    },
    [activeScene, upsertScene]
  );

  const handleToggleChecklistLine = useCallback(
    (lineIndex: number) => {
      if (!activeScene) return;
      const lines = activeScene.content.split(/\r?\n/);
      const target = lines[lineIndex];
      if (!target) return;
      if (/^(\s*[-*]\s+\[)\s(\]\s+.*)$/.test(target)) {
        lines[lineIndex] = target.replace(/^(\s*[-*]\s+\[)\s(\]\s+.*)$/, '$1x$2');
      } else if (/^(\s*[-*]\s+\[)[xX](\]\s+.*)$/.test(target)) {
        lines[lineIndex] = target.replace(/^(\s*[-*]\s+\[)[xX](\]\s+.*)$/, '$1 $2');
      }
      handleContentChange(lines.join('\n'));
    },
    [activeScene, handleContentChange]
  );

  const handleToggleSpeech = () => {
    if (!activeScene || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeScene.content);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  const handleQuickSnapshot = () => {
    createSnapshot(`Instantâneo Rápido (${new Date().toLocaleTimeString('pt-BR')})`);
    notify('Instantâneo rápido salvo.', 'success');
  };

  if (!activeScene) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        Selecione ou crie uma cena no índice lateral.
      </div>
    );
  }

  const words = countWords(activeScene.content);
  const charsCount = activeScene.content.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220));
  const povChar = project.characters.find((c) => c.id === activeScene.povCharacterId);

  return (
    <section
      aria-label="Editor do manuscrito"
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-canvas)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <input
          value={activeScene.title}
          onChange={(e) =>
            upsertScene({
              ...activeScene,
              title: e.target.value,
              lastEditedAt: new Date().toISOString(),
            })
          }
          placeholder="Título da Cena..."
          aria-label="Título da cena"
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 15,
            fontWeight: 700,
            outline: 'none',
          }}
        />

        {onToggleInspector && !settings.zenMode && (
          <button
            type="button"
            onClick={onToggleInspector}
            aria-pressed={Boolean(inspectorOpen)}
            aria-label={inspectorOpen ? 'Ocultar inspetor da cena' : 'Abrir inspetor da cena'}
            title={inspectorOpen ? 'Ocultar inspetor (Ctrl+Shift+I)' : 'Abrir inspetor (Ctrl+Shift+I)'}
            style={{
              minHeight: 28,
              padding: '4px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: inspectorOpen ? 'var(--accent-soft)' : 'var(--bg-elevated)',
              color: inspectorOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            <PanelRight size={13} aria-hidden="true" />
            <span>Inspetor</span>
          </button>
        )}
      </div>

      <ManuscriptFormattingBar
        editorMode={editorMode}
        onChangeEditorMode={setEditorMode}
        onFormatCommand={(cmd) => runMarkdownFormatCommand(cmViewRef.current, cmd)}
        onOpenSearch={() => openEditorSearch(cmViewRef.current)}
        typewriterMode={settings.typewriterMode}
        onToggleTypewriter={() =>
          updateSettings((s) => ({ ...s, typewriterMode: !s.typewriterMode }))
        }
        focusMode={settings.focusMode}
        onToggleFocus={() => updateSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
        zenMode={settings.zenMode}
        onToggleZen={() => updateSettings((s) => ({ ...s, zenMode: !s.zenMode }))}
        speaking={speaking}
        onToggleSpeech={handleToggleSpeech}
        onQuickSnapshot={handleQuickSnapshot}
      />

      <ManuscriptMentionBar mentions={mentions} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexWrap: editorMode === 'split' ? 'wrap' : 'nowrap',
          overflow: 'hidden',
        }}
      >
        {editorMode !== 'read' && (
          <div
            style={{
              flex: '1 1 340px',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight:
                editorMode === 'split' ? '1px solid var(--border-subtle)' : 'none',
              overflow: 'hidden',
            }}
          >
            <CodeMirrorEditorSurface
              sceneId={activeScene.id}
              value={activeScene.content}
              onChange={handleContentChange}
              project={project}
              settings={settings}
              onViewReady={(view) => {
                cmViewRef.current = view;
              }}
            />
          </div>
        )}

        {editorMode !== 'write' && (
          <div
            style={{
              flex: '1 1 340px',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <ManuscriptMarkdownPreview
              content={activeScene.content}
              project={project}
              settings={settings}
              onToggleChecklistLine={handleToggleChecklistLine}
            />
          </div>
        )}
      </div>

      <ManuscriptTelemetryFooter
        scene={activeScene}
        povName={povChar?.name}
        mentions={mentions}
        words={words}
        charsCount={charsCount}
        readingMinutes={readingMinutes}
        settings={settings}
      />
    </section>
  );
}
