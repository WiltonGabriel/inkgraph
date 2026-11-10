import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

interface CodeMirrorSourcePaneProps {
  value: string;
  onChange: (nextValue: string) => void;
  fontSize?: number;
  lineHeight?: number;
  maxWidth?: string | number;
  typewriterMode?: boolean;
}

export function CodeMirrorSourcePane({
  value,
  onChange,
  fontSize = 15,
  lineHeight = 1.7,
  maxWidth = '74ch',
  typewriterMode = false,
}: CodeMirrorSourcePaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const theme = EditorView.theme(
      {
        '&': {
          height: '100%',
          backgroundColor: 'transparent',
          color: '#e5e7eb',
          fontSize: `${fontSize}px`,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        },
        '.cm-content': {
          lineHeight: String(lineHeight),
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
          padding: typewriterMode ? '18vh 24px' : '24px',
        },
        '.cm-focused': { outline: 'none' },
        '.cm-gutters': { display: 'none' },
      },
      { dark: true }
    );

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        EditorView.lineWrapping,
        keymap.of([]),
        theme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [fontSize, lineHeight, maxWidth, typewriterMode]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        width: '100%',
      }}
    />
  );
}
