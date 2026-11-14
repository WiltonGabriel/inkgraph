import { Check, Monitor, Moon, Palette, Sun, SunMedium } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { THEME_PALETTES } from '../../domain/themes';
import type { ThemeBrightness } from '../../types/project';
import {
  THEME_VAR,
  fieldLabelTextStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

const ACCENT_SWATCHES = [
  { hex: '#3b82f6', labelPt: 'Azul Cobalto (Paleta)', labelEn: 'Cobalt Blue (Palette)' },
  { hex: '#10b981', labelPt: 'Esmeralda', labelEn: 'Emerald' },
  { hex: '#a855f7', labelPt: 'Ametista', labelEn: 'Amethyst' },
  { hex: '#f59e0b', labelPt: 'Âmbar', labelEn: 'Amber' },
  { hex: '#ef4444', labelPt: 'Carmesim', labelEn: 'Crimson' },
  { hex: '#06b6d4', labelPt: 'Ciano', labelEn: 'Cyan' },
];

export function AppearanceThemeSection() {
  const { draftSettings, updateDraftSetting, updateDraftSettings } = useSettings();
  const isEn = draftSettings.language === 'en';

  const selectBrightness = (mode: ThemeBrightness) => {
    const osLight =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: light)').matches;
    const resolvedLegacy =
      mode === 'system' ? (osLight ? 'light' : 'dark') : mode;
    updateDraftSettings({
      themeBrightness: mode,
      theme: resolvedLegacy,
    });
  };

  const brightnessOptions: {
    id: ThemeBrightness;
    label: string;
    icon: typeof Moon;
    bg: string;
    fg: string;
  }[] = [
    { id: 'dark', label: isEn ? 'Dark' : 'Escuro', icon: Moon, bg: '#0c0e14', fg: '#f1f5f9' },
    { id: 'light', label: isEn ? 'Light' : 'Claro', icon: Sun, bg: '#f8fafc', fg: '#0f172a' },
    { id: 'sepia', label: isEn ? 'Sepia' : 'Sépia', icon: SunMedium, bg: '#f4ecd8', fg: '#3e2723' },
    { id: 'system', label: isEn ? 'System' : 'Sistema', icon: Monitor, bg: 'linear-gradient(135deg, #f8fafc 50%, #0c0e14 50%)', fg: '#64748b' },
  ];

  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <Palette size={16} color={THEME_VAR.accentPrimary} />
        <span>{isEn ? 'Brightness, Palettes & Accent' : 'Brilho, Paletas Duplas & Destaque'}</span>
      </div>

      {/* Brilho: Claro / Escuro / Sépia / Sistema */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <span style={{ ...fieldLabelTextStyle, fontSize: '0.8rem' }}>
          {isEn ? 'Brightness Mode' : 'Modo de Brilho'}
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {brightnessOptions.map((opt) => {
            const Icon = opt.icon;
            const active = draftSettings.themeBrightness === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectBrightness(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: THEME_VAR.radiusSm,
                  background: THEME_VAR.bgElevated,
                  border: active
                    ? `2px solid ${THEME_VAR.accentPrimary}`
                    : `1px solid ${THEME_VAR.borderSubtle}`,
                  color: THEME_VAR.textPrimary,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: opt.bg,
                    border: '1px solid rgba(128, 128, 128, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: opt.fg,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={12} />
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Paletas Dual-Mode */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <span style={{ ...fieldLabelTextStyle, fontSize: '0.8rem' }}>
          {isEn ? 'Dual-Mode Color Palette' : 'Paleta de Cores (Modo Claro | Escuro)'}
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {THEME_PALETTES.map((palette) => {
            const active = draftSettings.themePalette === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateDraftSettings({
                    themePalette: palette.id,
                    accentColor: '#3b82f6',
                  })
                }
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  padding: '0.65rem',
                  borderRadius: THEME_VAR.radiusMd,
                  background: THEME_VAR.bgElevated,
                  border: active
                    ? `2px solid ${THEME_VAR.accentPrimary}`
                    : `1px solid ${THEME_VAR.borderSubtle}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    height: 36,
                    borderRadius: 5,
                    overflow: 'hidden',
                    border: '1px solid rgba(128, 128, 128, 0.28)',
                  }}
                >
                  <div
                    style={{
                      background: palette.light.canvas,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 7px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: palette.light.textPrimary,
                      }}
                    >
                      Aa
                    </span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: palette.light.accent,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      background: palette.dark.canvas,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 7px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: palette.dark.textPrimary,
                      }}
                    >
                      Aa
                    </span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: palette.dark.accent,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: active ? 700 : 500,
                      color: THEME_VAR.textPrimary,
                    }}
                  >
                    {isEn ? palette.labelEn : palette.labelPt}
                  </span>
                  {active && <Check size={13} color={THEME_VAR.accentPrimary} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cor de Destaque Global */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ ...fieldLabelTextStyle, fontSize: '0.8rem' }}>
          {isEn ? 'Custom Accent Override' : 'Cor de Destaque Global'}
        </span>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          {ACCENT_SWATCHES.map((sw) => {
            const selected = draftSettings.accentColor === sw.hex;
            const label = isEn ? sw.labelEn : sw.labelPt;
            return (
              <button
                key={sw.hex}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => updateDraftSetting('accentColor', sw.hex)}
                title={label}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: sw.hex,
                  border: selected
                    ? `2px solid ${THEME_VAR.textPrimary}`
                    : '2px solid transparent',
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
    </section>
  );
}
