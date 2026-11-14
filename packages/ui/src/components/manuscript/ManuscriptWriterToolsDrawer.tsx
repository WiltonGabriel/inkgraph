import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Wrench,
  X,
} from 'lucide-react';
import { analyzeProseStyle } from '../../domain/proseStyleAnalyzer';

interface ManuscriptWriterToolsDrawerProps {
  open: boolean;
  onClose: () => void;
  sceneContent: string;
  currentWords: number;
  sceneTargetWords: number;
  onChangeSceneTargetWords: (nextTarget: number) => void;
  onInsertSnippet: (snippet: string) => void;
  onSprintStatusChange?: (status: { active: boolean; formattedTime: string; deltaWords: number }) => void;
}

const TARGET_PRESETS = [500, 1000, 1500, 2000, 3000, 5000];
const SPRINT_PRESETS_MIN = [15, 25, 45];

export function ManuscriptWriterToolsDrawer({
  open,
  onClose,
  sceneContent,
  currentWords,
  sceneTargetWords,
  onChangeSceneTargetWords,
  onInsertSnippet,
  onSprintStatusChange,
}: ManuscriptWriterToolsDrawerProps) {
  const [sprintDurationMin, setSprintDurationMin] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [sprintRunning, setSprintRunning] = useState<boolean>(false);
  const [sprintStartWords, setSprintStartWords] = useState<number>(currentWords);
  const [sprintElapsedSec, setSprintElapsedSec] = useState<number>(0);

  const styleMetrics = useMemo(() => analyzeProseStyle(sceneContent), [sceneContent]);

  useEffect(() => {
    if (!sprintRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setSprintRunning(false);
          return 0;
        }
        return prev - 1;
      });
      setSprintElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sprintRunning]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const deltaWords = Math.max(0, currentWords - sprintStartWords);
  const wpm =
    sprintElapsedSec >= 10
      ? Math.round((deltaWords / sprintElapsedSec) * 60)
      : 0;

  useEffect(() => {
    onSprintStatusChange?.({
      active: sprintRunning,
      formattedTime,
      deltaWords,
    });
  }, [sprintRunning, formattedTime, deltaWords, onSprintStatusChange]);

  const handleSelectSprintPreset = (minutes: number) => {
    setSprintRunning(false);
    setSprintDurationMin(minutes);
    setSecondsLeft(minutes * 60);
    setSprintStartWords(currentWords);
    setSprintElapsedSec(0);
  };

  const handleToggleSprint = () => {
    if (!sprintRunning && secondsLeft === sprintDurationMin * 60) {
      setSprintStartWords(currentWords);
      setSprintElapsedSec(0);
    }
    setSprintRunning((prev) => !prev);
  };

  const handleResetSprint = () => {
    setSprintRunning(false);
    setSecondsLeft(sprintDurationMin * 60);
    setSprintStartWords(currentWords);
    setSprintElapsedSec(0);
  };

  if (!open) return null;

  const progressPct = Math.min(
    100,
    Math.round((currentWords / Math.max(100, sceneTargetWords)) * 100)
  );

  return (
    <section
      aria-label="Central de Ferramentas do Escritor"
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench size={14} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            Oficina do Escritor — Sprint, Meta da Cena, Raio-X de Estilo & Pontuação Literária
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Fechar oficina do escritor"
          aria-label="Fechar oficina do escritor"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 3,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
          gap: 10,
        }}
      >
        {/* 1. Cronômetro de Sprint Literário */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Clock size={12} style={{ color: 'var(--accent-primary)' }} />
              Sprint de Escrita
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {SPRINT_PRESETS_MIN.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => handleSelectSprintPreset(min)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor:
                      sprintDurationMin === min ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: sprintDurationMin === min ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: sprintRunning ? '#10b981' : 'var(--text-primary)',
                }}
              >
                {formattedTime}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                +{deltaWords} palavras no sprint · {wpm} pal/min
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleToggleSprint}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: sprintRunning ? '#f59e0b' : 'var(--accent-primary)',
                  color: '#ffffff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                {sprintRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{sprintRunning ? 'Pausar' : 'Iniciar'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetSprint}
                title="Reiniciar cronômetro"
                aria-label="Reiniciar cronômetro"
                style={{
                  padding: '5px 7px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Meta da Cena & Volume */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Target size={12} style={{ color: '#10b981' }} />
              Meta da Cena
            </span>
            <select
              aria-label="Meta de palavras da cena"
              value={sceneTargetWords}
              onChange={(e) => onChangeSceneTargetWords(Number(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                padding: '2px 6px',
              }}
            >
              {TARGET_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  Meta: {preset.toLocaleString('pt-BR')} palavras
                </option>
              ))}
            </select>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 5,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentWords.toLocaleString('pt-BR')} / {sceneTargetWords.toLocaleString('pt-BR')} pal.
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: progressPct >= 100 ? '#10b981' : 'var(--accent-primary)',
                }}
              >
                {progressPct}%
              </span>
            </div>
            <div
              style={{
                height: 7,
                borderRadius: 999,
                backgroundColor: 'var(--bg-surface)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: progressPct >= 100 ? '#10b981' : 'var(--accent-primary)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              Leitura silenciosa: ~{styleMetrics.readingTimeMinutes} min · Voz alta/Audiolivro: ~
              {styleMetrics.speakingTimeMinutes} min
            </div>
          </div>
        </div>

        {/* 3. Raio-X de Ritmo & Diálogo */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Activity size={12} style={{ color: '#38bdf8' }} />
              Raio-X de Ritmo & Voz
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--accent-primary)',
              }}
            >
              {styleMetrics.rhythmLabel}
            </span>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--text-primary)' }}>
            Diálogo: <strong>{styleMetrics.dialogueRatioPercent}%</strong> ({styleMetrics.dialogueLineCount}{' '}
            falas) · Narração: <strong>{styleMetrics.narrationRatioPercent}%</strong>
          </div>

          <div
            style={{
              height: 6,
              borderRadius: 999,
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${styleMetrics.dialogueRatioPercent}%`,
                backgroundColor: '#38bdf8',
              }}
              title={`Diálogo: ${styleMetrics.dialogueRatioPercent}%`}
            />
            <div
              style={{
                width: `${styleMetrics.narrationRatioPercent}%`,
                backgroundColor: 'var(--accent-primary)',
                opacity: 0.55,
              }}
              title={`Narração: ${styleMetrics.narrationRatioPercent}%`}
            />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Média: <strong>{styleMetrics.avgWordsPerSentence}</strong> pal/frase ·{' '}
            {styleMetrics.longSentencesCount > 0 ? (
              <span style={{ color: '#f59e0b' }}>
                {styleMetrics.longSentencesCount} frase(s) longa(s) (&gt;28 pal.)
              </span>
            ) : (
              <span style={{ color: '#10b981' }}>Zero frases excessivamente longas</span>
            )}
          </div>
        </div>

        {/* 4. Caça-Vícios (-mente & Repetições) + Atalhos Tipográficos */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
            Higiene de Estilo & Inserção Literária
          </span>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            <strong>Advérbios (-mente):</strong>{' '}
            {styleMetrics.adverbsMente.length === 0
              ? 'Nenhum detectado'
              : styleMetrics.adverbsMente.join(', ')}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            <strong>Repetições (3x+):</strong>{' '}
            {styleMetrics.topRepeatedWords.length === 0
              ? 'Vocabulário variado'
              : styleMetrics.topRepeatedWords.map((item) => `${item.word} (${item.count}x)`).join(', ')}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {(
              [
                { label: '— Fala', snippet: '— ' },
                { label: '“Aspas”', snippet: '“”' },
                { label: '✦ Cena', snippet: '\n***\n\n' },
                { label: 'Batida', snippet: '\n::beat{id="momento_chave"}\n' },
                { label: 'Revelação', snippet: '\n::epistemic-reveal{secret="segredo"}\n' },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onInsertSnippet(item.snippet)}
                style={{
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Sparkles size={10} style={{ color: 'var(--accent-primary)' }} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
