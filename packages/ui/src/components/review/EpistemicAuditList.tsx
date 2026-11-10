import { useState, useMemo } from 'react';
import { AlertTriangle, Info, ShieldAlert, Filter } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export interface EpistemicAuditIssue {
  id: string;
  severity: 'conflict' | 'warning' | 'info';
  characterId: string;
  characterName: string;
  sceneTitle: string;
  description: string;
}

export function EpistemicAuditList() {
  const { project } = useProject();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'conflict' | 'warning' | 'info'>('all');

  const issues = useMemo<EpistemicAuditIssue[]>(() => {
    const list: EpistemicAuditIssue[] = [];
    const orderedScenes = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);

    for (const char of project.characters) {
      for (const secret of char.epistemicSecrets) {
        const revealedIdx = secret.revealedInSceneId
          ? orderedScenes.findIndex((s) => s.id === secret.revealedInSceneId)
          : -1;

        orderedScenes.forEach((scene, idx) => {
          const isBeforeReveal = revealedIdx === -1 || idx < revealedIdx;
          const secretKeyword = secret.secret.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
          const mentionedInContent =
            secretKeyword.length > 4 && scene.content.toLowerCase().includes(secretKeyword);

          if (isBeforeReveal && mentionedInContent) {
            const povKnows = scene.povCharacterId
              ? secret.knownByIds.includes(scene.povCharacterId) || scene.povCharacterId === char.id
              : false;
            if (!povKnows) {
              list.push({
                id: `ep_${char.id}_${secret.id}_${scene.id}`,
                severity: 'conflict',
                characterId: char.id,
                characterName: char.name,
                sceneTitle: `Cap. ${scene.chapterNumber}: ${scene.title}`,
                description: `Referência prematura ao segredo "${secret.secret}" antes da cena de revelação oficial.`,
              });
            }
          }
        });

        if (!secret.revealedInSceneId) {
          list.push({
            id: `unrev_${char.id}_${secret.id}`,
            severity: 'warning',
            characterId: char.id,
            characterName: char.name,
            sceneTitle: 'Dossiê Epistêmico',
            description: `Segredo "${secret.secret}" ainda não possui cena de revelação vinculada no manuscrito.`,
          });
        } else {
          const revScene = orderedScenes.find((s) => s.id === secret.revealedInSceneId);
          list.push({
            id: `info_${char.id}_${secret.id}`,
            severity: 'info',
            characterId: char.id,
            characterName: char.name,
            sceneTitle: revScene ? `Cap. ${revScene.chapterNumber}: ${revScene.title}` : 'Cena vinculada',
            description: `Segredo "${secret.secret}" conhecido por ${secret.knownByIds.length} entidade(s) e revelado conforme planejado.`,
          });
        }
      }
    }
    return list;
  }, [project.characters, project.scenes]);

  const filtered = issues.filter((item) => {
    if (selectedCharacterId !== 'all' && item.characterId !== selectedCharacterId) return false;
    if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;
    return true;
  });

  const badgeConfig = {
    conflict: { label: 'Conflito', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', Icon: ShieldAlert },
    warning: { label: 'Aviso', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', Icon: AlertTriangle },
    info: { label: 'Informação', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', Icon: Info },
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--accent)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Auditoria Epistêmica de Segredos</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
          >
            <option value="all">Todos os personagens</option>
            {project.characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as 'all' | 'conflict' | 'warning' | 'info')}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
          >
            <option value="all">Todas as severidades</option>
            <option value="conflict">Conflito</option>
            <option value="warning">Aviso</option>
            <option value="info">Informação</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.8rem 0' }}>
            Nenhuma ocorrência epistêmica para os filtros selecionados.
          </p>
        ) : (
          filtered.map((item) => {
            const cfg = badgeConfig[item.severity];
            const Icon = cfg.Icon;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: '6px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icon size={14} color={cfg.color} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.characterName}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{item.sceneTitle}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.description}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
