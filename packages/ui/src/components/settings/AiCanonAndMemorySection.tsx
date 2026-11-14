import { BrainCircuit } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { CanonAiPermission } from '../../types/project';
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

export function AiCanonAndMemorySection() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  const scopes: {
    key: 'canonScopeEntities' | 'canonScopeWorld' | 'canonScopeGraphTimeline';
    label: string;
  }[] = [
    {
      key: 'canonScopeEntities',
      label: isEn
        ? 'Entities (Characters, Factions & Story Objects)'
        : 'Entidades (Personagens, Facções & Objetos)',
    },
    {
      key: 'canonScopeWorld',
      label: isEn
        ? 'World & Rules (Locations, Systems & Laws)'
        : 'Universo (Locais, Sistemas & Leis)',
    },
    {
      key: 'canonScopeGraphTimeline',
      label: isEn
        ? 'Relationship Graph & Narrative Timeline'
        : 'Grafo de Relações & Linha do Tempo',
    },
  ];

  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <BrainCircuit size={16} color={THEME_VAR.accentPrimary} />
        <span>
          {isEn
            ? 'Layered Memory, Epistemic Tracking & Canon Radar'
            : 'Memória em Camadas, Epistemologia & Radar de Cânone'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.enableMemoryCompiler}
            onChange={(e) => updateDraftSetting('enableMemoryCompiler', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Enable layered narrative memory compiler (Raw → Semantic Summaries → Canon)'
              : 'Habilitar compilador de memória narrativa em camadas (Bruto → Síntese → Cânone)'}
          </span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draftSettings.enableEpistemicTracking}
            onChange={(e) => updateDraftSetting('enableEpistemicTracking', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span>
            {isEn
              ? 'Enable epistemic separation tracking (Author vs. Reader vs. Character knowledge)'
              : 'Ativar rastreamento epistêmico (Autor vs. Leitor vs. Personagem por cena)'}
          </span>
        </label>
      </div>

      <label htmlFor="ink-canon-perm" style={{ ...fieldColumnStyle, maxWidth: 380 }}>
        <span style={fieldLabelTextStyle}>
          {isEn ? 'AI Canon Catalog Permission' : 'Permissão da IA no Radar de Cânone'}
        </span>
        <select
          id="ink-canon-perm"
          value={draftSettings.canonAiPermission}
          onChange={(e) =>
            updateDraftSetting('canonAiPermission', e.target.value as CanonAiPermission)
          }
          style={controlInputStyle}
        >
          <option value="observer">
            {isEn ? 'Observer Only (Read & Highlight)' : 'Somente Visão / Observador'}
          </option>
          <option value="staging">
            {isEn ? 'Propose in Staging (Author Approves)' : 'Rascunho / Staging (Autor Aprova)'}
          </option>
          <option value="auto">
            {isEn ? 'Auto-Catalog Universe' : 'Auto-Catalogar Universo'}
          </option>
        </select>
      </label>

      <fieldset
        style={{
          border: `1px solid ${THEME_VAR.borderSubtle}`,
          borderRadius: THEME_VAR.radiusSm,
          padding: '0.7rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <legend
          style={{
            fontSize: '0.76rem',
            fontWeight: 600,
            color: THEME_VAR.textSecondary,
            padding: '0 0.35rem',
          }}
        >
          {isEn ? 'Active Detection & Indexing Scopes' : 'Escopos Permitidos para Varredura'}
        </legend>

        {scopes.map((scope) => (
          <label key={scope.key} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings[scope.key]}
              onChange={(e) => updateDraftSetting(scope.key, e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>{scope.label}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
