import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
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
  type NarrativeTemplate,
} from '../data/initialProjectData';
import { normalizeWorkspaceData } from '../domain/workspaceNormalizer';
import { getDictionary, type AppDictionary } from '../i18n/translations';
import { SettingsProvider, useSettings } from './SettingsContext';
import {
  loadCatalogFromStorage,
  loadActiveWorkspaceIdFromStorage,
  scheduleCatalogSave,
  flushCatalogSave,
  verifyAndReloadStorage,
  type StorageVerificationResult,
} from '../domain/storageAdapter';
import { cascadeDeleteEntity } from '../domain/entityDirectory';
import { applyStagingDecision } from '../domain/stagingResolver';
import { resolveBreadcrumbPathInput } from '../domain/breadcrumbResolver';
import type { ConfirmDialogOptions } from '../components/common/ConfirmDialog';
import type { SilentToastItem } from '../components/common/SilentToast';

interface ProjectContextValue {
  project: ProjectData;
  workspaces: ProjectData[];
  activeWorkspaceId: string;
  settings: AppSettings;
  t: AppDictionary;
  activeView: ViewId;
  setActiveView: (v: ViewId) => void;
  activeSubPath: string;
  setActiveSubPath: (sub: string) => void;
  navigationHistory: string[];
  navigateToBreadcrumbPath: (rawPath: string) => boolean;
  toggleSidebarGroup: (groupKey: string) => void;
  showPortal: boolean;
  setShowPortal: (v: boolean) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (v: boolean) => void;
  showCopilot: boolean;
  setShowCopilot: (v: boolean) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  totalWordCount: number;
  verifyAndSaveNow: () => Promise<StorageVerificationResult>;
  lastVerifyResult: StorageVerificationResult | null;
  confirmState: { open: boolean; options: ConfirmDialogOptions | null };
  requestConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  resolveConfirm: (accepted: boolean) => void;
  toasts: SilentToastItem[];
  notify: (message: string, tone?: 'success' | 'info' | 'warning') => void;
  dismissToast: (id: string) => void;
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

const ProjectContext = createContext<ProjectContextValue | null>(null);

function ProjectProviderInner({ children }: { children: ReactNode }) {
  const {
    draftSettings: settings,
    committedSettings,
    commitSettingsUpdater,
    commitImmediateSetting,
    resetDraftToDefaults,
    saveSettings,
  } = useSettings();

  const [workspaces, setWorkspaces] = useState<ProjectData[]>(loadCatalogFromStorage);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    loadActiveWorkspaceIdFromStorage
  );

  const project = useMemo<ProjectData>(() => {
    return (
      workspaces.find((w) => w.id === activeWorkspaceId) ??
      workspaces[0] ??
      createDemoProjectData()
    );
  }, [workspaces, activeWorkspaceId]);

