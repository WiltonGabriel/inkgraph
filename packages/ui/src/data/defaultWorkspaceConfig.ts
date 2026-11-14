import type {
  ActDefinition,
  EntityTypeDefinition,
  InkGraphPluginManifest,
  WorkspaceConfig,
} from '../types/project';

export const DEFAULT_ACTS: ActDefinition[] = [
  {
    number: 1,
    title: 'Ato I — Apresentação e Incidente',
    color: '#6366f1',
    description: 'Estabelecimento do mundo, status quo, promessa e incidente incitante.',
  },
  {
    number: 2,
    title: 'Ato II — Confronto e Escalonamento',
    color: '#8b5cf6',
    description: 'Desenvolvimento dos conflitos, ponto médio, reviravoltas e crise.',
  },
  {
    number: 3,
    title: 'Ato III — Clímax e Resolução',
    color: '#ec4899',
    description: 'Confronto final, pagamento das promessas e novo equilíbrio.',
  },
];

export const BUILTIN_ENTITY_SCHEMAS: Record<string, EntityTypeDefinition> = {
  character: {
    id: 'character',
    label: 'Personagem',
    pluralLabel: 'Personagens',
    iconName: 'Users',
    color: '#6366f1',
    isBuiltin: true,
    builtinTarget: 'character',
    mentionPrefix: '@',
    hiddenNativeFields: [],
    customFields: [],
  },
  faction: {
    id: 'faction',
    label: 'Facção',
    pluralLabel: 'Facções',
    iconName: 'Shield',
    color: '#f59e0b',
    isBuiltin: true,
    builtinTarget: 'faction',
    mentionPrefix: '@',
    hiddenNativeFields: [],
    customFields: [],
  },
  location: {
    id: 'location',
    label: 'Local',
    pluralLabel: 'Locais',
    iconName: 'MapPin',
    color: '#10b981',
    isBuiltin: true,
    builtinTarget: 'location',
    mentionPrefix: '@',
    hiddenNativeFields: [],
    customFields: [],
  },
  rule_system: {
    id: 'rule_system',
    label: 'Sistema / Lei',
    pluralLabel: 'Sistemas e Leis',
    iconName: 'Sparkles',
    color: '#8b5cf6',
    isBuiltin: true,
    builtinTarget: 'rule_system',
    mentionPrefix: '@',
    hiddenNativeFields: [],
    customFields: [],
  },
  object: {
    id: 'object',
    label: 'Objeto',
    pluralLabel: 'Objetos e Artefatos',
    iconName: 'Package',
    color: '#ec4899',
    isBuiltin: true,
    builtinTarget: 'object',
    mentionPrefix: '@',
    hiddenNativeFields: [],
    customFields: [],
  },
};

