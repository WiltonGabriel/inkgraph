import { useMemo, useState } from 'react';
import { Bot, Check, Copy, Download, Shield, Terminal, Cpu } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { buildWorkspaceSystemPrompt } from '../../domain/memoryCompiler';
import type { WorkspaceAgentConfig } from '../../types/project';
import {
  sectionCardStyle,
  innerCardStyle,
  sectionHeaderStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  controlInputStyle,
  secondaryButtonStyle,
  primaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

const MCP_TOOLS_CATALOG = [
  { name: 'list_entities', desc: 'Lista e filtra entidades do cofre por tipo, status ou tag.' },
  { name: 'get_entity', desc: 'Resolve ID exato ou alias para o dossiê completo em Markdown/YAML.' },
  { name: 'search_lore', desc: 'Busca indexada (FTS5 ou exata) no cânone e custom_attributes.' },
  { name: 'query_epistemic_state', desc: 'Consulta quem sabe o quê e segredos até determinada cena.' },
  { name: 'get_timeline', desc: 'Retorna ordem causal de cenas, revelações e transições.' },
  { name: 'get_relationships', desc: 'Retorna o grafo de alianças, rivalidades e vínculos estruturais.' },
  { name: 'propose_lore', desc: 'Escreve nova ficha ou atualização de lore em workspace/staging/.' },
  { name: 'propose_scene', desc: 'Cria proposta de cena em workspace/staging/ preservando o cânone.' },
];

const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "inkgraph": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": {
        "INKGRAPH_WORKSPACE": "./workspace"
      }
    }
  }
}`;

export function WorkspaceAdvancedAiTab() {
  const { project, updateWorkspaceConfig, notify } = useProject();
  const [copiedKey, setCopiedKey] = useState<'prompt' | 'mcp' | null>(null);

  const agentConfig: WorkspaceAgentConfig = project.workspaceConfig?.agentConfig ?? {
    customSystemPrompt:
      'Atue como editor literário e guardião de cânone do InkGraph. Respeite continuidade epistêmica e proponha mudanças via Staging.',
    writingVoiceAndTone: 'Literário em Português, coerente com o gênero da obra.',
    autoInjectEntitySchemasInPrompt: true,
    autoInjectCanonRulesInPrompt: true,
    allowedAiCapabilities: {
      readCanonAndEpistemic: true,
      proposeStaging: true,
      directDraftEdits: true,
      analyzeConsistency: true,
    },
    externalIntegrations: {
      mcpTransportEnabled: true,
      preferredModelLabel: 'Local / MCP Stdio',
      webhookOrEndpointUrl: '',
    },
  };

  const updateAgent = (updater: (prev: WorkspaceAgentConfig) => WorkspaceAgentConfig) => {
    updateWorkspaceConfig((cfg) => ({
      ...cfg,
      agentConfig: updater(cfg.agentConfig ?? agentConfig),
    }));
  };

  const compiledSystemPrompt = useMemo(
    () => buildWorkspaceSystemPrompt(project),
    [project]
  );

  const handleCopy = async (text: string, kind: 'prompt' | 'mcp', message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(kind);
      setTimeout(() => setCopiedKey(null), 1800);
      notify(message, 'success');
    } catch {
      notify('Não foi possível copiar automaticamente neste navegador.', 'warning');
    }
  };

  const handleExportContract = () => {
    const payload = {
      format: 'inkgraph-agent-contract',
      exportedAt: new Date().toISOString(),
      projectTitle: project.title,
      systemPrompt: compiledSystemPrompt,
      entitySchemas: project.workspaceConfig?.entitySchemas ?? {},
      canonSettings: project.workspaceConfig?.canonSettings ?? {},
      agentConfig,
      mcpTools: MCP_TOOLS_CATALOG,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'inkgraph'}-agent-contract.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Contrato de esquema + System Prompt exportado em JSON.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Bot size={16} style={{ color: THEME_VAR.accentPrimary }} />
          System Prompt & Diretrizes do Agente IA
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: THEME_VAR.textSecondary, lineHeight: 1.5 }}>
          Defina o comportamento base do Copiloto e de agentes externos conectados via MCP. Ao alterar entidades ou campos na aba{' '}
          <strong style={{ color: THEME_VAR.textPrimary }}>Entidades & Campos</strong>, o contrato é atualizado dinamicamente abaixo sem quebrar o cofre ou a sincronização.
        </p>

        <label style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>System Prompt Base do Workspace</span>
          <textarea
            rows={4}
            value={agentConfig.customSystemPrompt}
            onChange={(e) =>
              updateAgent((prev) => ({ ...prev, customSystemPrompt: e.target.value }))
            }
            placeholder="Instruções centrais de estilo, restrições de cânone, postura narrativa..."
            style={{ ...controlInputStyle, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>

        <label style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>Voz Narrativa & Registro de Idioma</span>
          <input
            value={agentConfig.writingVoiceAndTone}
            onChange={(e) =>
              updateAgent((prev) => ({ ...prev, writingVoiceAndTone: e.target.value }))
            }
            placeholder="Ex: Terceira pessoa limitada, prosa enxuta e atmosférica em PT-BR..."
            style={controlInputStyle}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: THEME_VAR.textPrimary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={agentConfig.autoInjectEntitySchemasInPrompt}
              onChange={(e) =>
                updateAgent((prev) => ({
                  ...prev,
                  autoInjectEntitySchemasInPrompt: e.target.checked,
                }))
              }
            />
            Injetar esquema vivo de entidades e campos customizados no System Prompt
          </label>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: THEME_VAR.textPrimary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={agentConfig.autoInjectCanonRulesInPrompt}
              onChange={(e) =>
                updateAgent((prev) => ({
                  ...prev,
                  autoInjectCanonRulesInPrompt: e.target.checked,
                }))
              }
            />
            Injetar regras de Atos, Cânone e frontreira epistêmica
          </label>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Shield size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Permissões Granulares do Agente
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {(
            [
              {
                key: 'readCanonAndEpistemic',
                label: 'Ler Cânone & Estado Epistêmico',
                desc: 'Permite indexar dossiês e segredos nas 4 camadas de memória.',
              },
              {
                key: 'proposeStaging',
                label: 'Propor Alterações em Staging',
                desc: 'Cria rascunhos revisáveis sem tocar arquivos canônicos.',
              },
              {
                key: 'directDraftEdits',
                label: 'Inserir em Rascunho com Snapshot',
                desc: 'Permite aplicar sugestões do Copiloto após criar ponto de restauração.',
              },
              {
                key: 'analyzeConsistency',
                label: 'Executar Radar de Cânone & Auditoria',
                desc: 'Verifica contradições, regras de plugins e vazamentos epistêmicos.',
              },
            ] as const
          ).map((item) => {
            const active = agentConfig.allowedAiCapabilities[item.key];
            return (
              <label
                key={item.key}
                style={{
                  ...innerCardStyle,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    updateAgent((prev) => ({
                      ...prev,
                      allowedAiCapabilities: {
                        ...prev.allowedAiCapabilities,
                        [item.key]: e.target.checked,
                      },
                    }))
                  }
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME_VAR.textPrimary }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: THEME_VAR.textSecondary, marginTop: 2 }}>
                    {item.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={sectionHeaderStyle}>
            <Terminal size={16} style={{ color: THEME_VAR.accentPrimary }} />
            System Prompt Compilado (Ao Vivo)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() =>
                void handleCopy(
                  compiledSystemPrompt,
                  'prompt',
                  'System Prompt completo copiado para a área de transferência.'
                )
              }
              style={primaryButtonStyle}
            >
              {copiedKey === 'prompt' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'prompt' ? 'Copiado' : 'Copiar System Prompt'}
            </button>
            <button type="button" onClick={handleExportContract} style={secondaryButtonStyle}>
              <Download size={13} /> Exportar Contrato JSON
            </button>
          </div>
        </div>

        <pre
          style={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: THEME_VAR.radiusSm,
            backgroundColor: THEME_VAR.bgSurface,
            border: `1px solid ${THEME_VAR.borderSubtle}`,
            color: THEME_VAR.textPrimary,
            fontSize: 11.5,
            lineHeight: 1.5,
            maxHeight: 240,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {compiledSystemPrompt}
        </pre>
      </section>

      <section style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={sectionHeaderStyle}>
            <Cpu size={16} style={{ color: THEME_VAR.accentPrimary }} />
            Integrações Técnicas & Servidor MCP (@inkgraph/mcp)
          </div>
          <button
            type="button"
            onClick={() =>
              void handleCopy(
                MCP_CONFIG_SNIPPET,
                'mcp',
                'Configuração MCP copiada para uso em clientes stdio.'
              )
            }
            style={secondaryButtonStyle}
          >
            {copiedKey === 'mcp' ? <Check size={13} /> : <Copy size={13} />}
            Copiar mcp_config.json
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Perfil / Runtime Preferido</span>
            <input
              value={agentConfig.externalIntegrations.preferredModelLabel}
              onChange={(e) =>
                updateAgent((prev) => ({
                  ...prev,
                  externalIntegrations: {
                    ...prev.externalIntegrations,
                    preferredModelLabel: e.target.value,
                  },
                }))
              }
              placeholder="Ex: Local / Ollama / MCP Stdio"
              style={controlInputStyle}
            />
          </label>

          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Endpoint / Webhook Local (Opcional)</span>
            <input
              value={agentConfig.externalIntegrations.webhookOrEndpointUrl ?? ''}
              onChange={(e) =>
                updateAgent((prev) => ({
                  ...prev,
                  externalIntegrations: {
                    ...prev.externalIntegrations,
                    webhookOrEndpointUrl: e.target.value,
                  },
                }))
              }
              placeholder="Ex: http://localhost:11434"
              style={controlInputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
          {MCP_TOOLS_CATALOG.map((tool) => (
            <div
              key={tool.name}
              style={{
                padding: '7px 10px',
                borderRadius: THEME_VAR.radiusSm,
                backgroundColor: THEME_VAR.bgSurface,
                border: `1px solid ${THEME_VAR.borderSubtle}`,
              }}
            >
              <code style={{ fontSize: 11.5, fontWeight: 700, color: THEME_VAR.accentPrimary }}>
                {tool.name}
              </code>
              <div style={{ fontSize: 11, color: THEME_VAR.textSecondary, marginTop: 2 }}>
                {tool.desc}
              </div>
            </div>
          ))}
        </div>

        <pre
          style={{
            margin: 0,
            padding: '10px 12px',
            borderRadius: THEME_VAR.radiusSm,
            backgroundColor: THEME_VAR.bgSurface,
            border: `1px solid ${THEME_VAR.borderSubtle}`,
            color: THEME_VAR.textSecondary,
            fontSize: 11.5,
            overflowX: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {MCP_CONFIG_SNIPPET}
        </pre>
      </section>
    </div>
  );
}
