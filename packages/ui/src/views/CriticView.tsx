import { useState, useMemo } from 'react';
import { Feather, Activity, MessageSquare, Eye, BookOpen, AlertCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { countWords } from '../types/project';
import { calculateFleschReadability, scanFilterWords } from '@inkgraph/domain';

const SENSORY_WORDS = [
  'sombra', 'luz', 'frio', 'quente', 'sangue', 'cheiro', 'vento', 'silêncio',
  'eco', 'ferro', 'cinza', 'fogo', 'escuridão', 'brilho', 'sussurro', 'gelo',
];

export function CriticView() {
  const { project, activeSceneId, settings } = useProject();
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    activeSceneId || project.scenes[0]?.id || 'custom'
  );
  const [customText, setCustomText] = useState<string>('');

  const activeText = useMemo(() => {
    if (selectedSceneId === 'custom') return customText;
    return project.scenes.find((s) => s.id === selectedSceneId)?.content ?? '';
  }, [selectedSceneId, customText, project.scenes]);

  const metrics = useMemo(() => {
    const words = countWords(activeText);
    const sentences = Math.max(1, activeText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length);
    const avgWordsPerSentence = words / sentences;

    const lines = activeText.split('\n').filter((l) => l.trim().length > 0);
    const dialogueLines = lines.filter((l) => /^[-—"|«“]/.test(l.trim()) || l.includes('—') || l.includes('"'));
    const dialogueRatio = lines.length > 0 ? Math.round((dialogueLines.length / lines.length) * 100) : 0;

    const lower = activeText.toLowerCase();
    const sensoryHits = SENSORY_WORDS.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    const sensoryDensity = Math.min(100, Math.round((sensoryHits / Math.max(1, words / 40)) * 25));

    const fleschScore = calculateFleschReadability(activeText, settings.language);
    const filterAnalysis = scanFilterWords(activeText, settings.language);

    const pacingLabel =
      avgWordsPerSentence < 12 ? 'Rápido / Urgente' : avgWordsPerSentence < 20 ? 'Equilibrado' : 'Contemplativo / Denso';

    const plotHoles: string[] = [];
    const currentScene = project.scenes.find((s) => s.id === selectedSceneId);
    if (currentScene) {
      if (!currentScene.povCharacterId) {
        plotHoles.push('Cena sem personagem de Ponto de Vista (POV) atribuído.');
      }
      if (!currentScene.locationId) {
        plotHoles.push('Cena sem localização geográfica vinculada ao atlas.');
      }
      if (currentScene.tension > 80 && words < 150) {
        plotHoles.push('Tensão dramática alta (>80%) com extensão textual curta demais para sustentar o clímax.');
      }
    }
    if (words === 0) {
      plotHoles.push('Texto vazio. Insira ou selecione uma cena para avaliação.');
    }

    return { words, avgWordsPerSentence: Math.round(avgWordsPerSentence), dialogueRatio, sensoryDensity, fleschScore, filterAnalysis, pacingLabel, plotHoles };
  }, [activeText, selectedSceneId, project.scenes, settings.language]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Feather size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Crítico Literário & Análise de Enredo</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Avaliação estilística de ritmo, proporção de diálogo, densidade sensorial, legibilidade Flesch e lacunas de enredo.
            </p>
          </div>
        </div>
        <select
          value={selectedSceneId}
          onChange={(e) => setSelectedSceneId(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
        >
          {project.scenes.map((s) => (
            <option key={s.id} value={s.id}>Cap. {s.chapterNumber}: {s.title}</option>
          ))}
          <option value="custom">Texto personalizado para análise</option>
        </select>
      </div>

      {selectedSceneId === 'custom' && (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Cole ou digite um trecho literário para avaliar ritmo, diálogos e densidade sensorial..."
          rows={5}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', fontSize: '0.85rem', width: '100%' }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><Activity size={14} /> RITMO (PACING)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem' }}>{metrics.pacingLabel}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Média de {metrics.avgWordsPerSentence} palavras/frase</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><MessageSquare size={14} /> PROPORÇÃO DE DIÁLOGO</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.3rem', color: '#38bdf8' }}>{metrics.dialogueRatio}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.words} palavras totais</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><Eye size={14} /> DENSIDADE SENSORIAL</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.3rem', color: '#a855f7' }}>{metrics.sensoryDensity}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evocação visual, auditiva e tátil</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><BookOpen size={14} /> LEGIBILIDADE FLESCH</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.3rem', color: '#10b981' }}>{metrics.fleschScore}/100</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calibrado para {settings.language}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><AlertCircle size={14} /> PALAVRAS-MULETA</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.3rem', color: metrics.filterAnalysis.perThousandWords > 20 ? '#f59e0b' : '#34d399' }}>
            {metrics.filterAnalysis.perThousandWords}‰
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {metrics.filterAnalysis.matches.slice(0, 3).map((m) => `${m.word} (${m.count})`).join(', ') || 'Sem excessos'}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
          <AlertCircle size={16} color="#f59e0b" />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Diagnóstico de Lacunas de Enredo & Estrutura</h3>
        </div>
        {metrics.plotHoles.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#10b981' }}>Nenhuma lacuna estrutural detectada nesta cena.</p>
        ) : (
          <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {metrics.plotHoles.map((hole, idx) => (
              <li key={idx}>{hole}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
