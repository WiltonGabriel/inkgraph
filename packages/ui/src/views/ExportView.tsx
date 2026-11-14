import { useState, useMemo } from 'react';
import { FileOutput, Copy, Sparkles, Check, Download } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { CompileWizardModal } from '../components/publishing/CompileWizardModal';
import { ExportPreflightCard } from '../components/publishing/ExportPreflightCard';

type ExportFormat = 'md' | 'txt' | 'norm_txt' | 'html' | 'json';

export function ExportView() {
  const { project, updateProject, exportProjectJson, setActiveView, setActiveSceneId } = useProject();
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeManuscript, setIncludeManuscript] = useState(true);
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeFactions, setIncludeFactions] = useState(false);
  const [includeWorlds, setIncludeWorlds] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('md');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const profile = project.compileProfile;

  const updateProfileField = (field: keyof typeof profile, value: string) => {
    updateProject((prev) => ({
      ...prev,
      compileProfile: { ...prev.compileProfile, [field]: value },
    }));
  };

  const compiledOutput = useMemo(() => {
    if (format === 'json') return exportProjectJson();

    const parts: string[] = [];
    if (includeTitle) {
      parts.push(`# ${project.title}\nAutor: ${profile.authorName}\n\n> ${project.logline}`);
    }
    if (profile.titlePageText) parts.push(`## Página de título\n${profile.titlePageText}`);
    if (profile.dedication) parts.push(`## Dedicatória\n_${profile.dedication}_`);
    if (includeManuscript) {
      for (const s of project.scenes) {
        parts.push(`## Capítulo ${s.chapterNumber}: ${s.title}\n\n${s.content}`);
      }
    }
    if (includeCharacters && project.characters.length > 0) {
      parts.push(`## Personagens\n` + project.characters.map((c) => `- **${c.name}** (${c.role}): ${c.motivation}`).join('\n'));
    }
    if (includeFactions && project.factions.length > 0) {
      parts.push(`## Facções\n` + project.factions.map((f) => `- **${f.name}** (${f.subtype}): ${f.publicAgenda}`).join('\n'));
    }
    if (includeWorlds && project.worlds.length > 0) {
      parts.push(`## Mundos\n` + project.worlds.map((w) => `- **${w.name}**: ${w.premise}`).join('\n'));
    }
    if (profile.acknowledgements) parts.push(`## Agradecimentos\n${profile.acknowledgements}`);
    if (profile.imprint) parts.push(`## Colofão\n${profile.imprint}`);

    const raw = parts.join('\n\n---\n\n');
    if (format === 'txt' || format === 'norm_txt') {
      return raw.replace(/[#*_>`]/g, '');
    }
    if (format === 'html') {
      return `<!DOCTYPE html>\n<html><body>\n${raw.replace(/\n/g, '<br/>')}\n</body></html>`;
    }
    return raw;
  }, [project, profile, includeTitle, includeManuscript, includeCharacters, includeFactions, includeWorlds, format, exportProjectJson]);

  const handleCopyMarkdown = () => {
    navigator.clipboard?.writeText(compiledOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDirectDownload = () => {
    const ext = format === 'norm_txt' ? 'txt' : format;
    const blob = new Blob([compiledOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileOutput size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Exportação & Compilação Editorial</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure seções, metadados editoriais e formatos de saída.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleCopyMarkdown} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.45rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            Copiar Markdown
          </button>
          <button onClick={handleDirectDownload} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.45rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <Download size={14} /> Baixar .MD
          </button>
          <button onClick={() => setWizardOpen(true)} style={{ background: 'var(--accent)', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <Sparkles size={14} /> Assistente de compilação…
          </button>
        </div>
      </div>

      <ExportPreflightCard
        project={project}
        onOpenCanonRadar={() => setActiveView('canon-radar')}
        onOpenVersions={() => setActiveView('versions')}
        onOpenManuscriptScene={(sceneId) => {
          setActiveSceneId(sceneId);
          setActiveView('manuscript');
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Seleção de Conteúdo & Formato</h3>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeTitle} onChange={(e) => setIncludeTitle(e.target.checked)} /> Título e Premissa (Logline)</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeManuscript} onChange={(e) => setIncludeManuscript(e.target.checked)} /> Manuscrito ({project.scenes.length === 1 ? '1 cena' : `${project.scenes.length} cenas`})</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeCharacters} onChange={(e) => setIncludeCharacters(e.target.checked)} /> Personagens ({project.characters.length})</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeFactions} onChange={(e) => setIncludeFactions(e.target.checked)} /> Facções ({project.factions.length})</label>
          <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.45rem' }}><input type="checkbox" checked={includeWorlds} onChange={(e) => setIncludeWorlds(e.target.checked)} /> Mundos ({project.worlds.length})</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} style={{ marginTop: '0.3rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.4rem', fontSize: '0.8rem' }}>
            <option value="md">Markdown (.md)</option>
            <option value="txt">Texto Puro (.txt)</option>
            <option value="norm_txt">Lauda Padrão (norm .txt)</option>
            <option value="html">Documento Web (.html)</option>
            <option value="json">Pacote Estruturado (.json)</option>
          </select>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Elementos Pré e Pós-Textuais</h3>
          <input value={profile.titlePageText} onChange={(e) => updateProfileField('titlePageText', e.target.value)} placeholder="Página de título" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.dedication} onChange={(e) => updateProfileField('dedication', e.target.value)} placeholder="Dedicatória" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.acknowledgements} onChange={(e) => updateProfileField('acknowledgements', e.target.value)} placeholder="Agradecimentos" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
          <input value={profile.imprint} onChange={(e) => updateProfileField('imprint', e.target.value)} placeholder="Colofão" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Pré-visualização ao Vivo ({format})</div>
        <pre style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.8rem', fontSize: '0.78rem', fontFamily: 'monospace', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
          {compiledOutput}
        </pre>
      </div>

      <CompileWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