  const [activeView, setActiveViewState] = useState<ViewId>(
    () => settings.defaultOpeningView || 'dashboard'
  );
  const [activeSubPath, setActiveSubPath] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [showPortal, setShowPortal] = useState<boolean>(
    () => settings.startupBehavior === 'home'
  );
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showCopilot, setShowCopilot] = useState<boolean>(false);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    () => project.scenes[0]?.id ?? ''
  );
  const [lastVerifyResult, setLastVerifyResult] = useState<StorageVerificationResult | null>(
    null
  );

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    options: ConfirmDialogOptions | null;
  }>({ open: false, options: null });
  const confirmResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  const [toasts, setToasts] = useState<SilentToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: 'success' | 'info' | 'warning' = 'info') => {
      if (settings.quietNotifications && tone === 'info') {
        // Still surface concise feedback when explicitly requested; keep stack compact
      }
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3600);
    },
    [settings.quietNotifications]
  );

  const requestConfirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
    }
    setConfirmState({ open: true, options });
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const resolveConfirm = useCallback((accepted: boolean) => {
    setConfirmState({ open: false, options: null });
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    resolver?.(accepted);
  }, []);

  const setActiveView = useCallback((v: ViewId) => {
    setActiveViewState(v);
    setActiveSubPath('');
  }, []);

  const recordBreadcrumbHistory = useCallback((canonical: string) => {
    setNavigationHistory((prev) => [
      canonical,
      ...prev.filter((item) => item !== canonical),
    ].slice(0, 12));
  }, []);

  const navigateToBreadcrumbPath = useCallback(
    (rawPath: string): boolean => {
      const target = resolveBreadcrumbPathInput(rawPath);
      if (!target) {
        notify(`Caminho não encontrado: "${rawPath}"`, 'warning');
        return false;
      }
      recordBreadcrumbHistory(target.canonicalPath);
      if (target.openHome) {
        setShowPortal(true);
        setActiveSubPath(target.subPath ?? '');
        return true;
      }
      if (target.view) {
        setShowPortal(false);
        setActiveViewState(target.view);
        setActiveSubPath(target.subPath ?? '');
        return true;
      }
      return false;
    },
    [notify, recordBreadcrumbHistory]
  );

  const toggleSidebarGroup = useCallback(
    (groupKey: string) => {
      commitImmediateSetting('sidebarCollapsedGroups', {
        ...settings.sidebarCollapsedGroups,
        [groupKey]: !settings.sidebarCollapsedGroups[groupKey],
      });
    },
    [commitImmediateSetting, settings.sidebarCollapsedGroups]
  );

  // Sync activeSceneId when switching workspaces
  useEffect(() => {
    if (!project.scenes.some((s) => s.id === activeSceneId)) {
      setActiveSceneId(project.scenes[0]?.id ?? '');
    }
  }, [project, activeSceneId]);

  // Debounced persistence via storageAdapter (350ms) + synchronous flush before unload
  useEffect(() => {
    scheduleCatalogSave(workspaces, project.id, 350);
  }, [workspaces, project.id]);

  useEffect(() => {
    const onBeforeUnload = () => {
      flushCatalogSave();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      flushCatalogSave();
    };
  }, []);

  const verifyAndSaveNow = useCallback(async (): Promise<StorageVerificationResult> => {
    const result = verifyAndReloadStorage(workspaces, project.id, committedSettings);
    setLastVerifyResult(result);
    if (!result.ok && result.error) {
      notify(result.error, 'warning');
    }
    return result;
  }, [workspaces, project.id, committedSettings, notify]);

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
    commitSettingsUpdater(updater);
  };

  const resetSettingsToDefault = () => {
    resetDraftToDefaults();
    saveSettings();
  };

  const switchWorkspace = (workspaceId: string, targetView?: ViewId) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (!target) return;
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
    const target = workspaces.find((w) => w.id === workspaceId);
    const executeDelete = () => {
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
      notify('Workspace removido do catálogo local.', 'info');
    };

    if (settings.confirmDestructiveActions) {
      void requestConfirm({
        title: 'Excluir Workspace',
        message: `Tem certeza que deseja excluir "${target?.title ?? 'este workspace'}"? Esta ação remove o projeto da listagem local.`,
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      }).then((accepted) => {
        if (accepted) executeDelete();
      });
      return;
    }
    executeDelete();
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
          commitSettingsUpdater((prev) => ({ ...prev, ...parsed.settings }));
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
    const targetName = project.characters.find((c) => c.id === id)?.name;
    const execute = () => {
      updateProject((prev) => cascadeDeleteEntity(prev, 'character', id));
      notify('Personagem e vínculos removidos com segurança.', 'info');
    };
    if (settings.confirmDestructiveActions) {
      void requestConfirm({
        title: 'Excluir Personagem',
        message: `Excluir "${targetName ?? 'este personagem'}" e remover referências órfãs em cenas, facções e mapas mentais?`,
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      }).then((ok) => {
        if (ok) execute();
      });
      return;
    }
    execute();
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
    const targetName = project.factions.find((f) => f.id === id)?.name;
    const execute = () => {
      updateProject((prev) => cascadeDeleteEntity(prev, 'faction', id));
      notify('Facção e vínculos removidos.', 'info');
    };
    if (settings.confirmDestructiveActions) {
      void requestConfirm({
        title: 'Excluir Facção',
        message: `Tem certeza que deseja excluir "${targetName ?? 'esta facção'}"? Vínculos em personagens e locais serão limpos.`,
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      }).then((ok) => {
        if (ok) execute();
      });
      return;
    }
    execute();
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
    const targetName = project.objects.find((o) => o.id === id)?.name;
    const execute = () => {
      updateProject((prev) => cascadeDeleteEntity(prev, 'object', id));
      notify('Objeto removido do catálogo e cenas.', 'info');
    };
    if (settings.confirmDestructiveActions) {
      void requestConfirm({
        title: 'Excluir Objeto',
        message: `Deseja excluir "${targetName ?? 'este objeto'}"? Referências em cenas e relações serão limpas.`,
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      }).then((ok) => {
        if (ok) execute();
      });
      return;
    }
    execute();
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
    const targetTitle = project.scenes.find((s) => s.id === id)?.title;
    const execute = () => {
      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.filter((s) => s.id !== id),
        plotConnections: prev.plotConnections.filter(
          (c) => c.fromSceneId !== id && c.toSceneId !== id
        ),
      }));
      notify('Cena excluída.', 'info');
    };
    if (settings.confirmDestructiveActions) {
      void requestConfirm({
        title: 'Excluir Cena',
        message: `Tem certeza que deseja excluir "${targetTitle ?? 'esta cena'}"? Conexões de enredo ligadas a ela serão removidas.`,
        confirmLabel: 'Excluir Cena',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      }).then((ok) => {
        if (ok) execute();
      });
      return;
    }
    execute();
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
    updateProject((prev) => applyStagingDecision(prev, id, decision));
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

  return (
    <ProjectContext.Provider
      value={{
        project,
        workspaces,
        activeWorkspaceId: project.id,
        settings,
        t,
        activeView,
        setActiveView,
        activeSubPath,
        setActiveSubPath,
        navigationHistory,
        navigateToBreadcrumbPath,
        toggleSidebarGroup,
        showPortal,
        setShowPortal,
        showCommandPalette,
        setShowCommandPalette,
        showCopilot,
        setShowCopilot,
        activeSceneId,
        setActiveSceneId,
        totalWordCount,
        verifyAndSaveNow,
        lastVerifyResult,
        confirmState,
        requestConfirm,
        resolveConfirm,
        toasts,
        notify,
        dismissToast,
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

export function ProjectProvider({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ProjectProviderInner>{children}</ProjectProviderInner>
    </SettingsProvider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used inside ProjectProvider');
  }
  return ctx;
}
