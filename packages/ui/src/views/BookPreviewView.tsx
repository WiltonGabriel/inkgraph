import { useState, useMemo } from 'react';
import { BookOpen, List, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

type ReaderFont = 'serif' | 'sans' | 'mono';

const FONT_FAMILIES: Record<ReaderFont, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export function BookPreviewView() {
  const { project } = useProject();
  const [mode, setMode] = useState<'continuous' | 'paged'>('paged');
  const [showToc, setShowToc] = useState(true);
  const [fontFamily, setFontFamily] = useState<ReaderFont>('serif');
  const [fontSize, setFontSize] = useState(17);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const orderedScenes = useMemo(
    () => [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber),
    [project.scenes]
  );

  const currentScene = orderedScenes[currentIndex] ?? orderedScenes[0];
  const progressPercent =
    orderedScenes.length > 0
      ? Math.round(((currentIndex + 1) / orderedScenes.length) * 100)
      : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '0.8rem',
        ...(isFullscreen
          ? { position: 'fixed', inset: 0, zIndex: 999, background: 'var(--bg-primary)', padding: '1rem' }
          : {}),
      }}
    >
      {/* Reader Toolbar */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => setShowToc((v) => !v)}
            style={{ background: showToc ? 'var(--accent)' : 'var(--bg-card)', color: showToc ? '#fff' : 'var(--text-main)', padding: '0.35rem 0.65rem', borderRadius: '5px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <List size={14} /> Sumário
          </button>
          <BookOpen size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{project.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'continuous' | 'paged')}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
          >
            <option value="paged">Modo Paginado</option>
            <option value="continuous">Leitura Contínua</option>
          </select>

          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as ReaderFont)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
          >
            <option value="serif">Serif</option>
            <option value="sans">Sistema</option>
            <option value="mono">Monoespaçado</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.2rem 0.45rem' }}>
            <button onClick={() => setFontSize((s) => Math.max(13, s - 1))} style={{ padding: '0 0.3rem', fontSize: '0.8rem' }}>A-</button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fontSize}px</span>
            <button onClick={() => setFontSize((s) => Math.min(26, s + 1))} style={{ padding: '0 0.3rem', fontSize: '0.8rem' }}>A+</button>
          </div>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center' }}
            title="Alternar tela cheia"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Reading Progress Bar */}
      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s ease' }} />
      </div>

      {/* Reader Body */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
        {showToc && (
          <aside style={{ width: '240px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Capítulos</div>
            {orderedScenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  textAlign: 'left',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '5px',
                  fontSize: '0.78rem',
                  background: currentIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: currentIndex === idx ? 'var(--accent)' : 'var(--text-main)',
                  fontWeight: currentIndex === idx ? 700 : 400,
                }}
              >
                {scene.chapterNumber}. {scene.title}
              </button>
            ))}
          </aside>
        )}

        <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <article style={{ maxWidth: '680px', width: '100%', fontFamily: FONT_FAMILIES[fontFamily], fontSize: `${fontSize}px`, lineHeight: 1.75 }}>
            {mode === 'continuous' ? (
              orderedScenes.map((s) => (
                <section key={s.id} style={{ marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '1.35em', marginBottom: '1rem' }}>Capítulo {s.chapterNumber}: {s.title}</h2>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{s.content}</div>
                </section>
              ))
            ) : currentScene ? (
              <section>
                <h2 style={{ fontSize: '1.35em', marginBottom: '1rem' }}>Capítulo {currentScene.chapterNumber}: {currentScene.title}</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentScene.content}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontFamily: 'sans-serif', fontSize: '0.8rem' }}>
                  <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: currentIndex === 0 ? 0.4 : 1 }}>
                    <ChevronLeft size={14} /> Capítulo Anterior
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>Página {currentIndex + 1} de {orderedScenes.length} ({progressPercent}%)</span>
                  <button disabled={currentIndex >= orderedScenes.length - 1} onClick={() => setCurrentIndex((i) => Math.min(orderedScenes.length - 1, i + 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: currentIndex >= orderedScenes.length - 1 ? 0.4 : 1 }}>
                    Próximo Capítulo <ChevronRight size={14} />
                  </button>
                </div>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </div>
  );
}
