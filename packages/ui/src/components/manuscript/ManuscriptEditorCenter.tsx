import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2, SlidersHorizontal } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords, type Scene } from '../../types/project';
import { CodeMirrorEditorSurface } from './CodeMirrorEditorSurface';
import {
  insertBlockSnippet,
  insertInlineText,
  openEditorSearch,
  redoEditor,
  runMarkdownFormatCommand,
  selectAllEditor,
  setBlockStyle,
  undoEditor,
  type ActiveBlockStyle,
  type CursorMarkdownState,
  type MarkdownFormatCommand,
} from './cmMarkdownCommands';
import { ManuscriptDocsBar, type ManuscriptMode } from './ManuscriptDocsBar';
import { ManuscriptMarkdownPreview } from './ManuscriptMarkdownPreview';
import {
  ManuscriptMentionBar,
  type MentionCategoryKey,
} from './ManuscriptMentionBar';
import { ManuscriptTelemetryFooter } from './ManuscriptTelemetryFooter';
import { ManuscriptWriterToolsDrawer } from './ManuscriptWriterToolsDrawer';
import { extractSceneMentions } from './manuscriptMentions';

interface ManuscriptEditorCenterProps {
  navigatorOpen?: boolean;
  onToggleNavigator?: () => void;
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
  hasPinnedBinder?: boolean;
  onClearPinnedBinder?: () => void;
}

const MODE_ORDER: ManuscriptMode[] = ['write', 'markdown', 'split', 'read'];

const INITIAL_CURSOR_STATE: CursorMarkdownState = {
  blockStyle: 'normal',
  bold: false,
  italic: false,
  strikethrough: false,
  inlineCode: false,
};

function normalizeMode(raw: string | undefined): ManuscriptMode {
  if (raw === 'markdown' || raw === 'code') return 'markdown';
  if (raw === 'split') return 'split';
  if (raw === 'read') return 'read';
  return 'write';
}

