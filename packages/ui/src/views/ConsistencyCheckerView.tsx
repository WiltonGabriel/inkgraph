import { ShieldCheck } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { EpistemicAuditList } from '../components/review/EpistemicAuditList';
import { StoryBibleCooccurrenceCard } from '../components/review/StoryBibleCooccurrenceCard';

export function ConsistencyCheckerView() {
  const { project } = useProject();

  const totalSecrets = project.characters.reduce(
    (sum, c) => sum + c.epistemicSecrets.length,
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={20} color="#10b981" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Auditoria de Consistência & Cânone</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {project.scenes.length} cenas verificadas • {totalSecrets} segredos epistêmicos monitorados
            </p>
          </div>
        </div>
      </div>

      <EpistemicAuditList />
      <StoryBibleCooccurrenceCard />
    </div>
  );
}
