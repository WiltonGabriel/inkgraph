import { useEffect, type CSSProperties } from 'react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { WelcomePortal } from './components/shell/WelcomePortal';
import { CommandPalette } from './components/shell/CommandPalette';
import { Sidebar } from './components/shell/Sidebar';
import { Header } from './components/shell/Header';
import { CopilotPanel } from './components/shell/CopilotPanel';
import { MobileBottomNav } from './components/shell/MobileBottomNav';
import { QuickCaptureModal } from './components/shell/QuickCaptureModal';
import { GuidedOnboardingModal } from './components/onboarding/GuidedOnboardingModal';
import { useViewport } from './hooks/useViewport';
import { DashboardView } from './views/DashboardView';
import { ManuscriptView } from './views/ManuscriptView';
import { WriterStudioView } from './views/WriterStudioView';
import { TemplatesView } from './views/TemplatesView';
import { OutlineGeneratorView } from './views/OutlineGeneratorView';
import { PlotBoardView } from './views/PlotBoardView';
import { ScenarioView } from './views/ScenarioView';
import { CharacterStudioView } from './views/CharacterStudioView';
import { CharacterInterviewsView } from './views/CharacterInterviewsView';
import { FactionsStudioView } from './views/FactionsStudioView';
import { WorldbuildingStudioView } from './views/WorldbuildingStudioView';
import { PhysicsForceGraphView } from './views/PhysicsForceGraphView';
import { ObjectsStudioView } from './views/ObjectsStudioView';
import { MindMapView } from './views/MindMapView';
import { ConsistencyCheckerView } from './views/ConsistencyCheckerView';
import { CriticView } from './views/CriticView';
import { BookPreviewView } from './views/BookPreviewView';
import { ProgressTrackerView } from './views/ProgressTrackerView';
import { StagingApprovalView } from './views/StagingApprovalView';
import { ExportView } from './views/ExportView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';

function matchesShortcut(ev: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const wantCtrl = parts.includes('ctrl') || parts.includes('cmd');
  const wantShift = parts.includes('shift');
  const wantAlt = parts.includes('alt');
  const key = parts[parts.length - 1];

  const hasCtrl = ev.ctrlKey || ev.metaKey;
  if (wantCtrl !== hasCtrl) return false;
  if (wantShift !== ev.shiftKey) return false;
  if (wantAlt !== ev.altKey) return false;
  return ev.key.toLowerCase() === key;
}

function StudioWorkspace() {
  const {
    settings,
    updateSettings,
    activeView,
    setActiveView,
    showPortal,
    setShowPortal,
    showCommandPalette,
    setShowCommandPalette,
    showCopilot,
    setShowCopilot,
    showOnboarding,
    createSnapshot,
  } = useProject();
  const { isMobile } = useViewport();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);
  const canShowCopilot = showCopilot && settings.copilotEnabled && aiActive;

  useEffect(() => {
    const sc = settings.shortcuts;
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (matchesShortcut(ev, sc.commandPalette)) {
        ev.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      } else if (ev.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      } else if (matchesShortcut(ev, sc.openHome)) {
        ev.preventDefault();
        setShowPortal(!showPortal);
      } else if (matchesShortcut(ev, sc.openSettings)) {
        ev.preventDefault();
        setShowPortal(false);
        setActiveView('settings');
      } else if (matchesShortcut(ev, sc.toggleCopilot)) {
        ev.preventDefault();
        setShowCopilot(!showCopilot);
      } else if (matchesShortcut(ev, sc.toggleZenMode)) {
        ev.preventDefault();
        updateSettings((prev) => ({ ...prev, zenMode: !prev.zenMode }));
      } else if (matchesShortcut(ev, sc.quickSnapshot)) {
        ev.preventDefault();
        createSnapshot(`Instantâneo Rápido (${new Date().toLocaleTimeString('pt-BR')})`);
      } else if (matchesShortcut(ev, sc.focusManuscript)) {
        ev.preventDefault();
        setShowPortal(false);
        setActiveView('manuscript');
      } else if (matchesShortcut(ev, sc.focusGraph)) {
        ev.preventDefault();
        setShowPortal(false);
        setActiveView('graph');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.shortcuts,
    showCommandPalette,
    setShowCommandPalette,
    showPortal,
    setShowPortal,
    showCopilot,
    setShowCopilot,
    setActiveView,
    updateSettings,
    createSnapshot,
  ]);

  const themePalette =
    settings.theme === 'light'
      ? { bg: '#f8fafc', fg: '#0f172a', sec: '#f1f5f9', card: '#ffffff', border: '#cbd5e1' }
      : settings.theme === 'sepia'
        ? { bg: '#f4ecd8', fg: '#3b2f2f', sec: '#eadfc5', card: '#fbf6eb', border: '#d3c4a3' }
        : { bg: '#090b10', fg: '#f3f4f6', sec: '#111520', card: '#141926', border: '#1f2533' };

  const rootStyle: CSSProperties & Record<string, string | number | undefined> = {
    display: 'flex',
    height: '100dvh',
    width: '100vw',
    backgroundColor: themePalette.bg,
    color: themePalette.fg,
    overflow: 'hidden',
    fontSize: settings.largeText ? '108%' : '100%',
    filter: settings.highContrast ? 'contrast(1.12)' : undefined,
    '--accent': settings.accentColor || '#3b82f6',
    '--bg-primary': themePalette.bg,
    '--bg-secondary': themePalette.sec,
    '--bg-card': themePalette.card,
    '--border': themePalette.border,
    '--text-primary': themePalette.fg,
    '--text-main': themePalette.fg,
    '--ui-density-pad':
      settings.uiDensity === 'compact'
        ? '0.35rem'
        : settings.uiDensity === 'comfortable'
          ? '0.75rem'
          : '0.5rem',
  };

  return (
    <div style={rootStyle} data-theme={settings.theme} data-density={settings.uiDensity}>
      {showOnboarding && <GuidedOnboardingModal />}
      <QuickCaptureModal />
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

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          {!isMobile && canShowCopilot && settings.copilotPosition === 'left' && (
            <CopilotPanel />
          )}

          <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'manuscript' && <ManuscriptView />}
            {activeView === 'writer' && <WriterStudioView />}
            {activeView === 'templates' && <TemplatesView />}
            {activeView === 'outline' && <OutlineGeneratorView />}
            {activeView === 'plotboard' && <PlotBoardView />}
            {activeView === 'scenario' && <ScenarioView />}
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
          </main>

          {!isMobile && canShowCopilot && settings.copilotPosition !== 'left' && (
            <CopilotPanel />
          )}

          {isMobile && canShowCopilot && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 185,
                backgroundColor: 'rgba(6, 8, 13, 0.78)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
              onClick={() => setShowCopilot(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ height: '78dvh', width: '100%', display: 'flex' }}
              >
                <CopilotPanel />
              </div>
            </div>
          )}
        </div>

        {isMobile && !showPortal && <MobileBottomNav />}
      </div>
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
