import { ChevronLeft, ChevronRight, ArrowDownToLine, Replace, Sparkles, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export type StudioMode = 'fluxo' | 'foco' | 'proforge';

interface AiScratchpadColumnProps {
  scratchpad: string;
  onChangeScratchpad: (val: string) => void;
  history: string[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;
  studioMode: StudioMode;
  onChangeStudioMode: (mode: StudioMode) => void;
}

export function AiScratchpadColumn({
  scratchpad,
  onChangeScratchpad,
  history,
  historyIndex,
  onNavigateHistory,
  studioMode,
  onChangeStudioMode,
}: AiScratchpadColumnProps) {
  const { project, settings, activeSceneId, upsertScene } = useProject();
  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  const handleAppendToScene = () => {
    if (!activeScene || !scratchpad.trim()) return;
    const nextContent = `${activeScene.content.trimEnd()}\n\n${scratchpad.trim()}\n`;
    upsertScene({
      ...activeScene,
      content: nextContent,
      lastEditedAt: new Date().toISOString(),
    });
  };

  const handleReplaceScene = () => {
    if (!activeScene || !scratchpad.trim()) return;
    upsertScene({
      ...activeScene,
      content: scratchpad.trim(),
      lastEditedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas, #0b0e16)', overflow: 'hidden' }}>
      {/* Top Bar: Mode Toggles & History Navigation */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle, #263046)',
          backgroundColor: 'var(--bg-surface, #111623)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#a78bfa" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>IA Scratchpad</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onChangeStudioMode('fluxo')}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle, #263046)',
              backgroundColor: studioMode === 'fluxo' ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-elevated, #171d2e)',
              color: studioMode === 'fluxo' ? '#fff' : 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Modo de Fluxo
          </button>
          <button
            onClick={() => onChangeStudioMode('foco')}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle, #263046)',
              backgroundColor: studioMode === 'foco' ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-elevated, #171d2e)',
              color: studioMode === 'foco' ? '#fff' : 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Modo de Foco
          </button>
          <button
            onClick={() => onChangeStudioMode('proforge')}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid rgba(167,139,250,0.4)',
              backgroundColor: studioMode === 'proforge' ? '#7c3aed' : 'var(--bg-elevated, #171d2e)',
              color: studioMode === 'proforge' ? '#fff' : 'var(--text-primary, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Layers size={12} /> Pipeline ProForge
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            disabled={historyIndex <= 0}
            onClick={() => onNavigateHistory(historyIndex - 1)}
            style={{
              padding: 4,
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 5,
              color: historyIndex > 0 ? 'var(--text-primary, #f1f5f9)' : 'var(--text-muted, #64748b)',
              cursor: historyIndex > 0 ? 'pointer' : 'default',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
            {history.length > 0 ? `${historyIndex + 1}/${history.length}` : '0/0'}
          </span>
          <button
            disabled={historyIndex >= history.length - 1}
            onClick={() => onNavigateHistory(historyIndex + 1)}
            style={{
              padding: 4,
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 5,
              color: historyIndex < history.length - 1 ? 'var(--text-primary, #f1f5f9)' : 'var(--text-muted, #64748b)',
              cursor: historyIndex < history.length - 1 ? 'pointer' : 'default',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scratchpad Textarea */}
      <textarea
        value={scratchpad}
        onChange={(e) => onChangeScratchpad(e.target.value)}
        spellCheck={settings.spellcheck}
        placeholder="Use as ferramentas de escrita ao lado ou redija rascunhos experimentais aqui antes de incorporá-los à cena..."
        style={{
          flex: 1,
          width: '100%',
          maxWidth: studioMode === 'foco' ? 720 : `${settings.editorMaxWidthCh || 72}ch`,
          margin: '0 auto',
          padding: 24,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'var(--text-primary, #f1f5f9)',
          fontSize: settings.editorFontSize || 15,
          lineHeight: settings.editorLineHeight || 1.7,
          textIndent: settings.paragraphIndent ? '2em' : 0,
          fontFamily:
            settings.editorFont === 'mono'
              ? 'monospace'
              : settings.editorFont === 'sans'
                ? 'sans-serif'
                : 'Georgia, serif',
        }}
      />

      {/* Action Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle, #263046)',
          backgroundColor: 'var(--bg-surface, #111623)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
          Destino: <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{activeScene?.title ?? 'Nenhuma cena'}</strong>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAppendToScene}
            style={{
              padding: '7px 14px',
              backgroundColor: 'var(--accent-primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowDownToLine size={13} /> Inserir no Final da Cena
          </button>
          <button
            onClick={handleReplaceScene}
            style={{
              padding: '7px 14px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Replace size={13} /> Substituir Cena
          </button>
        </div>
      </div>
    </div>
  );
}
