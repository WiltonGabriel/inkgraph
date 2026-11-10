import { useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';

export function ManuscriptCompositionCard() {
  const { project, totalWordCount } = useProject();

  const statusCounts = useMemo(() => {
    const counts = {
      outline: 0,
      draft: 0,
      'first-draft': 0,
      revised: 0,
      final: 0,
    };
    for (const s of project.scenes) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }, [project.scenes]);

  const avgWordsPerScene =
    project.scenes.length > 0
      ? Math.round(totalWordCount / project.scenes.length)
      : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWordCount / 220));

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#f3f4f6' }}>
        Composição do Manuscrito
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Cenas</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>
            {project.scenes.length}
          </div>
        </div>
        <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Média / cena</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
            {avgWordsPerScene} pal.
          </div>
        </div>
        <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Tempo de leitura</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
            ~{readingTimeMinutes} min
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5 }}>
        <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#9ca3af' }}>
          Contorno: <strong>{statusCounts.outline}</strong>
        </span>
        <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#fbbf24' }}>
          Rascunho: <strong>{statusCounts.draft}</strong>
        </span>
        <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#60a5fa' }}>
          1º Rascunho: <strong>{statusCounts['first-draft']}</strong>
        </span>
        <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#34d399' }}>
          Revisado: <strong>{statusCounts.revised}</strong>
        </span>
        <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#a78bfa' }}>
          Final: <strong>{statusCounts.final}</strong>
        </span>
      </div>
    </div>
  );
}
