import type { KeyboardShortcutMap } from '../types/project';

export type ShortcutCategoryId = 'navigation' | 'views' | 'editor' | 'canvas';

export interface ShortcutDefinition {
  key: keyof KeyboardShortcutMap;
  category: ShortcutCategoryId;
  labelPt: string;
  labelEn: string;
  descPt: string;
  descEn: string;
}

export const SHORTCUT_CATEGORY_LABELS: Record<
  ShortcutCategoryId,
  { pt: string; en: string }
> = {
  navigation: { pt: 'Navegação & Painéis', en: 'Navigation & Panels' },
  views: { pt: 'Pulos Rápidos de Visão', en: 'Quick View Jumps' },
  editor: { pt: 'Escrita & Editor Markdown', en: 'Writing & Markdown Editor' },
  canvas: { pt: 'Grafo, Mapa Mental & Cânone', en: 'Graph, Mind Map & Canon' },
};

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  // Navegação & Painéis
  {
    key: 'commandPalette',
    category: 'navigation',
    labelPt: 'Paleta de Comandos Global',
    labelEn: 'Global Command Palette',
    descPt: 'Busca rápida de cenas, entidades, pilares do mundo e comandos.',
    descEn: 'Quick search across scenes, lore entities, world pillars, and commands.',
  },
  {
    key: 'toggleSidebar',
    category: 'navigation',
    labelPt: 'Recolher / Expandir Barra Lateral',
    labelEn: 'Toggle Navigation Sidebar',
    descPt: 'Alterna a largura da barra lateral esquerda para foco no conteúdo.',
    descEn: 'Collapses or expands the left navigation sidebar.',
  },
  {
    key: 'toggleCopilot',
    category: 'navigation',
    labelPt: 'Alternar Painel Copiloto',
    labelEn: 'Toggle Copilot Panel',
    descPt: 'Exibe ou recolhe o assistente contextual lateral.',
    descEn: 'Shows or hides the lateral contextual assistant.',
  },
  {
    key: 'toggleZenMode',
    category: 'navigation',
    labelPt: 'Alternar Modo Zen',
    labelEn: 'Toggle Zen Mode',
    descPt: 'Oculta barras acessórias para concentração máxima no texto.',
    descEn: 'Hides sidebars for distraction-free literary writing.',
  },
  {
    key: 'openHome',
    category: 'navigation',
    labelPt: 'Abrir Meu Espaço (Início)',
    labelEn: 'Open My Space (Home)',
    descPt: 'Alterna para a tela inicial de seleção de workspaces.',
    descEn: 'Switches to the home workspace catalog screen.',
  },
  {
    key: 'openSettings',
    category: 'navigation',
    labelPt: 'Configurações do Programa',
    labelEn: 'Program Settings',
    descPt: 'Abre esta tela de preferências globais.',
    descEn: 'Opens global program preferences.',
  },
  {
    key: 'openHelp',
    category: 'navigation',
    labelPt: 'Ajuda & Documentação',
    labelEn: 'Help & Documentation',
    descPt: 'Exibe a referência rápida e tabela dinâmica de atalhos.',
    descEn: 'Opens documentation and the live shortcut table.',
  },

  // Pulos Rápidos de Visão
  {
    key: 'focusDashboard',
    category: 'views',
    labelPt: 'Ir para Painel / Visão Geral',
    labelEn: 'Go to Dashboard',
    descPt: 'Abre os indicadores de metas, saúde do projeto e progresso.',
    descEn: 'Opens goal metrics, project health, and progress summary.',
  },
  {
    key: 'focusOutline',
    category: 'views',
    labelPt: 'Ir para Contorno',
    labelEn: 'Go to Outline',
    descPt: 'Abre a estrutura de capítulos e viradas narrativas.',
    descEn: 'Opens chapter outline and plot twist builder.',
  },
  {
    key: 'focusTimeline',
    category: 'views',
    labelPt: 'Ir para Linha do Tempo',
    labelEn: 'Go to Timeline',
    descPt: 'Abre diretamente o quadro cronológico das cenas.',
    descEn: 'Opens the chronological scene timeline.',
  },
  {
    key: 'focusPlotBoard',
    category: 'views',
    labelPt: 'Ir para Quadro de Cenas',
    labelEn: 'Go to Scene Board',
    descPt: 'Abre os cartões por ato, tela 2D e curva de tensão.',
    descEn: 'Opens act swimlanes, 2D canvas, and tension curve.',
  },
  {
    key: 'focusCanonRadar',
    category: 'views',
    labelPt: 'Ir para Radar de Cânone',
    labelEn: 'Go to Canon Radar',
    descPt: 'Exibe descobertas detectadas no texto e níveis de permissão da IA.',
    descEn: 'Displays prose discoveries and AI catalog permission levels.',
  },
  {
    key: 'focusCharacters',
    category: 'views',
    labelPt: 'Ir para Personagens',
    labelEn: 'Go to Characters',
    descPt: 'Abre o catálogo completo e dossiês de personagens.',
    descEn: 'Opens character roster and deep psychological dossiers.',
  },
  {
    key: 'focusGraph',
    category: 'views',
    labelPt: 'Ir para Grafo de Relações',
    labelEn: 'Go to Relationship Graph',
    descPt: 'Abre o grafo topológico interativo de entidades.',
    descEn: 'Opens the interactive relationship graph.',
  },
  {
    key: 'focusMindMap',
    category: 'views',
    labelPt: 'Ir para Mapas Mentais',
    labelEn: 'Go to Mind Maps',
    descPt: 'Abre os diagramas livres e nós conectados ao universo.',
    descEn: 'Opens freeform diagrams and linked story nodes.',
  },
  {
    key: 'focusWorld',
    category: 'views',
    labelPt: 'Ir para Construção Mundial',
    labelEn: 'Go to Worldbuilding',
    descPt: 'Abre os 10 pilares do mundo, atlas de mapas e sistemas.',
    descEn: 'Opens world pillars, atlas maps, and rule systems.',
  },
  {
    key: 'focusFactions',
    category: 'views',
    labelPt: 'Ir para Facções',
    labelEn: 'Go to Factions',
    descPt: 'Abre organizações, patentes, agendas públicas e secretas.',
    descEn: 'Opens factions, ranks, public and secret agendas.',
  },
  {
    key: 'focusObjects',
    category: 'views',
    labelPt: 'Ir para Objetos',
    labelEn: 'Go to Objects',
    descPt: 'Abre relíquias, armas, documentos e grupos de itens.',
    descEn: 'Opens story artifacts, weapons, documents, and item groups.',
  },
  {
    key: 'focusManuscript',
    category: 'views',
    labelPt: 'Ir para o Manuscrito',
    labelEn: 'Go to Manuscript',
    descPt: 'Abre a árvore de capítulos e o editor Markdown principal.',
    descEn: 'Opens the chapter tree and primary Markdown editor.',
  },
  {
    key: 'focusReview',
    category: 'views',
    labelPt: 'Ir para Revisão / Consistência',
    labelEn: 'Go to Review / Consistency',
    descPt: 'Abre a auditoria epistêmica e checagem de continuidade.',
    descEn: 'Opens epistemic audit and continuity checks.',
  },

  // Escrita & Editor Markdown
  {
    key: 'cycleEditorMode',
    category: 'editor',
    labelPt: 'Alternar Modo do Editor Markdown',
    labelEn: 'Cycle Markdown Editor Mode',
    descPt: 'Alterna entre Escrever, Painel Dividido e Leitura Formatada.',
    descEn: 'Cycles through Write, Split View, and Formatted Read modes.',
  },
  {
    key: 'toggleSceneInspector',
    category: 'editor',
    labelPt: 'Alternar Inspetor da Cena',
    labelEn: 'Toggle Scene Inspector',
    descPt: 'Abre ou recolhe metadados, POV, notas e segredos da cena.',
    descEn: 'Opens or hides active scene metadata, POV, notes, and secrets.',
  },
  {
    key: 'quickNewScene',
    category: 'editor',
    labelPt: 'Criar Nova Cena Rápida',
    labelEn: 'Quick New Scene',
    descPt: 'Adiciona um novo capítulo/cena ao manuscrito e abre para escrita.',
    descEn: 'Appends a new chapter/scene to the manuscript and focuses it.',
  },
  {
    key: 'quickSnapshot',
    category: 'editor',
    labelPt: 'Criar Snapshot Rápido',
    labelEn: 'Create Quick Snapshot',
    descPt: 'Salva imediatamente um ponto de restauração na ramificação atual.',
    descEn: 'Saves a restore snapshot immediately on the current branch.',
  },

  // Grafo, Mapa Mental & Cânone
  {
    key: 'fitGraphOrMap',
    category: 'canvas',
    labelPt: 'Enquadrar Grafo / Mapa Mental',
    labelEn: 'Fit Graph / Mind Map to Screen',
    descPt: 'Centraliza todos os nós na tela quando em visualização espacial.',
    descEn: 'Fits all nodes into view when viewing a spatial canvas.',
  },
  {
    key: 'scanCanonNow',
    category: 'canvas',
    labelPt: 'Escanear Cânone Agora',
    labelEn: 'Scan Canon Now',
    descPt: 'Abre o Radar de Cânone e dispara varredura imediata da prosa.',
    descEn: 'Opens Canon Radar and triggers an immediate prose scan.',
  },
];

