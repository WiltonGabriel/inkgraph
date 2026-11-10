import { useRef, useState } from 'react';
import { Bell, HardDrive, Download, Upload, RotateCcw, Info } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';

export function NotificationsAndStorageTab() {
  const {
    settings,
    updateSettings,
    resetSettingsToDefault,
    workspaces,
    exportAllWorkspacesJson,
    importAllWorkspacesJson,
  } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const isEn = settings.language === 'en';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Approximate storage calculation
  const serializedSizeKb = Math.max(
    1,
    Math.round((JSON.stringify(workspaces).length + JSON.stringify(settings).length) / 1024)
  );
  const totalScenesCount = workspaces.reduce((acc, w) => acc + w.scenes.length, 0);
  const totalSnapshotsCount = workspaces.reduce((acc, w) => acc + w.snapshots.length, 0);

  const handleExportCatalog = () => {
    const json = exportAllWorkspacesJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkgraph-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMsg(isEn ? 'Full catalog exported.' : 'Catálogo completo exportado.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAllWorkspacesJson(String(reader.result || ''));
      setFeedbackMsg(
        ok
          ? isEn
            ? 'Catalog imported successfully.'
            : 'Catálogo importado com sucesso.'
          : isEn
            ? 'Invalid catalog file format.'
            : 'Formato de arquivo inválido.'
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Avisos Silenciosos & Metas */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Bell size={16} color="var(--accent)" />
          <span>{isEn ? 'Silent Alerts & Epistemic Warnings' : 'Avisos Silenciosos & Alertas Epistêmicos'}</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.quietNotifications}
            onChange={(e) => setField('quietNotifications', e.target.checked)}
          />
          <span>
            {isEn
              ? 'Quiet Mode (suppress non-critical popups during writing)'
              : 'Modo Silencioso (suprimir avisos não críticos durante a escrita)'}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.epistemicAlertsInEditor}
            onChange={(e) => setField('epistemicAlertsInEditor', e.target.checked)}
          />
          <span>
            {isEn
              ? 'Highlight epistemic & continuity spoilers inline in the manuscript'
              : 'Destacar vazamentos epistêmicos e de continuidade no manuscrito'}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.dailyGoalReminder}
            onChange={(e) => setField('dailyGoalReminder', e.target.checked)}
          />
          <span>
            {isEn
              ? 'Show subtle daily word goal indicator in header'
              : 'Exibir indicador discreto da meta diária de palavras no cabeçalho'}
          </span>
        </label>
      </div>

      {/* Armazenamento Local, Snapshots & Backup do Catálogo */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <HardDrive size={16} color="var(--accent)" />
          <span>{isEn ? 'Local Vault Storage & Full Backup' : 'Armazenamento Local & Backup Completo'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.65rem 0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isEn ? 'Local Catalog Footprint' : 'Uso do Catálogo Local'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{serializedSizeKb} KB</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.65rem 0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isEn ? 'Workspaces / Scenes' : 'Workspaces / Cenas'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {workspaces.length} / {totalScenesCount}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.65rem 0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isEn ? 'Saved Snapshots' : 'Snapshots Salvos'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalSnapshotsCount}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Max Snapshots Kept per Workspace' : 'Limite de Snapshots por Workspace'}
            </span>
            <input
              type="number"
              min={5}
              max={100}
              value={settings.maxSnapshotsPerWorkspace}
              onChange={(e) => setField('maxSnapshotsPerWorkspace', Number(e.target.value))}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer', paddingTop: '1rem' }}>
            <input
              type="checkbox"
              checked={settings.autoSnapshotOnClose}
              onChange={(e) => setField('autoSnapshotOnClose', e.target.checked)}
            />
            <span>
              {isEn
                ? 'Create automatic snapshot when switching workspaces'
                : 'Criar snapshot automático ao alternar de workspace'}
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <button
            onClick={handleExportCatalog}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 6,
              padding: '0.5rem 0.9rem',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={14} />
            {isEn ? 'Export Full Catalog (.JSON)' : 'Exportar Catálogo Completo (.JSON)'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0.5rem 0.9rem',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Upload size={14} />
            {isEn ? 'Import Catalog (.JSON)' : 'Importar Catálogo (.JSON)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => {
              resetSettingsToDefault();
              setFeedbackMsg(isEn ? 'Default settings restored.' : 'Configurações padrão restauradas.');
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0.5rem 0.9rem',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RotateCcw size={14} />
            {isEn ? 'Restore Default Settings' : 'Restaurar Configurações Padrão'}
          </button>
        </div>

        {feedbackMsg && (
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>{feedbackMsg}</div>
        )}
      </div>

      {/* Sobre & Arquitetura */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.86rem' }}>
          <Info size={15} color="var(--accent)" />
          <span>{isEn ? 'System & Architecture' : 'Sistema & Arquitetura'}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div>
            <strong>InkGraph Studio</strong> • v0.2.0 • Local-First Markdown & YAML Vault (<code>./workspace/</code>)
          </div>
          <div>
            {isEn
              ? 'Engine: Ephemeral SQLite FTS5 Indexer • Native MCP Server (stdio & HTTP) • Tauri v2 Wayland Ready'
              : 'Motor: Indexador Efêmero SQLite FTS5 • Servidor MCP Nativo (stdio & HTTP) • Tauri v2 Wayland'}
          </div>
        </div>
      </div>
    </div>
  );
}
