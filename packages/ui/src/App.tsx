import { useEffect } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { WelcomePortal } from './components/shell/WelcomePortal';
import { CommandPalette } from './components/shell/CommandPalette';
import { Sidebar } from './components/shell/Sidebar';
import { Header } from './components/shell/Header';
import { CopilotPanel } from './components/shell/CopilotPanel';
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

function StudioWorkspace() {
  const {
    activeView,
    showPortal,
    showCommandPalette,
    setShowCommandPalette,
    showCopilot,
  } = useProject();

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      } else if (ev.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, setShowCommandPalette]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#090b10',
        color: '#f3f4f6',
        overflow: 'hidden',
      }}
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

          {showCopilot && <CopilotPanel />}
        </div>
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