const SPECIAL_KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Esc',
  ',': ',',
  '.': '.',
  '/': '/',
};

/**
 * Normalizes a shortcut combo string into canonical casing (`Ctrl+Shift+K`).
 */
export function normalizeShortcutString(combo: string): string {
  const rawParts = combo
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  if (rawParts.length === 0) return '';

  const modifiers = new Set<string>();
  let mainKey = '';

  for (const part of rawParts) {
    const low = part.toLowerCase();
    if (low === 'ctrl' || low === 'control' || low === 'cmd' || low === 'meta') {
      modifiers.add('Ctrl');
    } else if (low === 'alt' || low === 'option') {
      modifiers.add('Alt');
    } else if (low === 'shift') {
      modifiers.add('Shift');
    } else {
      mainKey = part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1);
    }
  }

  const ordered = ['Ctrl', 'Alt', 'Shift'].filter((m) => modifiers.has(m));
  if (mainKey) ordered.push(mainKey);
  return ordered.join('+');
}

/**
 * Converts a live KeyboardEvent into a canonical shortcut string, or returns null
 * if only modifier keys were pressed or a bare non-function key lacks modifiers.
 */
export function formatKeyEventToShortcut(ev: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): string | null {
  const ignoredKeys = new Set(['Control', 'Shift', 'Alt', 'Meta', 'OS', 'CapsLock', 'Tab']);
  if (ignoredKeys.has(ev.key)) return null;

  const mods: string[] = [];
  if (ev.ctrlKey || ev.metaKey) mods.push('Ctrl');
  if (ev.altKey) mods.push('Alt');
  if (ev.shiftKey) mods.push('Shift');

  const mapped =
    SPECIAL_KEY_NAMES[ev.key] ??
    (ev.key.length === 1 ? ev.key.toUpperCase() : ev.key[0].toUpperCase() + ev.key.slice(1));

  const isFunctionKey = /^F\d{1,2}$/i.test(mapped);
  if (mods.length === 0 && !isFunctionKey) {
    return null;
  }

  return [...mods, mapped].join('+');
}

