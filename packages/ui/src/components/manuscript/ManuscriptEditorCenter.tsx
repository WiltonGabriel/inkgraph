import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { Copy, Check, PanelRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords, type Scene } from '../../types/project';
import { CodeMirrorEditorSurface } from './CodeMirrorEditorSurface';
import {
  insertBlockSnippet,
  openEditorSearch,
  runMarkdownFormatCommand,
  type MarkdownFormatCommand,
} from './cmMarkdownCommands';
import {
  ManuscriptFormattingBar,
  type ManuscriptEditorMode,
} from './ManuscriptFormattingBar';
import { ManuscriptMarkdownPreview } from './ManuscriptMarkdownPreview';
import { ManuscriptMentionBar } from './ManuscriptMentionBar';
import { ManuscriptTelemetryFooter } from './ManuscriptTelemetryFooter';
import { ManuscriptVisualBlockEditor } from './ManuscriptVisualBlockEditor';
import { ManuscriptWriterToolsDrawer } from './ManuscriptWriterToolsDrawer';
import { extractSceneMentions } from './manuscriptMentions';

interface ManuscriptEditorCenterProps {
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

const MODE_ORDER: ManuscriptEditorMode[] = ['visual', 'write', 'code', 'split', 'read'];

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
    () => (settings.markdownEditorDefaultMode as ManuscriptEditorMode) || 'write'
  );
  const [writerToolsOpen, setWriterToolsOpen] = useState(false);
  const [sceneTargetWords, setSceneTargetWords] = useState(1500);
  const [sprintBadge, setSprintBadge] = useState<{
    active: boolean;
    formattedTime: string;
    deltaWords: number;
  }>({ active: false, formattedTime: '25:00', deltaWords: 0 });
  const [copiedRawSource, setCopiedRawSource] = useState(false);

  const cmViewRef = useRef<EditorView | null>(null);

  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  useEffect(() => {
    setEditorMode((settings.markdownEditorDefaultMode as ManuscriptEditorMode) || 'write');
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

  const handleInsertSnippet = useCallback(
    (snippet: string) => {
      if (!activeScene) return;
      if (
        cmViewRef.current &&
        (editorMode === 'write' || editorMode === 'code' || editorMode === 'split')
      ) {
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
      if (!activeScene) return;
      if (
        cmViewRef.current &&
        (editorMode === 'write' || editorMode === 'code' || editorMode === 'split')
      ) {
        runMarkdownFormatCommand(cmViewRef.current, cmd);
        return;
      }

      // Fallback when clicking top formatting bar while in Visual Interface mode
      const visualFallbacks: Record<MarkdownFormatCommand, string> = {
        h1: '# Novo Título',
        h2: '## Novo Subtítulo',
        h3: '### Nova Seção',
        bold: '**texto em negrito**',
        italic: '*texto em itálico*',
        strikethrough: '~~trecho cortado~~',
        dialogue: '— ',
        quotes: '“fala ou destaque”',
        epigraph: '> Epígrafe do capítulo',
        checklist: '- [ ] Novo item da cena',
        divider: '***',
        noteCallout: '> [!NOTA]\n> Nota de bastidor',
        secretCallout: '> [!SEGREDO]\n> Segredo epistêmico da cena',
        comment: '%% comentário do autor %%',
      };
      handleInsertSnippet(visualFallbacks[cmd]);
    },
    [activeScene, editorMode, handleInsertSnippet]
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
  const lineCount = activeScene.content.split(/\r?\n/).length;

  const yamlFrontmatterHeader = `---
id: "${activeScene.id}"
title: "${activeScene.title.replace(/"/g, '\\"')}"
chapter: ${activeScene.chapterNumber}
act: "${activeScene.act}"
pov: "${activeScene.povCharacterId || 'omniscient'}"
status: "${activeScene.status}"
tension: ${activeScene.tension}
---`;

  const handleCopyFullCode = () => {
    void navigator.clipboard
      ?.writeText(`${yamlFrontmatterHeader}\n\n${activeScene.content}`)
      .catch(() => undefined);
    setCopiedRawSource(true);
    notify('Código Markdown + YAML da cena copiado.', 'info');
    window.setTimeout(() => setCopiedRawSource(false), 1500);
  };

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
      {/* Cabeçalho da Cena: Título + POV rápido + Status rápido + Inspetor */}
      <div
        style={{
          padding: '8px 14px',
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
            fontSize: 15,
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
              height: 28,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: 600,
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
              height: 28,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              color:
                activeScene.status === 'final'
                  ? '#10b981'
                  : activeScene.status === 'revised'
                  ? '#38bdf8'
                  : '#f59e0b',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <option value="draft">Status: Rascunho</option>
            <option value="revised">Status: Em Revisão</option>
            <option value="final">Status: Finalizado</option>
          </select>

          {onToggleInspector && !settings.zenMode && (
            <button
              type="button"
              onClick={onToggleInspector}
              aria-pressed={Boolean(inspectorOpen)}
              aria-label={inspectorOpen ? 'Ocultar inspetor da cena' : 'Abrir inspetor da cena'}
              title={
                inspectorOpen
                  ? 'Ocultar inspetor (Ctrl+Shift+I)'
                  : 'Abrir inspetor (Ctrl+Shift+I)'
              }
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
                cursor: 'pointer',
              }}
            >
              <PanelRight size={13} aria-hidden="true" />
              <span>Inspetor</span>
            </button>
          )}
        </div>
      </div>

      <ManuscriptFormattingBar
        editorMode={editorMode}
        onChangeEditorMode={setEditorMode}
        onFormatCommand={handleFormatCommand}
        onOpenSearch={() => openEditorSearch(cmViewRef.current)}
        writerToolsOpen={writerToolsOpen}
        onToggleWriterTools={() => setWriterToolsOpen((prev) => !prev)}
        sprintBadge={sprintBadge}
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

      <ManuscriptWriterToolsDrawer
        open={writerToolsOpen}
        onClose={() => setWriterToolsOpen(false)}
        sceneContent={activeScene.content}
        currentWords={words}
        sceneTargetWords={sceneTargetWords}
        onChangeSceneTargetWords={setSceneTargetWords}
        onInsertSnippet={handleInsertSnippet}
        onSprintStatusChange={setSprintBadge}
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
        {editorMode === 'visual' && (
          <ManuscriptVisualBlockEditor
            sceneId={activeScene.id}
            content={activeScene.content}
            onChange={handleContentChange}
            project={project}
            settings={settings}
          />
        )}

        {(editorMode === 'write' || editorMode === 'code' || editorMode === 'split') && (
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
            {editorMode === 'code' && (
              <div
                style={{
                  padding: '8px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  {yamlFrontmatterHeader}
                </pre>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>
                    {lineCount} linhas · UTF-8 Markdown
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFullCode}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: copiedRawSource ? '#10b981' : 'var(--text-primary)',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedRawSource ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedRawSource ? 'Copiado' : 'Copiar YAML + Código'}</span>
                  </button>
                </div>
              </div>
            )}

            <CodeMirrorEditorSurface
              sceneId={activeScene.id}
              value={activeScene.content}
              onChange={handleContentChange}
              project={project}
              settings={settings}
              codeMode={editorMode === 'code'}
              onViewReady={(view) => {
                cmViewRef.current = view;
              }}
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
