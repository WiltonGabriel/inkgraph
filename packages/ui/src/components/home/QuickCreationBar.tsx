import { useState, useRef } from 'react';
import {
  FilePlus,
  LayoutTemplate,
  Sparkles,
  Upload,
  RotateCcw,
  X,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { NARRATIVE_TEMPLATES } from '../../data/templatesCatalog';
import { ImportPreviewModal } from './ImportPreviewModal';

const ACCENT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
];

type CreationMode = 'none' | 'blank' | 'template' | 'idea';

export function QuickCreationBar() {
  const { createNewWorkspace, importProjectJson, loadDemoProject, t } =
    useProject();

  const [mode, setMode] = useState<CreationMode>('none');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [folderOrTag, setFolderOrTag] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    NARRATIVE_TEMPLATES[0]?.id ?? 'three_act'
  );
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setMode('none');
    setTitle('');
    setGenre('');
    setFolderOrTag('');
    setIdeaPrompt('');
  };

  const handleCreateBlank = () => {
    createNewWorkspace({
      title: title.trim() || 'Novo Workspace',
      genre: genre.trim() || undefined,
      folderOrTag: folderOrTag.trim() || undefined,
      accentColor,
    });
    resetForm();
  };

  const handleCreateFromTemplate = () => {
    const tpl =
      NARRATIVE_TEMPLATES.find((item) => item.id === selectedTemplateId) ??
      NARRATIVE_TEMPLATES[0];
    createNewWorkspace({
      title: title.trim() || tpl.name,
      genre: genre.trim() || tpl.category,
      folderOrTag: folderOrTag.trim() || undefined,
      accentColor,
      template: tpl,
    });
    resetForm();
  };

  const handleCreateFromIdea = () => {
    const baseTpl = NARRATIVE_TEMPLATES[0];
    const derivedTitle =
      title.trim() ||
      (ideaPrompt.trim() ? ideaPrompt.trim().slice(0, 42) : 'Workspace Estruturado');
    const customTemplate = {
      ...baseTpl,
      sections: baseTpl.sections.map((sec, idx) =>
        idx === 0 && ideaPrompt.trim()
          ? { ...sec, description: `${ideaPrompt.trim()} — ${sec.description}` }
          : sec
      ),
    };
    createNewWorkspace({
      title: derivedTitle,
      genre: genre.trim() || undefined,
      folderOrTag: folderOrTag.trim() || undefined,
      accentColor,
      template: customTemplate,
    });
    resetForm();
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result ?? '');
      const ok = importProjectJson(content);
      setImportStatus(ok ? null : 'JSON inválido');
    };
    reader.readAsText(file);
  };

  return (
    <section
      style={{
        backgroundColor: '#11151f',
        border: '1px solid #1f2637',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 18,
      }}
    >
      {/* Top Action Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode(mode === 'blank' ? 'none' : 'blank')}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: mode === 'blank' ? '#2563eb' : '#181e2c',
              color: mode === 'blank' ? '#ffffff' : '#e5e7eb',
              border: '1px solid #2b3448',
            }}
          >
            <FilePlus size={14} />
            {t.home.newBlankBtn}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'template' ? 'none' : 'template')}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: mode === 'template' ? '#2563eb' : '#181e2c',
              color: mode === 'template' ? '#ffffff' : '#e5e7eb',
              border: '1px solid #2b3448',
            }}
          >
            <LayoutTemplate size={14} />
            {t.home.fromTemplateBtn}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'idea' ? 'none' : 'idea')}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: mode === 'idea' ? '#2563eb' : '#181e2c',
              color: mode === 'idea' ? '#ffffff' : '#e5e7eb',
              border: '1px solid #2b3448',
            }}
          >
            <Sparkles size={14} />
            {t.home.fromOutlineAiBtn}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#151a26',
              color: '#cbd5e1',
              border: '1px solid #262e40',
            }}
          >
            <Upload size={13} />
            {t.home.importJsonBtn}
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#151a26',
              color: '#93c5fd',
              border: '1px solid #262e40',
            }}
          >
            <Upload size={13} />
            Importar .MD / .DOCX / .ZIP
          </button>

          <button
            type="button"
            onClick={loadDemoProject}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <RotateCcw size={13} />
            {t.home.restoreDemoBtn}
          </button>
          {importStatus && (
            <span style={{ fontSize: 11, color: '#f87171' }}>{importStatus}</span>
          )}
        </div>
      </div>

      {/* Expandable Inline Drawer */}
      {mode !== 'none' && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #1e2536',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 10,
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.home.newWorkspaceTitlePlaceholder}
              style={{
                backgroundColor: '#0c0f16',
                border: '1px solid #283044',
                borderRadius: 6,
                padding: '7px 10px',
                color: '#f3f4f6',
                fontSize: 12,
              }}
            />
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder={t.home.newWorkspaceGenrePlaceholder}
              style={{
                backgroundColor: '#0c0f16',
                border: '1px solid #283044',
                borderRadius: 6,
                padding: '7px 10px',
                color: '#f3f4f6',
                fontSize: 12,
              }}
            />
            <input
              value={folderOrTag}
              onChange={(e) => setFolderOrTag(e.target.value)}
              placeholder={t.home.newWorkspaceTagPlaceholder}
              style={{
                backgroundColor: '#0c0f16',
                border: '1px solid #283044',
                borderRadius: 6,
                padding: '7px 10px',
                color: '#f3f4f6',
                fontSize: 12,
              }}
            />
            {mode === 'template' && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{
                  backgroundColor: '#0c0f16',
                  border: '1px solid #283044',
                  borderRadius: 6,
                  padding: '7px 10px',
                  color: '#f3f4f6',
                  fontSize: 12,
                }}
              >
                {NARRATIVE_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.sections.length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {mode === 'idea' && (
            <input
              value={ideaPrompt}
              onChange={(e) => setIdeaPrompt(e.target.value)}
              placeholder={t.home.ideaPromptPlaceholder}
              style={{
                backgroundColor: '#0c0f16',
                border: '1px solid #283044',
                borderRadius: 6,
                padding: '7px 10px',
                color: '#f3f4f6',
                fontSize: 12,
              }}
            />
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {/* Accent Color Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentColor(col)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: col,
                    border:
                      accentColor === col
                        ? '2px solid #ffffff'
                        : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #283044',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={13} />
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={
                  mode === 'blank'
                    ? handleCreateBlank
                    : mode === 'template'
                      ? handleCreateFromTemplate
                      : handleCreateFromIdea
                }
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {mode === 'idea' ? t.home.generateStructureBtn : t.common.create}
              </button>
            </div>
          </div>
        </div>
      )}
      <ImportPreviewModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </section>
  );
}