/**
 * Checks whether a KeyboardEvent matches a user-configured shortcut string.
 */
export function matchesShortcut(
  ev: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  },
  combo: string
): boolean {
  const normalizedCombo = normalizeShortcutString(combo);
  if (!normalizedCombo) return false;

  const parts = normalizedCombo.split('+');
  const wantCtrl = parts.includes('Ctrl');
  const wantAlt = parts.includes('Alt');
  const wantShift = parts.includes('Shift');
  const targetKey = parts[parts.length - 1]?.toLowerCase() ?? '';

  const hasCtrl = ev.ctrlKey || ev.metaKey;
  if (wantCtrl !== hasCtrl) return false;
  if (wantAlt !== ev.altKey) return false;
  if (wantShift !== ev.shiftKey) return false;

  const evKey = (SPECIAL_KEY_NAMES[ev.key] ?? ev.key).toLowerCase();
  return evKey === targetKey;
}

/**
 * Finds duplicate shortcut assignments across all configurable commands.
 * Returns a map from normalized combo -> array of colliding shortcut keys.
 */
export function findShortcutConflicts(
  shortcuts: KeyboardShortcutMap
): Record<string, (keyof KeyboardShortcutMap)[]> {
  const buckets: Record<string, (keyof KeyboardShortcutMap)[]> = {};
  (Object.keys(shortcuts) as (keyof KeyboardShortcutMap)[]).forEach((k) => {
    const norm = normalizeShortcutString(shortcuts[k] || '');
    if (!norm) return;
    if (!buckets[norm]) buckets[norm] = [];
    buckets[norm].push(k);
  });

  const conflicts: Record<string, (keyof KeyboardShortcutMap)[]> = {};
  for (const [combo, keys] of Object.entries(buckets)) {
    if (keys.length > 1) {
      conflicts[combo] = keys;
    }
  }
  return conflicts;
}

/** Counts how many shortcut bindings differ from defaults. */
export function countModifiedShortcuts(
  current: KeyboardShortcutMap,
  defaults: KeyboardShortcutMap
): number {
  let changed = 0;
  for (const def of SHORTCUT_DEFINITIONS) {
    if (
      normalizeShortcutString(current[def.key] || '') !==
      normalizeShortcutString(defaults[def.key] || '')
    ) {
      changed += 1;
    }
  }
  return changed;
}
