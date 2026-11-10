import { useRef, useState } from 'react';
import { Bell, HardDrive, Download, Upload, RotateCcw, Info, FolderOutput, Lock, Wifi, Cloud } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';
import {
  exportWorkspaceToLocalFolder,
  supportsDirectoryPicker,
} from '../../storage/vaultFolderExport';
import {
  decryptInkpack,
  encryptInkpack,
  sanitizeSettingsForExport,
  type InkpackEnvelope,
} from '../../storage/cryptoVault';
import { syncProjectWithLanHost } from '../../storage/lanSyncClient';
import {
  buildGoogleDriveAuthUrl,
  createPkceChallengePair,
  syncWorkspaceWithGoogleDrive,
} from '../../storage/googleDriveSyncAdapter';

export function NotificationsAndStorageTab() {
  const {
    project,
    settings,
    updateSettings,
    resetSettingsToDefault,
    workspaces,
    sessionCursor,
    storageKind,
    exportAllWorkspacesJson,
    importAllWorkspacesJson,
    replaceAllWorkspaces,
  } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inkpackInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
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

  const handleExportFolder = async () => {
    try {
      const result = await exportWorkspaceToLocalFolder(project);
      setFeedbackMsg(
        isEn
          ? `Exported ${result.filesWritten} Markdown files to "${result.directoryName}".`
          : `Exportados ${result.filesWritten} arquivos Markdown para "${result.directoryName}".`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('abort')) return;
      setFeedbackMsg(
        isEn
          ? `Could not export folder: ${msg}`
          : `Não foi possível gravar na pasta: ${msg}`
      );
    }
  };

  const handleExportInkpack = async () => {
    try {
      const envelope = await encryptInkpack(
        {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          workspaces,
          sanitizedSettings: sanitizeSettingsForExport(settings),
        },
        vaultPassphrase
      );
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inkgraph-vault-${new Date().toISOString().slice(0, 10)}.inkpack`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedbackMsg(isEn ? 'Encrypted .inkpack exported (API keys stripped).' : '.inkpack criptografado exportado (chaves de API removidas).');
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleImportInkpack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || '')) as InkpackEnvelope;
        const payload = await decryptInkpack(parsed, vaultPassphrase);
        replaceAllWorkspaces(payload.workspaces);
        setFeedbackMsg(
          isEn
            ? `Restored ${payload.workspaces.length} workspace(s) from encrypted .inkpack.`
            : `Restaurados ${payload.workspaces.length} workspace(s) do .inkpack criptografado.`
        );
      } catch (err) {
        setFeedbackMsg(
          isEn
            ? `Decryption failed: ${err instanceof Error ? err.message : 'check passphrase'}`
            : `Falha ao descriptografar: verifique a senha (${err instanceof Error ? err.message : ''})`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLanSync = async () => {
    setSyncBusy(true);
    setFeedbackMsg(null);
    try {
      const res = await syncProjectWithLanHost({
        hostUrl: settings.lanSyncUrl,
        bearerToken: settings.lanSyncToken,
        project,
        deviceName: settings.deviceName,
        sessionCursor,
        lastSyncedHashes: settings.syncLastHashes,
      });
      setFeedbackMsg(
        isEn
          ? `LAN Sync complete: ${res.appliedToHost} sent, ${res.conflictsStagedOnHost} conflicts staged.`
          : `Sync LAN concluído: ${res.appliedToHost} enviados, ${res.conflictsStagedOnHost} conflito(s) salvos em staging/.`
      );
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncBusy(false);
    }
  };

  const handleOpenGoogleDriveOAuth = async () => {
    if (!settings.googleDriveClientId.trim()) {
      setFeedbackMsg(isEn ? 'Enter your free Google OAuth Client ID first.' : 'Informe seu Client ID OAuth gratuito do Google Console.');
      return;
    }
    const { challenge } = await createPkceChallengePair();
    const authUrl = buildGoogleDriveAuthUrl({
      clientId: settings.googleDriveClientId.trim(),
      redirectUri: window.location.origin,
      codeChallenge: challenge,
      state: `inkgraph_${Date.now()}`,
    });
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDriveSync = async () => {
    if (!settings.googleDriveAccessToken.trim()) {
      setFeedbackMsg(isEn ? 'Paste a Google Drive OAuth token (drive.file) to sync.' : 'Cole o token OAuth do Google Drive (escopo drive.file) para sincronizar.');
      return;
    }
    setSyncBusy(true);
    try {
      const res = await syncWorkspaceWithGoogleDrive({
        accessToken: settings.googleDriveAccessToken.trim(),
        project,
        deviceName: settings.deviceName,
        sessionCursor,
        lastSyncedHashes: settings.syncLastHashes,
        encryptionPassphrase: vaultPassphrase.trim() || undefined,
      });
      setFeedbackMsg(
        isEn
          ? `Google Drive Sync ok (id: ${res.uploadedManifestId}, conflicts: ${res.delta.conflicts.length}).`
          : `Sync Google Drive concluído (${res.delta.conflicts.length} conflito(s) isolados).`
      );
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncBusy(false);
    }
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
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.65rem 0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isEn ? 'Local Storage Engine' : 'Motor Local Ativo'}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399' }}><code>{storageKind}</code></div>
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

          {supportsDirectoryPicker() && (
            <button
              onClick={() => void handleExportFolder()}
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
              <FolderOutput size={14} color="var(--accent)" />
              {isEn ? 'Sync Markdown Vault to Folder (./workspace/)' : 'Gravar Cofre Markdown em Pasta (./workspace/)'}
            </button>
          )}

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

      {/* Backup Criptografado .inkpack & Sync Multi-Dispositivo ($0 Infra) */}
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
          <Lock size={16} color="#10b981" />
          <span>{isEn ? 'Encrypted .inkpack & Cross-Device Sync ($0 Infrastructure)' : 'Cofre Criptografado (.inkpack) & Sync Entre Aparelhos ($0 Custo)'}</span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', maxWidth: 420 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Vault Passphrase (PBKDF2 600k + AES-256-GCM)' : 'Senha do Cofre (PBKDF2 600k + AES-256-GCM)'}
          </span>
          <input
            type="password"
            value={vaultPassphrase}
            onChange={(e) => setVaultPassphrase(e.target.value)}
            placeholder={isEn ? 'Minimum 6 characters...' : 'Mínimo 6 caracteres...'}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.45rem 0.65rem', color: 'var(--text-primary)' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void handleExportInkpack()}
            style={{ background: '#10b981', color: '#052e16', borderRadius: 6, padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Lock size={14} /> {isEn ? 'Export Encrypted .inkpack' : 'Exportar .inkpack Criptografado'}
          </button>
          <button
            type="button"
            onClick={() => inkpackInputRef.current?.click()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Upload size={14} /> {isEn ? 'Restore .inkpack' : 'Restaurar .inkpack'}
          </button>
          <input ref={inkpackInputRef} type="file" accept=".inkpack,.json" onChange={handleImportInkpack} style={{ display: 'none' }} />
        </div>

        {/* LAN / Tailscale Direct P2P Sync */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Wifi size={13} color="var(--accent)" /> LAN / Tailscale Host URL
            </span>
            <input
              value={settings.lanSyncUrl}
              onChange={(e) => setField('lanSyncUrl', e.target.value)}
              placeholder="http://192.168.0.10:3333"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.42rem 0.6rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>LAN Sync Bearer Token</span>
            <input
              type="password"
              value={settings.lanSyncToken}
              onChange={(e) => setField('lanSyncToken', e.target.value)}
              placeholder={isEn ? 'Optional token' : 'Token opcional'}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.42rem 0.6rem' }}
            />
          </label>
          <button
            type="button"
            disabled={syncBusy}
            onClick={() => void handleLanSync()}
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: 6, padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 600 }}
          >
            {syncBusy ? '...' : isEn ? 'Sync with PC (LAN)' : 'Sincronizar via LAN'}
          </button>
        </div>

        {/* Google Drive Free Relay (drive.file only) */}
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}>
            <Cloud size={14} color="#60a5fa" />
            <span>{isEn ? 'Google Drive Personal Sync (100% Free — drive.file scope only, never uploads SQLite)' : 'Google Drive Pessoal (100% Gratuito — escopo drive.file, nunca sobe SQLite)'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem', alignItems: 'flex-end' }}>
            <input
              value={settings.googleDriveClientId}
              onChange={(e) => setField('googleDriveClientId', e.target.value)}
              placeholder="Google OAuth Client ID"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.42rem 0.6rem', fontSize: '0.78rem' }}
            />
            <input
              type="password"
              value={settings.googleDriveAccessToken}
              onChange={(e) => setField('googleDriveAccessToken', e.target.value)}
              placeholder="OAuth Access Token (drive.file)"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.42rem 0.6rem', fontSize: '0.78rem' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => void handleOpenGoogleDriveOAuth()}
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '0.45rem 0.7rem', fontSize: '0.76rem', fontWeight: 600 }}
              >
                OAuth PKCE
              </button>
              <button
                type="button"
                disabled={syncBusy}
                onClick={() => void handleDriveSync()}
                style={{ flex: 1, background: '#2563eb', color: '#fff', borderRadius: 6, padding: '0.45rem 0.7rem', fontSize: '0.76rem', fontWeight: 600 }}
              >
                {isEn ? 'Sync Drive' : 'Sync Drive'}
              </button>
            </div>
          </div>
        </div>
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
