import { useEffect, useState } from 'react';
import { Columns, Compass, Clock } from 'lucide-react';
import { SubplotManagerBar } from '../components/scene-board/SubplotManagerBar';
import { ActSwimlaneBoard } from '../components/scene-board/ActSwimlaneBoard';
import { PlotCanvas2D } from '../components/scene-board/PlotCanvas2D';
import { SceneTimelineBoard } from '../components/scene-board/SceneTimelineBoard';
import { TensionCurveChart } from '../components/scene-board/TensionCurveChart';

export type BoardMode = 'board' | 'canvas' | 'timeline';

interface PlotBoardViewProps {
  initialMode?: BoardMode;
}

export function PlotBoardView({ initialMode = 'board' }: PlotBoardViewProps) {
  const [mode, setMode] = useState<BoardMode>(initialMode);
  const [selectedSubplotId, setSelectedSubplotId] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
        padding: 14,
        minWidth: 0,
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {mode === 'timeline' ? 'Linha do Tempo' : 'Quadro de Enredo'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            Estruturação de atos, tela espacial 2D, cronologia e curva de tensão
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            backgroundColor: 'var(--bg-surface)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'board' as const, label: 'Quadro', icon: Columns },
            { id: 'canvas' as const, label: 'Tela', icon: Compass },
            { id: 'timeline' as const, label: 'Linha do Tempo', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: mode === id ? 'var(--accent-primary)' : 'transparent',
                color: mode === id ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <SubplotManagerBar
        selectedSubplotId={selectedSubplotId}
        onSelectSubplot={setSelectedSubplotId}
      />

      <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        {mode === 'board' && <ActSwimlaneBoard selectedSubplotId={selectedSubplotId} />}
        {mode === 'canvas' && <PlotCanvas2D selectedSubplotId={selectedSubplotId} />}
        {mode === 'timeline' && <SceneTimelineBoard selectedSubplotId={selectedSubplotId} />}
      </div>

      <TensionCurveChart />
    </div>
  );
}
export default PlotBoardView;
