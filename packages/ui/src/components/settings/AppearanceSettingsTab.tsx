import { Palette, Layout, Accessibility, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';

const ACCENT_SWATCHES = [
  { hex: '#3b82f6', labelPt: 'Azul Cobalto', labelEn: 'Cobalt Blue' },
  { hex: '#10b981', labelPt: 'Esmeralda', labelEn: 'Emerald' },
  { hex: '#a855f7', labelPt: 'Ametista', labelEn: 'Amethyst' },
  { hex: '#f59e0b', labelPt: 'Âmbar', labelEn: 'Amber' },
  { hex: '#ef4444', labelPt: 'Carmesim', labelEn: 'Crimson' },
  { hex: '#06b6d4', labelPt: 'Ciano', labelEn: 'Cyan' },
];

export function AppearanceSettingsTab() {
  const { settings, updateSettings } = useProject();
  const isEn = settings.language === 'en';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Tema Visual & Cor de Destaque */}
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
          <Palette size={16} color="var(--accent)" />
          <span>{isEn ? 'Visual Theme & Accent' : 'Tema Visual & Cor de Destaque'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {(
            [
              { id: 'dark', name: isEn ? 'Dark (Default)' : 'Escuro (Padrão)', bg: '#0c0e14', fg: '#f3f4f6' },
              { id: 'light', name: isEn ? 'Light Paper' : 'Papel Claro', bg: '#f8fafc', fg: '#0f172a' },
              { id: 'sepia', name: isEn ? 'Warm Sepia' : 'Sépia Quente', bg: '#f4ecd8', fg: '#3e2723' },
            ] as const
          ).map((themeOpt) => {
            const active = settings.theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => setField('theme', themeOpt.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: active ? `2px solid ${settings.accentColor}` : '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    height: 36,
                    borderRadius: 5,
                    background: themeOpt.bg,
                    border: '1px solid rgba(128,128,128,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    color: themeOpt.fg,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Aa Bb Cc
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: active ? 700 : 500, color: 'var(--text-primary)' }}>
                  {themeOpt.name}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isEn ? 'Global Accent Color' : 'Cor de Destaque Global'}
          </span>
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            {ACCENT_SWATCHES.map((sw) => {
              const selected = settings.accentColor === sw.hex;
              return (
                <button
                  key={sw.hex}
                  onClick={() => setField('accentColor', sw.hex)}
                  title={isEn ? sw.labelEn : sw.labelPt}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: sw.hex,
                    border: selected ? '2px solid #ffffff' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {selected && <Check size={14} color="#ffffff" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Layout & Densidade (Niri / Wayland Tiling) */}
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
          <Layout size={16} color="var(--accent)" />
          <span>{isEn ? 'Density & Panels' : 'Densidade & Painéis'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Interface Density' : 'Densidade da Interface'}
            </span>
            <select
              value={settings.uiDensity}
              onChange={(e) => setField('uiDensity', e.target.value as AppSettings['uiDensity'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="compact">{isEn ? 'Compact (Tiling / High Density)' : 'Compacta (Tiling / Alta Densidade)'}</option>
              <option value="standard">{isEn ? 'Standard' : 'Padrão'}</option>
              <option value="comfortable">{isEn ? 'Comfortable' : 'Confortável'}</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Copilot Panel Position' : 'Posição do Painel Copiloto'}
            </span>
            <select
              value={settings.copilotPosition}
              onChange={(e) => setField('copilotPosition', e.target.value as AppSettings['copilotPosition'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="right">{isEn ? 'Right Side' : 'Lado Direito'}</option>
              <option value="left">{isEn ? 'Left Side' : 'Lado Esquerdo'}</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.sidebarDefaultCollapsed}
            onChange={(e) => setField('sidebarDefaultCollapsed', e.target.checked)}
          />
          <span>
            {isEn
              ? 'Start with navigation sidebar collapsed'
              : 'Iniciar com a barra de navegação lateral recolhida'}
          </span>
        </label>
      </div>

      {/* Acessibilidade Visual */}
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
          <Accessibility size={16} color="var(--accent)" />
          <span>{isEn ? 'Accessibility' : 'Acessibilidade'}</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => setField('highContrast', e.target.checked)}
          />
          <span>{isEn ? 'High contrast borders and text' : 'Alto contraste em bordas e textos'}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => setField('largeText', e.target.checked)}
          />
          <span>{isEn ? 'Large interface text' : 'Texto ampliado na interface'}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => setField('reducedMotion', e.target.checked)}
          />
          <span>{isEn ? 'Reduced motion (disable transitions)' : 'Movimento reduzido (desativar transições)'}</span>
        </label>
      </div>
    </div>
  );
}
