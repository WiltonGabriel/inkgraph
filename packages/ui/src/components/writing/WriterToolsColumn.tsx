import { useState, useRef } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { runAiCompletion } from '../../services/aiClient';

const STYLES = ['Padrão', 'Cinematográfico', 'Conciso', 'Descritivo', 'Minimalista'] as const;
const TONES = [
  'Mais Cinematográfico',
  'Mais Formal',
  'Mais Humorístico',
  'Mais Poético',
  'Mais Suspense',
] as const;

const TOOLS = [
  'Continuar Escrita',
  'Melhorar Texto',
  'Alterar Tom',
  'Gerar Diálogo',
  'Brainstorming de Ideias',
  'Gerar Sinopse',
  'Gramática e Estilo',
  'Consistência do Universo',
  'Detector de Furos de Enredo',
] as const;

interface WriterToolsColumnProps {
  onGenerateToScratchpad: (generatedText: string) => void;
}

export function WriterToolsColumn({ onGenerateToScratchpad }: WriterToolsColumnProps) {
  const { project, settings, activeSceneId } = useProject();
  const [style, setStyle] = useState<(typeof STYLES)[number]>('Cinematográfico');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Mais Suspense');
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  const povChar = project.characters.find((c) => c.id === activeScene?.povCharacterId);

  const handleRunTool = async (tool: (typeof TOOLS)[number]) => {
    const seq = ++requestIdRef.current;
    const workspaceAtStart = project.id;
    setRunningTool(tool);
    setErrorMsg(null);

    const systemPrompt = [
      'You are an editorial assistant inside InkGraph.',
      `Target literary style: ${style}. Target tone: ${tone}.`,
      `Write in ${settings.language === 'en' ? 'English' : 'Portuguese (Brazil)'}.`,
      'Respect canon strictly and never invent lore contradictions.',
    ].join(' ');

    const userPrompt = [
      `Task: ${tool}`,
      `Scene title: ${activeScene?.title ?? 'Untitled'} (Act ${activeScene?.act ?? 1})`,
      povChar ? `POV Character: ${povChar.name} (${povChar.role})` : '',
      `Scene summary: ${activeScene?.summary ?? ''}`,
      `Scene excerpt:\n${(activeScene?.content ?? '').slice(-2200)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await runAiCompletion({ settings, systemPrompt, userPrompt });
    if (seq !== requestIdRef.current || workspaceAtStart !== project.id) return;

    setRunningTool(null);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    onGenerateToScratchpad(res.text);
  };

  return (
    <aside
      style={{
        width: 300,
        backgroundColor: '#0e1118',
        borderLeft: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        padding: 14,
        gap: 14,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f3f4f6', marginBottom: 10 }}>
          <Wand2 size={14} color="#a78bfa" /> Parâmetros de Prosa
        </div>

        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
          Estilo Literário
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: '#141926',
            border: '1px solid #262f42',
            borderRadius: 6,
            color: '#f3f4f6',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
          Modulação de Tom
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: '#141926',
            border: '1px solid #262f42',
            borderRadius: 6,
            color: '#f3f4f6',
            fontSize: 12,
          }}
        >
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div style={{ fontSize: 11.5, color: '#fbbf24', padding: 9, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>
          Ferramentas ({TOOLS.length})
        </div>
        {TOOLS.map((tool) => {
          const isRunning = runningTool === tool;
          return (
            <button
              key={tool}
              onClick={() => void handleRunTool(tool)}
              disabled={runningTool !== null}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 11px',
                backgroundColor: '#131824',
                border: '1px solid #222a3d',
                borderRadius: 6,
                color: '#e5e7eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: runningTool !== null ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: runningTool !== null && !isRunning ? 0.6 : 1,
              }}
            >
              <span>{tool}</span>
              <span style={{ fontSize: 10, color: '#a78bfa' }}>
                {isRunning ? '...' : 'Executar'}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
