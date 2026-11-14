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
  const {
    workspaces,
    createNewWorkspace,
    importProjectJson,
    loadDemoProject,
    requestConfirm,
    settings,
    t,
  } = useProject();

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

  const handleRestoreDemo = async () => {
    const existingDemo = workspaces.some((w) => w.title === 'As Cinzas de Vael');
    if (existingDemo) {
      const isEn = settings.language === 'en';
      const accepted = await requestConfirm({
        title: t.home.restoreDemoBtn,
        message: isEn
          ? 'A workspace named "As Cinzas de Vael" already exists. Restoring the demo will replace it with the original template.'
          : 'Já existe um workspace chamado "As Cinzas de Vael". Restaurar a demonstração substituirá essa cópia pelos dados originais.',
        confirmLabel: isEn ? 'Restore Demo' : 'Restaurar Demo',
        cancelLabel: t.common.cancel,
        tone: 'neutral',
      });
      if (!accepted) return;
    }
    loadDemoProject();
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

  const modeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: active
      ? 'var(--accent-primary, #3b82f6)'
      : 'var(--bg-elevated, var(--bg-card, #171d2e))',
    color: active ? '#ffffff' : 'var(--text-primary, #f1f5f9)',
    border: active
      ? '1px solid var(--accent-primary, #3b82f6)'
      : '1px solid var(--border-subtle, var(--border, #263046))',
  });

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        border: '1px solid var(--border-subtle, var(--border, #263046))',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '12px 16px',
        marginBottom: 18,
        boxShadow: 'var(--card-shadow, none)',
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
            style={modeBtnStyle(mode === 'blank')}
          >
            <FilePlus size={14} />
            {t.home.newBlankBtn}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'template' ? 'none' : 'template')}
            style={modeBtnStyle(mode === 'template')}
          >
            <LayoutTemplate size={14} />
            {t.home.fromTemplateBtn}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'idea' ? 'none' : 'idea')}
            style={modeBtnStyle(mode === 'idea')}
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
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              color: 'var(--text-primary, #f1f5f9)',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
            }}
          >
            <Upload size={13} />
            {t.home.importJsonBtn}
          </button>

          <button
            type="button"
            onClick={() => void handleRestoreDemo()}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.32)',
            }}
          >
            <RotateCcw size={13} />
            {t.home.restoreDemoBtn}
          </button>
          {importStatus && (
            <span style={{ fontSize: 11, color: '#ef4444' }}>{importStatus}</span>
          )}
        </div>
      </div>

      {/* Expandable Inline Drawer */}
      {mode !== 'none' && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
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
              style={inputStyle}
            />
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder={t.home.newWorkspaceGenrePlaceholder}
              style={inputStyle}
            />
            <input
              value={folderOrTag}
              onChange={(e) => setFolderOrTag(e.target.value)}
              placeholder={t.home.newWorkspaceTagPlaceholder}
              style={inputStyle}
            />
            {mode === 'template' && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={inputStyle}
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
              style={inputStyle}
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
                  aria-label={`Cor ${col}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: col,
                    border:
                      accentColor === col
                        ? '2px solid var(--text-primary, #ffffff)'
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
                  color: 'var(--text-secondary, #94a3b8)',
                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                  borderRadius: 'var(--radius-sm, 6px)',
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
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 6px)',
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
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '7px 10px',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 12,
};
