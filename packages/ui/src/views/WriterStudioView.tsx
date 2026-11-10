import { useState, useEffect } from 'react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../context/ProjectContext';
import { WriterContextColumn } from '../components/writing/WriterContextColumn';
import { AiScratchpadColumn, type StudioMode } from '../components/writing/AiScratchpadColumn';
import { WriterToolsColumn } from '../components/writing/WriterToolsColumn';
import { ProForgePipelinePanel } from '../components/writing/ProForgePipelinePanel';
import { useViewport } from '../hooks/useViewport';

export function WriterStudioView() {
  const { settings } = useProject();
  const { isMobile } = useViewport();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);

  const [scratchpad, setScratchpad] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [studioMode, setStudioMode] = useState<StudioMode>('fluxo');

  useEffect(() => {
    if (!aiActive && studioMode === 'proforge') {
      setStudioMode('fluxo');
    }
  }, [aiActive, studioMode]);

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
        flexDirection: isMobile ? 'column' : 'row',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0d14',
      }}
    >
      {!isMobile && studioMode !== 'foco' && <WriterContextColumn />}

      {aiActive && studioMode === 'proforge' ? (
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

      {!isMobile && aiActive && studioMode !== 'foco' && (
        <WriterToolsColumn onGenerateToScratchpad={handleGenerate} />
      )}
    </div>
  );
}
