import { useState, useMemo } from 'react';
import {
  BookOpen,
  List,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useViewport } from '../hooks/useViewport';
import {
  generatePdfBytes,
  runPublicationPreflight,
  type PrintTrimFormat,
} from '../export/exporters';

type ReaderFont = 'serif' | 'sans' | 'mono';

const FONT_FAMILIES: Record<ReaderFont, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

const TRIM_SPEC: Record<
  PrintTrimFormat,
  { label: string; maxWidthPx: number; wordsPerPage: number }
> = {
  '6x9': { label: '6×9 pol (Trade)', maxWidthPx: 580, wordsPerPage: 260 },
  '5.5x8.5': { label: '5.5×8.5 pol (Digest)', maxWidthPx: 520, wordsPerPage: 220 },
  a5: { label: 'A5 (148×210 mm)', maxWidthPx: 550, wordsPerPage: 240 },
  manuscript: { label: 'Carta (8.5×11 pol)', maxWidthPx: 700, wordsPerPage: 250 },
};

function formatProseForReader(raw: string): string {
  return raw
    .replace(/^::(beat|epistemic-reveal)\{[^}]*\}\r?\n[\s\S]*?\r?\n::\r?\n?/gm, '')
    .replace(/\[([^\]]+)\]\(kb:[a-zA-Z0-9_-]+\)/g, '$1')
    .trim();
}

export function BookPreviewView() {
  const { project } = useProject();
  const { isMobile } = useViewport();
  const [mode, setMode] = useState<'continuous' | 'paged'>('paged');
  const [trim, setTrim] = useState<PrintTrimFormat>('6x9');
  const [showToc, setShowToc] = useState(!isMobile);
  const [fontFamily, setFontFamily] = useState<ReaderFont>('serif');
  const [fontSize, setFontSize] = useState(17);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const orderedScenes = useMemo(
    () => [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber),
    [project.scenes]
  );

  const preflightIssues = useMemo(() => runPublicationPreflight(project), [project]);
  const errorCount = preflightIssues.filter((i) => i.severity === 'error').length;

  const totalWords = useMemo(
    () =>
      orderedScenes.reduce((sum, scene) => {
        const clean = formatProseForReader(scene.content);
        return sum + (clean ? clean.split(/\s+/).filter(Boolean).length : 0);
      }, 0),
    [orderedScenes]
  );

  const trimSpec = TRIM_SPEC[trim];
  const estimatedPages = Math.max(1, Math.ceil(totalWords / trimSpec.wordsPerPage));

  const currentScene = orderedScenes[currentIndex] ?? orderedScenes[0];
  const progressPercent =
    orderedScenes.length > 0
      ? Math.round(((currentIndex + 1) / orderedScenes.length) * 100)
      : 0;

  const handleDownloadPdf = () => {
    const bytes = generatePdfBytes(project, trim);
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}_${trim}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowToc((v) => !v)}
            style={{ background: showToc ? 'var(--accent)' : 'var(--bg-card)', color: showToc ? '#fff' : 'var(--text-main)', padding: '0.35rem 0.65rem', borderRadius: '5px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
          >
            <List size={14} /> Sumário
          </button>
          <BookOpen size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{project.title}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.18rem 0.45rem', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            ~{estimatedPages} pág. · {totalWords} palavras
          </span>
          <span
            title={
              preflightIssues.length === 0
                ? 'Preflight sem pendências'
                : preflightIssues.map((i) => i.message).join(' | ')
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.72rem',
              padding: '0.18rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: errorCount > 0 ? '#fca5a5' : preflightIssues.length > 0 ? '#fcd34d' : '#34d399',
            }}
          >
            {preflightIssues.length === 0 ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
            {preflightIssues.length === 0 ? 'Preflight OK' : `${preflightIssues.length} alerta(s)`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={trim}
            onChange={(e) => setTrim(e.target.value as PrintTrimFormat)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
          >
            {(Object.keys(TRIM_SPEC) as PrintTrimFormat[]).map((key) => (
              <option key={key} value={key}>
                {TRIM_SPEC[key].label}
              </option>
            ))}
          </select>

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
            onClick={handleDownloadPdf}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', cursor: 'pointer' }}
            title="Gerar PDF offline neste formato de corte"
          >
            <Download size={13} /> PDF ({trim})
          </button>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', overflow: 'hidden' }}>
        {showToc && (
          <aside style={{ width: isMobile ? '100%' : '240px', maxHeight: isMobile ? '180px' : 'none', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Capítulos</div>
            {orderedScenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  if (isMobile) setShowToc(false);
                }}
                style={{
                  textAlign: 'left',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '5px',
                  fontSize: '0.78rem',
                  background: currentIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: currentIndex === idx ? 'var(--accent)' : 'var(--text-main)',
                  fontWeight: currentIndex === idx ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {scene.chapterNumber}. {scene.title}
              </button>
            ))}
          </aside>
        )}

        <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: isMobile ? '1rem' : '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <article
            style={{
              maxWidth: `${trimSpec.maxWidthPx}px`,
              width: '100%',
              fontFamily: FONT_FAMILIES[fontFamily],
              fontSize: `${fontSize}px`,
              lineHeight: 1.75,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: isMobile ? '1.25rem' : '2.25rem 2.5rem',
              height: 'fit-content',
            }}
          >
            {mode === 'continuous' ? (
              orderedScenes.map((s) => (
                <section key={s.id} style={{ marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '1.35em', marginBottom: '1rem' }}>Capítulo {s.chapterNumber}: {s.title}</h2>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{formatProseForReader(s.content)}</div>
                </section>
              ))
            ) : currentScene ? (
              <section>
                <h2 style={{ fontSize: '1.35em', marginBottom: '1rem' }}>Capítulo {currentScene.chapterNumber}: {currentScene.title}</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>{formatProseForReader(currentScene.content)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontFamily: 'sans-serif', fontSize: '0.8rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: currentIndex === 0 ? 0.4 : 1, cursor: 'pointer' }}>
                    <ChevronLeft size={14} /> Capítulo Anterior
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>Capítulo {currentIndex + 1} de {orderedScenes.length} ({progressPercent}%)</span>
                  <button disabled={currentIndex >= orderedScenes.length - 1} onClick={() => setCurrentIndex((i) => Math.min(orderedScenes.length - 1, i + 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: currentIndex >= orderedScenes.length - 1 ? 0.4 : 1, cursor: 'pointer' }}>
                    Próximo Capítulo <ChevronRight size={14} />
                  </button>
                </div>
              </section>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma cena para pré-visualizar.</div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
