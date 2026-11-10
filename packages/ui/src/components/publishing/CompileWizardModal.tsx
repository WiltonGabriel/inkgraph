import { useState } from 'react';
import { X, Download, CheckSquare, FileText, AlertTriangle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  exportNormseiteText,
  generateDocxBytes,
  generateEpub3Bytes,
  generateMarkdownZipBytes,
  generatePdfBytes,
  runPublicationPreflight,
  type PrintTrimFormat,
} from '../../export/exporters';

interface CompileWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CompilePreset = 'epub' | 'docx' | 'pdf' | 'norm_txt' | 'md_zip' | 'html';

const PRESETS: { id: CompilePreset; title: string; subtitle: string; ext: string; mime: string }[] = [
  {
    id: 'epub',
    title: 'E-book EPUB 3 (.epub)',
    subtitle: 'Pacote digital padrão com metadados, sumário navegável e capítulos em XHTML.',
    ext: 'epub',
    mime: 'application/epub+zip',
  },
  {
    id: 'docx',
    title: 'Microsoft Word (.docx)',
    subtitle: 'Documento formatado com folha de rosto, quebras de capítulo e parágrafos.',
    ext: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    id: 'pdf',
    title: 'PDF Editorial (.pdf)',
    subtitle: 'Diagramação direta offline conforme formato de corte selecionado.',
    ext: 'pdf',
    mime: 'application/pdf',
  },
  {
    id: 'norm_txt',
    title: 'Lauda Padrão 60×30 (.txt)',
    subtitle: 'Paginação clássica com 60 colunas, 30 linhas e quebras \\f reais.',
    ext: 'txt',
    mime: 'text/plain;charset=utf-8',
  },
  {
    id: 'md_zip',
    title: 'Vault Markdown (.zip)',
    subtitle: 'Todas as cenas, personagens, facções e mundos em Markdown estruturado.',
    ext: 'zip',
    mime: 'application/zip',
  },
  {
    id: 'html',
    title: 'Manuscrito Web (.html)',
    subtitle: 'Arquivo único HTML autocontido para revisão em navegador ou impressão.',
    ext: 'html',
    mime: 'text/html;charset=utf-8',
  },
];

export function CompileWizardModal({ isOpen, onClose }: CompileWizardModalProps) {
  const { project } = useProject();
  const [selectedPreset, setSelectedPreset] = useState<CompilePreset>('epub');
  const [trim, setTrim] = useState<PrintTrimFormat>('6x9');
  const [stripEpistemic, setStripEpistemic] = useState(true);
  const [compiling, setCompiling] = useState(false);

  if (!isOpen) return null;

  const issues = runPublicationPreflight(project);
  const errorCount = issues.filter((i) => i.severity === 'error').length;

  const safeFileSlug =
    project.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'inkgraph_obra';

  const handleDownload = async () => {
    const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[0];
    setCompiling(true);
    try {
      const targetProject = stripEpistemic
        ? project
        : {
            ...project,
            scenes: project.scenes.map((s) => ({
              ...s,
              content: s.notes ? `${s.content}\n\n> [Nota]: ${s.notes}` : s.content,
            })),
          };

      let blob: Blob;
      if (selectedPreset === 'epub') {
        const bytes = await generateEpub3Bytes(targetProject);
        blob = new Blob([new Uint8Array(bytes)], { type: preset.mime });
      } else if (selectedPreset === 'docx') {
        const bytes = await generateDocxBytes(targetProject);
        blob = new Blob([new Uint8Array(bytes)], { type: preset.mime });
      } else if (selectedPreset === 'pdf') {
        const bytes = generatePdfBytes(targetProject, trim);
        blob = new Blob([new Uint8Array(bytes)], { type: preset.mime });
      } else if (selectedPreset === 'norm_txt') {
        blob = new Blob([exportNormseiteText(targetProject)], { type: preset.mime });
      } else if (selectedPreset === 'md_zip') {
        const bytes = await generateMarkdownZipBytes(targetProject);
        blob = new Blob([new Uint8Array(bytes)], { type: preset.mime });
      } else {
        const profile = project.compileProfile;
        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${project.title}</title></head><body><h1>${project.title}</h1><p><em>${profile.authorName}</em></p>${[...targetProject.scenes]
          .sort((a, b) => a.chapterNumber - b.chapterNumber)
          .map((s) => `<h2>Capítulo ${s.chapterNumber}: ${s.title}</h2><div>${s.content.replace(/\n/g, '<br/>')}</div>`)
          .join('<hr/>')}</body></html>`;
        blob = new Blob([html], { type: preset.mime });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileSlug}.${preset.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Assistente de Compilação Editorial</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.2rem', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
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
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.title}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{p.subtitle}</span>
            </button>
          ))}
        </div>

        {selectedPreset === 'pdf' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Formato de corte (Trim):</span>
            <select
              value={trim}
              onChange={(e) => setTrim(e.target.value as PrintTrimFormat)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
            >
              <option value="6x9">Romance Trade 6×9 pol</option>
              <option value="5.5x8.5">Digest 5.5×8.5 pol</option>
              <option value="a5">A5 (148×210 mm)</option>
              <option value="manuscript">Carta Manuscrito</option>
            </select>
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {errorCount > 0 ? <AlertTriangle size={14} color="#f59e0b" /> : <CheckSquare size={14} color="#10b981" />}
              Preflight Editorial
            </span>
            <span style={{ fontSize: '0.72rem', color: errorCount > 0 ? '#f59e0b' : '#10b981' }}>
              {issues.length === 0 ? 'Sem pendências' : `${issues.length} alerta(s) (${errorCount} crítico)`}
            </span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={stripEpistemic} onChange={(e) => setStripEpistemic(e.target.checked)} />
            Remover blocos privados (::beat / ::epistemic-reveal) e notas de bastidores
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button onClick={onClose} style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.8rem', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            disabled={compiling}
            onClick={() => void handleDownload()}
            style={{ padding: '0.45rem 1rem', borderRadius: '6px', background: 'var(--accent)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', opacity: compiling ? 0.65 : 1 }}
          >
            <Download size={14} /> {compiling ? 'Compilando…' : 'Compilar e Baixar'}
          </button>
        </div>
      </div>
    </div>
  );
}
