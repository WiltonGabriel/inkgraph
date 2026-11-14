import type { AppSettings } from '../types/project';

export interface AiAvailabilityStatus {
  connected: boolean;
  provider: AppSettings['aiProvider'];
  mode: AppSettings['aiMode'];
  modeLabel: string;
  reasonPt: string;
  reasonEn: string;
}

export function checkAiAvailability(settings: AppSettings): AiAvailabilityStatus {
  const isLocalHeuristicForced =
    !settings.copilotEnabled || settings.aiMode === 'eco' || settings.copilotHeuristicsOnly;

  if (isLocalHeuristicForced) {
    return {
      connected: false,
      provider: settings.aiProvider,
      mode: settings.aiMode,
      modeLabel: settings.aiMode === 'eco' ? 'Modo Eco (Heurísticas)' : 'Modo Offline / Heurístico',
      reasonPt:
        'Nenhuma IA generativa ativa (Modo Eco ou Apenas Heurística). Ative um provedor em Configurações → IA & Servidor MCP.',
      reasonEn:
        'No generative AI active (Eco or Heuristics-Only mode). Enable a provider in Settings → AI & MCP Server.',
    };
  }

  const hasCloudKey = settings.geminiApiKey.trim().length > 0;
  const hasOllamaConfig =
    settings.ollamaUrl.trim().length > 0 &&
    settings.ollamaModel.trim().length > 0 &&
    (settings.aiMode === 'local' || settings.aiMode === 'hybrid');

  if (settings.aiProvider === 'gemini' || settings.aiProvider === 'openai') {
    if (hasCloudKey) {
      return {
        connected: true,
        provider: settings.aiProvider,
        mode: settings.aiMode,
        modeLabel:
          settings.aiProvider === 'gemini' ? 'Provedor em Nuvem (Gemini)' : 'Endpoint OpenAI',
        reasonPt: 'Chave de API configurada localmente no navegador.',
        reasonEn: 'API key configured locally in browser.',
      };
    }
    return {
      connected: false,
      provider: settings.aiProvider,
      mode: settings.aiMode,
      modeLabel: 'Sem chave de API',
      reasonPt:
        'Nenhuma IA conectada. Adicione uma chave de API em Configurações → IA & Servidor MCP ou conecte um modelo Ollama local.',
      reasonEn:
        'No AI connected. Add an API key in Settings → AI & MCP Server or connect a local Ollama model.',
    };
  }

  if (settings.aiProvider === 'ollama') {
    if (hasOllamaConfig) {
      return {
        connected: true,
        provider: 'ollama',
        mode: settings.aiMode,
        modeLabel: `Ollama Local (${settings.ollamaModel.trim()})`,
        reasonPt: `Endpoint local configurado em ${settings.ollamaUrl.trim()}.`,
        reasonEn: `Local endpoint configured at ${settings.ollamaUrl.trim()}.`,
      };
    }
    return {
      connected: false,
      provider: 'ollama',
      mode: settings.aiMode,
      modeLabel: 'Ollama incompleto',
      reasonPt:
        'Nenhuma IA conectada. Informe o endereço e o modelo Ollama em Configurações → IA & Servidor MCP.',
      reasonEn:
        'No AI connected. Provide the local Ollama URL and model in Settings → AI & MCP Server.',
    };
  }

  if (hasCloudKey) {
    return {
      connected: true,
      provider: 'mcp',
      mode: settings.aiMode,
      modeLabel: 'MCP + Provedor em Nuvem',
      reasonPt: 'Servidor MCP nativo e chave de API prontos.',
      reasonEn: 'Native MCP server and API key ready.',
    };
  }

  return {
    connected: false,
    provider: 'mcp',
    mode: settings.aiMode,
    modeLabel: 'Sem IA conectada',
    reasonPt:
      'Nenhuma IA conectada. Configure uma chave de API ou modelo local em Configurações → IA & Servidor MCP para usar recursos generativos.',
    reasonEn:
      'No AI connected. Configure an API key or local model in Settings → AI & MCP Server to use generative features.',
  };
}
