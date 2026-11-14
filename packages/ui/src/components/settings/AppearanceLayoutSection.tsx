import { Layout } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type {
  AppSettings,
  CornerStyle,
  SidebarIndicatorStyle,
  StatusColorSet,
  SurfaceStyle,
  UiFontFamily,
} from '../../types/project';
import {
  THEME_VAR,
  checkboxInputStyle,
  checkboxLabelStyle,
  controlInputStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

export function AppearanceLayoutSection() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <Layout size={16} color={THEME_VAR.accentPrimary} />
        <span>{isEn ? 'Typography, Geometry & Panels' : 'Tipografia, Geometria & Painéis'}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <label htmlFor="ink-ui-font" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Interface Font' : 'Fonte da Interface'}
          </span>
          <select
            id="ink-ui-font"
            value={draftSettings.uiFont}
            onChange={(e) => updateDraftSetting('uiFont', e.target.value as UiFontFamily)}
            style={controlInputStyle}
          >
            <option value="sans">Sans-Serif (Inter / Sistema)</option>
            <option value="humanist">Humanista (Plus Jakarta)</option>
            <option value="serif">{isEn ? 'Editorial Serif' : 'Serifa Editorial'}</option>
            <option value="mono">{isEn ? 'Monospace' : 'Monoespaçada'}</option>
          </select>
        </label>

        <label htmlFor="ink-ui-scale" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'UI Scale' : 'Escala da Interface'}:{' '}
            <strong style={{ color: THEME_VAR.textPrimary }}>{draftSettings.uiScale}%</strong>
          </span>
          <input
            id="ink-ui-scale"
            type="range"
            min={90}
            max={120}
            step={5}
            value={draftSettings.uiScale}
            onChange={(e) => updateDraftSetting('uiScale', Number(e.target.value))}
            style={{ accentColor: THEME_VAR.accentPrimary, marginTop: '0.35rem' }}
          />
        </label>

        <label htmlFor="ink-ui-density" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Interface Density' : 'Densidade da Interface'}
          </span>
          <select
            id="ink-ui-density"
            value={draftSettings.uiDensity}
            onChange={(e) =>
              updateDraftSetting('uiDensity', e.target.value as AppSettings['uiDensity'])
            }
            style={controlInputStyle}
          >
            <option value="compact">
              {isEn ? 'Compact (Tiling / High Density)' : 'Compacta (Tiling / Alta Densidade)'}
            </option>
            <option value="standard">{isEn ? 'Standard' : 'Padrão'}</option>
            <option value="comfortable">{isEn ? 'Comfortable' : 'Confortável'}</option>
          </select>
        </label>

        <label htmlFor="ink-corner-radius" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Corner Radius' : 'Arredondamento de Cantos'}
          </span>
          <select
            id="ink-corner-radius"
            value={draftSettings.cornerRadius}
            onChange={(e) => updateDraftSetting('cornerRadius', e.target.value as CornerStyle)}
            style={controlInputStyle}
          >
            <option value="sharp">{isEn ? 'Sharp (2–6px)' : 'Reto (2–6px)'}</option>
            <option value="subtle">{isEn ? 'Subtle (6–12px)' : 'Sutil (6–12px)'}</option>
            <option value="rounded">{isEn ? 'Rounded (10–18px)' : 'Arredondado (10–18px)'}</option>
          </select>
        </label>

        <label htmlFor="ink-surface-style" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Card & Surface Style' : 'Estilo de Superfície'}
          </span>
          <select
            id="ink-surface-style"
            value={draftSettings.surfaceStyle}
            onChange={(e) => updateDraftSetting('surfaceStyle', e.target.value as SurfaceStyle)}
            style={controlInputStyle}
          >
            <option value="bordered">{isEn ? 'Bordered (Flat)' : 'Com Bordas (Plano)'}</option>
            <option value="elevated">{isEn ? 'Elevated (Soft Shadow)' : 'Elevado (Sombra Sutil)'}</option>
            <option value="minimal">{isEn ? 'Minimal' : 'Minimalista'}</option>
          </select>
        </label>

        <label htmlFor="ink-sidebar-indicator" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Active Sidebar Indicator' : 'Indicador na Barra Lateral'}
          </span>
          <select
            id="ink-sidebar-indicator"
            value={draftSettings.sidebarIndicator}
            onChange={(e) =>
              updateDraftSetting('sidebarIndicator', e.target.value as SidebarIndicatorStyle)
            }
            style={controlInputStyle}
          >
            <option value="pill">{isEn ? 'Filled Pill' : 'Pílula Destacada'}</option>
            <option value="bar">{isEn ? 'Left Accent Bar' : 'Barra Lateral'}</option>
            <option value="dot">{isEn ? 'Quiet Dot' : 'Ponto Discreto'}</option>
          </select>
        </label>

        <label htmlFor="ink-status-colors" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Status & Canon Color Set' : 'Conjunto de Cores de Estado'}
          </span>
          <select
            id="ink-status-colors"
            value={draftSettings.statusColorSet}
            onChange={(e) =>
              updateDraftSetting('statusColorSet', e.target.value as StatusColorSet)
            }
            style={controlInputStyle}
          >
            <option value="default">{isEn ? 'Balanced Default' : 'Padrão Equilibrado'}</option>
            <option value="vibrant">{isEn ? 'Vibrant' : 'Vibrante'}</option>
            <option value="muted">{isEn ? 'Muted / Quiet' : 'Suave / Silencioso'}</option>
            <option value="colorblind">{isEn ? 'Colorblind Safe' : 'Daltônico Seguro'}</option>
          </select>
        </label>

        <label htmlFor="ink-copilot-pos" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Copilot Panel Position' : 'Posição do Painel Copiloto'}
          </span>
          <select
            id="ink-copilot-pos"
            value={draftSettings.copilotPosition}
            onChange={(e) =>
              updateDraftSetting(
                'copilotPosition',
                e.target.value as AppSettings['copilotPosition']
              )
            }
            style={controlInputStyle}
          >
            <option value="right">{isEn ? 'Right Side' : 'Lado Direito'}</option>
            <option value="left">{isEn ? 'Left Side' : 'Lado Esquerdo'}</option>
          </select>
        </label>
      </div>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={draftSettings.sidebarDefaultCollapsed}
          onChange={(e) => updateDraftSetting('sidebarDefaultCollapsed', e.target.checked)}
          style={checkboxInputStyle}
        />
        <span>
          {isEn
            ? 'Start with navigation sidebar collapsed'
            : 'Iniciar com a barra de navegação lateral recolhida'}
        </span>
      </label>
    </section>
  );
}
