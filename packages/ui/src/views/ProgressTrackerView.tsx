import { useState, useEffect, useMemo } from 'react';
import { Timer, Play, Square, Target, TrendingUp, Calendar } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export function ProgressTrackerView() {
  const { project, recordWritingSession } = useProject();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sessionWords, setSessionWords] = useState(250);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStopSession = () => {
    setIsRunning(false);
    const minutes = Math.max(1, Math.round(secondsElapsed / 60));
    recordWritingSession(sessionWords, minutes);
    setSecondsElapsed(0);
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayWords = project.writingLogs.find((l) => l.date === todayIso)?.wordsWritten ?? 0;
  const weeklyWords = useMemo(
    () => project.writingLogs.slice(-7).reduce((acc, l) => acc + l.wordsWritten, 0),
    [project.writingLogs]
  );

  const dailyPct = Math.min(100, Math.round((todayWords / Math.max(1, project.dailyWordGoal)) * 100));
  const weeklyPct = Math.min(100, Math.round((weeklyWords / Math.max(1, project.weeklyWordGoal)) * 100));

  const last30Days = useMemo(() => {
    const entries: { date: string; words: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const log = project.writingLogs.find((l) => l.date === d);
      entries.push({ date: d.slice(5), words: log?.wordsWritten ?? 0 });
    }
    return entries;
  }, [project.writingLogs]);

  const heatmap84Days = useMemo(() => {
    const cells: { date: string; words: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const log = project.writingLogs.find((l) => l.date === d);
      cells.push({ date: d, words: log?.wordsWritten ?? 0 });
    }
    return cells;
  }, [project.writingLogs]);

  const max30 = Math.max(500, ...last30Days.map((d) => d.words));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      {/* Live Session Timer */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Timer size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Rastreador de Progresso & Sessões de Escrita</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Cronômetro de foco, metas diárias/semanais, velocidade de 30 dias e mapa de calor de 12 semanas.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <input
            type="number"
            value={sessionWords}
            onChange={(e) => setSessionWords(Number(e.target.value))}
            style={{ width: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            title="Palavras escritas na sessão"
          />
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700 }}>
            {String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:{String(secondsElapsed % 60).padStart(2, '0')}
          </span>
          {!isRunning ? (
            <button onClick={() => setIsRunning(true)} style={{ background: '#10b981', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Play size={14} /> Iniciar sessão
            </button>
          ) : (
            <button onClick={handleStopSession} style={{ background: '#ef4444', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Square size={14} /> Encerrar sessão
            </button>
          )}
        </div>
      </div>

      {/* Daily & Weekly Goal Rings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><Target size={14} /> META DIÁRIA</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>{todayWords} / {project.dailyWordGoal} pal.</div>
          </div>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', border: '4px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>{dailyPct}%</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><Target size={14} /> META SEMANAL</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>{weeklyWords} / {project.weeklyWordGoal} pal.</div>
          </div>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>{weeklyPct}%</div>
        </div>
      </div>

      {/* 30-Day Velocity Chart */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.8rem', fontSize: '0.88rem', fontWeight: 700 }}>
          <TrendingUp size={15} color="var(--accent)" /> Velocidade de Escrita (Últimos 30 Dias)
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '110px' }}>
          {last30Days.map((d) => (
            <div key={d.date} title={`${d.date}: ${d.words} palavras`} style={{ flex: 1, height: `${Math.max(6, Math.round((d.words / max30) * 100))}%`, background: d.words > 0 ? 'var(--accent)' : 'var(--bg-card)', borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      </div>

      {/* 12-Week Activity Heatmap */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.8rem', fontSize: '0.88rem', fontWeight: 700 }}>
          <Calendar size={15} color="#10b981" /> Mapa de Calor de Atividade (12 Semanas)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '5px' }}>
          {heatmap84Days.map((cell) => {
            const bg = cell.words === 0 ? 'var(--bg-card)' : cell.words < 300 ? 'rgba(16, 185, 129, 0.35)' : cell.words < 800 ? 'rgba(16, 185, 129, 0.65)' : '#10b981';
            return <div key={cell.date} title={`${cell.date}: ${cell.words} palavras`} style={{ height: '16px', borderRadius: '3px', background: bg, border: '1px solid var(--border)' }} />;
          })}
        </div>
      </div>
    </div>
  );
}
