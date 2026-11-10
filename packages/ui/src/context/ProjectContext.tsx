import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  ProjectData,
  AppSettings,
  ViewId,
  Character,
  Faction,
  World,
  StoryObject,
  ObjectGroup,
  Scene,
  OutlineSection,
  Subplot,
  PlotConnection,
  BinderItem,
  CharacterInterview,
  MindMap,
  Snapshot,
  Branch,
} from '../types/project';
import { countWords } from '../types/project';
import {
  createDemoProjectData,
  createBlankProjectData,
  DEFAULT_SETTINGS,
  type NarrativeTemplate,
} from '../data/initialProjectData';
import { normalizeWorkspaceData } from '../domain/workspaceNormalizer';
import { getDictionary, type AppDictionary } from '../i18n/translations';
import { catalogStorage } from '../storage/indexedDbStorageAdapter';
import { uiIncarnationTracker } from '../services/aiClient';
import type { SessionCursor } from '../types/project';

interface ProjectContextValue {
  project: ProjectData;
  workspaces: ProjectData[];
  activeWorkspaceId: string;
  settings: AppSettings;
  t: AppDictionary;
  sessionCursor: SessionCursor | null;
  storageKind: 'opfs-idb' | 'localstorage' | 'host-vault' | 'tauri-ipc';
  activeView: ViewId;
  setActiveView: (v: ViewId) => void;
  showPortal: boolean;
  setShowPortal: (v: boolean) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (v: boolean) => void;
  showCopilot: boolean;
  setShowCopilot: (v: boolean) => void;
  showOnboarding: boolean;
  openOnboarding: () => void;
  completeOnboarding: () => void;
  showQuickCapture: boolean;
  setShowQuickCapture: (v: boolean) => void;
  captureToStaging: (input: {
    title: string;
    content: string;
    entityType: 'scene' | 'character' | 'location';
  }) => void;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (v: boolean) => void;
  resumeLastSession: () => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  totalWordCount: number;
  updateProject: (updater: (prev: ProjectData) => ProjectData) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  resetSettingsToDefault: () => void;
  // Multi-Workspace Catalog Operations
  switchWorkspace: (workspaceId: string, targetView?: ViewId) => void;
  createNewWorkspace: (options: {
    title: string;
    genre?: string;
    folderOrTag?: string;
    accentColor?: string;
    template?: NarrativeTemplate;
  }) => void;
  duplicateWorkspace: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  toggleFavoriteWorkspace: (workspaceId: string) => void;
  toggleArchiveWorkspace: (workspaceId: string) => void;
  exportAllWorkspacesJson: () => string;
  importAllWorkspacesJson: (jsonString: string) => boolean;
  replaceAllWorkspaces: (items: ProjectData[]) => void;
  importScenesIntoWorkspace: (title: string, scenes: Scene[], characters: Character[]) => void;
  promoteCharacterToSeriesSiblings: (characterId: string) => number;
  // Legacy / Single-workspace shortcuts
  loadDemoProject: () => void;
  startBlankProject: (title?: string) => void;
  applyTemplateToProject: (template: NarrativeTemplate, replaceManuscript?: boolean) => void;
  importProjectJson: (jsonString: string) => boolean;
  exportProjectJson: () => string;
  // Entity helpers
  upsertCharacter: (char: Character) => void;
  deleteCharacter: (id: string) => void;
  upsertFaction: (faction: Faction) => void;
  deleteFaction: (id: string) => void;
  upsertWorld: (world: World) => void;
  upsertObject: (obj: StoryObject) => void;
  deleteObject: (id: string) => void;
  upsertObjectGroup: (group: ObjectGroup) => void;
  deleteObjectGroup: (id: string) => void;
  upsertScene: (scene: Scene) => void;
  deleteScene: (id: string) => void;
  setOutline: (sections: OutlineSection[]) => void;
  applyOutlineToManuscript: () => void;
  upsertSubplot: (subplot: Subplot) => void;
  deleteSubplot: (id: string) => void;
  upsertPlotConnection: (conn: PlotConnection) => void;
  deletePlotConnection: (id: string) => void;
  upsertBinderItem: (item: BinderItem) => void;
  deleteBinderItem: (id: string) => void;
  upsertInterview: (interview: CharacterInterview) => void;
  deleteInterview: (id: string) => void;
  upsertMindMap: (map: MindMap) => void;
  deleteMindMap: (id: string) => void;
  createSnapshot: (label: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  createBranch: (name: string, description: string) => void;
  switchBranch: (branchId: string) => void;
  resolveStagingProposal: (id: string, decision: 'approved' | 'rejected') => void;
  recordWritingSession: (wordsDelta: number, minutesDelta: number) => void;
}

const STORAGE_KEY_CATALOG = 'inkgraph_workspaces_catalog_v3';
const STORAGE_KEY_ACTIVE_ID = 'inkgraph_active_workspace_id_v3';
const STORAGE_KEY_LEGACY_PROJECT = 'inkgraph_project_v2';
const STORAGE_KEY_SETTINGS = 'inkgraph_settings_v2';
const STORAGE_KEY_SESSION_CURSOR = 'inkgraph_session_cursor_v1';

const ProjectContext = createContext<ProjectContextValue | null>(null);

function loadInitialSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shortcuts: {
          ...DEFAULT_SETTINGS.shortcuts,
          ...(parsed.shortcuts ?? {}),
        },
      };
    }
  } catch {
    // Fallback
  }
  return DEFAULT_SETTINGS;
}

