import { Flame } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function WritingMomentumCard() {
  const { project } = useProject();

  const recentLogs = project.writingLogs.slice(-14);
  const weekWords = recentLogs
    .slice(-7)
    .reduce((acc, l) => acc + l.wordsWritten, 0);
  const activeDaysStreak = project.writingLogs.filter((l) => l.wordsWritten > 0).length;

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#f3f4f6',
          }}
        >
          <Flame size={15} color="#f59e0b" /> Momento de Escrita
        </span>
        <span style={{ fontSize: 11.5, color: '#fbbf24', fontWeight: 600 }}>
          {activeDaysStreak} {activeDaysStreak === 1 ? 'dia de sequência' : 'dias de sequência'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Hoje</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6' }}>
            {recentLogs[recentLogs.length - 1]?.wordsWritten ?? 0}{' '}
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              / {project.dailyWordGoal}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Essa semana</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
            {weekWords.toLocaleString('pt-BR')} palavras
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 44,
          paddingTop: 6,
        }}
      >
        {recentLogs.map((log) => {
          const h = Math.min(
            100,
            Math.round((log.wordsWritten / Math.max(1, project.dailyWordGoal)) * 100)
          );
          return (
            <div
              key={log.date}
              title={`${log.date}: ${log.wordsWritten} palavras`}
              style={{
                flex: 1,
                height: `${Math.max(10, h)}%`,
                backgroundColor:
                  log.wordsWritten >= project.dailyWordGoal
                    ? '#10b981'
                    : log.wordsWritten > 0
                      ? '#3b82f6'
                      : '#1f2533',
                borderRadius: 3,
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 6 }}>
        Atividade nos últimos 14 dias
      </div>
    </div>
  );
}
