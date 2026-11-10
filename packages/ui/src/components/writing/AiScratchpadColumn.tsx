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
  const { project, activeSceneId, upsertScene } = useProject();
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0d14', overflow: 'hidden' }}>
      {/* Top Bar: Mode Toggles & History Navigation */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#111520',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#a78bfa" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f3f4f6' }}>IA Scratchpad</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onChangeStudioMode('fluxo')}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid #283147',
              backgroundColor: studioMode === 'fluxo' ? '#2563eb' : '#181e2c',
              color: '#fff',
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
              borderRadius: 6,
              border: '1px solid #283147',
              backgroundColor: studioMode === 'foco' ? '#2563eb' : '#181e2c',
              color: '#fff',
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
              borderRadius: 6,
              border: '1px solid rgba(167,139,250,0.4)',
              backgroundColor: studioMode === 'proforge' ? '#7c3aed' : '#181e2c',
              color: '#fff',
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
              backgroundColor: '#181e2c',
              border: '1px solid #283147',
              borderRadius: 5,
              color: historyIndex > 0 ? '#e5e7eb' : '#4b5563',
              cursor: historyIndex > 0 ? 'pointer' : 'default',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {history.length > 0 ? `${historyIndex + 1}/${history.length}` : '0/0'}
          </span>
          <button
            disabled={historyIndex >= history.length - 1}
            onClick={() => onNavigateHistory(historyIndex + 1)}
            style={{
              padding: 4,
              backgroundColor: '#181e2c',
              border: '1px solid #283147',
              borderRadius: 5,
              color: historyIndex < history.length - 1 ? '#e5e7eb' : '#4b5563',
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
        placeholder="Use as ferramentas de escrita ao lado ou redija rascunhos experimentais aqui antes de incorporá-los à cena..."
        style={{
          flex: 1,
          width: '100%',
          maxWidth: studioMode === 'foco' ? 720 : '100%',
          margin: '0 auto',
          padding: 24,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#e5e7eb',
          fontSize: 15,
          lineHeight: 1.7,
          fontFamily: 'Georgia, serif',
        }}
      />

      {/* Action Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #1b202c',
          backgroundColor: '#0e1118',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
          Destino: <strong>{activeScene?.title ?? 'Nenhuma cena'}</strong>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAppendToScene}
            style={{
              padding: '7px 14px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
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
              backgroundColor: '#19202e',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: 6,
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
