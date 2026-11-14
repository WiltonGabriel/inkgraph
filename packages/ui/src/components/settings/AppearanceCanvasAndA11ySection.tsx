import { Accessibility, Compass } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import {
  THEME_VAR,
  checkboxInputStyle,
  checkboxLabelStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

export function AppearanceCanvasAndA11ySection() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  return (
    <>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Compass size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Spatial Canvas, Graph & Performance' : 'Tela Espacial, Grafo & Desempenho'}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center',
          }}
        >
          <label htmlFor="ink-graph-dim" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Inactive Node Dimming' : 'Atenuação de Nós Inativos'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {Math.round(draftSettings.graphDimIntensity * 100)}%
              </strong>
            </span>
            <input
              id="ink-graph-dim"
              type="range"
              min={0}
              max={0.5}
              step={0.02}
              value={draftSettings.graphDimIntensity}
              onChange={(e) =>
                updateDraftSetting('graphDimIntensity', Number(e.target.value))
              }
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings.graphGridEnabled}
              onChange={(e) => updateDraftSetting('graphGridEnabled', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn
                ? 'Show spatial grid on Graph & Mind Map'
                : 'Exibir grade espacial no Grafo & Mapa Mental'}
            </span>
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.6rem',
          }}
        >
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings.enableAnimations}
              onChange={(e) => updateDraftSetting('enableAnimations', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn ? 'Enable subtle UI animations' : 'Habilitar animações sutis na interface'}
            </span>
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings.lowPowerMode}
              onChange={(e) => updateDraftSetting('lowPowerMode', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn
                ? 'Low power mode (reduce blurs & graph physics ticks)'
                : 'Modo econômico (reduzir desfoques e ciclos físicos)'}
            </span>
          </label>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Accessibility size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Accessibility' : 'Acessibilidade'}</span>
        </div>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.highContrast}
            onChange={(e) => updateDraftSetting('highContrast', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn ? 'High contrast borders and text' : 'Alto contraste em bordas e textos'}
          </span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.largeText}
            onChange={(e) => updateDraftSetting('largeText', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>{isEn ? 'Large interface text' : 'Texto ampliado na interface'}</span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.reducedMotion}
            onChange={(e) => updateDraftSetting('reducedMotion', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Reduced motion (disable transitions)'
              : 'Movimento reduzido (desativar transições)'}
          </span>
        </label>
      </section>
    </>
  );
}
