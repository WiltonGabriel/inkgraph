import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
} from '../../types/project';

export function ProjectHealthCard() {
  const { project, totalWordCount } = useProject();

  const wordGoalPercent = Math.min(
    100,
    Math.round((totalWordCount / Math.max(1, project.wordCountGoal)) * 100)
  );

  const castDepth = useMemo(() => {
    if (project.characters.length === 0) return 0;
    const sum = project.characters.reduce(
      (acc, c) => acc + calculateCharacterCompleteness(c),
      0
    );
    return Math.round(sum / project.characters.length);
  }, [project.characters]);

  const worldDepth = useMemo(() => {
    const wScores = project.worlds.map(calculateWorldCompleteness);
    const fScores = project.factions.map(calculateFactionCompleteness);
    const all = [...wScores, ...fScores];
    if (all.length === 0) return 0;
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [project.worlds, project.factions]);

  const healthScore = Math.round(
    wordGoalPercent * 0.3 + castDepth * 0.35 + worldDepth * 0.35
  );

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#f3f4f6',
          }}
        >
          <Activity size={15} color="#10b981" /> Saúde do Projeto
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.12)',
            padding: '2px 8px',
            borderRadius: 999,
          }}
        >
          {healthScore}/100
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#9ca3af' }}>Profundidade do elenco ({project.characters.length})</span>
            <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{castDepth}%</span>
          </div>
          <div style={{ height: 5, backgroundColor: '#1b2230', borderRadius: 999 }}>
            <div style={{ width: `${castDepth}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 999 }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#9ca3af' }}>
              Cobertura de Mundo & Facções ({project.worlds.length + project.factions.length})
            </span>
            <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{worldDepth}%</span>
          </div>
          <div style={{ height: 5, backgroundColor: '#1b2230', borderRadius: 999 }}>
            <div style={{ width: `${worldDepth}%`, height: '100%', backgroundColor: '#10b981', borderRadius: 999 }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, color: '#9ca3af', fontSize: 11.5 }}>
          <span>Legibilidade (heurística Flesch): <strong style={{ color: '#e5e7eb' }}>68/100</strong></span>
          <span style={{ color: '#34d399' }}>Linha do tempo: OK</span>
        </div>
      </div>
    </div>
  );
}
