import { useMemo } from 'react';
import { BookOpen, Sparkles, Users, Shield, Globe } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function WriterContextColumn() {
  const { project, activeSceneId, setActiveSceneId, upsertScene } = useProject();

  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  const retrievedContext = useMemo(() => {
    if (!activeScene) return [];
    const text = `${activeScene.title} ${activeScene.summary} ${activeScene.content}`.toLowerCase();
    const items: { id: string; kind: 'Personagem' | 'Facção' | 'Mundo'; title: string; snippet: string }[] = [];

    for (const char of project.characters) {
      if (
        text.includes(char.name.toLowerCase()) ||
        char.id === activeScene.povCharacterId ||
        char.aliases.some((a) => text.includes(a.toLowerCase()))
      ) {
        items.push({
          id: char.id,
          kind: 'Personagem',
          title: char.name,
          snippet: `${char.role} · Motivação: ${char.motivation || char.backstory.slice(0, 90)}`,
        });
      }
    }

    for (const fac of project.factions) {
      if (
        text.includes(fac.name.toLowerCase()) ||
        fac.aliases.some((a) => text.includes(a.toLowerCase()))
      ) {
        items.push({
          id: fac.id,
          kind: 'Facção',
          title: fac.name,
          snippet: `${fac.subtype} · Lema: "${fac.motto}" · Doutrina: ${fac.doctrine.slice(0, 80)}`,
        });
      }
    }

    for (const world of project.worlds) {
      items.push({
        id: world.id,
        kind: 'Mundo',
        title: world.name,
        snippet: world.premise || world.description.slice(0, 100),
      });
    }

    return items;
  }, [activeScene, project.characters, project.factions, project.worlds]);

  return (
    <aside
      style={{
        width: 280,
        backgroundColor: '#0e1118',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid #1b202c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f3f4f6', marginBottom: 8 }}>
          <BookOpen size={14} color="#60a5fa" /> Cena de Trabalho
        </div>
        <select
          value={activeScene?.id ?? ''}
          onChange={(e) => setActiveSceneId(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: '#141926',
            border: '1px solid #262f42',
            borderRadius: 6,
            color: '#f3f4f6',
            fontSize: 12.5,
            marginBottom: 10,
          }}
        >
          {project.scenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.chapterNumber}. {s.title}
            </option>
          ))}
        </select>

        {activeScene && (
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
              Resumo da Cena
            </label>
            <textarea
              value={activeScene.summary}
              onChange={(e) => upsertScene({ ...activeScene, summary: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                backgroundColor: '#0c0f17',
                border: '1px solid #242c3d',
                borderRadius: 6,
                padding: 8,
                color: '#d1d5db',
                fontSize: 11.5,
                lineHeight: 1.45,
                resize: 'vertical',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>
          <Sparkles size={13} /> Contexto recuperado ({retrievedContext.length})
        </div>

        {retrievedContext.map((ctx) => (
          <div
            key={ctx.id}
            style={{
              padding: 10,
              backgroundColor: '#131824',
              border: '1px solid #1f2637',
              borderRadius: 7,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                {ctx.kind === 'Personagem' && <Users size={11} color="#60a5fa" />}
                {ctx.kind === 'Facção' && <Shield size={11} color="#f87171" />}
                {ctx.kind === 'Mundo' && <Globe size={11} color="#10b981" />}
                {ctx.title}
              </span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{ctx.kind}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
              {ctx.snippet}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
