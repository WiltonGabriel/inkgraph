import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StoryDetailsCard } from '../components/dashboard/StoryDetailsCard';
import { GoalTrackerCard } from '../components/dashboard/GoalTrackerCard';
import { WritingMomentumCard } from '../components/dashboard/WritingMomentumCard';
import { ProjectHealthCard } from '../components/dashboard/ProjectHealthCard';
import { ManuscriptCompositionCard } from '../components/dashboard/ManuscriptCompositionCard';
import { QuickActionsBackupCard } from '../components/dashboard/QuickActionsBackupCard';

export function DashboardView() {
  return (
    <div style={{ padding: 24, maxWidth: 1360, margin: '0 auto' }}>
      <DashboardHeader />
      <StoryDetailsCard />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
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
          gridTemplateColumns: '1.2fr 1fr',
          gap: 16,
        }}
      >
        <ManuscriptCompositionCard />
        <QuickActionsBackupCard />
      </div>
    </div>
  );
}
