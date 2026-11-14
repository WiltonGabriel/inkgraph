import type { ViewId } from '../types/project';

export interface BreadcrumbTarget {
  canonicalPath: string;
  view?: ViewId;
  subPath?: string;
  openHome?: boolean;
  aliases: string[];
}

export const BREADCRUMB_TARGETS: BreadcrumbTarget[] = [
  {
    canonicalPath: 'InkGraph / Meu Espaço',
    openHome: true,
    aliases: ['inicio', 'início', 'home', 'meu espaco', 'meu espaço', 'workspaces', 'catalogo'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Painel',
    view: 'dashboard',
    aliases: ['painel', 'dashboard', 'visao geral', 'visão geral'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Contorno',
    view: 'outline',
    aliases: ['contorno', 'outline', 'estrutura'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Quadro de Cenas',
    view: 'plotboard',
    aliases: ['quadro', 'quadro de cenas', 'plotboard', 'enredo'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Linha do Tempo',
    view: 'timeline',
    aliases: ['linha do tempo', 'timeline', 'cronologia'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Cenário & Roteiro',
    view: 'scenario',
    aliases: ['cenario', 'cenário', 'roteiro', 'scenario'],
  },
  {
    canonicalPath: 'InkGraph / Planejamento / Radar de Cânone',
    view: 'canon-radar',
    aliases: ['radar', 'radar de canone', 'radar de cânone', 'canon-radar'],
  },
  {
    canonicalPath: 'InkGraph / Personagens & Conexões / Personagens',
    view: 'characters',
    aliases: ['personagens', 'characters', 'elenco'],
  },
  {
    canonicalPath: 'InkGraph / Personagens & Conexões / Entrevistas',
    view: 'interviews',
    aliases: ['entrevistas', 'interviews'],
  },
  {
    canonicalPath: 'InkGraph / Personagens & Conexões / Grafo de Relações',
    view: 'graph',
    aliases: ['grafo', 'grafo de relacoes', 'grafo de relações', 'graph'],
  },
  {
    canonicalPath: 'InkGraph / Personagens & Conexões / Mapas Mentais',
    view: 'mindmap',
    aliases: ['mapas mentais', 'mapa mental', 'mindmap'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial',
    view: 'worlds',
    aliases: ['mundo', 'construcao mundial', 'construção mundial', 'worlds', 'world'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Geografia',
    view: 'worlds',
    subPath: 'Geografia',
    aliases: ['mundo/geografia', 'geografia', 'geography'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Cultura',
    view: 'worlds',
    subPath: 'Cultura',
    aliases: ['mundo/cultura', 'cultura'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Política',
    view: 'worlds',
    subPath: 'Política',
    aliases: ['mundo/politica', 'mundo/política', 'politica', 'política'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Economia',
    view: 'worlds',
    subPath: 'Economia',
    aliases: ['mundo/economia', 'economia'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Locais',
    view: 'worlds',
    subPath: 'Locais',
    aliases: ['mundo/locais', 'locais', 'locations'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Atlas & Mapas',
    view: 'worlds',
    subPath: 'Atlas & Mapas',
    aliases: ['mundo/atlas', 'mundo/mapas', 'atlas', 'mapas'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Construção Mundial / Sistemas & Leis',
    view: 'worlds',
    subPath: 'Sistemas & Leis',
    aliases: ['mundo/sistemas', 'sistemas', 'leis'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Facções',
    view: 'factions',
    aliases: ['faccoes', 'facções', 'factions'],
  },
  {
    canonicalPath: 'InkGraph / Mundo & Lore / Objetos',
    view: 'objects',
    aliases: ['objetos', 'itens', 'objects'],
  },
  {
    canonicalPath: 'InkGraph / Escrita & Revisão / Manuscrito',
    view: 'manuscript',
    aliases: ['manuscrito', 'manuscript', 'escrever'],
  },
  {
    canonicalPath: 'InkGraph / Escrita & Revisão / Estúdio de Redação',
    view: 'writer',
    aliases: ['estudio', 'estúdio', 'redacao', 'redação', 'writer'],
  },
  {
    canonicalPath: 'InkGraph / Escrita & Revisão / Consistência',
    view: 'consistency',
    aliases: ['consistencia', 'consistência', 'consistency'],
  },
  {
    canonicalPath: 'InkGraph / Escrita & Revisão / Versões & Staging',
    view: 'versions',
    aliases: ['versoes', 'versões', 'git', 'staging', 'versions'],
  },
  {
    canonicalPath: 'InkGraph / Escrita & Revisão / Exportar',
    view: 'export',
    aliases: ['exportar', 'export'],
  },
  {
    canonicalPath: 'InkGraph / Configurações',
    view: 'settings',
    aliases: ['configuracoes', 'configurações', 'settings', 'config'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Geral & Inicialização',
    view: 'settings',
    subPath: 'general',
    aliases: ['configuracoes/geral', 'config/geral', 'settings/general'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Aparência & Interface',
    view: 'settings',
    subPath: 'appearance',
    aliases: ['configuracoes/aparencia', 'configuracoes/aparência', 'config/aparencia', 'settings/appearance'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Editor Padrão',
    view: 'settings',
    subPath: 'editor',
    aliases: ['configuracoes/editor', 'config/editor', 'settings/editor'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / IA & Servidor MCP',
    view: 'settings',
    subPath: 'ai',
    aliases: ['configuracoes/ia', 'configuracoes/mcp', 'config/ia', 'settings/ai'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Atalhos de Teclado',
    view: 'settings',
    subPath: 'shortcuts',
    aliases: ['configuracoes/atalhos', 'config/atalhos', 'atalhos', 'settings/shortcuts'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Armazenamento & Backup',
    view: 'settings',
    subPath: 'storage',
    aliases: ['configuracoes/armazenamento', 'config/armazenamento', 'settings/storage'],
  },
  {
    canonicalPath: 'InkGraph / Configurações / Sobre',
    view: 'settings',
    subPath: 'about',
    aliases: ['configuracoes/sobre', 'config/sobre', 'sobre', 'about', 'settings/about'],
  },
  {
    canonicalPath: 'InkGraph / Ajuda',
    view: 'help',
    aliases: ['ajuda', 'help', 'docs'],
  },
];

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Resolves a folder-style path string entered by the user (`configuracoes/atalhos`,
 * `InkGraph / Mundo / Geografia`, etc.) to a concrete view and optional sub-tab.
 */
export function resolveBreadcrumbPathInput(rawPath: string): BreadcrumbTarget | null {
  const cleaned = stripAccents(rawPath)
    .replace(/^inkgraph\s*\/\s*/i, '')
    .replace(/\s*\/\s*/g, '/');
  if (!cleaned) return null;

  // 1. Exact alias or normalized suffix match
  for (const item of BREADCRUMB_TARGETS) {
    const normCanon = stripAccents(item.canonicalPath).replace(/^inkgraph\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');
    if (cleaned === normCanon) return item;
    if (item.aliases.some((a) => stripAccents(a) === cleaned)) return item;
  }

  // 2. Partial match on last segment or combined query
  const lastSeg = cleaned.split('/').pop() || cleaned;
  return (
    BREADCRUMB_TARGETS.find((item) => {
      const normCanon = stripAccents(item.canonicalPath);
      return (
        normCanon.includes(cleaned) ||
        item.aliases.some((a) => stripAccents(a).includes(lastSeg))
      );
    }) ?? null
  );
}
