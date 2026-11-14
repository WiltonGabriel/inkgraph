import { useMemo } from 'react';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';
import { DASHBOARD_CARD_STYLE } from './dashboardTheme';

export function DashboardHeader() {
  const { project, setActiveView, setActiveSceneId } = useProject();

  const lastScene = useMemo(() => {
    if (project.scenes.length === 0) return null;
    return [...project.scenes].sort((a, b) =>
      b.lastEditedAt.localeCompare(a.lastEditedAt)
    )[0];
  }, [project.scenes]);

  return (
    <header
      style={{
        ...DASHBOARD_CARD_STYLE,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 24px',
        marginBottom: 20,
      }}
    >
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: 'var(--accent-primary)',
            backgroundColor: 'var(--accent-soft)',
            padding: '2px 9px',
            borderRadius: 999,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Visão geral do projeto · {project.genre}
        </div>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>
          Bem-vindo de volta a {project.title}
        </h1>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
          {lastScene ? (
            <>
              Última edição:{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveSceneId(lastScene.id);
                  setActiveView('manuscript');
                }}
                style={{
                  background: 'transparent',
                  padding: 0,
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                {lastScene.title}
              </button>{' '}
              ({countWords(lastScene.content).toLocaleString('pt-BR')} palavras)
            </>
          ) : (
            'Comece sua história na visualização Manuscrito.'
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          className="ig-tile-interactive"
          onClick={() => {
            if (lastScene) setActiveSceneId(lastScene.id);
            setActiveView('manuscript');
          }}
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BookOpen size={15} /> Continuar escrevendo <ArrowRight size={14} />
        </button>
        <button
          type="button"
          className="ig-tile-interactive"
          onClick={() => setActiveView('writer')}
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} /> Estúdio de Redação
        </button>
      </div>
    </header>
  );
}
