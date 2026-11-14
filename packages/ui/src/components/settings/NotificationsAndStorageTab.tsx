import { useRef, useState } from 'react';
import { Bell, Download, HardDrive, RotateCcw, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import {
  THEME_VAR,
  checkboxInputStyle,
  checkboxLabelStyle,
  controlInputStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  innerCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

export function NotificationsAndStorageTab() {
  const {
    workspaces,
    exportAllWorkspacesJson,
    importAllWorkspacesJson,
    requestConfirm,
    notify,
  } = useProject();
  const { draftSettings, updateDraftSetting, resetDraftToDefaults } = useSettings();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const isEn = draftSettings.language === 'en';

  const serializedSizeKb = Math.max(
    1,
    Math.round(
      (JSON.stringify(workspaces).length + JSON.stringify(draftSettings).length) / 1024
    )
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
    const msg = isEn ? 'Full catalog exported.' : 'Catálogo completo exportado.';
    setFeedbackMsg(msg);
    notify(msg, 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAllWorkspacesJson(String(reader.result || ''));
      const msg = ok
        ? isEn
          ? 'Catalog imported successfully.'
          : 'Catálogo importado com sucesso.'
        : isEn
          ? 'Invalid catalog file format.'
          : 'Formato de arquivo inválido.';
      setFeedbackMsg(msg);
      notify(msg, ok ? 'success' : 'warning');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = async () => {
    const accepted = await requestConfirm({
      title: isEn ? 'Restore Default Settings' : 'Restaurar Configurações Padrão',
      message: isEn
        ? 'Restore all preferences and shortcuts to factory defaults in draft? Click Save afterwards to persist.'
        : 'Restaurar todas as preferências e atalhos para o padrão no rascunho? Clique em Salvar em seguida para aplicar.',
      confirmLabel: isEn ? 'Restore' : 'Restaurar',
      cancelLabel: isEn ? 'Cancel' : 'Cancelar',
      tone: 'danger',
    });
    if (accepted) {
      resetDraftToDefaults();
      const msg = isEn
        ? 'Default settings loaded in draft.'
        : 'Configurações padrão carregadas no rascunho.';
      setFeedbackMsg(msg);
      notify(msg, 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Bell size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn
              ? 'Silent Alerts & Epistemic Warnings'
              : 'Avisos Silenciosos & Alertas Epistêmicos'}
          </span>
        </div>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.quietNotifications}
            onChange={(e) => updateDraftSetting('quietNotifications', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Quiet Mode (suppress non-critical popups during writing)'
              : 'Modo Silencioso (suprimir avisos não críticos durante a escrita)'}
          </span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.epistemicAlertsInEditor}
            onChange={(e) =>
              updateDraftSetting('epistemicAlertsInEditor', e.target.checked)
            }
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Highlight epistemic & continuity spoilers inline in the manuscript'
              : 'Destacar vazamentos epistêmicos e de continuidade no manuscrito'}
          </span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.dailyGoalReminder}
            onChange={(e) => updateDraftSetting('dailyGoalReminder', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Show subtle daily word goal indicator in header'
              : 'Exibir indicador discreto da meta diária de palavras no cabeçalho'}
          </span>
        </label>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <HardDrive size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn
              ? 'Local Vault Storage & Full Backup'
              : 'Armazenamento Local & Backup Completo'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
              {isEn ? 'Local Catalog Footprint' : 'Uso do Catálogo Local'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {serializedSizeKb} KB
            </div>
          </div>
          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
              {isEn ? 'Workspaces / Scenes' : 'Workspaces / Cenas'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {workspaces.length} / {totalScenesCount}
            </div>
          </div>
          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
              {isEn ? 'Saved Snapshots' : 'Snapshots Salvos'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {totalSnapshotsCount}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center',
          }}
        >
          <label htmlFor="ink-max-snaps" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Max Snapshots Kept per Workspace' : 'Limite de Snapshots por Workspace'}
            </span>
            <input
              id="ink-max-snaps"
              type="number"
              min={5}
              max={100}
              value={draftSettings.maxSnapshotsPerWorkspace}
              onChange={(e) =>
                updateDraftSetting('maxSnapshotsPerWorkspace', Number(e.target.value))
              }
              style={controlInputStyle}
            />
          </label>

          <label style={{ ...checkboxLabelStyle, paddingTop: '1rem' }}>
            <input
              type="checkbox"
              checked={draftSettings.autoSnapshotOnClose}
              onChange={(e) => updateDraftSetting('autoSnapshotOnClose', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn
                ? 'Create automatic snapshot when switching workspaces'
                : 'Criar snapshot automático ao alternar de workspace'}
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <button type="button" onClick={handleExportCatalog} style={primaryButtonStyle}>
            <Download size={14} />
            {isEn ? 'Export Full Catalog (.JSON)' : 'Exportar Catálogo Completo (.JSON)'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={secondaryButtonStyle}
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
            type="button"
            onClick={() => void handleResetDefaults()}
            style={{ ...secondaryButtonStyle, color: THEME_VAR.textSecondary }}
          >
            <RotateCcw size={14} />
            {isEn ? 'Restore Default Settings' : 'Restaurar Configurações Padrão'}
          </button>
        </div>

        {feedbackMsg && (
          <div role="status" style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            {feedbackMsg}
          </div>
        )}
      </section>
    </div>
  );
}
