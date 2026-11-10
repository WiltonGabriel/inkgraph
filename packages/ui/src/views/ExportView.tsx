import { useState, useMemo } from 'react';
import {
  FileOutput,
  Copy,
  Sparkles,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../context/ProjectContext';
import { CompileWizardModal } from '../components/publishing/CompileWizardModal';
import {
  exportNormseiteText,
  generateDocxBytes,
  generateEpub3Bytes,
  generateMarkdownZipBytes,
  generatePdfBytes,
  runPublicationPreflight,
  type PrintTrimFormat,
} from '../export/exporters';
import { runAiCompletion } from '../services/aiClient';

type ExportFormat =
  | 'md'
  | 'epub'
  | 'docx'
  | 'pdf'
  | 'norm_txt'
  | 'md_zip'
  | 'txt'
  | 'html'
  | 'json';

const FORMAT_LABELS: Record<ExportFormat, { ext: string; mime: string; button: string }> = {
  md: { ext: 'md', mime: 'text/markdown;charset=utf-8', button: 'Baixar .MD' },
  epub: { ext: 'epub', mime: 'application/epub+zip', button: 'Baixar .EPUB' },
  docx: {
    ext: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    button: 'Baixar .DOCX',
  },
  pdf: { ext: 'pdf', mime: 'application/pdf', button: 'Baixar .PDF' },
  norm_txt: { ext: 'txt', mime: 'text/plain;charset=utf-8', button: 'Baixar Lauda (.TXT)' },
  md_zip: { ext: 'zip', mime: 'application/zip', button: 'Baixar Vault (.ZIP)' },
  txt: { ext: 'txt', mime: 'text/plain;charset=utf-8', button: 'Baixar .TXT' },
  html: { ext: 'html', mime: 'text/html;charset=utf-8', button: 'Baixar .HTML' },
  json: { ext: 'json', mime: 'application/json;charset=utf-8', button: 'Baixar .JSON' },
};

export function ExportView() {
  const {
    project,
    settings,
    updateProject,
    exportProjectJson,
    setActiveSceneId,
    setActiveView,
  } = useProject();

  const aiActive = isAiGenerativeEnabled(settings.aiMode);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeManuscript, setIncludeManuscript] = useState(true);
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeFactions, setIncludeFactions] = useState(false);
  const [includeWorlds, setIncludeWorlds] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('epub');
  const [printTrim, setPrintTrim] = useState<PrintTrimFormat>('6x9');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [ignoreBlockers, setIgnoreBlockers] = useState(false);
  const [blurbDraft, setBlurbDraft] = useState('');
  const [blurbLoading, setBlurbLoading] = useState(false);
  const [blurbError, setBlurbError] = useState<string | null>(null);

  const profile = project.compileProfile;
  const preflightIssues = useMemo(() => runPublicationPreflight(project), [project]);
  const blockers = preflightIssues.filter((i) => i.severity === 'error');
  const isBlocked = blockers.length > 0 && !ignoreBlockers;

  const updateProfileField = (field: keyof typeof profile, value: string) => {
    updateProject((prev) => ({
      ...prev,
      compileProfile: { ...prev.compileProfile, [field]: value },
    }));
  };

  const compiledOutput = useMemo(() => {
    if (format === 'json') return exportProjectJson();
    if (format === 'norm_txt') return exportNormseiteText(project);

    if (format === 'epub' || format === 'docx' || format === 'pdf' || format === 'md_zip') {
      const sorted = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);
      const totalWords = sorted.reduce(
        (acc, s) => acc + s.content.trim().split(/\s+/).filter(Boolean).length,
        0
      );
      return [
        `Título: ${project.title}`,
        `Autor: ${profile.authorName || '(não informado)'}`,
        `Formato de saída: ${format.toUpperCase()}${format === 'pdf' ? ` (corte ${printTrim})` : ''}`,
        `Capítulos incluídos: ${sorted.length} (~${totalWords} palavras)`,
        '',
        ...sorted.map((s, idx) => `${idx + 1}. Capítulo ${s.chapterNumber} — ${s.title}`),
      ].join('\n');
    }

    const parts: string[] = [];
    if (includeTitle) {
      parts.push(`# ${project.title}\nAutor: ${profile.authorName}\n\n> ${project.logline}`);
    }
    if (profile.titlePageText) parts.push(`## Página de título\n${profile.titlePageText}`);
    if (profile.dedication) parts.push(`## Dedicatória\n_${profile.dedication}_`);
    if (includeManuscript) {
      for (const s of [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber)) {
        parts.push(`## Capítulo ${s.chapterNumber}: ${s.title}\n\n${s.content}`);
      }
    }
    if (includeCharacters && project.characters.length > 0) {
      parts.push(
        `## Personagens\n` +
          project.characters.map((c) => `- **${c.name}** (${c.role}): ${c.motivation}`).join('\n')
      );
    }
    if (includeFactions && project.factions.length > 0) {
      parts.push(
        `## Facções\n` +
          project.factions.map((f) => `- **${f.name}** (${f.subtype}): ${f.publicAgenda}`).join('\n')
      );
    }
    if (includeWorlds && project.worlds.length > 0) {
      parts.push(
        `## Mundos\n` + project.worlds.map((w) => `- **${w.name}**: ${w.premise}`).join('\n')
      );
    }
    if (profile.acknowledgements) parts.push(`## Agradecimentos\n${profile.acknowledgements}`);
    if (profile.imprint) parts.push(`## Colofão\n${profile.imprint}`);

    const raw = parts.join('\n\n---\n\n');
    if (format === 'txt') {
      return raw.replace(/[#*_>`]/g, '');
    }
    if (format === 'html') {
      return `<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"><title>${project.title}</title></head><body>\n${raw.replace(/\n/g, '<br/>')}\n</body></html>`;
    }
    return raw;
  }, [
    project,
    profile,
    includeTitle,
    includeManuscript,
    includeCharacters,
    includeFactions,
    includeWorlds,
    format,
    printTrim,
    exportProjectJson,
  ]);

  const handleCopyMarkdown = () => {
    navigator.clipboard?.writeText(compiledOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDirectDownload = async () => {
    if (isBlocked || downloading) return;
    const meta = FORMAT_LABELS[format];
    const slug =
      project.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'inkgraph';

    setDownloading(true);
    try {
      let blob: Blob;
      if (format === 'epub') {
        const bytes = await generateEpub3Bytes(project);
        blob = new Blob([new Uint8Array(bytes)], { type: meta.mime });
      } else if (format === 'docx') {
        const bytes = await generateDocxBytes(project);
        blob = new Blob([new Uint8Array(bytes)], { type: meta.mime });
      } else if (format === 'pdf') {
        const bytes = generatePdfBytes(project, printTrim);
        blob = new Blob([new Uint8Array(bytes)], { type: meta.mime });
      } else if (format === 'md_zip') {
        const bytes = await generateMarkdownZipBytes(project);
        blob = new Blob([new Uint8Array(bytes)], { type: meta.mime });
      } else {
        blob = new Blob([compiledOutput], { type: meta.mime });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.${meta.ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateBlurb = async () => {
    if (!aiActive || blurbLoading) return;
    setBlurbLoading(true);
    setBlurbError(null);
    const sceneDigest = project.scenes
      .slice(0, 6)
      .map((s) => `${s.title}: ${s.summary || s.content.slice(0, 140)}`)
      .join('\n');
    const res = await runAiCompletion({
      settings,
      systemPrompt:
        'Redija uma sinopse editorial concisa de contracapa (1 parágrafo, sem clichês promocionais). Responda apenas com o texto da sinopse.',
      userPrompt: `Título: ${project.title}\nGênero: ${project.genre ?? 'Ficção'}\nLogline atual: ${project.logline}\nCenas:\n${sceneDigest}`,
    });
    setBlurbLoading(false);
    if (!res.ok) {
      if (!res.stale) setBlurbError(res.error);
      return;
    }
    setBlurbDraft(res.text.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileOutput size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Exportação & Compilação Editorial</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Geração 100% offline para EPUB 3, DOCX, PDF de corte, Lauda e Markdown.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleCopyMarkdown} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.45rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            Copiar Resumo/Texto
          </button>
          <button
            disabled={isBlocked || downloading}
            onClick={() => void handleDirectDownload()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.45rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: isBlocked ? 'not-allowed' : 'pointer', opacity: isBlocked ? 0.5 : 1 }}
          >
            <Download size={14} /> {downloading ? 'Gerando…' : FORMAT_LABELS[format].button}
          </button>
          <button onClick={() => setWizardOpen(true)} style={{ background: 'var(--accent)', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <FileOutput size={14} /> Assistente de compilação…
          </button>
        </div>
      </div>

      {/* Publication Preflight Gate */}
      <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${blockers.length > 0 ? '#f59e0b' : 'var(--border)'}`, borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700 }}>
            {preflightIssues.length === 0 ? (
              <ShieldCheck size={16} color="#10b981" />
            ) : (
              <AlertTriangle size={16} color={blockers.length > 0 ? '#ef4444' : '#f59e0b'} />
            )}
            Preflight Editorial
          </div>
          <span style={{ fontSize: '0.75rem', color: preflightIssues.length === 0 ? '#10b981' : 'var(--text-muted)' }}>
            {preflightIssues.length === 0
              ? 'Pronto para compilação final'
              : `${blockers.length} bloqueio(s) · ${preflightIssues.length - blockers.length} aviso(s)`}
          </span>
        </div>

        {preflightIssues.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '130px', overflowY: 'auto' }}>
            {preflightIssues.map((issue) => (
              <div
                key={issue.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderRadius: '4px', background: 'var(--bg-card)', color: issue.severity === 'error' ? '#fca5a5' : '#fcd34d' }}
              >
                <span>{issue.message}</span>
                {issue.sceneId && (
                  <button
                    onClick={() => {
                      setActiveSceneId(issue.sceneId!);
                      setActiveView('manuscript');
                    }}
                    style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Abrir cena
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {blockers.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={ignoreBlockers} onChange={(e) => setIgnoreBlockers(e.target.checked)} />
            Liberar download mesmo com bloqueios críticos
          </label>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>Seleção de Conteúdo & Formato</h3>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeTitle} onChange={(e) => setIncludeTitle(e.target.checked)} /> Título e Premissa (Logline)</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeManuscript} onChange={(e) => setIncludeManuscript(e.target.checked)} /> Manuscrito ({project.scenes.length} cenas)</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeCharacters} onChange={(e) => setIncludeCharacters(e.target.checked)} /> Personagens ({project.characters.length})</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeFactions} onChange={(e) => setIncludeFactions(e.target.checked)} /> Facções ({project.factions.length})</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeWorlds} onChange={(e) => setIncludeWorlds(e.target.checked)} /> Mundos ({project.worlds.length})</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} style={{ marginTop: '0.3rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.4rem', fontSize: '0.8rem' }}>
            <option value="epub">E-book EPUB 3 (.epub)</option>
            <option value="docx">Microsoft Word (.docx)</option>
            <option value="pdf">PDF Editorial (.pdf)</option>
            <option value="norm_txt">Lauda Padrão 60×30 (norm .txt)</option>
            <option value="md_zip">Vault Completo Markdown (.zip)</option>
            <option value="md">Markdown Único (.md)</option>
            <option value="txt">Texto Puro (.txt)</option>
            <option value="html">Documento Web (.html)</option>
            <option value="json">Pacote Estruturado (.json)</option>
          </select>

          {format === 'pdf' && (
            <select value={printTrim} onChange={(e) => setPrintTrim(e.target.value as PrintTrimFormat)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.4rem', fontSize: '0.78rem' }}>
              <option value="6x9">Trim 6×9 pol (Trade Paperback)</option>
              <option value="5.5x8.5">Trim 5.5×8.5 pol (Digest)</option>
              <option value="a5">Trim A5 (148×210 mm)</option>
              <option value="manuscript">Carta Padrão (8.5×11 pol)</option>
            </select>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>Elementos Pré e Pós-Textuais</h3>
          <input value={profile.authorName} onChange={(e) => updateProfileField('authorName', e.target.value)} placeholder="Nome do autor" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.titlePageText} onChange={(e) => updateProfileField('titlePageText', e.target.value)} placeholder="Página de título" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.dedication} onChange={(e) => updateProfileField('dedication', e.target.value)} placeholder="Dedicatória" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.acknowledgements} onChange={(e) => updateProfileField('acknowledgements', e.target.value)} placeholder="Agradecimentos" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.imprint} onChange={(e) => updateProfileField('imprint', e.target.value)} placeholder="Colofão" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />

          {aiActive && (
            <div style={{ marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                onClick={() => void handleGenerateBlurb()}
                disabled={blurbLoading}
                style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                <Sparkles size={13} color="var(--accent)" />
                {blurbLoading ? 'Rascunhando sinopse…' : 'Rascunhar Sinopse de Contracapa'}
              </button>
              {blurbError && <span style={{ fontSize: '0.72rem', color: '#f87171' }}>{blurbError}</span>}
              {blurbDraft && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <textarea
                    value={blurbDraft}
                    onChange={(e) => setBlurbDraft(e.target.value)}
                    rows={3}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.45rem', fontSize: '0.75rem' }}
                  />
                  <button
                    onClick={() => updateProject((prev) => ({ ...prev, logline: blurbDraft }))}
                    style={{ alignSelf: 'flex-end', background: 'var(--accent)', color: '#fff', borderRadius: '5px', padding: '0.28rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Aplicar como Logline do Projeto
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Pré-visualização ({format})</div>
        <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.8rem', fontSize: '0.78rem', fontFamily: 'monospace', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
          {compiledOutput}
        </pre>
      </div>

      <CompileWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
