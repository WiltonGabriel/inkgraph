import { ShieldCheck, Puzzle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { evaluatePluginConsistencyRules } from '../domain/registry';
import { EpistemicAuditList } from '../components/review/EpistemicAuditList';
import { StoryBibleCooccurrenceCard } from '../components/review/StoryBibleCooccurrenceCard';

export function ConsistencyCheckerView() {
  const { project } = useProject();
  const pluginFindings = evaluatePluginConsistencyRules(project);

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
              {project.scenes.length === 1 ? '1 cena verificada' : `${project.scenes.length} cenas verificadas`} • {totalSecrets === 1 ? '1 segredo epistêmico monitorado' : `${totalSecrets} segredos epistêmicos monitorados`}
            </p>
          </div>
        </div>
      </div>

      <EpistemicAuditList />
      <StoryBibleCooccurrenceCard />

      {pluginFindings.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.92rem' }}>
            <Puzzle size={16} color="var(--accent-primary, #3b82f6)" />
            Regras de Plugins Ativos ({pluginFindings.length})
          </div>
          {pluginFindings.map((finding, idx) => (
            <div
              key={`${finding.pluginId}_${finding.ruleId}_${finding.targetId}_${idx}`}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 6,
                background: 'var(--bg-elevated, #171d2e)',
                border: '1px solid var(--border-subtle, #263046)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 600 }}>
                [{finding.pluginName}] {finding.title} — <span style={{ color: 'var(--accent-primary)' }}>{finding.targetName}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{finding.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
