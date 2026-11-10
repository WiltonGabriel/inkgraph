import { useState } from 'react';
import { Cpu, Server, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';

export function AiAndMcpSettingsTab() {
  const { settings, updateSettings } = useProject();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [connectionDetail, setConnectionDetail] = useState<string>('');
  const [mcpClientTarget, setMcpClientTarget] = useState<'antigravity' | 'claude' | 'codex'>('antigravity');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const isEn = settings.language === 'en';
  const isAiOff = settings.aiMode === 'off' || settings.aiMode === 'eco';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeChange = (mode: AppSettings['aiMode']) => {
    updateSettings((prev) => ({
      ...prev,
      aiMode: mode,
      copilotEnabled: mode === 'off' || mode === 'eco' ? false : prev.copilotEnabled,
      copilotHeuristicsOnly: mode === 'off' || mode === 'eco' || mode === 'local',
    }));
  };

  const handleTestConnection = async () => {
    if (isAiOff) {
      setConnectionStatus('idle');
      setConnectionDetail(isEn ? 'AI is currently disabled.' : 'A IA está desativada.');
      return;
    }

    if (settings.aiProvider === 'ollama' || settings.aiProvider === 'lmstudio') {
      setConnectionStatus('testing');
      setConnectionDetail('');
      try {
        const baseUrl = settings.ollamaUrl.replace(/\/+$/, '');
        const probePath = settings.aiProvider === 'lmstudio' ? '/v1/models' : '/api/tags';
        const res = await fetch(`${baseUrl}${probePath}`, { method: 'GET' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { models?: unknown[]; data?: unknown[] };
        const count = Array.isArray(data.models)
          ? data.models.length
          : Array.isArray(data.data)
            ? data.data.length
            : 0;
        setConnectionStatus('ok');
        setConnectionDetail(
          isEn ? `Reachable (${count} models listed)` : `Acessível (${count} modelos detectados)`
        );
      } catch (err) {
        setConnectionStatus('error');
        const msg = err instanceof Error ? err.message : String(err);
        setConnectionDetail(
          isEn
            ? `Unavailable (${msg}). Verify server or CORS.`
            : `Indisponível (${msg}). Verifique o servidor local.`
        );
      }
      return;
    }

    if (settings.aiProvider === 'mcp') {
      setConnectionStatus('ok');
      setConnectionDetail(
        isEn
          ? `MCP stdio ready · HTTP port ${settings.mcpServerPort}`
          : `MCP stdio pronto · Porta local ${settings.mcpServerPort}`
      );
      return;
    }

    if (!settings.geminiApiKey.trim()) {
      setConnectionStatus('error');
      setConnectionDetail(isEn ? 'API key is required for cloud providers.' : 'Informe uma chave de API.');
      return;
    }
    setConnectionStatus('ok');
    setConnectionDetail(isEn ? 'API key configured locally.' : 'Chave configurada localmente.');
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
              onChange={(e) => handleModeChange(e.target.value as AppSettings['aiMode'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="off">{isEn ? 'Off (Pure Studio — No AI)' : 'Desativado (Estúdio Puro Sem IA)'}</option>
              <option value="eco">{isEn ? 'Eco (Deterministic Audits Only)' : 'Eco (Apenas Auditoria Determinística)'}</option>
              <option value="local">{isEn ? 'Local Only (100% Offline)' : 'Apenas Local (100% Offline)'}</option>
              <option value="hybrid">{isEn ? 'Hybrid (BYOK + Local Fallback)' : 'Híbrido (BYOK + Fallback Local)'}</option>
              <option value="cloud">{isEn ? 'Cloud API (BYOK)' : 'API em Nuvem (BYOK)'}</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Primary Provider' : 'Provedor Principal'}
            </span>
            <select
              value={settings.aiProvider}
              onChange={(e) => setField('aiProvider', e.target.value as AppSettings['aiProvider'])}
              disabled={isAiOff}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.48rem 0.65rem',
                color: 'var(--text-primary)',
                opacity: isAiOff ? 0.55 : 1,
              }}
            >
              <option value="mcp">{isEn ? 'External Agents (MCP Hub)' : 'Agentes Externos (Hub MCP)'}</option>
              <option value="ollama">{isEn ? 'Local Server (Ollama)' : 'Servidor Local (Ollama)'}</option>
              <option value="lmstudio">{isEn ? 'Local Server (LM Studio / llama.cpp)' : 'Servidor Local (LM Studio / llama.cpp)'}</option>
              <option value="gemini">{isEn ? 'Cloud Provider (Gemini)' : 'Provedor em Nuvem (Gemini)'}</option>
              <option value="openai">{isEn ? 'Cloud Provider (OpenAI / Compatible)' : 'Provedor em Nuvem (OpenAI / Compatível)'}</option>
              <option value="anthropic">{isEn ? 'Cloud Provider (Claude / Anthropic)' : 'Provedor em Nuvem (Claude / Anthropic)'}</option>
              <option value="openrouter">{isEn ? 'Cloud Provider (OpenRouter)' : 'Provedor em Nuvem (OpenRouter)'}</option>
            </select>
          </label>
        </div>

        {isAiOff && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.55rem 0.75rem', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {isEn
              ? 'AI generation is disabled. Generative panels are hidden cleanly while graph, epistemic checks, Flesch critic, diffs, and exporters stay 100% active.'
              : 'IA generativa desativada. Painéis de geração ficam ocultos, mantendo grafo, auditoria epistêmica, crítico Flesch, diffs e exportação 100% ativos.'}
          </div>
        )}

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
            {connectionStatus === 'error' && <AlertCircle size={14} color="#f59e0b" />}
            {connectionStatus === 'testing'
              ? isEn
                ? 'Testing...'
                : 'Verificando...'
              : connectionStatus === 'ok'
                ? isEn
                  ? 'Connected'
                  : 'Conexão ativa'
                : connectionStatus === 'error'
                  ? isEn
                    ? 'Retry Test'
                    : 'Tentar Novamente'
                  : isEn
                    ? 'Test Connection'
                    : 'Testar Conexão'}
          </button>
        </div>
        {connectionDetail && (
          <div style={{ fontSize: '0.76rem', color: connectionStatus === 'error' ? '#fbbf24' : '#34d399' }}>
            {connectionDetail}
          </div>
        )}
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

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'External Agent Write Governance (Antigravity / Claude / Codex)' : 'Governança de Escrita MCP (Antigravity / Claude / Codex)'}
          </span>
          <select
            value={settings.mcpGovernance}
            onChange={(e) => setField('mcpGovernance', e.target.value as AppSettings['mcpGovernance'])}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.45rem 0.65rem',
              color: 'var(--text-primary)',
            }}
          >
            <option value="staging_strict">
              {isEn
                ? 'Strict Staging (Recommended) — agents write only to staging/'
                : 'Staging Estrito (Recomendado) — agentes gravam apenas em staging/'}
            </option>
            <option value="draft_copilot">
              {isEn
                ? 'Direct Draft Copilot — allows direct edits on draft scenes with expected_version + Undo'
                : 'Copiloto Direto em Rascunhos — permite editar cenas draft com expected_version + Desfazer'}
            </option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isEn ? 'Optional HTTP Bearer Token (LAN / Streamable HTTP /mcp)' : 'Token Bearer Opcional (HTTP /mcp & Sync LAN)'}
          </span>
          <input
            type="password"
            value={settings.mcpToken}
            onChange={(e) => setField('mcpToken', e.target.value)}
            placeholder={isEn ? 'Leave empty for loopback-only, or set a pairing token...' : 'Opcional — defina um segredo para autenticar chamadas HTTP /mcp'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.45rem 0.65rem',
              color: 'var(--text-primary)',
            }}
          />
        </label>

        {/* Gerador Automático de Config MCP */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              {isEn ? 'Agent Config Generator' : 'Snippet de Configuração para Agentes'}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['antigravity', 'claude', 'codex'] as const).map((client) => (
                <button
                  key={client}
                  type="button"
                  onClick={() => setMcpClientTarget(client)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: mcpClientTarget === client ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: mcpClientTarget === client ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {client === 'antigravity' ? 'Antigravity' : client === 'claude' ? 'Claude' : 'Codex CLI'}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const snippet =
              mcpClientTarget === 'codex'
                ? `[mcp_servers.inkgraph]\ncommand = "pnpm"\nargs = ["--filter", "@inkgraph/mcp", "start"]\n[mcp_servers.inkgraph.env]\nINKGRAPH_MCP_GOVERNANCE = "${settings.mcpGovernance}"\nINKGRAPH_MCP_PORT = "${settings.mcpServerPort}"`
                : JSON.stringify(
                    {
                      mcpServers: {
                        inkgraph: {
                          command: 'pnpm',
                          args: ['--filter', '@inkgraph/mcp', 'start'],
                          env: {
                            INKGRAPH_MCP_GOVERNANCE: settings.mcpGovernance,
                            INKGRAPH_MCP_HTTP: '1',
                            INKGRAPH_MCP_PORT: String(settings.mcpServerPort),
                            ...(settings.mcpToken ? { INKGRAPH_MCP_TOKEN: settings.mcpToken } : {}),
                          },
                        },
                      },
                    },
                    null,
                    2
                  );
            return (
              <>
                <pre style={{ background: '#070a10', border: '1px solid var(--border)', borderRadius: 5, padding: '0.6rem', fontSize: '0.72rem', fontFamily: 'monospace', overflowX: 'auto', margin: 0, color: '#cbd5e1' }}>
                  {snippet}
                </pre>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(snippet);
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 1600);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.74rem',
                      color: copiedSnippet ? '#34d399' : 'var(--text-primary)',
                    }}
                  >
                    {copiedSnippet ? (isEn ? 'Copied' : 'Copiado') : isEn ? 'Copy Snippet' : 'Copiar Configuração'}
                  </button>
                </div>
              </>
            );
          })()}
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
