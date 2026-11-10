import {
  createContext,
  useContext,
  useState,
  useEffect,
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

interface ProjectContextValue {
  project: ProjectData;
  settings: AppSettings;
  activeView: ViewId;
  setActiveView: (v: ViewId) => void;
  showPortal: boolean;
  setShowPortal: (v: boolean) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (v: boolean) => void;
  showCopilot: boolean;
  setShowCopilot: (v: boolean) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  totalWordCount: number;
  updateProject: (updater: (prev: ProjectData) => ProjectData) => void;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
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

const STORAGE_KEY_PROJECT = 'inkgraph_project_v2';
const STORAGE_KEY_SETTINGS = 'inkgraph_settings_v2';

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECT);
      if (saved) {
        return JSON.parse(saved) as ProjectData;
      }
    } catch {
      // Fallback to demo data
    }
    return createDemoProjectData();
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(saved) as Partial<AppSettings>) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [showPortal, setShowPortal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showCopilot, setShowCopilot] = useState<boolean>(false);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    () => project.scenes[0]?.id ?? ''
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(project));
    } catch {
      // Ignore storage quota errors
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Global keyboard shortcuts (Ctrl+K for Command Palette, Ctrl+Shift+P for Portal)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalWordCount = project.scenes.reduce(
    (sum, s) => sum + countWords(s.content),
    0
  );

  const updateProject = (updater: (prev: ProjectData) => ProjectData) => {
    setProject((prev) => {
      const next = updater(prev);
      return { ...next, updatedAt: new Date().toISOString() };
    });
  };

  const updateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => updater(prev));
  };

  const loadDemoProject = () => {
    const demo = createDemoProjectData();
    setProject(demo);
    setActiveSceneId(demo.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView('dashboard');
  };

  const startBlankProject = (title?: string) => {
    const blank = createBlankProjectData(title);
    setProject(blank);
    setActiveSceneId(blank.scenes[0]?.id ?? '');
    setShowPortal(false);
    setActiveView('manuscript');
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
      const parsed = JSON.parse(jsonString) as ProjectData;
      if (parsed && typeof parsed.title === 'string' && Array.isArray(parsed.scenes)) {
        setProject(parsed);
        setActiveSceneId(parsed.scenes[0]?.id ?? '');
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
      return { ...prev, snapshots: [snap, ...prev.snapshots] };
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
      const newBranch: Branch = {
        id: `branch_${Date.now()}`,
        name: name.trim() || 'Nova Ramificação',
        description,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      return {
        ...prev,
        branches: [...prev.branches, newBranch],
        activeBranchId: newBranch.id,
      };
    });
  };

  const switchBranch = (branchId: string) => {
    updateProject((prev) => ({ ...prev, activeBranchId: branchId }));
  };

  const resolveStagingProposal = (
    id: string,
    decision: 'approved' | 'rejected'
  ) => {
    updateProject((prev) => {
      const target = prev.stagingProposals.find((p) => p.id === id);
      let nextCharacters = prev.characters;
      if (
        target &&
        decision === 'approved' &&
        target.entityType === 'character' &&
        target.action === 'create'
      ) {
        const newChar: Character = {
          id: String(target.proposedFrontmatter.id || `char_${Date.now()}`),
          name: target.entityName,
          aliases: [],
          role: 'Personagem Canonizado via Staging',
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
          tags: ['canonizado'],
          relationships: [],
          epistemicSecrets: [],
        };
        if (!prev.characters.some((c) => c.id === newChar.id)) {
          nextCharacters = [...prev.characters, newChar];
        }
      }
      return {
        ...prev,
        characters: nextCharacters,
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

  return (
    <ProjectContext.Provider
      value={{
        project,
        settings,
        activeView,
        setActiveView,
        showPortal,
        setShowPortal,
        showCommandPalette,
        setShowCommandPalette,
        showCopilot,
        setShowCopilot,
        activeSceneId,
        setActiveSceneId,
        totalWordCount,
        updateProject,
        updateSettings,
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