export const BUILTIN_DECLARATIVE_PLUGINS: InkGraphPluginManifest[] = [
  {
    id: 'plugin_litrpg_stats',
    name: 'Ficha RPG / Progressão',
    version: '1.0.0',
    description:
      'Adiciona atributos de nível, classe e mana aos personagens, além da entidade Classes/Habilidades e snippet de caixa de status.',
    author: 'InkGraph',
    enabled: false,
    isBuiltinSample: true,
    entityTypes: [
      {
        id: 'skill_ability',
        label: 'Habilidade',
        pluralLabel: 'Habilidades & Magias',
        iconName: 'Zap',
        color: '#06b6d4',
        isBuiltin: false,
        mentionPrefix: '@',
        hiddenNativeFields: [],
        sourcePluginId: 'plugin_litrpg_stats',
        customFields: [
          {
            key: 'rank',
            label: 'Grau / Tier',
            type: 'select',
            options: ['F', 'E', 'D', 'C', 'B', 'A', 'S'],
            completenessWeight: 5,
            includeInMemory: true,
          },
          {
            key: 'mana_cost',
            label: 'Custo / Desgaste',
            type: 'text',
            placeholder: 'Ex: 20 de Éter / 1 turno',
            includeInMemory: true,
          },
          {
            key: 'cooldown',
            label: 'Recarga / Limitação',
            type: 'text',
            placeholder: 'Ex: 1 vez por lua',
          },
        ],
      },
    ],
    fieldExtensions: [
      {
        targetType: 'character',
        fields: [
          {
            key: 'rpg_class',
            label: 'Classe / Arquétipo de Combate',
            type: 'text',
            group: 'Ficha RPG',
            placeholder: 'Ex: Arcanista de Ferro',
            completenessWeight: 4,
            includeInMemory: true,
          },
          {
            key: 'rpg_level',
            label: 'Nível Atual',
            type: 'number',
            group: 'Ficha RPG',
            includeInMemory: true,
          },
          {
            key: 'rpg_affinity',
            label: 'Afinidade Elemental / Técnica',
            type: 'tags',
            group: 'Ficha RPG',
            includeInMemory: true,
          },
        ],
      },
    ],
    snippets: [
      {
        id: 'litrpg_status_box',
        label: 'Caixa de Status',
        description: 'Bloco Markdown estruturado para exibição de ficha em cena.',
        markdown:
          '> **[STATUS — Nome]**  \n> Nível: `1` · Classe: `Iniciado`  \n> Atributos: Vigor `10` | Mente `12` | Éter `8`\n',
      },
    ],
    consistencyRules: [
      {
        id: 'litrpg_placeholder_status',
        title: 'Status RPG não preenchido',
        severity: 'warning',
        pattern: '\\[STATUS — Nome\\]',
        message: 'Há uma caixa de status modelo ainda sem o nome do personagem preenchido.',
        target: 'scenes',
      },
    ],
    settingsSchema: [
      {
        key: 'maxLevel',
        label: 'Nível Máximo do Sistema',
        type: 'number',
        placeholder: '100',
      },
    ],
    settingsValues: { maxLevel: 100 },
  },
  {
    id: 'plugin_crime_dossier',
    name: 'Dossiê de Investigação',
    version: '1.0.0',
    description:
      'Ideal para mistério, noir e thriller policial: cria a entidade Pistas & Evidências e estende personagens com álibi e suspeita.',
    author: 'InkGraph',
    enabled: false,
    isBuiltinSample: true,
    entityTypes: [
      {
        id: 'clue_evidence',
        label: 'Pista / Evidência',
        pluralLabel: 'Pistas e Evidências',
        iconName: 'Search',
        color: '#f97316',
        isBuiltin: false,
        mentionPrefix: '@',
        hiddenNativeFields: [],
        sourcePluginId: 'plugin_crime_dossier',
        customFields: [
          {
            key: 'discovered_in_scene',
            label: 'Cena da Descoberta',
            type: 'text',
            placeholder: 'Ex: Capítulo 3 — Beco Norte',
            includeInMemory: true,
          },
          {
            key: 'authenticity',
            label: 'Natureza da Pista',
            type: 'select',
            options: ['Genuína', 'Plantada / Falsa', 'Ambígua'],
            completenessWeight: 5,
            includeInMemory: true,
          },
          {
            key: 'forensic_detail',
            label: 'Detalhe Forense',
            type: 'textarea',
            includeInMemory: true,
          },
        ],
      },
    ],
    fieldExtensions: [
      {
        targetType: 'character',
        fields: [
          {
            key: 'alibi',
            label: 'Álibi Declarado',
            type: 'textarea',
            group: 'Investigação',
            includeInMemory: true,
          },
          {
            key: 'is_suspect',
            label: 'Sob Suspeita Ativa',
            type: 'boolean',
            group: 'Investigação',
            includeInMemory: true,
          },
        ],
      },
    ],
    snippets: [
      {
        id: 'crime_case_note',
        label: 'Nota de Caso / Registro Policial',
        description: 'Cabeçalho de registro investigativo em citação Markdown.',
        markdown: '> **REGISTRO DE OCORRÊNCIA #00** — Local: `...` · Hora estimada: `...`\n',
      },
    ],
    consistencyRules: [
      {
        id: 'crime_unnumbered_case',
        title: 'Registro policial sem número',
        severity: 'warning',
        pattern: 'REGISTRO DE OCORRÊNCIA #00',
        message: 'Registro de ocorrência ainda usa o identificador padrão #00.',
        target: 'scenes',
      },
    ],
  },
];

function cloneBuiltinSchemas(): Record<string, EntityTypeDefinition> {
  const out: Record<string, EntityTypeDefinition> = {};
  for (const [key, schema] of Object.entries(BUILTIN_ENTITY_SCHEMAS)) {
    out[key] = {
      ...schema,
      hiddenNativeFields: [...schema.hiddenNativeFields],
      customFields: [...schema.customFields],
    };
  }
  return out;
}

export function createDefaultWorkspaceConfig(): WorkspaceConfig {
  return {
    schemaVersion: 1,
    acts: DEFAULT_ACTS.map((act) => ({ ...act })),
    disabledModules: [],
    entitySchemas: cloneBuiltinSchemas(),
    plugins: BUILTIN_DECLARATIVE_PLUGINS.map((plugin) => ({
      ...plugin,
      entityTypes: plugin.entityTypes?.map((et) => ({
        ...et,
        hiddenNativeFields: [...et.hiddenNativeFields],
        customFields: et.customFields.map((f) => ({ ...f })),
      })),
      fieldExtensions: plugin.fieldExtensions?.map((ext) => ({
        ...ext,
        fields: ext.fields.map((f) => ({ ...f })),
      })),
      snippets: plugin.snippets?.map((s) => ({ ...s })),
      consistencyRules: plugin.consistencyRules?.map((r) => ({ ...r })),
      settingsSchema: plugin.settingsSchema?.map((f) => ({ ...f })),
      settingsValues: plugin.settingsValues ? { ...plugin.settingsValues } : undefined,
    })),
    canonSettings: {
      requireStagingForCopilot: true,
      autoTrackEpistemic: true,
      strictEntityRefs: true,
    },
    agentConfig: {
      customSystemPrompt:
        'Atue como editor literário e guardião de cânone do InkGraph. Respeite estritamente a continuidade epistêmica (quem sabe o quê em cada cena), preserve os atributos definidos no esquema do workspace e proponha alterações via Staging antes de canonizar fatos.',
      writingVoiceAndTone: 'Literário em Português, consistente com o gênero e as regras de mundo configuradas.',
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
    },
  };
}
