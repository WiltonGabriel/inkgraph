import { CalendarClock, Clock, Compass, Globe, ShieldAlert } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import type { AppSettings, ViewId } from '../../types/project';
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

const OPENING_VIEW_IDS: ViewId[] = [
  'dashboard',
  'manuscript',
  'writer',
  'plotboard',
  'timeline',
  'canon-radar',
  'characters',
  'worlds',
  'graph',
];

const ROLLOVER_HOURS = Array.from({ length: 13 }, (_, hour) => hour);

export function GeneralSettingsTab() {
  const { t } = useProject();
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Idioma, Calendário & Dia de Escrita */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Globe size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Language, Date & Writing Day' : 'Idioma, Data & Dia de Escrita'}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.9rem',
          }}
        >
          <label htmlFor="ink-lang" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Interface Language' : 'Idioma da Interface'}
            </span>
            <select
              id="ink-lang"
              value={draftSettings.language}
              onChange={(e) =>
                updateDraftSetting('language', e.target.value as AppSettings['language'])
              }
              style={controlInputStyle}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
            </select>
          </label>

          <label htmlFor="ink-date-format" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Date Format' : 'Formato de Data'}
            </span>
            <select
              id="ink-date-format"
              value={draftSettings.dateFormat}
              onChange={(e) =>
                updateDraftSetting('dateFormat', e.target.value as AppSettings['dateFormat'])
              }
              style={controlInputStyle}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
            </select>
          </label>

          <label htmlFor="ink-rollover-hour" style={fieldColumnStyle}>
            <span style={{ ...fieldLabelTextStyle, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <CalendarClock size={13} />
              {isEn ? 'Writing Day Rollover (0–12h)' : 'Virada do Dia de Escrita (0–12h)'}
            </span>
            <select
              id="ink-rollover-hour"
              value={draftSettings.writingDayRolloverHour}
              onChange={(e) => updateDraftSetting('writingDayRolloverHour', Number(e.target.value))}
              style={controlInputStyle}
            >
              {ROLLOVER_HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {`${String(hour).padStart(2, '0')}:00`}
                  {hour === 4 ? (isEn ? ' (Recommended)' : ' (Recomendado)') : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Inicialização & Navegação */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Compass size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Startup & Navigation' : 'Inicialização & Navegação'}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.9rem',
          }}
        >
          <label htmlFor="ink-startup" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'On Program Startup' : 'Ao Iniciar o Programa'}
            </span>
            <select
              id="ink-startup"
              value={draftSettings.startupBehavior}
              onChange={(e) =>
                updateDraftSetting(
                  'startupBehavior',
                  e.target.value as AppSettings['startupBehavior']
                )
              }
              style={controlInputStyle}
            >
              <option value="home">
                {isEn
                  ? 'Open My Space (Workspace Catalog)'
                  : 'Abrir Meu Espaço (Catálogo de Workspaces)'}
              </option>
              <option value="last-workspace">
                {isEn ? 'Reopen Last Active Workspace' : 'Reabrir Último Workspace Ativo'}
              </option>
            </select>
          </label>

          <label htmlFor="ink-opening-view" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Default View When Entering Workspace' : 'Visão Padrão ao Abrir Workspace'}
            </span>
            <select
              id="ink-opening-view"
              value={draftSettings.defaultOpeningView}
              onChange={(e) => updateDraftSetting('defaultOpeningView', e.target.value as ViewId)}
              style={controlInputStyle}
            >
              {OPENING_VIEW_IDS.map((vid) => (
                <option key={vid} value={vid}>
                  {t.views[vid]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.startupRestoreLastViewAndScene}
            onChange={(e) =>
              updateDraftSetting('startupRestoreLastViewAndScene', e.target.checked)
            }
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Restore last active view and manuscript scene on startup'
              : 'Restaurar última visão e cena aberta ao reabrir o workspace'}
          </span>
        </label>
      </section>

      {/* Salvamento Automático & Segurança */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Clock size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Autosave & Safety' : 'Salvamento Automático & Segurança'}</span>
        </div>

        <label htmlFor="ink-autosave" style={{ ...fieldColumnStyle, maxWidth: 320 }}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Autosave Interval' : 'Intervalo de Salvamento Automático'}
          </span>
          <select
            id="ink-autosave"
            value={draftSettings.autosaveIntervalSeconds}
            onChange={(e) => updateDraftSetting('autosaveIntervalSeconds', Number(e.target.value))}
            style={controlInputStyle}
          >
            <option value={5}>
              {isEn ? 'Every 5 seconds (Instant)' : 'A cada 5 segundos (Instantâneo)'}
            </option>
            <option value={10}>
              {isEn ? 'Every 10 seconds (Recommended)' : 'A cada 10 segundos (Recomendado)'}
            </option>
            <option value={30}>{isEn ? 'Every 30 seconds' : 'A cada 30 segundos'}</option>
            <option value={60}>{isEn ? 'Every 60 seconds' : 'A cada 60 segundos'}</option>
          </select>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.confirmDestructiveActions}
            onChange={(e) =>
              updateDraftSetting('confirmDestructiveActions', e.target.checked)
            }
            style={checkboxInputStyle}
          />
          <ShieldAlert size={14} color={THEME_VAR.textMuted} />
          <span>
            {isEn
              ? 'Ask for confirmation before deleting scenes, entities, or workspaces'
              : 'Solicitar confirmação antes de excluir cenas, entidades ou workspaces'}
          </span>
        </label>
      </section>
    </div>
  );
}
