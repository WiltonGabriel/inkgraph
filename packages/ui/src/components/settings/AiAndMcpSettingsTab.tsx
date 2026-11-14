import { Server, Sparkles } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { AiCanonAndMemorySection } from './AiCanonAndMemorySection';
import { AiProviderSection } from './AiProviderSection';
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

export function AiAndMcpSettingsTab() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AiProviderSection />

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Server size={16} color="#10b981" />
          <span>
            {isEn
              ? 'Native Model Context Protocol (MCP) Server'
              : 'Servidor Model Context Protocol (MCP) Nativo'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center',
          }}
        >
          <label htmlFor="ink-mcp-port" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Streamable HTTP / SSE Port' : 'Porta HTTP / SSE do Servidor MCP'}
            </span>
            <input
              id="ink-mcp-port"
              type="number"
              min={1024}
              max={65535}
              value={draftSettings.mcpServerPort}
              onChange={(e) => updateDraftSetting('mcpServerPort', Number(e.target.value))}
              style={controlInputStyle}
            />
          </label>

          <label style={{ ...checkboxLabelStyle, paddingTop: '1rem' }}>
            <input
              type="checkbox"
              checked={draftSettings.mcpAutoSyncVault}
              onChange={(e) => updateDraftSetting('mcpAutoSyncVault', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn
                ? 'Auto-sync ./workspace/ Markdown vault with SQLite FTS5 index'
                : 'Sincronizar cofre Markdown ./workspace/ com índice SQLite FTS5'}
            </span>
          </label>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Sparkles size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn ? 'Generation Parameters & Copilot' : 'Parâmetros de Geração & Copiloto'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <label htmlFor="ink-ai-temp" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Creative Temperature' : 'Temperatura Criativa'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.aiTemperature.toFixed(1)}
              </strong>
            </span>
            <input
              id="ink-ai-temp"
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={draftSettings.aiTemperature}
              onChange={(e) => updateDraftSetting('aiTemperature', Number(e.target.value))}
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>

          <label htmlFor="ink-ai-tokens" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Max Output Tokens' : 'Limite Máximo de Tokens'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.aiMaxTokens}
              </strong>
            </span>
            <select
              id="ink-ai-tokens"
              value={draftSettings.aiMaxTokens}
              onChange={(e) => updateDraftSetting('aiMaxTokens', Number(e.target.value))}
              style={controlInputStyle}
            >
              <option value={512}>512 tokens</option>
              <option value={1024}>1024 tokens</option>
              <option value={2048}>2048 tokens</option>
              <option value={4096}>4096 tokens</option>
              <option value={8192}>8192 tokens</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings.copilotEnabled}
              onChange={(e) => updateDraftSetting('copilotEnabled', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn ? 'Enable lateral Copilot assistant' : 'Habilitar assistente Copiloto lateral'}
            </span>
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={draftSettings.copilotHeuristicsOnly}
              onChange={(e) => updateDraftSetting('copilotHeuristicsOnly', e.target.checked)}
              style={checkboxInputStyle}
            />
            <span>
              {isEn
                ? 'Strict Offline Heuristics Mode (never send prompts to external servers)'
                : 'Modo Estrito de Heurísticas Offline (nunca enviar prompts a servidores externos)'}
            </span>
          </label>
        </div>
      </section>

      <AiCanonAndMemorySection />
    </div>
  );
}
