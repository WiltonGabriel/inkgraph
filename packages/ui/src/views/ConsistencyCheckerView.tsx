import { useMemo, useState } from 'react';
import { ShieldCheck, Sparkles, PlusCircle, AlertTriangle, Check } from 'lucide-react';
import {
  isAiGenerativeEnabled,
  runAllNarrativeHeuristics,
  scanUncatalogedCodexTerms,
} from '@inkgraph/domain';
import { useProject } from '../context/ProjectContext';
import { runAiCompletion } from '../services/aiClient';
import { EpistemicAuditList } from '../components/review/EpistemicAuditList';
import { StoryBibleCooccurrenceCard } from '../components/review/StoryBibleCooccurrenceCard';

export function ConsistencyCheckerView() {
  const { project, settings, setActiveSceneId, setActiveView, captureToStaging } = useProject();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);
  const [aiAuditText, setAiAuditText] = useState<string | null>(null);
  const [aiAuditBusy, setAiAuditBusy] = useState(false);
  const [stagedTerms, setStagedTerms] = useState<Set<string>>(() => new Set());

  const totalSecrets = project.characters.reduce(
    (sum, c) => sum + c.epistemicSecrets.length,
    0
  );

  const diagnostics = useMemo(() => {
    const secrets = [
      ...project.characters.flatMap((c) =>
        c.epistemicSecrets.map((s) => ({
          ownerId: c.id,
          ownerName: c.name,
          secret: s.secret,
          knownByIds: s.knownByIds,
          revealedInSceneId: s.revealedInSceneId,
        }))
      ),
      ...project.factions.flatMap((f) =>
        f.epistemicSecrets.map((s) => ({
          ownerId: f.id,
          ownerName: f.name,
          secret: s.secret,
          knownByIds: s.knownByIds,
          revealedInSceneId: s.revealedInSceneId,
        }))
      ),
    ];

    return runAllNarrativeHeuristics({
      locale: settings.language,
      scenes: project.scenes,
      secrets,
      subplots: project.subplots,
    });
  }, [project.scenes, project.characters, project.factions, project.subplots, settings.language]);

  const codexCandidates = useMemo(() => {
    const known = [
      ...project.characters.flatMap((c) => [c.name, ...c.aliases]),
      ...project.factions.flatMap((f) => [f.name, ...f.aliases]),
      ...project.worlds.flatMap((w) => [w.name, ...w.locations.map((l) => l.name)]),
      ...project.objects.map((o) => o.name),
    ];
    return scanUncatalogedCodexTerms({
      scenes: project.scenes,
      knownNamesAndAliases: known,
      minMentions: 2,
    });
  }, [project.scenes, project.characters, project.factions, project.worlds, project.objects]);

  const handleRunAiAudit = async () => {
    setAiAuditBusy(true);
    setAiAuditText(null);
    const res = await runAiCompletion({
      settings,
      systemPrompt:
        'Audit the manuscript summary and entity secrets strictly for timeline/epistemic contradictions or canon inconsistencies.',
      userPrompt: `Project: ${project.title}\nEntities: ${project.characters.map((c) => c.name).join(', ')}\nScenes:\n${project.scenes.map((s) => `Ch${s.chapterNumber} ${s.title}: ${s.summary}`).join('\n')}`,
    });
    setAiAuditBusy(false);
    setAiAuditText(res.ok ? res.text : res.error);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto', padding: '1rem' }}>
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={20} color="#10b981" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Auditoria de Consistência, Regras & Story Codex</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {project.scenes.length} cenas verificadas • {totalSecrets} segredos epistêmicos • {diagnostics.length} apontamentos determinísticos
            </p>
          </div>
        </div>

        {aiActive && (
          <button
            type="button"
            disabled={aiAuditBusy}
            onClick={() => void handleRunAiAudit()}
            style={{
              background: '#7c3aed',
              color: '#fff',
              borderRadius: 6,
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={14} /> {aiAuditBusy ? '...' : 'Auditoria Semântica (IA)'}
          </button>
        )}
      </div>

      {aiAuditText && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid #7c3aed', borderRadius: 8, padding: '0.9rem', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
          {aiAuditText}
        </div>
      )}

      {/* 8 Deterministic Structural Rules */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.92rem' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span>Motor Heurístico Determinístico (8 Regras Offline)</span>
        </div>
        {diagnostics.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#10b981' }}>Nenhum alerta estrutural encontrado nas 8 regras.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {diagnostics.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  if (d.sceneId) {
                    setActiveSceneId(d.sceneId);
                    setActiveView('manuscript');
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${d.severity === 'error' ? '#ef4444' : d.severity === 'warn' ? '#f59e0b' : '#38bdf8'}`,
                  borderRadius: 6,
                  padding: '0.6rem 0.8rem',
                  cursor: d.sceneId ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{d.title}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{d.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Codex Discovery Scanner */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Auto-Scanner Story Codex (Entidades Não Catalogadas)</h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Termos próprios recorrentes no manuscrito ainda ausentes do fichário canônico.
          </p>
        </div>
        {codexCandidates.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Todos os nomes próprios recorrentes já estão catalogados.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.6rem' }}>
            {codexCandidates.slice(0, 10).map((cand) => {
              const staged = stagedTerms.has(cand.term);
              return (
                <div key={cand.term} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.84rem' }}>{cand.term}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#60a5fa' }}>{cand.totalMentions}x</span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    “{cand.sampleSnippet}”
                  </div>
                  <button
                    type="button"
                    disabled={staged}
                    onClick={() => {
                      captureToStaging({
                        title: cand.term,
                        content: `# ${cand.term}\n\nDescoberto automaticamente em ${cand.sceneIds.length} cena(s).\n\nTrecho: ${cand.sampleSnippet}`,
                        entityType: 'character',
                      });
                      setStagedTerms((prev) => new Set([...prev, cand.term]));
                    }}
                    style={{
                      marginTop: 'auto',
                      padding: '4px 8px',
                      borderRadius: 5,
                      background: staged ? 'rgba(16,185,129,0.16)' : '#1e2638',
                      color: staged ? '#34d399' : '#e5e7eb',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    {staged ? <Check size={12} /> : <PlusCircle size={12} />}
                    {staged ? 'Enviado para Staging' : 'Criar Ficha em Staging'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EpistemicAuditList />
      <StoryBibleCooccurrenceCard />
    </div>
  );
}
