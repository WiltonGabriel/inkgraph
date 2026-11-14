import { useEffect, useRef } from 'react';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { openSearchPanel, search, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import type { AppSettings, ProjectData } from '../../types/project';
import { createInkGraphCompletionSource } from './cmMentionAutocomplete';
import {
  INKGRAPH_CM_PHRASES_PT,
  buildInkGraphEditorTheme,
  createFocusModeExtension,
  createTypewriterExtension,
} from './cmEditorThemeAndPlugins';
import { toggleWrapSelection } from './cmMarkdownCommands';
import { createProseHighlightExtension } from './cmMarkdownDecorations';

interface CodeMirrorEditorSurfaceProps {
  sceneId: string;
  value: string;
  onChange: (nextValue: string) => void;
  project: ProjectData;
  settings: AppSettings;
  codeMode?: boolean;
  placeholderText?: string;
  onViewReady?: (view: EditorView | null) => void;
}

export function CodeMirrorEditorSurface({
  sceneId,
  value,
  onChange,
  project,
  settings,
  codeMode = false,
  placeholderText = 'Escreva a prosa da cena... Use @Personagem, #Local, &Facção, !Objeto ou / para comandos rápidos.',
  onViewReady,
}: CodeMirrorEditorSurfaceProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const prevSceneIdRef = useRef<string>(sceneId);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const projectRef = useRef(project);
  projectRef.current = project;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const codeModeRef = useRef(codeMode);
  codeModeRef.current = codeMode;

  const onViewReadyRef = useRef(onViewReady);
  onViewReadyRef.current = onViewReady;

  const compartmentsRef = useRef({
    theme: new Compartment(),
    spellcheck: new Compartment(),
    focus: new Compartment(),
    typewriter: new Compartment(),
  });

  const buildExtensions = (cfg: AppSettings, isCode = false): Extension[] => {
    const comps = compartmentsRef.current;
    const completionSource = createInkGraphCompletionSource(() => projectRef.current);

    return [
      markdown(),
      history(),
      search({ top: true }),
      EditorState.phrases.of(INKGRAPH_CM_PHRASES_PT),
      EditorView.lineWrapping,
      cmPlaceholder(placeholderText),
      autocompletion({
        override: [completionSource],
        activateOnTyping: true,
        defaultKeymap: true,
      }),
      keymap.of([
        { key: 'Mod-h', run: openSearchPanel, scope: 'editor search-panel' },
        {
          key: 'Mod-b',
          run: (v) => toggleWrapSelection(v, '**', '**', 'texto em negrito'),
        },
        {
          key: 'Mod-i',
          run: (v) => toggleWrapSelection(v, '*', '*', 'texto em itálico'),
        },
        indentWithTab,
        ...completionKeymap,
        ...searchKeymap,
        ...markdownKeymap,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      createProseHighlightExtension(),
      comps.theme.of(buildInkGraphEditorTheme(cfg, isCode)),
      comps.spellcheck.of(
        EditorView.contentAttributes.of({
          spellcheck: cfg.spellcheck ? 'true' : 'false',
          'aria-label': 'Editor de prosa do manuscrito',
        })
      ),
      comps.focus.of(createFocusModeExtension(cfg.focusMode)),
      comps.typewriter.of(
        createTypewriterExtension(cfg.typewriterMode, cfg.reducedMotion)
      ),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];
  };

  // Mount CodeMirror 6 EditorView once and destroy cleanly on unmount.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc: value,
      extensions: buildExtensions(settingsRef.current, codeModeRef.current),
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    prevSceneIdRef.current = sceneId;
    onViewReadyRef.current?.(view);

    return () => {
      onViewReadyRef.current?.(null);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure theme, typography, spellcheck, focus mode, and typewriter mode reactively.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const comps = compartmentsRef.current;

    view.dispatch({
      effects: [
        comps.theme.reconfigure(buildInkGraphEditorTheme(settings, codeMode)),
        comps.spellcheck.reconfigure(
          EditorView.contentAttributes.of({
            spellcheck: settings.spellcheck ? 'true' : 'false',
            'aria-label': 'Editor de prosa do manuscrito',
          })
        ),
        comps.focus.reconfigure(createFocusModeExtension(settings.focusMode)),
        comps.typewriter.reconfigure(
          createTypewriterExtension(settings.typewriterMode, settings.reducedMotion)
        ),
      ],
    });
  }, [settings, codeMode]);

  // Sync scene switches (reset undo history) and external document changes without disturbing cursor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (prevSceneIdRef.current !== sceneId) {
      prevSceneIdRef.current = sceneId;
      const nextState = EditorState.create({
        doc: value,
        extensions: buildExtensions(settingsRef.current, codeModeRef.current),
      });
      view.setState(nextState);
      view.scrollDOM.scrollTop = 0;
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      const sel = view.state.selection.main;
      const maxLen = value.length;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
        selection: {
          anchor: Math.min(sel.anchor, maxLen),
          head: Math.min(sel.head, maxLen),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, value]);

  return (
    <div
      ref={hostRef}
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    />
  );
}
