import { useMemo, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { InteractiveChartStyles } from '../components/dashboard/InteractiveChartStyles';
import { SessionTimerBanner } from '../components/dashboard/SessionTimerBanner';
import { GoalRingsGrid } from '../components/dashboard/GoalRingsGrid';
import { VelocitySectionCard } from '../components/dashboard/VelocitySectionCard';
import { ActivityHeatmapCard } from '../components/dashboard/ActivityHeatmapCard';

export function ProgressTrackerView() {
  const { project, settings } = useProject();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayWords =
    project.writingLogs.find((l) => l.date === todayIso)?.wordsWritten ?? 0;
  const weeklyWords = useMemo(
    () => project.writingLogs.slice(-7).reduce((acc, l) => acc + l.wordsWritten, 0),
    [project.writingLogs]
  );

  const dailyGoal = Math.max(1, project.dailyWordGoal);
  const weeklyGoal = Math.max(1, project.weeklyWordGoal);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        overflowY: 'auto',
        padding: 20,
        maxWidth: 1280,
        margin: '0 auto',
        color: 'var(--text-primary)',
      }}
    >
      <InteractiveChartStyles />
      <SessionTimerBanner />
      <GoalRingsGrid
        todayWords={todayWords}
        weeklyWords={weeklyWords}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
      />
      <VelocitySectionCard
        dailyGoal={dailyGoal}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <ActivityHeatmapCard
        writingLogs={project.writingLogs}
        dailyWordGoal={dailyGoal}
        dateFormat={settings.dateFormat}
        selectedDate={selectedDate}
        onSelectDate={(iso) =>
          setSelectedDate((curr) => (curr === iso ? null : iso))
        }
      />
    </div>
  );
}
