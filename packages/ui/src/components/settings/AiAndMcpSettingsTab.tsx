import { useState } from 'react';
import { Cpu, Server, Sparkles, CheckCircle2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';

export function AiAndMcpSettingsTab() {
  const { settings, updateSettings } = useProject();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok'>('idle');
  const isEn = settings.language === 'en';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => setConnectionStatus('ok'), 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Provedor & Modo de Operação */}
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
          <Cpu size={16} color="var(--accent)" />
          <span>{isEn ? 'Inference Mode & Primary Provider' : 'Modo de Inferência & Provedor Principal'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Operation Mode' : 'Modo de Operação'}
            </span>
            <select
              value={settings.aiMode}
              onChange={(e) => setField('aiMode', e.target.value as AppSettings['aiMode'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="hybrid">{isEn ? 'Hybrid (MCP + Local Fallback)' : 'Híbrido (MCP + Fallback Local)'}</option>
              <option value="local">{isEn ? 'Local Only (100% Offline)' : 'Apenas Local (100% Offline)'}</option>
              <option value="cloud">{isEn ? 'Cloud API' : 'API em Nuvem'}</option>
              <option value="eco">{isEn ? 'Eco (Deterministic Heuristics)' : 'Eco (Heurísticas Determinísticas)'}</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Primary Provider' : 'Provedor Principal'}
            </span>
            <select
              value={settings.aiProvider}
              onChange={(e) => setField('aiProvider', e.target.value as AppSettings['aiProvider'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="mcp">{isEn ? 'Native MCP Server' : 'Servidor MCP Nativo'}</option>
              <option value="ollama">{isEn ? 'Local Server (Ollama)' : 'Servidor Local (Ollama)'}</option>
              <option value="gemini">{isEn ? 'Cloud Provider (Gemini)' : 'Provedor em Nuvem (Gemini)'}</option>
              <option value="openai">{isEn ? 'OpenAI-Compatible Endpoint' : 'Endpoint Compatível (OpenAI)'}</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Cloud API Key (Stored Only in Local Browser Vault)' : 'Chave de API em Nuvem (Armazenada Apenas Localmente)'}
          </span>
          <input
            type="password"
            value={settings.geminiApiKey}
            onChange={(e) => setField('geminiApiKey', e.target.value)}
            placeholder={isEn ? 'Paste your API key...' : 'Insira sua chave de acesso...'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.48rem 0.65rem',
              color: 'var(--text-primary)',
            }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: '0.6rem', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Local Ollama Endpoint' : 'Endereço do Servidor Local (Ollama)'}
            </span>
            <input
              value={settings.ollamaUrl}
              onChange={(e) => setField('ollamaUrl', e.target.value)}
              placeholder="http://localhost:11434"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Local Model' : 'Modelo Local'}
            </span>
            <input
              value={settings.ollamaModel}
              onChange={(e) => setField('ollamaModel', e.target.value)}
              placeholder="llama3.2:3b"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <button
            onClick={handleTestConnection}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.5rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
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
      </div>

      {/* Servidor MCP Nativo */}
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
          <Server size={16} color="#10b981" />
          <span>{isEn ? 'Native Model Context Protocol (MCP) Server' : 'Servidor Model Context Protocol (MCP) Nativo'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Streamable HTTP / SSE Port' : 'Porta HTTP / SSE do Servidor MCP'}
            </span>
            <input
              type="number"
              min={1024}
              max={65535}
              value={settings.mcpServerPort}
              onChange={(e) => setField('mcpServerPort', Number(e.target.value))}
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
              checked={settings.mcpAutoSyncVault}
              onChange={(e) => setField('mcpAutoSyncVault', e.target.checked)}
            />
            <span>
              {isEn
                ? 'Auto-sync ./workspace/ Markdown vault with SQLite FTS5 index'
                : 'Sincronizar cofre Markdown ./workspace/ com índice SQLite FTS5'}
            </span>
          </label>
        </div>
      </div>

      {/* Parâmetros de Geração & Copiloto */}
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
          <Sparkles size={16} color="var(--accent)" />
          <span>{isEn ? 'Generation Parameters & Copilot' : 'Parâmetros de Geração & Copiloto'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Creative Temperature' : 'Temperatura Criativa'}: <strong>{settings.aiTemperature.toFixed(1)}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={settings.aiTemperature}
              onChange={(e) => setField('aiTemperature', Number(e.target.value))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Max Output Tokens' : 'Limite Máximo de Tokens'}: <strong>{settings.aiMaxTokens}</strong>
            </span>
            <select
              value={settings.aiMaxTokens}
              onChange={(e) => setField('aiMaxTokens', Number(e.target.value))}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
              }}
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.copilotEnabled}
              onChange={(e) => setField('copilotEnabled', e.target.checked)}
            />
            <span>{isEn ? 'Enable lateral Copilot assistant' : 'Habilitar assistente Copiloto lateral'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.copilotHeuristicsOnly}
              onChange={(e) => setField('copilotHeuristicsOnly', e.target.checked)}
            />
            <span>
              {isEn
                ? 'Strict Offline Heuristics Mode (never send prompts to external servers)'
                : 'Modo Estrito de Heurísticas Offline (nunca enviar prompts a servidores externos)'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
