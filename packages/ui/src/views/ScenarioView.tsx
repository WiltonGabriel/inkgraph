import { BookOpen, Users, Shield, Globe2, ListOrdered, FileText } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { countWords } from '../types/project';

export function ScenarioView() {
  const { project, totalWordCount, setActiveSceneId, setActiveView } = useProject();

  const sceneLabel =
    project.scenes.length === 1 ? '1 cena' : `${project.scenes.length} cenas`;
  const charLabel =
    project.characters.length === 1
      ? '1 personagem'
      : `${project.characters.length} personagens`;
  const sectionLabel =
    project.outline.length === 1 ? '1 seção' : `${project.outline.length} seções`;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 28px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            padding: 20,
            backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-lg, 12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent-primary, #6366f1)',
              textTransform: 'uppercase',
            }}
          >
            <BookOpen size={14} /> Documento Mestre Canônico • {project.genre}
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary, #f8fafc)',
              margin: '6px 0',
            }}
          >
            {project.title}
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--text-secondary, #cbd5e1)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {project.logline}
          </p>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
            Total do Manuscrito: <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{totalWordCount}</strong> / {project.wordCountGoal} palavras •{' '}
            {sceneLabel} • {charLabel}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <section style={cardStyle}>
            <h3 style={secTitleStyle}>
              <Users size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} /> Elenco ({project.characters.length})
            </h3>
            {project.characters.map((c) => (
              <div key={c.id} style={itemRowStyle}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                  {c.name}{' '}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                    ({c.role})
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                  {c.motivation || c.backstory}
                </div>
              </div>
            ))}
          </section>

          <section style={cardStyle}>
            <h3 style={secTitleStyle}>
              <Shield size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} /> Facções ({project.factions.length})
            </h3>
            {project.factions.map((f) => (
              <div key={f.id} style={itemRowStyle}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                  {f.name}{' '}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                    ({f.subtype})
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                  {f.publicAgenda}
                </div>
              </div>
            ))}
          </section>
        </div>

        <section style={cardStyle}>
          <h3 style={secTitleStyle}>
            <Globe2 size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} /> Mundo e Sistemas de Regras
          </h3>
          {project.worlds.map((w) => (
            <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                {w.name}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary, #cbd5e1)', margin: 0 }}>
                {w.premise || w.description}
              </p>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #94a3b8)' }}>
                Locais: {w.locations.map((l) => l.name).join(', ') || 'Nenhum'} • Sistemas:{' '}
                {w.systems.map((s) => s.name).join(', ') || 'Nenhum'}
              </div>
            </div>
          ))}
        </section>

        <section style={cardStyle}>
          <h3 style={secTitleStyle}>
            <ListOrdered size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} /> Esboço Estrutural ({sectionLabel})
          </h3>
          {project.outline.map((sec) => (
            <div key={sec.id} style={itemRowStyle}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                [Ato {sec.act}] {sec.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                {sec.description}
              </div>
            </div>
          ))}
        </section>

        <section style={cardStyle}>
          <h3 style={secTitleStyle}>
            <FileText size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} /> Detalhamento de Cenas ({project.scenes.length})
          </h3>
          {project.scenes.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setActiveSceneId(s.id);
                setActiveView('manuscript');
              }}
              style={{ ...itemRowStyle, cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--text-primary, #f1f5f9)',
                }}
              >
                <span>
                  #{s.chapterNumber} {s.title} (Ato {s.act})
                </span>
                <span style={{ color: 'var(--text-secondary, #94a3b8)', fontWeight: 500 }}>
                  {countWords(s.content)} palavras • Tensão {s.tension}%
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                {s.summary}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
export default ScenarioView;

const cardStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  borderRadius: 'var(--radius-lg, 12px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const secTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary, #f8fafc)',
  margin: '0 0 4px 0',
};

const itemRowStyle: React.CSSProperties = {
  padding: '8px 10px',
  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
  border: '1px solid var(--border-subtle, var(--border, #263046))',
  borderRadius: 'var(--radius-sm, 6px)',
};
