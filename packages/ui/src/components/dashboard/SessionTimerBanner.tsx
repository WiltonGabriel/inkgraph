import { useEffect, useId, useState } from 'react';
import { Play, Square, Timer } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DASHBOARD_CARD_STYLE } from './dashboardTheme';

export function SessionTimerBanner() {
  const { recordWritingSession, notify } = useProject();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sessionWords, setSessionWords] = useState(250);
  const wordsInputId = useId();

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStopSession = () => {
    setIsRunning(false);
    const words = Math.max(0, Math.round(sessionWords || 0));
    const minutes = Math.max(1, Math.round(secondsElapsed / 60));
    recordWritingSession(words, minutes);
    setSecondsElapsed(0);
    notify(
      `Sessão registrada: ${words.toLocaleString('pt-BR')} palavras em ${minutes} min.`,
      'success'
    );
  };

  return (
    <section
      style={{
        ...DASHBOARD_CARD_STYLE,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Timer size={20} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Rastreador de Progresso & Sessões de Escrita
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Cronômetro de foco, metas diárias/semanais, velocidade de 30 dias e mapa de calor de 12 semanas.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label
          htmlFor={wordsInputId}
          style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}
        >
          Palavras:
        </label>
        <input
          id={wordsInputId}
          type="number"
          min={0}
          value={sessionWords}
          onChange={(e) => setSessionWords(Number(e.target.value))}
          style={{
            width: 92,
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '6px 8px',
            fontSize: 12.5,
            color: 'var(--text-primary)',
          }}
          aria-label="Palavras escritas na sessão"
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            minWidth: 52,
            textAlign: 'center',
          }}
        >
          {String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:
          {String(secondsElapsed % 60).padStart(2, '0')}
        </span>
        {!isRunning ? (
          <button
            type="button"
            className="ig-tile-interactive"
            onClick={() => setIsRunning(true)}
            style={{
              backgroundColor: 'var(--success, #10b981)',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Play size={14} /> Iniciar sessão
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopSession}
            style={{
              backgroundColor: 'var(--danger, #ef4444)',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Square size={14} /> Encerrar sessão
          </button>
        )}
      </div>
    </section>
  );
}
