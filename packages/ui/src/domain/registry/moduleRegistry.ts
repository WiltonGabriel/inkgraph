import type { EntityTypeDefinition, ProjectData, ViewId } from '../../types/project';
import { listCustomEntitySchemas } from './entitySchemaRegistry';

export type ModuleGroupKey =
  | 'writing'
  | 'planning'
  | 'review'
  | 'charactersNetwork'
  | 'universe'
  | 'system';

export interface InkModuleDescriptor {
  id: ViewId;
  group: ModuleGroupKey;
  label: string;
  description: string;
  iconName: string;
  essential: boolean;
}

export const INK_MODULES_CATALOG: InkModuleDescriptor[] = [
  {
    id: 'manuscript',
    group: 'writing',
    label: 'Manuscrito',
    description: 'Editor Markdown principal por cenas, leitura e menções.',
    iconName: 'BookOpen',
    essential: true,
  },
  {
    id: 'writer',
    group: 'writing',
    label: 'Copiloto Epistêmico',
    description: 'Assistência de escrita consciente de cânone e memória.',
    iconName: 'Sparkles',
    essential: false,
  },
  {
    id: 'dashboard',
    group: 'planning',
    label: 'Painel',
    description: 'Visão geral de metas, composição e progresso da obra.',
    iconName: 'LayoutDashboard',
    essential: true,
  },
  {
    id: 'outline',
    group: 'planning',
    label: 'Contorno',
    description: 'Estrutura de atos, capítulos e aplicação ao manuscrito.',
    iconName: 'ListTree',
    essential: false,
  },
  {
    id: 'plotboard',
    group: 'planning',
    label: 'Quadro de Cenas',
    description: 'Quadro visual por atos, subtramas e canvas 2D.',
    iconName: 'Kanban',
    essential: false,
  },
  {
    id: 'timeline',
    group: 'planning',
    label: 'Linha do Tempo',
    description: 'Cronologia narrativa, eras e eventos.',
    iconName: 'Clock',
    essential: false,
  },
  {
    id: 'scenario',
    group: 'planning',
    label: 'Cenário',
    description: 'Simulação e impacto de decisões em cenas.',
    iconName: 'FileText',
    essential: false,
  },
  {
    id: 'canon-radar',
    group: 'planning',
    label: 'Radar de Cânone',
    description: 'Vigilância de coerência, fatos canônicos e memória em camadas.',
    iconName: 'Radar',
    essential: false,
  },
  {
    id: 'consistency',
    group: 'review',
    label: 'Consistência',
    description: 'Detecção de contradições, regras de plugins e continuidade.',
    iconName: 'ShieldAlert',
    essential: false,
  },
  {
    id: 'critic',
    group: 'review',
    label: 'Revisão',
    description: 'Leitura crítica, ritmo e notas de revisão.',
    iconName: 'Feather',
    essential: false,
  },
  {
    id: 'preview',
    group: 'review',
    label: 'Pré-visualização',
    description: 'Simulação de leitura limpa do livro completo.',
    iconName: 'Eye',
    essential: false,
  },
  {
    id: 'progress',
    group: 'review',
    label: 'Progresso',
    description: 'Histórico de palavras, metas diárias e semanais.',
    iconName: 'TrendingUp',
    essential: false,
  },
  {
    id: 'versions',
    group: 'review',
    label: 'Versões & Staging',
    description: 'Ramos narrativos, snapshots e aprovação de propostas.',
    iconName: 'GitBranch',
    essential: false,
  },
  {
    id: 'export',
    group: 'review',
    label: 'Exportação',
    description: 'Compilação para Markdown, HTML e livro.',
    iconName: 'Download',
    essential: false,
  },
  {
    id: 'characters',
    group: 'charactersNetwork',
    label: 'Personagens',
    description: 'Dossiês de personagens, arcos e campos customizados.',
    iconName: 'Users',
    essential: false,
  },
  {
    id: 'graph',
    group: 'charactersNetwork',
    label: 'Grafo de Relações',
    description: 'Rede física interativa entre entidades do projeto.',
    iconName: 'Network',
    essential: false,
  },
  {
    id: 'mindmap',
    group: 'charactersNetwork',
    label: 'Mapa Mental',
    description: 'Canvas livre de ideias e conexões conceituais.',
    iconName: 'Share2',
    essential: false,
  },
  {
    id: 'worlds',
    group: 'universe',
    label: 'Construção Mundial',
    description: 'Mundos, locais, mapas e sistemas de regras.',
    iconName: 'Globe',
    essential: false,
  },
  {
    id: 'factions',
    group: 'universe',
    label: 'Facções',
    description: 'Organizações, hierarquias e conflitos internos.',
    iconName: 'Shield',
    essential: false,
  },
  {
    id: 'objects',
    group: 'universe',
    label: 'Objetos',
    description: 'Artefatos, itens-chave, armas e tecnologias.',
    iconName: 'Package',
    essential: false,
  },
  {
    id: 'workspace-settings',
    group: 'system',
    label: 'Configurações do Workspace',
    description: 'Estrutura do modelo, atos, entidades, módulos e plugins deste livro.',
    iconName: 'SlidersHorizontal',
    essential: true,
  },
  {
    id: 'settings',
    group: 'system',
    label: 'Configurações',
    description: 'Preferências globais de aparência, editor e aplicação.',
    iconName: 'Settings',
    essential: true,
  },
  {
    id: 'help',
    group: 'system',
    label: 'Sobre / Ajuda',
    description: 'Guia rápido e créditos open-source.',
    iconName: 'HelpCircle',
    essential: true,
  },
];

export function isModuleEssential(moduleId: ViewId): boolean {
  return INK_MODULES_CATALOG.find((m) => m.id === moduleId)?.essential ?? false;
}

export function isModuleEnabled(project: ProjectData, moduleId: ViewId): boolean {
  if (isModuleEssential(moduleId)) return true;
  const disabled = project.workspaceConfig?.disabledModules ?? [];
  return !disabled.includes(moduleId);
}

export function listConfigurableModules(): InkModuleDescriptor[] {
  return INK_MODULES_CATALOG.filter((m) => m.group !== 'system');
}

export function listCustomEntitySidebarEntries(project: ProjectData): Array<{
  typeDef: EntityTypeDefinition;
  count: number;
}> {
  const customTypes = listCustomEntitySchemas(project);
  return customTypes.map((typeDef) => ({
    typeDef,
    count: (project.customEntities?.[typeDef.id] ?? []).length,
  }));
}
