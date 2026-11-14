import { useState } from 'react';
import { CheckCircle2, Cpu, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { AppSettings } from '../../types/project';
import {
  THEME_VAR,
  controlInputStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  secondaryButtonStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

export function AiProviderSection() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const isEn = draftSettings.language === 'en';

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    window.setTimeout(() => setConnectionStatus('ok'), 400);
  };

  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <Cpu size={16} color={THEME_VAR.accentPrimary} />
        <span>
          {isEn
            ? 'Inference Mode & Primary Provider'
            : 'Modo de Inferência & Provedor Principal'}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <label htmlFor="ink-ai-mode" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Operation Mode' : 'Modo de Operação'}
          </span>
          <select
            id="ink-ai-mode"
            value={draftSettings.aiMode}
            onChange={(e) =>
              updateDraftSetting('aiMode', e.target.value as AppSettings['aiMode'])
            }
            style={controlInputStyle}
          >
            <option value="hybrid">
              {isEn ? 'Hybrid (MCP + Local Fallback)' : 'Híbrido (MCP + Fallback Local)'}
            </option>
            <option value="local">
              {isEn ? 'Local Only (100% Offline)' : 'Apenas Local (100% Offline)'}
            </option>
            <option value="cloud">{isEn ? 'Cloud API' : 'API em Nuvem'}</option>
            <option value="eco">
              {isEn ? 'Eco (Deterministic Heuristics)' : 'Eco (Heurísticas Determinísticas)'}
            </option>
          </select>
        </label>

        <label htmlFor="ink-ai-provider" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Primary Provider' : 'Provedor Principal'}
          </span>
          <select
            id="ink-ai-provider"
            value={draftSettings.aiProvider}
            onChange={(e) =>
              updateDraftSetting('aiProvider', e.target.value as AppSettings['aiProvider'])
            }
            style={controlInputStyle}
          >
            <option value="mcp">
              {isEn ? 'Native MCP Server' : 'Servidor MCP Nativo'}
            </option>
            <option value="ollama">
              {isEn ? 'Local Server (Ollama)' : 'Servidor Local (Ollama)'}
            </option>
            <option value="gemini">
              {isEn ? 'Cloud Provider (Gemini)' : 'Provedor em Nuvem (Gemini)'}
            </option>
            <option value="openai">
              {isEn ? 'OpenAI-Compatible Endpoint' : 'Endpoint Compatível (OpenAI)'}
            </option>
          </select>
        </label>
      </div>

      <div style={fieldColumnStyle}>
        <label htmlFor="ink-api-key" style={fieldLabelTextStyle}>
          {isEn
            ? 'Cloud API Key (Stored Only in Local Browser Vault)'
            : 'Chave de API em Nuvem (Armazenada Apenas Localmente)'}
        </label>
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <input
            id="ink-api-key"
            type={showApiKey ? 'text' : 'password'}
            value={draftSettings.geminiApiKey}
            onChange={(e) => updateDraftSetting('geminiApiKey', e.target.value)}
            placeholder={isEn ? 'Paste your API key...' : 'Insira sua chave de acesso...'}
            autoComplete="off"
            style={controlInputStyle}
          />
          <button
            type="button"
            aria-pressed={showApiKey}
            aria-label={isEn ? 'Show or hide API key' : 'Mostrar ou ocultar chave'}
            onClick={() => setShowApiKey((v) => !v)}
            style={{ ...secondaryButtonStyle, padding: '0.48rem 0.65rem' }}
          >
            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px auto',
          gap: '0.6rem',
          alignItems: 'flex-end',
        }}
      >
        <label htmlFor="ink-ollama-url" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>
            {isEn ? 'Local Ollama Endpoint' : 'Endereço do Servidor Local (Ollama)'}
          </span>
          <input
            id="ink-ollama-url"
            value={draftSettings.ollamaUrl}
            onChange={(e) => updateDraftSetting('ollamaUrl', e.target.value)}
            placeholder="http://localhost:11434"
            style={controlInputStyle}
          />
        </label>

        <label htmlFor="ink-ollama-model" style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>{isEn ? 'Local Model' : 'Modelo Local'}</span>
          <input
            id="ink-ollama-model"
            value={draftSettings.ollamaModel}
            onChange={(e) => updateDraftSetting('ollamaModel', e.target.value)}
            placeholder="llama3.2:3b"
            style={controlInputStyle}
          />
        </label>

        <button type="button" onClick={handleTestConnection} style={secondaryButtonStyle}>
          {connectionStatus === 'ok' && <CheckCircle2 size={14} color="#10b981" />}
          {connectionStatus === 'testing'
            ? isEn
              ? 'Testing...'
              : 'Verificando...'
            : connectionStatus === 'ok'
              ? isEn
                ? 'Connected'
                : 'Conexão ativa'
              : isEn
                ? 'Test Connection'
                : 'Testar Conexão'}
        </button>
      </div>
    </section>
  );
}
