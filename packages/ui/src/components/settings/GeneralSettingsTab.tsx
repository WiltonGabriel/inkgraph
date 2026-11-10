import { Globe, Compass, Clock, ShieldAlert, BookOpenCheck, Laptop } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings, ViewId } from '../../types/project';

const OPENING_VIEW_IDS: ViewId[] = [
  'dashboard',
  'manuscript',
  'writer',
  'plotboard',
  'characters',
  'worlds',
  'graph',
];

export function GeneralSettingsTab() {
  const { settings, updateSettings, openOnboarding, t } = useProject();
  const isEn = settings.language === 'en';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Idioma & Região */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Globe size={16} color="var(--accent)" />
          <span>{isEn ? 'Language & Region' : 'Idioma & Região'}</span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Interface Language' : 'Idioma da Interface'}
          </span>
          <select
            value={settings.language}
            onChange={(e) => setField('language', e.target.value as AppSettings['language'])}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.5rem 0.65rem',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      {/* Comportamento de Inicialização */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Compass size={16} color="var(--accent)" />
          <span>{isEn ? 'Startup & Navigation' : 'Inicialização & Navegação'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'On Program Startup' : 'Ao Iniciar o Programa'}
            </span>
            <select
              value={settings.startupBehavior}
              onChange={(e) => setField('startupBehavior', e.target.value as AppSettings['startupBehavior'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.5rem 0.65rem',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            >
              <option value="home">
                {isEn ? 'Open My Space (Workspace Catalog)' : 'Abrir Meu Espaço (Catálogo de Workspaces)'}
              </option>
              <option value="last-workspace">
                {isEn ? 'Reopen Last Active Workspace' : 'Reabrir Último Workspace Ativo'}
              </option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Default View When Entering Workspace' : 'Visão Padrão ao Abrir Workspace'}
            </span>
            <select
              value={settings.defaultOpeningView}
              onChange={(e) => setField('defaultOpeningView', e.target.value as ViewId)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.5rem 0.65rem',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            >
              {OPENING_VIEW_IDS.map((vid) => (
                <option key={vid} value={vid}>
                  {t.views[vid]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Salvamento Automático & Segurança */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Clock size={16} color="var(--accent)" />
          <span>{isEn ? 'Autosave & Safety' : 'Salvamento Automático & Segurança'}</span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', maxWidth: 320 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Autosave Interval' : 'Intervalo de Salvamento Automático'}
          </span>
          <select
            value={settings.autosaveIntervalSeconds}
            onChange={(e) => setField('autosaveIntervalSeconds', Number(e.target.value))}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.5rem 0.65rem',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          >
            <option value={5}>{isEn ? 'Every 5 seconds (Instant)' : 'A cada 5 segundos (Instantâneo)'}</option>
            <option value={10}>{isEn ? 'Every 10 seconds (Recommended)' : 'A cada 10 segundos (Recomendado)'}</option>
            <option value={30}>{isEn ? 'Every 30 seconds' : 'A cada 30 segundos'}</option>
            <option value={60}>{isEn ? 'Every 60 seconds' : 'A cada 60 segundos'}</option>
          </select>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontSize: '0.82rem',
            cursor: 'pointer',
            paddingTop: '0.2rem',
          }}
        >
          <input
            type="checkbox"
            checked={settings.confirmDestructiveActions}
            onChange={(e) => setField('confirmDestructiveActions', e.target.checked)}
          />
          <ShieldAlert size={14} color="var(--text-muted)" />
          <span>
            {isEn
              ? 'Ask for confirmation before deleting scenes, entities, or workspaces'
              : 'Solicitar confirmação antes de excluir cenas, entidades ou workspaces'}
          </span>
        </label>
      </div>

      {/* Dispositivo & Tutorial Guiado */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Laptop size={16} color="var(--accent)" />
          <span>{isEn ? 'Device Identity & Guided Onboarding' : 'Identidade do Aparelho & Tutorial Guiado'}</span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', maxWidth: 340 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Device Name (shown when resuming sessions)' : 'Nome deste Aparelho (exibido ao retomar sessões)'}
          </span>
          <input
            value={settings.deviceName}
            onChange={(e) => setField('deviceName', e.target.value)}
            placeholder="PC Casa / Notebook / Celular"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.45rem 0.65rem',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 460 }}>
            {t.onboarding.reopenDesc}
          </span>
          <button
            type="button"
            onClick={openOnboarding}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.48rem 0.85rem',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <BookOpenCheck size={14} color="var(--accent)" />
            {t.onboarding.reopenBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
