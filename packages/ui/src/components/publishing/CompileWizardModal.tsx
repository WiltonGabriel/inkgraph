import { useState } from 'react';
import { X, Download, CheckSquare, FileText } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface CompileWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CompilePreset = 'html_pdf' | 'ebook' | 'norm_txt' | 'full_md';

const PRESETS: { id: CompilePreset; title: string; subtitle: string; ext: string }[] = [
  {
    id: 'html_pdf',
    title: 'Manuscrito do Romance (HTML/PDF)',
    subtitle: 'Diagramação editorial com folha de rosto, dedicatória e capítulos paginados.',
    ext: 'html',
  },
  {
    id: 'ebook',
    title: 'Capítulos de E-book',
    subtitle: 'Estrutura limpa sem cabeçalhos fixos, pronta para conversão digital.',
    ext: 'md',
  },
  {
    id: 'norm_txt',
    title: 'Manuscrito da Norma (.txt 60×30)',
    subtitle: 'Lauda padrão de 60 caracteres por 30 linhas para submissão editorial.',
    ext: 'txt',
  },
  {
    id: 'full_md',
    title: 'Arquivo Completo (Markdown)',
    subtitle: 'Inclui manuscrito, dossiês de personagens, facções e atlas do mundo.',
    ext: 'md',
  },
];

export function CompileWizardModal({ isOpen, onClose }: CompileWizardModalProps) {
  const { project } = useProject();
  const [selectedPreset, setSelectedPreset] = useState<CompilePreset>('html_pdf');
  const [checks, setChecks] = useState({
    frontmatter: true,
    sceneBreaks: true,
    epistemicClean: true,
  });

  if (!isOpen) return null;

  const formatNormLine = (text: string): string => {
    const words = text.replace(/\n+/g, ' ').split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 60) {
        lines.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) lines.push(current);
    return lines.join('\n');
  };

  const handleDownload = () => {
    const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[0];
    const scenesText = project.scenes
      .map((s) => `# Capítulo ${s.chapterNumber}: ${s.title}\n\n${s.content}`)
      .join(checks.sceneBreaks ? '\n\n* * *\n\n' : '\n\n');

    let output = '';
    if (selectedPreset === 'html_pdf') {
      output = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${project.title}</title></head><body><h1>${project.title}</h1><p><em>${project.compileProfile.authorName}</em></p><hr/>${project.scenes.map((s) => `<h2>Capítulo ${s.chapterNumber}: ${s.title}</h2><div>${s.content.replace(/\n/g, '<br/>')}</div>`).join('<hr/>')}</body></html>`;
    } else if (selectedPreset === 'norm_txt') {
      output = `${project.title.toUpperCase()}\nAutor: ${project.compileProfile.authorName}\n\n` + formatNormLine(scenesText);
    } else if (selectedPreset === 'full_md') {
      const chars = project.characters.map((c) => `### ${c.name} (${c.role})\n${c.backstory}`).join('\n\n');
      output = `# ${project.title}\n\n> ${project.logline}\n\n${scenesText}\n\n## Dossiê de Personagens\n\n${chars}`;
    } else {
      output = `# ${project.title}\n\n${scenesText}`;
    }

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_compilado.${preset.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', width: '100%', maxWidth: '580px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Assistente de Compilação Editorial</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.2rem' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p.id)}
              style={{
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '6px',
                border: selectedPreset === p.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: selectedPreset === p.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.title}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{p.subtitle}</span>
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600 }}>
            <CheckSquare size={14} color="#10b981" /> Verificação Pré-Compilação
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={checks.frontmatter} onChange={(e) => setChecks({ ...checks, frontmatter: e.target.checked })} />
            Incluir elementos pré-textuais (Página de título, Dedicatória e Colofão)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={checks.sceneBreaks} onChange={(e) => setChecks({ ...checks, sceneBreaks: e.target.checked })} />
            Inserir separadores tipográficos (* * *) entre cenas
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={checks.epistemicClean} onChange={(e) => setChecks({ ...checks, epistemicClean: e.target.checked })} />
            Omitir notas privadas do autor e segredos epistêmicos não revelados
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button onClick={onClose} style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
            Cancelar
          </button>
          <button onClick={handleDownload} style={{ padding: '0.45rem 1rem', borderRadius: '6px', background: 'var(--accent)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Compilar e Baixar
          </button>
        </div>
      </div>
    </div>
  );
}
