import type { ViewId } from '../types/project';

export type AppLocale = 'pt-BR' | 'en';

export interface AppDictionary {
  common: {
    mySpace: string;
    workspaces: string;
    programSettings: string;
    saved: string;
    words: string;
    scenes: string;
    characters: string;
    factions: string;
    worlds: string;
    objects: string;
    searchPlaceholder: string;
    copilot: string;
    open: string;
    create: string;
    cancel: string;
    delete: string;
    duplicate: string;
    exportJson: string;
    archive: string;
    unarchive: string;
    favorite: string;
    all: string;
    favorites: string;
    recent: string;
    archived: string;
    gridView: string;
    listView: string;
    backToWorkspace: string;
  };
  home: {
    title: string;
    subtitle: string;
    activeSessionLabel: string;
    openWorkspaceBtn: string;
    openLastSceneBtn: string;
    newBlankBtn: string;
    fromTemplateBtn: string;
    fromOutlineAiBtn: string;
    importJsonBtn: string;
    restoreDemoBtn: string;
    filterSearchPlaceholder: string;
    noWorkspacesFound: string;
    globalSummaryWords: string;
    globalSummaryWorkspaces: string;
    globalSummarySnapshots: string;
    mcpStatusLabel: string;
    newWorkspaceTitlePlaceholder: string;
    newWorkspaceGenrePlaceholder: string;
    newWorkspaceTagPlaceholder: string;
    ideaPromptPlaceholder: string;
    generateStructureBtn: string;
  };
  sidebarGroups: {
    planning: string;
    charactersNetwork: string;
    universe: string;
    writing: string;
    review: string;
  };
  views: Record<ViewId, string>;
  settings: {
    title: string;
    subtitle: string;
    resetDefaults: string;
    tabs: {
      general: string;
      appearance: string;
      editor: string;
      ai: string;
      shortcuts: string;
      notifications: string;
      storage: string;
      about: string;
    };
  };
}

