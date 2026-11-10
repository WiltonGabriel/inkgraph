import { useState } from 'react';
import { Columns, Compass, Clock } from 'lucide-react';
import { SubplotManagerBar } from '../components/scene-board/SubplotManagerBar';
import { ActSwimlaneBoard } from '../components/scene-board/ActSwimlaneBoard';
import { PlotCanvas2D } from '../components/scene-board/PlotCanvas2D';
import { SceneTimelineBoard } from '../components/scene-board/SceneTimelineBoard';
import { TensionCurveChart } from '../components/scene-board/TensionCurveChart';

type BoardMode = 'board' | 'canvas' | 'timeline';

export function PlotBoardView() {
  const [mode, setMode] = useState<BoardMode>('board');
  const [selectedSubplotId, setSelectedSubplotId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100vh - 64px)', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Quadro de Enredo
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            Estruturação de atos, tela espacial 2D, cronologia e curva de tensão
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, backgroundColor: '#111622', padding: 4, borderRadius: 8, border: '1px solid #242f44' }}>
          {[
            { id: 'board' as const, label: 'Quadro', icon: Columns },
            { id: 'canvas' as const, label: 'Tela', icon: Compass },
            { id: 'timeline' as const, label: 'Linha do Tempo', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: mode === id ? '#6366f1' : 'transparent',
                color: mode === id ? '#ffffff' : '#94a3b8',
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

      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === 'board' && <ActSwimlaneBoard selectedSubplotId={selectedSubplotId} />}
        {mode === 'canvas' && <PlotCanvas2D selectedSubplotId={selectedSubplotId} />}
        {mode === 'timeline' && <SceneTimelineBoard selectedSubplotId={selectedSubplotId} />}
      </div>

      <TensionCurveChart />
    </div>
  );
}
export default PlotBoardView;