function loadInitialWorkspaces(): ProjectData[] {
  try {
    const savedCatalog = localStorage.getItem(STORAGE_KEY_CATALOG);
    if (savedCatalog) {
      const parsed = JSON.parse(savedCatalog);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed
          .map((item) => normalizeWorkspaceData(item))
          .filter((item): item is ProjectData => item !== null);
        if (normalized.length > 0) {
          return normalized;
        }
      }
    }
    const legacySingle = localStorage.getItem(STORAGE_KEY_LEGACY_PROJECT);
    if (legacySingle) {
      const normalizedSingle = normalizeWorkspaceData(JSON.parse(legacySingle));
      if (normalizedSingle) {
        return [{ ...normalizedSingle, isFavorite: true, folderOrTag: 'Principal' }];
      }
    }
  } catch {
    // Fallback
  }
  const demo = createDemoProjectData();
  return [
    {
      ...demo,
      isFavorite: true,
      folderOrTag: 'Série Principal',
      accentColor: '#3b82f6',
      lastOpenedAt: new Date().toISOString(),
    },
  ];
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);
  const [workspaces, setWorkspaces] = useState<ProjectData[]>(loadInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return '';
  });

  const project = useMemo<ProjectData>(() => {
    return (
      workspaces.find((w) => w.id === activeWorkspaceId) ??
      workspaces[0] ??
      createDemoProjectData()
    );
  }, [workspaces, activeWorkspaceId]);

  const [activeView, setActiveView] = useState<ViewId>(
    () => settings.defaultOpeningView || 'dashboard'
  );
  const [showPortal, setShowPortal] = useState<boolean>(
    () => settings.startupBehavior === 'home'
  );
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showCopilot, setShowCopilot] = useState<boolean>(false);
  const [showQuickCapture, setShowQuickCapture] = useState<boolean>(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !settings.onboardingCompleted);
  const [storageHydrated, setStorageHydrated] = useState<boolean>(false);
  const [storageKind, setStorageKind] = useState<'opfs-idb' | 'localstorage' | 'host-vault' | 'tauri-ipc'>(
    () => catalogStorage.getStatus().kind
  );
  const [sessionCursor, setSessionCursor] = useState<SessionCursor | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION_CURSOR);
      return raw ? (JSON.parse(raw) as SessionCursor) : null;
    } catch {
      return null;
    }
  });
  const [activeSceneId, setActiveSceneId] = useState<string>(
    () => project.scenes[0]?.id ?? ''
  );

  // Hydrate cleanly from IndexedDB/OPFS storage on startup (with legacy migration)
  useEffect(() => {
    let active = true;
    (async () => {
      const [idbSettings, idbCatalog, idbActiveId, idbCursor] = await Promise.all([
        catalogStorage.readJson<Partial<AppSettings>>(STORAGE_KEY_SETTINGS),
        catalogStorage.readJson<unknown[]>(STORAGE_KEY_CATALOG),
        catalogStorage.readJson<string>(STORAGE_KEY_ACTIVE_ID),
        catalogStorage.readJson<SessionCursor>(STORAGE_KEY_SESSION_CURSOR),
      ]);
      if (!active) return;

      if (idbSettings) {
        const mergedSettings: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...idbSettings,
          shortcuts: {
            ...DEFAULT_SETTINGS.shortcuts,
            ...(idbSettings.shortcuts ?? {}),
          },
        };
        setSettings(mergedSettings);
        setShowOnboarding(!mergedSettings.onboardingCompleted);
      }

      if (Array.isArray(idbCatalog) && idbCatalog.length > 0) {
        const normalized = idbCatalog
          .map((item) => normalizeWorkspaceData(item))
          .filter((item): item is ProjectData => item !== null);
        if (normalized.length > 0) {
          setWorkspaces(normalized);
        }
      }

      if (typeof idbActiveId === 'string' && idbActiveId) {
        setActiveWorkspaceId(idbActiveId);
      }
      if (idbCursor) {
        setSessionCursor(idbCursor);
      }
      setStorageHydrated(true);
      setStorageKind(catalogStorage.getStatus().kind);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Ensure Copilot closes silently when AI is off/eco
  useEffect(() => {
    if (settings.aiMode === 'off' || settings.aiMode === 'eco') {
      setShowCopilot(false);
    }
  }, [settings.aiMode]);

  // Sync activeSceneId when switching workspaces
  useEffect(() => {
    if (!project.scenes.some((s) => s.id === activeSceneId)) {
      setActiveSceneId(project.scenes[0]?.id ?? '');
    }
  }, [project, activeSceneId]);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(workspaces));
      localStorage.setItem(STORAGE_KEY_LEGACY_PROJECT, JSON.stringify(project));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, project.id);
    } catch {
      // Ignore localStorage quota overflow; IndexedDB persists primary catalog
    }
    void catalogStorage.writeJson(STORAGE_KEY_CATALOG, workspaces);
    void catalogStorage.writeJson(STORAGE_KEY_ACTIVE_ID, project.id);
    setStorageKind(catalogStorage.getStatus().kind);
  }, [workspaces, project, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
    void catalogStorage.writeJson(STORAGE_KEY_SETTINGS, settings);
  }, [settings, storageHydrated]);

  // Persist "Continuar de onde parou" session cursor cleanly
  useEffect(() => {
    if (!storageHydrated || showPortal) return;
    const nextCursor: SessionCursor = {
      lastWorkspaceId: project.id,
      lastView: activeView,
      lastSceneId: activeSceneId || null,
      scrollRatio: 0,
      deviceName: settings.deviceName || 'Desktop',
      updatedAt: new Date().toISOString(),
    };
    setSessionCursor(nextCursor);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION_CURSOR, JSON.stringify(nextCursor));
    } catch {
      // Ignore
    }
    void catalogStorage.writeJson(STORAGE_KEY_SESSION_CURSOR, nextCursor);
  }, [project.id, activeView, activeSceneId, settings.deviceName, showPortal, storageHydrated]);

  const t = useMemo(() => getDictionary(settings.language), [settings.language]);

  const totalWordCount = useMemo(
    () => project.scenes.reduce((sum, s) => sum + countWords(s.content), 0),
    [project.scenes]
  );

  const updateProject = (updater: (prev: ProjectData) => ProjectData) => {
    const now = new Date().toISOString();
    setWorkspaces((prevCatalog) =>
      prevCatalog.map((w) => {
        if (w.id !== project.id) return w;
        const next = updater(w);
        return { ...next, updatedAt: now, lastOpenedAt: now };
      })
    );
  };

  const updateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => updater(prev));
  };

  const resetSettingsToDefault = () => {
    setSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: settings.onboardingCompleted });
  };

  const openOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
  };

  const resumeLastSession = () => {
    const cursor = sessionCursor;
    if (!cursor) {
      setShowPortal(false);
      return;
    }
    uiIncarnationTracker.bump();
    const targetWs = workspaces.find((w) => w.id === cursor.lastWorkspaceId);
    if (targetWs) {
      setActiveWorkspaceId(targetWs.id);
      if (cursor.lastSceneId && targetWs.scenes.some((s) => s.id === cursor.lastSceneId)) {
        setActiveSceneId(cursor.lastSceneId);
      }
      setActiveView((cursor.lastView as ViewId) || settings.defaultOpeningView || 'manuscript');
    }
    setShowPortal(false);
  };

  const captureToStaging = (input: {
    title: string;
    content: string;
    entityType: 'scene' | 'character' | 'location';
  }) => {
    const cleanTitle = input.title.trim() || 'Captura Rápida';
    const cleanContent = input.content.trim();
    if (!cleanContent) return;

    const id = `stg_cap_${Date.now()}`;
    const slug = cleanTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'captura';

    const folderMap = {
      scene: 'manuscript',
      character: 'lore/characters',
      location: 'lore/worlds',
    } as const;

    updateProject((prev) => ({
      ...prev,
      stagingProposals: [
        {
          id,
          fileName: `${slug}.md`,
          targetPath: `./workspace/staging/${slug}.md`,
          canonicalPath: `./workspace/${folderMap[input.entityType]}/${slug}.md`,
          entityType: input.entityType,
          entityName: cleanTitle,
          action: 'create',
          rationale: `Captura rápida registrada (${settings.deviceName || 'Dispositivo local'}).`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          epistemicImpact: [],
          proposedFrontmatter: {
            id: `${input.entityType}_${Date.now()}`,
            name: cleanTitle,
            status: 'draft',
          },
          proposedMarkdown: cleanContent,
        },
        ...prev.stagingProposals,
      ],
    }));
  };

  const switchWorkspace = (workspaceId: string, targetView?: ViewId) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (!target) return;
    uiIncarnationTracker.bump();
    const now = new Date().toISOString();
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspaceId ? { ...w, lastOpenedAt: now } : w))
    );
    setActiveWorkspaceId(workspaceId);
    setActiveSceneId(target.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView(targetView ?? settings.defaultOpeningView ?? 'dashboard');
  };

  const createNewWorkspace = (options: {
    title: string;
    genre?: string;
    folderOrTag?: string;
    accentColor?: string;
    template?: NarrativeTemplate;
  }) => {
    const now = new Date().toISOString();
    const blank = createBlankProjectData(options.title.trim() || 'Novo Workspace');
    const newWs: ProjectData = {
      ...blank,
      id: `ws_${Date.now()}`,
      genre: options.genre?.trim() || blank.genre,
      folderOrTag: options.folderOrTag?.trim() || 'Geral',
      accentColor: options.accentColor || '#3b82f6',
      isFavorite: false,
      isArchived: false,
      updatedAt: now,
      lastOpenedAt: now,
    };

    if (options.template) {
      const tplSections: OutlineSection[] = options.template.sections.map((sec, idx) => ({
        id: `out_${Date.now()}_${idx}`,
        title: sec.title,
        description: sec.description,
        act: sec.act,
        isTwist: sec.isTwist,
        targetWords: 2500,
      }));
      newWs.outline = tplSections;
      newWs.scenes = tplSections.map((sec, idx) => ({
        id: `scene_tpl_${Date.now()}_${idx}`,
        chapterNumber: idx + 1,
        title: sec.title,
        summary: sec.description,
        content: `# ${sec.title}\n\n${sec.description}\n`,
        act: sec.act,
        status: 'outline',
        tension: Math.min(95, 25 + idx * 8),
        subplotIds: [],
        characterIds: [],
        objectIds: [],
        secretsRevealed: [],
        notes: sec.isTwist ? 'Ponto de reviravolta (Twist) estrutural.' : '',
        position: { x: 80 + (idx % 4) * 280, y: 100 + Math.floor(idx / 4) * 180 },
        comments: [],
        revisions: [],
        lastEditedAt: now,
      }));
    }

    setWorkspaces((prev) => [newWs, ...prev]);
    setActiveWorkspaceId(newWs.id);
    setActiveSceneId(newWs.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView('dashboard');
  };

  const duplicateWorkspace = (workspaceId: string) => {
    const source = workspaces.find((w) => w.id === workspaceId);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: ProjectData = {
      ...JSON.parse(JSON.stringify(source)),
      id: `ws_copy_${Date.now()}`,
      title: `${source.title} (Cópia)`,
      updatedAt: now,
      lastOpenedAt: now,
    };
    setWorkspaces((prev) => [copy, ...prev]);
  };

  const deleteWorkspace = (workspaceId: string) => {
    if (
      settings.confirmDestructiveActions &&
      typeof window !== 'undefined' &&
      !window.confirm('Tem certeza que deseja excluir este workspace?')
    ) {
      return;
    }
    setWorkspaces((prev) => {
      const remaining = prev.filter((w) => w.id !== workspaceId);
      if (remaining.length === 0) {
        const fallback = createBlankProjectData('Workspace Inicial');
        setActiveWorkspaceId(fallback.id);
        return [fallback];
      }
      if (activeWorkspaceId === workspaceId) {
        setActiveWorkspaceId(remaining[0].id);
      }
      return remaining;
    });
  };

  const toggleFavoriteWorkspace = (workspaceId: string) => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId ? { ...w, isFavorite: !w.isFavorite } : w
      )
    );
  };

  const toggleArchiveWorkspace = (workspaceId: string) => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId ? { ...w, isArchived: !w.isArchived } : w
      )
    );
  };

  const exportAllWorkspacesJson = (): string => {
    return JSON.stringify({ version: 3, workspaces, settings }, null, 2);
  };

  const importAllWorkspacesJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) {
        const normalized = parsed.workspaces
          .map((item: unknown) => normalizeWorkspaceData(item))
          .filter((item: ProjectData | null): item is ProjectData => item !== null);
        if (normalized.length === 0) return false;
        setWorkspaces(normalized);
        setActiveWorkspaceId(normalized[0].id);
        if (parsed.settings && typeof parsed.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loadDemoProject = () => {
    const demo = createDemoProjectData();
    const now = new Date().toISOString();
    const enrichedDemo: ProjectData = {
      ...demo,
      id: `proj_demo_${Date.now()}`,
      isFavorite: true,
      folderOrTag: 'Demonstração',
      accentColor: '#10b981',
      updatedAt: now,
      lastOpenedAt: now,
    };
    setWorkspaces((prev) => {
      const filtered = prev.filter((w) => w.title !== demo.title);
      return [enrichedDemo, ...filtered];
    });
    setActiveWorkspaceId(enrichedDemo.id);
    setActiveSceneId(enrichedDemo.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView('dashboard');
  };

  const startBlankProject = (title?: string) => {
    createNewWorkspace({ title: title || 'Novo Workspace' });
  };

  const applyTemplateToProject = (
    template: NarrativeTemplate,
    replaceManuscript = false
  ) => {
    const newOutline: OutlineSection[] = template.sections.map((sec, idx) => ({
      id: `out_${Date.now()}_${idx}`,
      title: sec.title,
      description: sec.description,
      act: sec.act,
      isTwist: sec.isTwist,
      targetWords: 2500,
    }));

    updateProject((prev) => {
      const newScenes: Scene[] = replaceManuscript
        ? newOutline.map((sec, idx) => ({
            id: `scene_tpl_${Date.now()}_${idx}`,
            chapterNumber: idx + 1,
            title: sec.title,
            summary: sec.description,
            content: `# ${sec.title}\n\n${sec.description}\n`,
            act: sec.act,
            status: 'outline',
            tension: Math.min(95, 25 + idx * 8),
            subplotIds: [],
            characterIds: [],
            objectIds: [],
            secretsRevealed: [],
            notes: sec.isTwist ? 'Ponto de reviravolta (Twist) estrutural.' : '',
            position: { x: 80 + (idx % 4) * 280, y: 100 + Math.floor(idx / 4) * 180 },
            comments: [],
            revisions: [],
            lastEditedAt: new Date().toISOString(),
          }))
        : prev.scenes;

      return {
        ...prev,
        outline: newOutline,
        scenes: newScenes,
      };
    });
    setShowPortal(false);
    setActiveView(replaceManuscript ? 'manuscript' : 'outline');
  };

  const importProjectJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.workspaces)) {
        return importAllWorkspacesJson(jsonString);
      }
      const normalized = normalizeWorkspaceData(parsed);
      if (normalized) {
        const imported: ProjectData = {
          ...normalized,
          id: normalized.id || `ws_imp_${Date.now()}`,
          lastOpenedAt: new Date().toISOString(),
        };
        setWorkspaces((prev) => [imported, ...prev.filter((w) => w.id !== imported.id)]);
        setActiveWorkspaceId(imported.id);
        setActiveSceneId(imported.scenes[0]?.id ?? '');
        setShowPortal(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const exportProjectJson = (): string => {
    return JSON.stringify(project, null, 2);
  };

  const upsertCharacter = (char: Character) => {
    updateProject((prev) => {
      const exists = prev.characters.some((c) => c.id === char.id);
      return {
        ...prev,
        characters: exists
          ? prev.characters.map((c) => (c.id === char.id ? char : c))
          : [...prev.characters, char],
      };
    });
  };

  const deleteCharacter = (id: string) => {
    if (
      settings.confirmDestructiveActions &&
      typeof window !== 'undefined' &&
      !window.confirm('Tem certeza que deseja excluir este personagem?')
    ) {
      return;
    }
    updateProject((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== id),
    }));
  };

  const upsertFaction = (faction: Faction) => {
    updateProject((prev) => {
      const exists = prev.factions.some((f) => f.id === faction.id);
      return {
        ...prev,
        factions: exists
          ? prev.factions.map((f) => (f.id === faction.id ? faction : f))
          : [...prev.factions, faction],
      };
    });
  };

  const deleteFaction = (id: string) => {
    if (
      settings.confirmDestructiveActions &&
      typeof window !== 'undefined' &&
      !window.confirm('Tem certeza que deseja excluir esta facção?')
    ) {
      return;
    }
    updateProject((prev) => ({
      ...prev,
      factions: prev.factions.filter((f) => f.id !== id),
    }));
  };

  const upsertWorld = (world: World) => {
    updateProject((prev) => {
      const exists = prev.worlds.some((w) => w.id === world.id);
      return {
        ...prev,
        worlds: exists
          ? prev.worlds.map((w) => (w.id === world.id ? world : w))
          : [...prev.worlds, world],
      };
    });
  };

  const upsertObject = (obj: StoryObject) => {
    updateProject((prev) => {
      const exists = prev.objects.some((o) => o.id === obj.id);
      return {
        ...prev,
        objects: exists
          ? prev.objects.map((o) => (o.id === obj.id ? obj : o))
          : [...prev.objects, obj],
      };
    });
  };

  const deleteObject = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      objects: prev.objects.filter((o) => o.id !== id),
    }));
  };

  const upsertObjectGroup = (group: ObjectGroup) => {
    updateProject((prev) => {
      const exists = prev.objectGroups.some((g) => g.id === group.id);
      return {
        ...prev,
        objectGroups: exists
          ? prev.objectGroups.map((g) => (g.id === group.id ? group : g))
          : [...prev.objectGroups, group],
      };
    });
  };

  const deleteObjectGroup = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      objectGroups: prev.objectGroups.filter((g) => g.id !== id),
      objects: prev.objects.map((o) =>
        o.groupId === id ? { ...o, groupId: undefined } : o
      ),
    }));
  };

  const upsertScene = (scene: Scene) => {
    updateProject((prev) => {
      const exists = prev.scenes.some((s) => s.id === scene.id);
      return {
        ...prev,
        scenes: exists
          ? prev.scenes.map((s) => (s.id === scene.id ? scene : s))
          : [...prev.scenes, scene],
      };
    });
  };

  const deleteScene = (id: string) => {
    if (
      settings.confirmDestructiveActions &&
      typeof window !== 'undefined' &&
      !window.confirm('Tem certeza que deseja excluir esta cena?')
    ) {
      return;
    }
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((s) => s.id !== id),
      plotConnections: prev.plotConnections.filter(
        (c) => c.fromSceneId !== id && c.toSceneId !== id
      ),
    }));
  };

  const setOutline = (sections: OutlineSection[]) => {
    updateProject((prev) => ({ ...prev, outline: sections }));
  };

  const applyOutlineToManuscript = () => {
    updateProject((prev) => {
      if (prev.outline.length === 0) return prev;
      const generatedScenes: Scene[] = prev.outline.map((sec, idx) => {
        const existing = prev.scenes[idx];
        return {
          id: existing?.id ?? `scene_${Date.now()}_${idx}`,
          chapterNumber: idx + 1,
          title: sec.title,
          summary: sec.description,
          content: existing?.content || `${sec.description}\n`,
          act: sec.act,
          status: existing?.status ?? 'outline',
          povCharacterId: existing?.povCharacterId,
          locationId: existing?.locationId,
          tension: existing?.tension ?? Math.min(95, 30 + idx * 12),
          subplotIds: existing?.subplotIds ?? [],
          characterIds: existing?.characterIds ?? [],
          objectIds: existing?.objectIds ?? [],
          secretsRevealed: existing?.secretsRevealed ?? [],
          notes: sec.isTwist ? 'Contém reviravolta (Plot Twist).' : existing?.notes ?? '',
          position: existing?.position ?? { x: 100 + idx * 280, y: 120 },
          comments: existing?.comments ?? [],
          revisions: existing?.revisions ?? [],
          lastEditedAt: new Date().toISOString(),
        };
      });
      return { ...prev, scenes: generatedScenes };
    });
  };

  const upsertSubplot = (subplot: Subplot) => {
    updateProject((prev) => {
      const exists = prev.subplots.some((sp) => sp.id === subplot.id);
      return {
        ...prev,
        subplots: exists
          ? prev.subplots.map((sp) => (sp.id === subplot.id ? subplot : sp))
          : [...prev.subplots, subplot],
      };
    });
  };

  const deleteSubplot = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      subplots: prev.subplots.filter((sp) => sp.id !== id),
      scenes: prev.scenes.map((s) => ({
        ...s,
        subplotIds: s.subplotIds.filter((sid) => sid !== id),
      })),
    }));
  };

  const upsertPlotConnection = (conn: PlotConnection) => {
    updateProject((prev) => {
      const exists = prev.plotConnections.some((c) => c.id === conn.id);
      return {
        ...prev,
        plotConnections: exists
          ? prev.plotConnections.map((c) => (c.id === conn.id ? conn : c))
          : [...prev.plotConnections, conn],
      };
    });
  };

  const deletePlotConnection = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      plotConnections: prev.plotConnections.filter((c) => c.id !== id),
    }));
  };

  const upsertBinderItem = (item: BinderItem) => {
    updateProject((prev) => {
      const exists = prev.binder.some((b) => b.id === item.id);
      return {
        ...prev,
        binder: exists
          ? prev.binder.map((b) => (b.id === item.id ? item : b))
          : [...prev.binder, item],
      };
    });
  };

  const deleteBinderItem = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      binder: prev.binder.filter((b) => b.id !== id && b.parentId !== id),
    }));
  };

  const upsertInterview = (interview: CharacterInterview) => {
    updateProject((prev) => {
      const exists = prev.interviews.some((i) => i.id === interview.id);
      return {
        ...prev,
        interviews: exists
          ? prev.interviews.map((i) => (i.id === interview.id ? interview : i))
          : [...prev.interviews, interview],
      };
    });
  };

  const deleteInterview = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      interviews: prev.interviews.filter((i) => i.id !== id),
    }));
  };

  const upsertMindMap = (map: MindMap) => {
    updateProject((prev) => {
      const exists = prev.mindMaps.some((m) => m.id === map.id);
      return {
        ...prev,
        mindMaps: exists
          ? prev.mindMaps.map((m) => (m.id === map.id ? map : m))
          : [...prev.mindMaps, map],
      };
    });
  };

  const deleteMindMap = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      mindMaps: prev.mindMaps.filter((m) => m.id !== id),
    }));
  };

  const createSnapshot = (label: string) => {
    updateProject((prev) => {
      const words = prev.scenes.reduce((acc, s) => acc + countWords(s.content), 0);
      const snap: Snapshot = {
        id: `snap_${Date.now()}`,
        branchId: prev.activeBranchId,
        label: label.trim() || 'Instantâneo sem nome',
        createdAt: new Date().toLocaleString('pt-BR'),
        wordCount: words,
        scenesBackup: JSON.parse(JSON.stringify(prev.scenes)) as Scene[],
      };
      const maxSnaps = settings.maxSnapshotsPerWorkspace || 25;
      return { ...prev, snapshots: [snap, ...prev.snapshots].slice(0, maxSnaps) };
    });
  };

  const restoreSnapshot = (snapshotId: string) => {
    uiIncarnationTracker.bump();
    updateProject((prev) => {
      const target = prev.snapshots.find((s) => s.id === snapshotId);
      if (!target || target.scenesBackup.length === 0) return prev;
      return {
        ...prev,
        scenes: JSON.parse(JSON.stringify(target.scenesBackup)) as Scene[],
      };
    });
  };

  const createBranch = (name: string, description: string) => {
    updateProject((prev) => {
      const clonedScenes = JSON.parse(JSON.stringify(prev.scenes)) as Scene[];
      const updatedBranches = prev.branches.map((b) =>
        b.id === prev.activeBranchId
          ? { ...b, scenesBackup: JSON.parse(JSON.stringify(prev.scenes)) as Scene[] }
          : b
      );
      const newBranch: Branch = {
        id: `branch_${Date.now()}`,
        name: name.trim() || 'Nova Ramificação',
        description,
        createdAt: new Date().toISOString().slice(0, 10),
        scenesBackup: clonedScenes,
      };
      return {
        ...prev,
        branches: [...updatedBranches, newBranch],
        activeBranchId: newBranch.id,
      };
    });
  };

  const switchBranch = (branchId: string) => {
    uiIncarnationTracker.bump();
    updateProject((prev) => {
      if (branchId === prev.activeBranchId) return prev;
      const targetBranch = prev.branches.find((b) => b.id === branchId);
      if (!targetBranch) return prev;
      const updatedBranches = prev.branches.map((b) =>
        b.id === prev.activeBranchId
          ? { ...b, scenesBackup: JSON.parse(JSON.stringify(prev.scenes)) as Scene[] }
          : b
      );
      const nextScenes =
        targetBranch.scenesBackup && targetBranch.scenesBackup.length > 0
          ? (JSON.parse(JSON.stringify(targetBranch.scenesBackup)) as Scene[])
          : prev.scenes;
      return {
        ...prev,
        branches: updatedBranches,
        activeBranchId: branchId,
        scenes: nextScenes,
      };
    });
  };

  const resolveStagingProposal = (
    id: string,
    decision: 'approved' | 'rejected'
  ) => {
    updateProject((prev) => {
      const target = prev.stagingProposals.find((p) => p.id === id);
      if (!target) return prev;

      let nextCharacters = prev.characters;
      let nextFactions = prev.factions;
      let nextWorlds = prev.worlds;
      let nextObjects = prev.objects;
      let nextScenes = prev.scenes;

      if (decision === 'approved') {
        const fm = target.proposedFrontmatter ?? {};
        const proposedId = String(fm.id || `${target.entityType}_${Date.now()}`);
        const proposedTags = Array.isArray(fm.tags)
          ? fm.tags.map(String)
          : ['canonizado'];
        const proposedAliases = Array.isArray(fm.aliases)
          ? fm.aliases.map(String)
          : [];

        if (target.entityType === 'character') {
          const existing = prev.characters.find(
            (c) => c.id === proposedId || c.name.toLowerCase() === target.entityName.toLowerCase()
          );
          if (target.action === 'update' && existing) {
            nextCharacters = prev.characters.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    status: 'canon',
                    backstory: target.rationale || c.backstory,
                    notes: target.proposedMarkdown || c.notes,
                    tags: Array.from(new Set([...c.tags, ...proposedTags])),
                  }
                : c
            );
          } else if (!existing) {
            const newChar: Character = {
              id: proposedId,
              name: target.entityName,
              aliases: proposedAliases,
              role: String(fm.subtype || 'Personagem Canonizado'),
              archetype: 'ally',
              status: 'canon',
              avatarColor: '#a855f7',
              appearance: '',
              backstory: target.rationale,
              motivation: '',
              personalityTraits: '',
              flaws: '',
              want: '',
              need: '',
              lieBelieved: '',
              ghost: '',
              arcAct1: '',
              arcAct2: '',
              arcAct3: '',
              characterArc: '',
              notes: target.proposedMarkdown,
              tags: proposedTags,
              relationships: [],
              epistemicSecrets: [],
            };
            nextCharacters = [...prev.characters, newChar];
          }
        } else if (target.entityType === 'faction') {
          const existing = prev.factions.find(
            (f) => f.id === proposedId || f.name.toLowerCase() === target.entityName.toLowerCase()
          );
          if (target.action === 'update' && existing) {
            nextFactions = prev.factions.map((f) =>
              f.id === existing.id
                ? {
                    ...f,
                    status: 'canon',
                    doctrine: target.proposedMarkdown || f.doctrine,
                    notes: target.rationale || f.notes,
                    tags: Array.from(new Set([...f.tags, ...proposedTags])),
                  }
                : f
            );
          } else if (!existing) {
            const newFac: Faction = {
              id: proposedId,
              name: target.entityName,
              aliases: proposedAliases,
              subtype: String(fm.subtype || 'Organização'),
              motto: '',
              color: '#a855f7',
              status: 'canon',
              publicAgenda: target.rationale,
              secretAgenda: '',
              doctrine: target.proposedMarkdown,
              history: '',
              resourcesAndPower: '',
              internalConflicts: '',
              notes: '',
              ranks: [],
              controlledLocationIds: [],
              tags: proposedTags,
              relationships: [],
              epistemicSecrets: [],
            };
            nextFactions = [...prev.factions, newFac];
          }
        } else if (target.entityType === 'location' && prev.worlds.length > 0) {
          const firstWorld = prev.worlds[0];
          const existing = firstWorld.locations.find(
            (l) => l.id === proposedId || l.name.toLowerCase() === target.entityName.toLowerCase()
          );
          const updatedLocations =
            target.action === 'update' && existing
              ? firstWorld.locations.map((l) =>
                  l.id === existing.id
                    ? { ...l, description: target.proposedMarkdown || l.description, notes: target.rationale || l.notes }
                    : l
                )
              : existing
                ? firstWorld.locations
                : [
                    ...firstWorld.locations,
                    {
                      id: proposedId,
                      worldId: firstWorld.id,
                      name: target.entityName,
                      type: 'city' as const,
                      climateOrAtmosphere: 'Padrão',
                      description: target.proposedMarkdown,
                      strategicValue: target.rationale,
                      coordinates: { x: 50, y: 50 },
                      connectedLocationIds: [],
                      notes: '',
                    },
                  ];
          nextWorlds = [
            { ...firstWorld, locations: updatedLocations },
            ...prev.worlds.slice(1),
          ];
        } else if (target.entityType === 'system' && prev.worlds.length > 0) {
          const firstWorld = prev.worlds[0];
          const existing = firstWorld.systems.find(
            (s) => s.id === proposedId || s.name.toLowerCase() === target.entityName.toLowerCase()
          );
          const updatedSystems =
            target.action === 'update' && existing
              ? firstWorld.systems.map((s) =>
                  s.id === existing.id
                    ? { ...s, notes: target.proposedMarkdown || s.notes, costsAndToll: target.rationale || s.costsAndToll }
                    : s
                )
              : existing
                ? firstWorld.systems
                : [
                    ...firstWorld.systems,
                    {
                      id: proposedId,
                      worldId: firstWorld.id,
                      name: target.entityName,
                      subtype: String(fm.subtype || 'Sistema de Regras'),
                      coreSource: target.rationale,
                      fundamentalRules: [target.proposedMarkdown],
                      costsAndToll: '',
                      hardLimits: [],
                      socialTaboos: '',
                      knownPractitionerIds: [],
                      notes: target.proposedMarkdown,
                    },
                  ];
          nextWorlds = [
            { ...firstWorld, systems: updatedSystems },
            ...prev.worlds.slice(1),
          ];
        } else if (target.entityType === 'item') {
          const existing = prev.objects.find(
            (o) => o.id === proposedId || o.name.toLowerCase() === target.entityName.toLowerCase()
          );
          if (target.action === 'update' && existing) {
            nextObjects = prev.objects.map((o) =>
              o.id === existing.id
                ? { ...o, description: target.proposedMarkdown || o.description, notes: target.rationale || o.notes }
                : o
            );
          } else if (!existing) {
            nextObjects = [
              ...prev.objects,
              {
                id: proposedId,
                name: target.entityName,
                type: 'artifact',
                status: 'Ativo',
                description: target.proposedMarkdown,
                significance: target.rationale,
                rulesOrCapabilities: '',
                linkedCharacterIds: [],
                linkedSceneIds: [],
                notes: '',
              },
            ];
          }
        } else if (target.entityType === 'scene') {
          const existing = prev.scenes.find(
            (s) => s.id === proposedId || s.title.toLowerCase() === target.entityName.toLowerCase()
          );
          if (target.action === 'update' && existing) {
            nextScenes = prev.scenes.map((s) =>
              s.id === existing.id
                ? {
                    ...s,
                    content: target.proposedMarkdown || s.content,
                    notes: target.rationale || s.notes,
                    lastEditedAt: new Date().toISOString(),
                  }
                : s
            );
          } else if (!existing) {
            nextScenes = [
              ...prev.scenes,
              {
                id: proposedId,
                chapterNumber: prev.scenes.length + 1,
                title: target.entityName,
                summary: target.rationale,
                content: target.proposedMarkdown,
                act: 2,
                status: 'draft',
                tension: 60,
                subplotIds: [],
                characterIds: [],
                objectIds: [],
                secretsRevealed: [],
                notes: target.rationale,
                position: { x: 140 + prev.scenes.length * 220, y: 140 },
                comments: [],
                revisions: [],
                lastEditedAt: new Date().toISOString(),
              },
            ];
          }
        }
      }

      return {
        ...prev,
        characters: nextCharacters,
        factions: nextFactions,
        worlds: nextWorlds,
        objects: nextObjects,
        scenes: nextScenes,
        stagingProposals: prev.stagingProposals.map((p) =>
          p.id === id ? { ...p, status: decision } : p
        ),
      };
    });
  };

  const recordWritingSession = (wordsDelta: number, minutesDelta: number) => {
    const today = new Date().toISOString().slice(0, 10);
    updateProject((prev) => {
      const exists = prev.writingLogs.some((l) => l.date === today);
      const nextLogs = exists
        ? prev.writingLogs.map((l) =>
            l.date === today
              ? {
                  ...l,
                  wordsWritten: Math.max(0, l.wordsWritten + wordsDelta),
                  minutesSpent: l.minutesSpent + minutesDelta,
                }
              : l
          )
        : [
            ...prev.writingLogs,
            {
              date: today,
              wordsWritten: Math.max(0, wordsDelta),
              minutesSpent: minutesDelta,
            },
          ];
      return { ...prev, writingLogs: nextLogs };
    });
  };

  const replaceAllWorkspaces = (items: ProjectData[]) => {
    const normalized = items
      .map((item) => normalizeWorkspaceData(item))
      .filter((item): item is ProjectData => item !== null);
    if (normalized.length === 0) return;
    uiIncarnationTracker.bump();
    setWorkspaces(normalized);
    setActiveWorkspaceId(normalized[0]!.id);
    setActiveSceneId(normalized[0]!.scenes[0]?.id ?? '');
  };

  const importScenesIntoWorkspace = (
    title: string,
    scenes: Scene[],
    characters: Character[]
  ) => {
    const now = new Date().toISOString();
    const blank = createBlankProjectData(title || 'Importado');
    const ws: ProjectData = {
      ...blank,
      id: `ws_${Date.now()}`,
      scenes: scenes.length > 0 ? scenes : blank.scenes,
      characters,
      updatedAt: now,
      lastOpenedAt: now,
    };
    uiIncarnationTracker.bump();
    setWorkspaces((prev) => [ws, ...prev]);
    setActiveWorkspaceId(ws.id);
    setActiveSceneId(ws.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView('manuscript');
  };

  const promoteCharacterToSeriesSiblings = (characterId: string): number => {
    const sourceChar = project.characters.find((c) => c.id === characterId);
    const seriesTag = (project.seriesId || project.folderOrTag || '').trim();
    if (!sourceChar || !seriesTag) return 0;

    let updatedCount = 0;
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id === project.id) return ws;
        const siblingTag = (ws.seriesId || ws.folderOrTag || '').trim();
        if (siblingTag !== seriesTag) return ws;
        updatedCount += 1;
        const exists = ws.characters.some((c) => c.id === sourceChar.id);
        return {
          ...ws,
          characters: exists
            ? ws.characters.map((c) => (c.id === sourceChar.id ? sourceChar : c))
            : [...ws.characters, sourceChar],
        };
      })
    );
    return updatedCount;
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        workspaces,
        activeWorkspaceId: project.id,
        settings,
        t,
        sessionCursor,
        storageKind,
        activeView,
        setActiveView,
        showPortal,
        setShowPortal,
        showCommandPalette,
        setShowCommandPalette,
        showCopilot,
        setShowCopilot,
        showOnboarding,
        openOnboarding,
        completeOnboarding,
        showQuickCapture,
        setShowQuickCapture,
        captureToStaging,
        showMobileSidebar,
        setShowMobileSidebar,
        resumeLastSession,
        activeSceneId,
        setActiveSceneId,
        totalWordCount,
        updateProject,
        updateSettings,
        resetSettingsToDefault,
        switchWorkspace,
        createNewWorkspace,
        duplicateWorkspace,
        deleteWorkspace,
        toggleFavoriteWorkspace,
        toggleArchiveWorkspace,
        exportAllWorkspacesJson,
        importAllWorkspacesJson,
        replaceAllWorkspaces,
        importScenesIntoWorkspace,
        promoteCharacterToSeriesSiblings,
        loadDemoProject,
        startBlankProject,
        applyTemplateToProject,
        importProjectJson,
        exportProjectJson,
        upsertCharacter,
        deleteCharacter,
        upsertFaction,
        deleteFaction,
        upsertWorld,
        upsertObject,
        deleteObject,
        upsertObjectGroup,
        deleteObjectGroup,
        upsertScene,
        deleteScene,
        setOutline,
        applyOutlineToManuscript,
        upsertSubplot,
        deleteSubplot,
        upsertPlotConnection,
        deletePlotConnection,
        upsertBinderItem,
        deleteBinderItem,
        upsertInterview,
        deleteInterview,
        upsertMindMap,
        deleteMindMap,
        createSnapshot,
        restoreSnapshot,
        createBranch,
        switchBranch,
        resolveStagingProposal,
        recordWritingSession,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used inside ProjectProvider');
  }
  return ctx;
}
