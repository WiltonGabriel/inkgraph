import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  previewDocxImport,
  previewMarkdownFolderImport,
  previewNovelcrafterImport,
  type ImportPreviewResult,
} from '../../import/importers';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportPreviewModal({ isOpen, onClose }: ImportPreviewModalProps) {
  const { importScenesIntoWorkspace } = useProject();
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const files = Array.from(fileList);
      const first = files[0]!;
      const lower = first.name.toLowerCase();

      let result: ImportPreviewResult;
      if (files.length === 1 && lower.endsWith('.zip')) {
        const bytes = new Uint8Array(await first.arrayBuffer());
        result = await previewNovelcrafterImport(bytes, first.name);
        if (!workspaceTitle.trim()) {
          setWorkspaceTitle(first.name.replace(/\.zip$/i, ''));
        }
      } else if (files.length === 1 && lower.endsWith('.docx')) {
        const bytes = new Uint8Array(await first.arrayBuffer());
        result = await previewDocxImport(bytes, first.name);
        if (!workspaceTitle.trim()) {
          setWorkspaceTitle(first.name.replace(/\.docx$/i, ''));
        }
      } else {
        const mdFiles = await Promise.all(
          files
            .filter((f) => f.name.toLowerCase().endsWith('.md'))
            .map(async (f) => ({ name: f.name, content: await f.text() }))
        );
        result = previewMarkdownFolderImport(mdFiles);
        if (!workspaceTitle.trim()) {
          setWorkspaceTitle('Obra Importada (Markdown)');
        }
      }

      setPreview(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview || preview.scenes.length === 0) return;
    importScenesIntoWorkspace(
      workspaceTitle.trim() || preview.sourceName,
      preview.scenes,
      preview.characters
    );
    setPreview(null);
    setWorkspaceTitle('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#11151f', border: '1px solid #242b3d', borderRadius: 10, width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#60a5fa" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f3f4f6' }}>
              Importar Manuscrito (.MD, .DOCX, Novelcrafter .ZIP)
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".md,.docx,.zip"
          style={{ display: 'none' }}
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '18px 14px',
            borderRadius: 8,
            border: '1px dashed #334155',
            backgroundColor: '#0c1018',
            color: '#cbd5e1',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Upload size={16} />
          {loading ? 'Analisando arquivo…' : 'Selecionar um ou mais arquivos (.md), .docx ou .zip'}
        </button>

        {errorMsg && (
          <div style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '8px 10px', borderRadius: 6 }}>
            {errorMsg}
          </div>
        )}

        {preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                Nome do novo Workspace
              </label>
              <input
                value={workspaceTitle}
                onChange={(e) => setWorkspaceTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: '#090c12', border: '1px solid #2b3448', color: '#f8fafc', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#cbd5e1' }}>
              <span>Origem: <strong>{preview.sourceName}</strong></span>
              <span>Cenas detectadas: <strong>{preview.scenes.length}</strong></span>
              <span>Personagens: <strong>{preview.characters.length}</strong></span>
            </div>

            {preview.warnings.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#fcd34d', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <AlertTriangle size={13} /> Observações da Análise
                </span>
                {preview.warnings.map((w, idx) => (
                  <span key={idx}>{w}</span>
                ))}
              </div>
            )}

            <div style={{ maxHeight: 190, overflowY: 'auto', border: '1px solid #1e2536', borderRadius: 6, background: '#090c12', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {preview.scenes.map((sc, i) => (
                <div key={sc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 6px', borderBottom: '1px solid #151b28' }}>
                  <span style={{ color: '#e2e8f0' }}>
                    {i + 1}. {sc.title}
                  </span>
                  <span style={{ color: '#64748b' }}>{sc.content.length} chars</span>
                </div>
              ))}
              {preview.scenes.length === 0 && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Nenhuma cena encontrada neste pacote.</span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '7px 14px', borderRadius: 6, background: '#181e2c', border: '1px solid #2b3448', color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!preview || preview.scenes.length === 0}
            onClick={handleConfirm}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              background: preview && preview.scenes.length > 0 ? '#2563eb' : '#1e293b',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: preview && preview.scenes.length > 0 ? 'pointer' : 'not-allowed',
              opacity: preview && preview.scenes.length > 0 ? 1 : 0.5,
            }}
          >
            <Check size={14} /> Importar Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
