import { useMemo } from 'react';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';

export function DashboardHeader() {
  const { project, setActiveView, setActiveSceneId } = useProject();

  const lastScene = useMemo(() => {
    if (project.scenes.length === 0) return null;
    return [...project.scenes].sort((a, b) =>
      b.lastEditedAt.localeCompare(a.lastEditedAt)
    )[0];
  }, [project.scenes]);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 24px',
        backgroundColor: '#121621',
        border: '1px solid #212838',
        borderRadius: 12,
        marginBottom: 20,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>
          Visão geral do projeto · {project.genre}
        </div>
        <h1 style={{ margin: 0, fontSize: 22, color: '#f3f4f6' }}>
          Bem-vindo de volta a {project.title}
        </h1>
        <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 4 }}>
          {lastScene
            ? `Última edição: ${lastScene.title} (${countWords(lastScene.content)} palavras)`
            : 'Comece sua história na visualização Manuscrito.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => {
            if (lastScene) setActiveSceneId(lastScene.id);
            setActiveView('manuscript');
          }}
          style={{
            padding: '10px 18px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BookOpen size={15} /> Continuar escrevendo <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setActiveView('writer')}
          style={{
            padding: '10px 14px',
            backgroundColor: '#1a2030',
            color: '#d1d5db',
            border: '1px solid #2c3548',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Sparkles size={14} color="#a78bfa" /> Estúdio de Redação
        </button>
      </div>
    </div>
  );
}
