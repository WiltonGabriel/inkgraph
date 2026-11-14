import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StoryDetailsCard } from '../components/dashboard/StoryDetailsCard';
import { GoalTrackerCard } from '../components/dashboard/GoalTrackerCard';
import { WritingMomentumCard } from '../components/dashboard/WritingMomentumCard';
import { ProjectHealthCard } from '../components/dashboard/ProjectHealthCard';
import { ManuscriptCompositionCard } from '../components/dashboard/ManuscriptCompositionCard';
import { QuickActionsBackupCard } from '../components/dashboard/QuickActionsBackupCard';
import { InteractiveChartStyles } from '../components/dashboard/InteractiveChartStyles';
import { useViewport } from '../hooks/useViewport';

export function DashboardView() {
  const { isMobile, isTablet } = useViewport();

  return (
    <div style={{ padding: 24, maxWidth: 1360, margin: '0 auto', color: 'var(--text-primary)' }}>
      <InteractiveChartStyles />
      <DashboardHeader />
      <StoryDetailsCard />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <GoalTrackerCard />
        <WritingMomentumCard />
        <ProjectHealthCard />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile || isTablet ? '1fr' : '1.2fr 1fr',
          gap: 16,
        }}
      >
        <ManuscriptCompositionCard />
        <QuickActionsBackupCard />
      </div>
    </div>
  );
}