export function ManuscriptEditorCenter({
  navigatorOpen = true,
  onToggleNavigator,
  inspectorOpen = true,
  onToggleInspector,
}: ManuscriptEditorCenterProps) {
  const {
    project,
    settings,
    updateSettings,
    activeSceneId,
    setActiveSceneId,
    upsertScene,
    createSnapshot,
    notify,
  } = useProject();

  const [speaking, setSpeaking] = useState(false);
  const [editorMode, setEditorMode] = useState<ManuscriptMode>(() =>
    normalizeMode(settings.markdownEditorDefaultMode)
  );
  const [showFormatBar, setShowFormatBar] = useState(true);
  const [showMentionBar, setShowMentionBar] = useState(true);
  const [showZenChrome, setShowZenChrome] = useState(false);
  const [openMentionCategory, setOpenMentionCategory] =
    useState<MentionCategoryKey | null>(null);
  const [writerToolsOpen, setWriterToolsOpen] = useState(false);
  const [sceneTargetWords, setSceneTargetWords] = useState(1500);
  const [cursorFormat, setCursorFormat] =
    useState<CursorMarkdownState>(INITIAL_CURSOR_STATE);

  const cmViewRef = useRef<EditorView | null>(null);

  const sortedScenes = useMemo(
    () => [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber),
    [project.scenes]
  );

  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? sortedScenes[0] ?? project.scenes[0];

  const activeSceneIndex = activeScene
    ? sortedScenes.findIndex((s) => s.id === activeScene.id)
    : -1;
  const prevScene = activeSceneIndex > 0 ? sortedScenes[activeSceneIndex - 1] : null;
  const nextScene =
    activeSceneIndex >= 0 && activeSceneIndex < sortedScenes.length - 1
      ? sortedScenes[activeSceneIndex + 1]
      : null;

  useEffect(() => {
    setEditorMode(normalizeMode(settings.markdownEditorDefaultMode));
  }, [settings.markdownEditorDefaultMode]);

  useEffect(() => {
    if (!settings.zenMode) setShowZenChrome(false);
  }, [settings.zenMode]);

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

  const handleToggleFullscreen = useCallback(() => {
    const nextZen = !settings.zenMode;
    updateSettings((prev) => ({ ...prev, zenMode: nextZen }));
    if (nextZen) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, [settings.zenMode, updateSettings]);

  const handleInsertSnippet = useCallback(
    (snippet: string) => {
      if (!activeScene) return;
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
    },
    [activeScene, editorMode, upsertScene]
  );

  const handleInsertMention = useCallback(
    (token: string) => {
      if (!activeScene) return;
      if (cmViewRef.current && editorMode !== 'read') {
        insertInlineText(cmViewRef.current, token);
        return;
      }
      const sep =
        activeScene.content.length > 0 && !/\s$/.test(activeScene.content) ? ' ' : '';
      upsertScene({
        ...activeScene,
        content: `${activeScene.content}${sep}${token}`,
        lastEditedAt: new Date().toISOString(),
      });
    },
    [activeScene, editorMode, upsertScene]
  );

  useEffect(() => {
    const handleInsertProse = (ev: Event) => {
      const snippet = (ev as CustomEvent<{ snippet?: string }>).detail?.snippet;
      if (!snippet) return;
      handleInsertSnippet(snippet);
    };

    window.addEventListener('inkgraph:insert-prose', handleInsertProse);
    return () => window.removeEventListener('inkgraph:insert-prose', handleInsertProse);
  }, [handleInsertSnippet]);

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

  const handleFormatCommand = useCallback(
    (cmd: MarkdownFormatCommand) => {
      if (!activeScene || !cmViewRef.current) return;
      runMarkdownFormatCommand(cmViewRef.current, cmd);
    },
    [activeScene]
  );

  const handleBlockStyle = useCallback(
    (style: ActiveBlockStyle) => {
      if (!activeScene || !cmViewRef.current) return;
      setBlockStyle(cmViewRef.current, style);
    },
    [activeScene]
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

  const showSceneHeader = !settings.zenMode && editorMode !== 'read';
  const showDocsBars = (!settings.zenMode || showZenChrome) && editorMode !== 'read';

  return (
    <section
      aria-label="Editor do manuscrito"
      style={{
        flex: 1,
        minWidth: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-canvas)',
        overflow: 'hidden',
      }}
    >
      {/* Floating Fullscreen Corner Controls (minimal, only when in Tela Cheia) */}
      {settings.zenMode && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 6px',
            borderRadius: 999,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          {editorMode !== 'read' && (
            <button
              type="button"
              onClick={() => setShowZenChrome((prev) => !prev)}
              title={showZenChrome ? 'Ocultar barra de formatação' : 'Mostrar barra de formatação'}
              style={{
                padding: '4px 9px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
                backgroundColor: showZenChrome ? 'var(--accent-soft)' : 'transparent',
                color: showZenChrome ? 'var(--accent-primary)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={12} aria-hidden="true" />
              <span>Controles</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Sair da tela cheia"
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <Minimize2 size={12} aria-hidden="true" />
            <span>Sair da tela cheia</span>
          </button>
        </div>
      )}

      {/* Calm Scene Title & Metadata Header */}
      {showSceneHeader && (
        <div
          style={{
            padding: '6px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
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
              flex: '1 1 200px',
              minWidth: 0,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14.5,
              fontWeight: 700,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <select
              aria-label="Ponto de Vista (POV) da cena"
              title="Ponto de Vista (POV) da cena"
              value={activeScene.povCharacterId}
              onChange={(e) =>
                upsertScene({
                  ...activeScene,
                  povCharacterId: e.target.value,
                  lastEditedAt: new Date().toISOString(),
                })
              }
              style={{
                height: 26,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="">POV: Narrador Livre</option>
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  POV: {c.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Status editorial da cena"
              title="Status editorial da cena"
              value={activeScene.status}
              onChange={(e) =>
                upsertScene({
                  ...activeScene,
                  status: e.target.value as Scene['status'],
                  lastEditedAt: new Date().toISOString(),
                })
              }
              style={{
                height: 26,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color:
                  activeScene.status === 'final'
                    ? '#10b981'
                    : activeScene.status === 'revised'
                    ? 'var(--accent-primary, #38bdf8)'
                    : '#f59e0b',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="draft">Rascunho</option>
              <option value="revised">Em Revisão</option>
              <option value="final">Finalizado</option>
            </select>
          </div>
        </div>
      )}

      {/* Minimalist Reader Top Strip when in Final Book Reading Mode */}
      {editorMode === 'read' && (
        <div
          style={{
            padding: '7px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            paddingRight: settings.zenMode ? 170 : 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              disabled={!prevScene}
              onClick={() => prevScene && setActiveSceneId(prevScene.id)}
              title="Capítulo / Cena anterior"
              style={{
                height: 26,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: prevScene ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: prevScene ? 1 : 0.45,
                cursor: prevScene ? 'pointer' : 'default',
              }}
            >
              <ChevronLeft size={13} aria-hidden="true" /> Anterior
            </button>
            <button
              type="button"
              disabled={!nextScene}
              onClick={() => nextScene && setActiveSceneId(nextScene.id)}
              title="Próximo Capítulo / Cena"
              style={{
                height: 26,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: nextScene ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: nextScene ? 1 : 0.45,
                cursor: nextScene ? 'pointer' : 'default',
              }}
            >
              Próxima <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Cap. {activeScene.chapterNumber} · {activeScene.title}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              style={{
                height: 26,
                padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar ao Editor
            </button>
            {!settings.zenMode && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                title="Tela cheia"
                style={{
                  height: 26,
                  padding: '0 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Maximize2 size={12} aria-hidden="true" /> Tela cheia
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menu Bar + Collapsible Markdown Formatting Ribbon */}
      {showDocsBars && (
        <ManuscriptDocsBar
          mode={editorMode}
          onModeChange={setEditorMode}
          cursorFormat={cursorFormat}
          showFormatBar={showFormatBar}
          onToggleFormatBar={() => setShowFormatBar((prev) => !prev)}
          showMentionBar={showMentionBar}
          onToggleMentionBar={() => setShowMentionBar((prev) => !prev)}
          navigatorOpen={navigatorOpen}
          onToggleNavigator={() => onToggleNavigator?.()}
          inspectorOpen={inspectorOpen}
          onToggleInspector={() => onToggleInspector?.()}
          fullscreen={settings.zenMode}
          onToggleFullscreen={handleToggleFullscreen}
          showWorkshop={writerToolsOpen}
          onToggleWorkshop={() => setWriterToolsOpen((prev) => !prev)}
          readingSpeechActive={speaking}
          onToggleSpeech={handleToggleSpeech}
          onUndo={() => undoEditor(cmViewRef.current)}
          onRedo={() => redoEditor(cmViewRef.current)}
          onSelectAll={() => selectAllEditor(cmViewRef.current)}
          onOpenSearch={() => openEditorSearch(cmViewRef.current)}
          onFormatCommand={handleFormatCommand}
          onBlockStyle={handleBlockStyle}
          onOpenMentionCategory={(cat) => {
            setShowMentionBar(true);
            setOpenMentionCategory(cat);
          }}
          onSnapshot={handleQuickSnapshot}
          font={settings.editorFont}
          onFontChange={(font) => updateSettings((s) => ({ ...s, editorFont: font }))}
          fontSize={settings.editorFontSize}
          onFontSizeDelta={(delta) =>
            updateSettings((s) => ({
              ...s,
              editorFontSize: Math.min(28, Math.max(12, s.editorFontSize + delta)),
            }))
          }
          align={settings.editorTextAlign}
          onAlignChange={(editorTextAlign) =>
            updateSettings((s) => ({ ...s, editorTextAlign }))
          }
          paragraphIndent={settings.paragraphIndent}
          onToggleParagraphIndent={() =>
            updateSettings((s) => ({ ...s, paragraphIndent: !s.paragraphIndent }))
          }
        />
      )}

      {showDocsBars && (
        <ManuscriptWriterToolsDrawer
          open={writerToolsOpen}
          onClose={() => setWriterToolsOpen(false)}
          sceneContent={activeScene.content}
          currentWords={words}
          sceneTargetWords={sceneTargetWords}
          onChangeSceneTargetWords={setSceneTargetWords}
          onInsertSnippet={handleInsertSnippet}
        />
      )}

      {showDocsBars && showMentionBar && (
        <ManuscriptMentionBar
          project={project}
          mentions={mentions}
          onInsertMention={handleInsertMention}
          openCategory={openMentionCategory}
          onOpenCategoryChange={setOpenMentionCategory}
          onHide={() => setShowMentionBar(false)}
        />
      )}

      {/* Main Editor / Reader Canvas */}
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
              codeMode={editorMode === 'markdown'}
              livePreview={editorMode === 'write'}
              onViewReady={(view) => {
                cmViewRef.current = view;
              }}
              onCursorFormatChange={setCursorFormat}
            />
          </div>
        )}

        {(editorMode === 'split' || editorMode === 'read') && (
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
              finalProduct={true}
              onToggleChecklistLine={handleToggleChecklistLine}
            />
          </div>
        )}
      </div>

      {!settings.zenMode && editorMode !== 'read' && (
        <ManuscriptTelemetryFooter
          scene={activeScene}
          povName={povChar?.name}
          mentions={mentions}
          words={words}
          charsCount={charsCount}
          readingMinutes={readingMinutes}
          settings={settings}
        />
      )}
    </section>
  );
}
