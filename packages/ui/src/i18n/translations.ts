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
    menu: string;
    close: string;
  };
  home: {
    title: string;
    subtitle: string;
    activeSessionLabel: string;
    resumeSessionPrefix: string;
    resumeSceneBtn: string;
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
  quickCapture: {
    buttonLabel: string;
    modalTitle: string;
    modalSubtitle: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    kindNote: string;
    kindScene: string;
    kindLore: string;
    saveToStagingBtn: string;
    savedNotice: string;
  };
  onboarding: {
    badge: string;
    skipBtn: string;
    backBtn: string;
    nextBtn: string;
    finishBtn: string;
    reopenBtn: string;
    reopenDesc: string;
    stepOf: string;
    steps: {
      title: string;
      subtitle: string;
      bullets: string[];
    }[];
    modeLabels: {
      offTitle: string;
      offDesc: string;
      localTitle: string;
      localDesc: string;
      cloudTitle: string;
      cloudDesc: string;
    };
  };
  sidebarGroups: {
    writing: string;
    planning: string;
    universe: string;
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
      menu: 'Menu',
      close: 'Fechar',
    },
    home: {
      title: 'Meu Espaço',
      subtitle: 'Gerencie seus workspaces, universos e configurações globais.',
      activeSessionLabel: 'Último Workspace Acessado',
      resumeSessionPrefix: 'Continuar de onde parou',
      resumeSceneBtn: 'Retomar Cena',
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
    quickCapture: {
      buttonLabel: 'Captura +',
      modalTitle: 'Captura Rápida para Staging',
      modalSubtitle: 'Registre uma ideia, nota de personagem ou trecho de cena offline direto para revisão.',
      titlePlaceholder: 'Título curto (ex.: Cena do Cais / Traço do Antagonista)...',
      bodyPlaceholder: 'Escreva rapidamente o trecho, diálogo ou regra do mundo...',
      kindNote: 'Nota / Ideia',
      kindScene: 'Trecho de Cena',
      kindLore: 'Ficha de Lore',
      saveToStagingBtn: 'Enviar para Staging',
      savedNotice: 'Enviado para Staging.',
    },
    onboarding: {
      badge: 'Configuração Inicial',
      skipBtn: 'Pular tutorial',
      backBtn: 'Voltar',
      nextBtn: 'Próximo',
      finishBtn: 'Começar a escrever',
      reopenBtn: 'Reabrir Tutorial Guiado',
      reopenDesc: 'Veja novamente em poucos passos como funcionam os modos offline, sem IA, sincronização e staging.',
      stepOf: 'Passo',
      steps: [
        {
          title: 'Idioma & Modo de Trabalho',
          subtitle: 'Você escolhe se quer trabalhar 100% sem IA, com IA local offline ou conectada à sua API.',
          bullets: [
            'Sem IA (Silencioso): oculta painéis de geração; todas as ferramentas de escrita, grafo e auditoria seguem ativas.',
            'IA Local (Ollama/LM Studio): inferência privada na sua máquina, sem internet.',
            'Hub MCP Nativo: Antigravity, Claude e Codex CLI lêem seu universo com segurança.',
          ],
        },
        {
          title: 'Local-First & Multi-Dispositivo',
          subtitle: 'Seus textos ficam salvos primeiro neste dispositivo (IndexedDB/OPFS no browser e Markdown no PC).',
          bullets: [
            'Funciona 100% sem internet no Desktop, Notebook e Celular.',
            'No computador, exporte ou sincronize a pasta ./workspace/ em Markdown puro (.md).',
            'Retome exatamente da última cena aberta com o indicador de sessão.',
          ],
        },
        {
          title: 'Manuscrito, Grafo & Motor Epistêmico',
          subtitle: 'Acompanhe quem sabe o quê, em qual cena — para evitar spoilers involuntários.',
          bullets: [
            'Ctrl+K abre a paleta rápida de comandos, cenas e personagens.',
            'No Manuscrito, navegue pelo Índice, consulte Fichários lado a lado e edite metadados.',
            'O Crítico Literário e a Consistência rodam determinísticos, sem depender de LLM.',
          ],
        },
        {
          title: 'Cânone vs. Staging',
          subtitle: 'Nenhuma sugestão ou captura rápida altera seu manuscrito definitivo sem revisão.',
          bullets: [
            'Use Captura + (no cabeçalho ou celular) para anotar ideias rápido.',
            'Tudo que vem de captura externa ou agente entra em Versões & Staging.',
            'Compare em diff e aprove apenas o que entrar no cânone.',
          ],
        },
      ],
      modeLabels: {
        offTitle: 'Estúdio Puro (Sem IA)',
        offDesc: 'Zero chamadas externas e zero painéis de IA na tela.',
        localTitle: 'IA Local Offline + MCP',
        localDesc: 'Usa Ollama/LM Studio na sua rede ou agentes via MCP.',
        cloudTitle: 'Híbrido / Nuvem (Sua Chave)',
        cloudDesc: 'Conecta provedores externos quando desejar e cai para local offline.',
      },
    },
    sidebarGroups: {
      writing: 'Escrita',
      planning: 'Planejamento',
      universe: 'Universo & Lore',
      review: 'Revisão & Saída',
    },
    views: {
      dashboard: 'Painel',
      manuscript: 'Manuscrito',
      writer: 'Notas & Estúdio',
      templates: 'Modelos',
      outline: 'Estruturador',
      plotboard: 'Quadro de Cenas',
      scenario: 'Cenário / Roteiro',
      characters: 'Personagens',
      interviews: 'Sabatinas',
      factions: 'Facções',
      worlds: 'Construção Mundial',
      graph: 'Grafo de Relações',
      objects: 'Objetos de História',
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
        about: 'Sobre & Sistema',
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
      menu: 'Menu',
      close: 'Close',
    },
    home: {
      title: 'My Space',
      subtitle: 'Manage your workspaces, story worlds, and global preferences.',
      activeSessionLabel: 'Last Accessed Workspace',
      resumeSessionPrefix: 'Continue where you left off',
      resumeSceneBtn: 'Resume Scene',
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
    quickCapture: {
      buttonLabel: 'Capture +',
      modalTitle: 'Quick Capture to Staging',
      modalSubtitle: 'Save an offline note, character trait, or scene snippet straight into staging for review.',
      titlePlaceholder: 'Short title (e.g., Harbor Scene / Villain Trait)...',
      bodyPlaceholder: 'Write the draft snippet, dialogue, or world rule...',
      kindNote: 'Note / Idea',
      kindScene: 'Scene Snippet',
      kindLore: 'Lore Entry',
      saveToStagingBtn: 'Send to Staging',
      savedNotice: 'Saved to Staging.',
    },
    onboarding: {
      badge: 'Initial Setup',
      skipBtn: 'Skip tutorial',
      backBtn: 'Back',
      nextBtn: 'Next',
      finishBtn: 'Start writing',
      reopenBtn: 'Reopen Guided Tutorial',
      reopenDesc: 'Review how offline storage, Zero-AI mode, device continuity, and staging work.',
      stepOf: 'Step',
      steps: [
        {
          title: 'Language & AI Mode',
          subtitle: 'Choose whether to work 100% without AI, with local offline models, or with your own API key.',
          bullets: [
            'No AI (Silent Studio): hides generative panels while keeping all writing, graph, and audit tools active.',
            'Local AI (Ollama/LM Studio): private inference on your machine with zero cloud calls.',
            'Native MCP Hub: Antigravity, Claude, and Codex CLI can read your world state safely.',
          ],
        },
        {
          title: 'Local-First & Multi-Device',
          subtitle: 'Your drafts are saved locally on this device first (IndexedDB/OPFS in browser, Markdown on PC).',
          bullets: [
            'Works 100% offline across Desktop, Laptop, and Mobile.',
            'On desktop browsers, export or sync a clean ./workspace/ Markdown tree directly to disk.',
            'Resume right from your last active scene across sessions.',
          ],
        },
        {
          title: 'Manuscript, Graph & Epistemic Engine',
          subtitle: 'Track who knows which secret — and in which scene — to prevent accidental spoilers.',
          bullets: [
            'Press Ctrl+K to jump to any command, scene, or entity.',
            'Use split research notes beside the Manuscript without losing focus.',
            'Readability Critic and Consistency checks run deterministically without any LLM.',
          ],
        },
        {
          title: 'Canon vs. Staging',
          subtitle: 'No external agent or quick capture alters confirmed canon without your approval.',
          bullets: [
            'Use Capture + (header or mobile bar) to jot ideas quickly anywhere.',
            'Agent drafts and quick captures land inside Versions & Staging first.',
            'Inspect diffs and approve only what belongs in canon.',
          ],
        },
      ],
      modeLabels: {
        offTitle: 'Pure Studio (No AI)',
        offDesc: 'Zero network calls and zero generative UI clutter.',
        localTitle: 'Offline Local AI + MCP',
        localDesc: 'Uses Ollama/LM Studio locally or external MCP agents.',
        cloudTitle: 'Hybrid / Cloud (BYOK)',
        cloudDesc: 'Connects cloud providers when desired with offline fallback.',
      },
    },
    sidebarGroups: {
      writing: 'Writing',
      planning: 'Planning',
      universe: 'Universe & Lore',
      review: 'Review & Output',
    },
    views: {
      dashboard: 'Dashboard',
      manuscript: 'Manuscript',
      writer: 'Notes & Studio',
      templates: 'Templates',
      outline: 'Outline Builder',
      plotboard: 'Scene Board',
      scenario: 'Scenario / Script',
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