export const DICTIONARIES: Record<AppLocale, AppDictionary> = {
  'pt-BR': {
    common: {
      mySpace: 'Meu Espaço',
      workspaces: 'Workspaces',
      programSettings: 'Configurações do Programa',
      saved: 'Salvo',
      words: 'palavras',
      scenes: 'cenas',
      characters: 'personagens',
      factions: 'facções',
      worlds: 'mundos',
      objects: 'objetos',
      searchPlaceholder: 'Pesquisar comandos, cenas ou lore...',
      copilot: 'Copiloto',
      open: 'Abrir',
      create: 'Criar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      duplicate: 'Duplicar',
      exportJson: 'Exportar .JSON',
      archive: 'Arquivar',
      unarchive: 'Desarquivar',
      favorite: 'Favorito',
      all: 'Todos',
      favorites: 'Favoritos',
      recent: 'Recentes',
      archived: 'Arquivados',
      gridView: 'Grade',
      listView: 'Lista',
      backToWorkspace: 'Voltar ao Workspace Ativo',
    },
    home: {
      title: 'Meu Espaço',
      subtitle: 'Gerencie seus workspaces, universos e configurações globais.',
      activeSessionLabel: 'Último Workspace Acessado',
      openWorkspaceBtn: 'Abrir Workspace',
      openLastSceneBtn: 'Ir para o Manuscrito',
      newBlankBtn: 'Novo em Branco',
      fromTemplateBtn: 'A partir de Modelo',
      fromOutlineAiBtn: 'Estruturar Ideia',
      importJsonBtn: 'Importar .JSON',
      restoreDemoBtn: 'Restaurar Demo',
      filterSearchPlaceholder: 'Filtrar workspaces por título, gênero ou tag...',
      noWorkspacesFound: 'Nenhum workspace encontrado para este filtro.',
      globalSummaryWords: 'Palavras no catálogo',
      globalSummaryWorkspaces: 'Workspaces ativos',
      globalSummarySnapshots: 'Snapshots salvos',
      mcpStatusLabel: 'Protocolo MCP Local',
      newWorkspaceTitlePlaceholder: 'Título do workspace...',
      newWorkspaceGenrePlaceholder: 'Gênero (ex.: Fantasia, Sci-Fi, Thriller)...',
      newWorkspaceTagPlaceholder: 'Coleção / Tag (ex.: Série Principal)...',
      ideaPromptPlaceholder: 'Descreva a premissa central para estruturar capítulos iniciais...',
      generateStructureBtn: 'Criar Estrutura',
    },
    sidebarGroups: {
      planning: 'Planejamento',
      charactersNetwork: 'Personagens & Conexões',
      universe: 'Mundo & Lore',
      writing: 'Escrita & Revisão',
      review: 'Revisão & Publicação',
    },
    views: {
      dashboard: 'Painel',
      manuscript: 'Manuscrito',
      writer: 'Estúdio de Redação',
      templates: 'Modelos',
      outline: 'Gerador de Contorno',
      plotboard: 'Quadro de Cenas',
      timeline: 'Linha do Tempo',
      scenario: 'Cenário / Roteiro',
      'canon-radar': 'Radar de Cânone',
      characters: 'Personagens',
      interviews: 'Entrevistas',
      factions: 'Facções',
      worlds: 'Construção Mundial',
      graph: 'Grafo de Relações',
      objects: 'Objetos',
      mindmap: 'Mapas Mentais',
      consistency: 'Consistência',
      critic: 'Crítico Literário',
      preview: 'Visualização do Livro',
      progress: 'Progresso',
      versions: 'Versões & Staging',
      export: 'Exportar',
      settings: 'Configurações',
      help: 'Ajuda',
    },
    settings: {
      title: 'Configurações do Programa',
      subtitle: 'Preferências globais do aplicativo, independentes do workspace aberto.',
      resetDefaults: 'Restaurar Padrões',
      tabs: {
        general: 'Geral & Inicialização',
        appearance: 'Aparência & Interface',
        editor: 'Editor Padrão',
        ai: 'IA & Servidor MCP',
        shortcuts: 'Atalhos de Teclado',
        notifications: 'Avisos & Metas',
        storage: 'Armazenamento & Backup',
        about: 'Sobre',
      },
    },
  },
  en: {
    common: {
      mySpace: 'My Space',
      workspaces: 'Workspaces',
      programSettings: 'Program Settings',
      saved: 'Saved',
      words: 'words',
      scenes: 'scenes',
      characters: 'characters',
      factions: 'factions',
      worlds: 'worlds',
      objects: 'objects',
      searchPlaceholder: 'Search commands, scenes, or lore...',
      copilot: 'Copilot',
      open: 'Open',
      create: 'Create',
      cancel: 'Cancel',
      delete: 'Delete',
      duplicate: 'Duplicate',
      exportJson: 'Export .JSON',
      archive: 'Archive',
      unarchive: 'Unarchive',
      favorite: 'Favorite',
      all: 'All',
      favorites: 'Favorites',
      recent: 'Recent',
      archived: 'Archived',
      gridView: 'Grid',
      listView: 'List',
      backToWorkspace: 'Return to Active Workspace',
    },
    home: {
      title: 'My Space',
      subtitle: 'Manage your workspaces, story worlds, and global preferences.',
      activeSessionLabel: 'Last Accessed Workspace',
      openWorkspaceBtn: 'Open Workspace',
      openLastSceneBtn: 'Go to Manuscript',
      newBlankBtn: 'New Blank',
      fromTemplateBtn: 'From Template',
      fromOutlineAiBtn: 'Structure Idea',
      importJsonBtn: 'Import .JSON',
      restoreDemoBtn: 'Restore Demo',
      filterSearchPlaceholder: 'Filter workspaces by title, genre, or tag...',
      noWorkspacesFound: 'No workspaces match the current filter.',
      globalSummaryWords: 'Total catalog words',
      globalSummaryWorkspaces: 'Active workspaces',
      globalSummarySnapshots: 'Saved snapshots',
      mcpStatusLabel: 'Local MCP Protocol',
      newWorkspaceTitlePlaceholder: 'Workspace title...',
      newWorkspaceGenrePlaceholder: 'Genre (e.g., Fantasy, Sci-Fi, Thriller)...',
      newWorkspaceTagPlaceholder: 'Collection / Tag (e.g., Main Series)...',
      ideaPromptPlaceholder: 'Describe the core premise to structure initial chapters...',
      generateStructureBtn: 'Create Structure',
    },
    sidebarGroups: {
      planning: 'Planning',
      charactersNetwork: 'Characters & Connections',
      universe: 'World & Lore',
      writing: 'Writing',
      review: 'Review & Output',
    },
    views: {
      dashboard: 'Dashboard',
      manuscript: 'Manuscript',
      writer: 'Writing Studio',
      templates: 'Templates',
      outline: 'Outline Generator',
      plotboard: 'Scene Board',
      timeline: 'Timeline',
      scenario: 'Scenario / Script',
      'canon-radar': 'Canon Radar',
      characters: 'Characters',
      interviews: 'Interviews',
      factions: 'Factions',
      worlds: 'Worldbuilding',
      graph: 'Relationship Graph',
      objects: 'Story Objects',
      mindmap: 'Mind Maps',
      consistency: 'Consistency',
      critic: 'Literary Critic',
      preview: 'Book Preview',
      progress: 'Progress',
      versions: 'Versions & Staging',
      export: 'Export',
      settings: 'Settings',
      help: 'Help',
    },
    settings: {
      title: 'Program Settings',
      subtitle: 'Global application preferences, independent of the active workspace.',
      resetDefaults: 'Restore Defaults',
      tabs: {
        general: 'General & Startup',
        appearance: 'Appearance & UI',
        editor: 'Default Editor',
        ai: 'AI & MCP Server',
        shortcuts: 'Keyboard Shortcuts',
        notifications: 'Alerts & Goals',
        storage: 'Storage & Backup',
        about: 'About & System',
      },
    },
  },
};

export function getDictionary(locale: AppLocale): AppDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES['pt-BR'];
}
