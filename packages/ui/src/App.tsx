import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { WelcomePortal } from './components/shell/WelcomePortal';
import { CommandPalette } from './components/shell/CommandPalette';
import { Sidebar } from './components/shell/Sidebar';
import { Header } from './components/shell/Header';
import { CopilotPanel } from './components/shell/CopilotPanel';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { SilentToast } from './components/common/SilentToast';
import { matchesShortcut } from './domain/shortcutManager';
import { buildThemeCssVars } from './domain/themes';
import type { Scene } from './types/project';

const DashboardView = lazy(() =>
  import('./views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const ManuscriptView = lazy(() =>
  import('./views/ManuscriptView').then((m) => ({ default: m.ManuscriptView }))
);
const WriterStudioView = lazy(() =>
  import('./views/WriterStudioView').then((m) => ({ default: m.WriterStudioView }))
);
const TemplatesView = lazy(() =>
  import('./views/TemplatesView').then((m) => ({ default: m.TemplatesView }))
);
const OutlineGeneratorView = lazy(() =>
  import('./views/OutlineGeneratorView').then((m) => ({ default: m.OutlineGeneratorView }))
);
const PlotBoardView = lazy(() =>
  import('./views/PlotBoardView').then((m) => ({ default: m.PlotBoardView }))
);
const ScenarioView = lazy(() =>
  import('./views/ScenarioView').then((m) => ({ default: m.ScenarioView }))
);
const CanonRadarView = lazy(() =>
  import('./views/CanonRadarView').then((m) => ({ default: m.CanonRadarView }))
);
const CharacterStudioView = lazy(() =>
  import('./views/CharacterStudioView').then((m) => ({ default: m.CharacterStudioView }))
);
const CharacterInterviewsView = lazy(() =>
  import('./views/CharacterInterviewsView').then((m) => ({ default: m.CharacterInterviewsView }))
);
const FactionsStudioView = lazy(() =>
  import('./views/FactionsStudioView').then((m) => ({ default: m.FactionsStudioView }))
);
const WorldbuildingStudioView = lazy(() =>
  import('./views/WorldbuildingStudioView').then((m) => ({ default: m.WorldbuildingStudioView }))
);
const PhysicsForceGraphView = lazy(() =>
  import('./views/PhysicsForceGraphView').then((m) => ({ default: m.PhysicsForceGraphView }))
);
const ObjectsStudioView = lazy(() =>
  import('./views/ObjectsStudioView').then((m) => ({ default: m.ObjectsStudioView }))
);
const MindMapView = lazy(() =>
  import('./views/MindMapView').then((m) => ({ default: m.MindMapView }))
);
const ConsistencyCheckerView = lazy(() =>
  import('./views/ConsistencyCheckerView').then((m) => ({ default: m.ConsistencyCheckerView }))
);
const CriticView = lazy(() =>
  import('./views/CriticView').then((m) => ({ default: m.CriticView }))
);
const BookPreviewView = lazy(() =>
  import('./views/BookPreviewView').then((m) => ({ default: m.BookPreviewView }))
);
const ProgressTrackerView = lazy(() =>
  import('./views/ProgressTrackerView').then((m) => ({ default: m.ProgressTrackerView }))
);
const StagingApprovalView = lazy(() =>
  import('./views/StagingApprovalView').then((m) => ({ default: m.StagingApprovalView }))
);
const ExportView = lazy(() =>
  import('./views/ExportView').then((m) => ({ default: m.ExportView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const HelpView = lazy(() =>
  import('./views/HelpView').then((m) => ({ default: m.HelpView }))
);

function dispatchShortcutAction(action: string) {
  window.dispatchEvent(new CustomEvent('inkgraph:shortcut', { detail: { action } }));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function StudioWorkspace() {
  const {
    project,
    settings,
    updateSettings,
    activeView,
    setActiveView,
    setActiveSceneId,
    upsertScene,
    showPortal,
    setShowPortal,
    showCommandPalette,
    setShowCommandPalette,
    showCopilot,
    setShowCopilot,
    createSnapshot,
    confirmState,
    resolveConfirm,
    toasts,
    dismissToast,
    notify,
  } = useProject();

  const [systemPrefEpoch, setSystemPrefEpoch] = useState(0);

  // Listen to OS color-scheme switches when user chooses 'system' brightness
  useEffect(() => {
    if (settings.themeBrightness !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setSystemPrefEpoch((e) => e + 1);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.themeBrightness]);

  const resolvedTheme = useMemo(
    () => buildThemeCssVars(settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, systemPrefEpoch]
  );

  // Sync theme tokens onto :root so portaled dialogs, scrollbars & native inputs follow Dual-Mode
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, val] of Object.entries(resolvedTheme.vars)) {
      root.style.setProperty(key, val);
    }
    root.dataset.theme = resolvedTheme.mode;
    root.dataset.reducedMotion = settings.reducedMotion || !settings.enableAnimations ? 'true' : 'false';
    root.dataset.lowPower = settings.lowPowerMode ? 'true' : 'false';
    root.style.colorScheme = resolvedTheme.mode === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme, settings.reducedMotion, settings.enableAnimations, settings.lowPowerMode]);

  useEffect(() => {
    document.title = project.title ? `InkGraph — ${project.title}` : 'InkGraph';
  }, [project.title]);

  // Global dispatcher for all 26 editable keyboard shortcuts
  useEffect(() => {
    const sc = settings.shortcuts;

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented) return;

      if (ev.key === 'Escape' && showCommandPalette) {
        ev.preventDefault();
        setShowCommandPalette(false);
        return;
      }

      const typing = isEditableTarget(ev.target);
      const hasModifierOrFn =
        ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d{1,2}$/i.test(ev.key);
      if (typing && !hasModifierOrFn) return;

      const openView = (v: typeof activeView) => {
        setShowPortal(false);
        setActiveView(v);
      };

      if (matchesShortcut(ev, sc.commandPalette)) {
        ev.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      } else if (matchesShortcut(ev, sc.toggleSidebar)) {
        ev.preventDefault();
        dispatchShortcutAction('toggleSidebar');
      } else if (matchesShortcut(ev, sc.toggleCopilot)) {
        ev.preventDefault();
        setShowCopilot(!showCopilot);
      } else if (matchesShortcut(ev, sc.toggleZenMode)) {
        ev.preventDefault();
        updateSettings((prev) => ({ ...prev, zenMode: !prev.zenMode }));
      } else if (matchesShortcut(ev, sc.openHome)) {
        ev.preventDefault();
        setShowPortal(!showPortal);
      } else if (matchesShortcut(ev, sc.openSettings)) {
        ev.preventDefault();
        openView('settings');
      } else if (matchesShortcut(ev, sc.openHelp)) {
        ev.preventDefault();
        openView('help');
      } else if (matchesShortcut(ev, sc.focusDashboard)) {
        ev.preventDefault();
        openView('dashboard');
      } else if (matchesShortcut(ev, sc.focusOutline)) {
        ev.preventDefault();
        openView('outline');
      } else if (matchesShortcut(ev, sc.focusTimeline)) {
        ev.preventDefault();
        openView('timeline');
      } else if (matchesShortcut(ev, sc.focusPlotBoard)) {
        ev.preventDefault();
        openView('plotboard');
      } else if (matchesShortcut(ev, sc.focusCanonRadar)) {
        ev.preventDefault();
        openView('canon-radar');
      } else if (matchesShortcut(ev, sc.focusCharacters)) {
        ev.preventDefault();
        openView('characters');
      } else if (matchesShortcut(ev, sc.focusGraph)) {
        ev.preventDefault();
        openView('graph');
      } else if (matchesShortcut(ev, sc.focusMindMap)) {
        ev.preventDefault();
        openView('mindmap');
      } else if (matchesShortcut(ev, sc.focusWorld)) {
        ev.preventDefault();
        openView('worlds');
      } else if (matchesShortcut(ev, sc.focusFactions)) {
        ev.preventDefault();
        openView('factions');
      } else if (matchesShortcut(ev, sc.focusObjects)) {
        ev.preventDefault();
        openView('objects');
      } else if (matchesShortcut(ev, sc.focusManuscript)) {
        ev.preventDefault();
        openView('manuscript');
      } else if (matchesShortcut(ev, sc.focusReview)) {
        ev.preventDefault();
        openView('consistency');
      } else if (matchesShortcut(ev, sc.cycleEditorMode)) {
        ev.preventDefault();
        openView('manuscript');
        dispatchShortcutAction('cycleEditorMode');
      } else if (matchesShortcut(ev, sc.toggleSceneInspector)) {
        ev.preventDefault();
        dispatchShortcutAction('toggleSceneInspector');
      } else if (matchesShortcut(ev, sc.quickNewScene)) {
        ev.preventDefault();
        const nextNum = project.scenes.length + 1;
        const newScene: Scene = {
          id: `scene_${Date.now()}`,
          chapterNumber: nextNum,
          title: `Cena ${nextNum}`,
          summary: '',
          content: `# Cena ${nextNum}\n\n`,
          act: 1,
          status: 'draft',
          tension: 45,
          subplotIds: [],
          characterIds: [],
          objectIds: [],
          secretsRevealed: [],
          notes: '',
          position: { x: 100 + (nextNum % 4) * 260, y: 120 + Math.floor(nextNum / 4) * 160 },
          comments: [],
          revisions: [],
          lastEditedAt: new Date().toISOString(),
        };
        upsertScene(newScene);
        setActiveSceneId(newScene.id);
        openView('manuscript');
        notify(
          settings.language === 'en' ? 'New scene created.' : 'Nova cena criada.',
          'success'
        );
      } else if (matchesShortcut(ev, sc.quickSnapshot)) {
        ev.preventDefault();
        createSnapshot(`Instantâneo Rápido (${new Date().toLocaleTimeString('pt-BR')})`);
        notify(
          settings.language === 'en' ? 'Snapshot saved.' : 'Instantâneo rápido salvo.',
          'success'
        );
      } else if (matchesShortcut(ev, sc.fitGraphOrMap)) {
        ev.preventDefault();
        dispatchShortcutAction('fitGraphOrMap');
      } else if (matchesShortcut(ev, sc.scanCanonNow)) {
        ev.preventDefault();
        openView('canon-radar');
        dispatchShortcutAction('scanCanonNow');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.shortcuts,
    settings.language,
    showCommandPalette,
    setShowCommandPalette,
    showPortal,
    setShowPortal,
    showCopilot,
    setShowCopilot,
    setActiveView,
    setActiveSceneId,
    upsertScene,
    updateSettings,
    createSnapshot,
    notify,
    project.scenes.length,
  ]);

  const rootStyle: CSSProperties & Record<string, string | number | undefined> = {
    ...(resolvedTheme.vars as Record<string, string>),
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-canvas)',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    fontSize: settings.largeText ? '108%' : '100%',
    filter: settings.highContrast ? 'contrast(1.12)' : undefined,
    '--ui-density-pad':
      settings.uiDensity === 'compact'
        ? '0.35rem'
        : settings.uiDensity === 'comfortable'
          ? '0.75rem'
          : '0.5rem',
  };

  return (
    <div
      style={rootStyle}
      data-theme={resolvedTheme.mode}
      data-palette={settings.themePalette}
      data-density={settings.uiDensity}
      data-reduced-motion={settings.reducedMotion || !settings.enableAnimations ? 'true' : 'false'}
      data-low-power={settings.lowPowerMode ? 'true' : 'false'}
    >
      {showPortal && <WelcomePortal />}
      {showCommandPalette && <CommandPalette />}

      <Sidebar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
        }}
      >
        <Header />

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {showCopilot && settings.copilotEnabled && settings.copilotPosition === 'left' && (
            <CopilotPanel />
          )}

          <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
            <Suspense
              fallback={
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  {settings.language === 'en' ? 'Loading view...' : 'Carregando módulo...'}
                </div>
              }
            >
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'manuscript' && <ManuscriptView />}
              {activeView === 'writer' && <WriterStudioView />}
              {activeView === 'templates' && <TemplatesView />}
              {activeView === 'outline' && <OutlineGeneratorView />}
              {activeView === 'plotboard' && <PlotBoardView initialMode="board" />}
              {activeView === 'timeline' && <PlotBoardView initialMode="timeline" />}
              {activeView === 'scenario' && <ScenarioView />}
              {activeView === 'canon-radar' && <CanonRadarView />}
              {activeView === 'characters' && <CharacterStudioView />}
              {activeView === 'interviews' && <CharacterInterviewsView />}
              {activeView === 'factions' && <FactionsStudioView />}
              {activeView === 'worlds' && <WorldbuildingStudioView />}
              {activeView === 'graph' && <PhysicsForceGraphView />}
              {activeView === 'objects' && <ObjectsStudioView />}
              {activeView === 'mindmap' && <MindMapView />}
              {activeView === 'consistency' && <ConsistencyCheckerView />}
              {activeView === 'critic' && <CriticView />}
              {activeView === 'preview' && <BookPreviewView />}
              {activeView === 'progress' && <ProgressTrackerView />}
              {activeView === 'versions' && <StagingApprovalView />}
              {activeView === 'export' && <ExportView />}
              {activeView === 'settings' && <SettingsView />}
              {activeView === 'help' && <HelpView />}
            </Suspense>
          </main>

          {showCopilot && settings.copilotEnabled && settings.copilotPosition !== 'left' && (
            <CopilotPanel />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        options={confirmState.options}
        onConfirm={() => resolveConfirm(true)}
        onCancel={() => resolveConfirm(false)}
      />
      <SilentToast items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export function App() {
  return (
    <ProjectProvider>
      <StudioWorkspace />
    </ProjectProvider>
  );
}

export default App;
