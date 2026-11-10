import { useState } from 'react';
import { WriterContextColumn } from '../components/writing/WriterContextColumn';
import { AiScratchpadColumn, type StudioMode } from '../components/writing/AiScratchpadColumn';
import { WriterToolsColumn } from '../components/writing/WriterToolsColumn';
import { ProForgePipelinePanel } from '../components/writing/ProForgePipelinePanel';

export function WriterStudioView() {
  const [scratchpad, setScratchpad] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [studioMode, setStudioMode] = useState<StudioMode>('fluxo');

  const handleGenerate = (generatedText: string) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), generatedText];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setScratchpad(generatedText);
    if (studioMode === 'proforge') {
      setStudioMode('fluxo');
    }
  };

  const handleNavigateHistory = (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      setScratchpad(history[index]);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
        backgroundColor: '#0a0d14',
      }}
    >
      {studioMode !== 'foco' && <WriterContextColumn />}

      {studioMode === 'proforge' ? (
        <ProForgePipelinePanel onApplyProposal={handleGenerate} />
      ) : (
        <AiScratchpadColumn
          scratchpad={scratchpad}
          onChangeScratchpad={setScratchpad}
          history={history}
          historyIndex={historyIndex}
          onNavigateHistory={handleNavigateHistory}
          studioMode={studioMode}
          onChangeStudioMode={setStudioMode}
        />
      )}

      {studioMode !== 'foco' && (
        <WriterToolsColumn onGenerateToScratchpad={handleGenerate} />
      )}
    </div>
  );
}
