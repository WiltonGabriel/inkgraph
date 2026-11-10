import { useMemo } from 'react';
import { Network } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface CooccurrencePair {
  id: string;
  entityA: string;
  kindA: string;
  entityB: string;
  kindB: string;
  count: number;
  sceneTitles: string[];
}

export function StoryBibleCooccurrenceCard() {
  const { project } = useProject();

  const pairs = useMemo<CooccurrencePair[]>(() => {
    const map = new Map<string, CooccurrencePair>();
    const locations = project.worlds.flatMap((w) => w.locations);

    for (const scene of project.scenes) {
      const present: { id: string; name: string; kind: string }[] = [];

      for (const cid of scene.characterIds) {
        const char = project.characters.find((c) => c.id === cid);
        if (char) {
          present.push({ id: `char_${char.id}`, name: char.name, kind: 'Personagem' });
          if (char.factionId) {
            const fac = project.factions.find((f) => f.id === char.factionId);
            if (fac && !present.some((p) => p.id === `fac_${fac.id}`)) {
              present.push({ id: `fac_${fac.id}`, name: fac.name, kind: 'Facção' });
            }
          }
        }
      }

      if (scene.locationId) {
        const loc = locations.find((l) => l.id === scene.locationId);
        if (loc) {
          present.push({ id: `loc_${loc.id}`, name: loc.name, kind: 'Local' });
        }
      }

      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          const a = present[i];
          const b = present[j];
          const [first, second] = a.id < b.id ? [a, b] : [b, a];
          const key = `${first.id}__${second.id}`;
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
            existing.sceneTitles.push(`Cap. ${scene.chapterNumber}`);
          } else {
            map.set(key, {
              id: key,
              entityA: first.name,
              kindA: first.kind,
              entityB: second.name,
              kindB: second.kind,
              count: 1,
              sceneTitles: [`Cap. ${scene.chapterNumber}`],
            });
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [project.scenes, project.characters, project.factions, project.worlds]);

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
        <Network size={16} color="var(--accent)" />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Matriz de Coocorrência da Bíblia Narrativa</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Frequência com que personagens, facções e locais compartilham cenas no manuscrito.
          </p>
        </div>
      </div>

      {pairs.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Nenhuma coocorrência registrada nas cenas atuais.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.6rem' }}>
          {pairs.slice(0, 12).map((pair) => (
            <div
              key={pair.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {pair.entityA} <span style={{ color: 'var(--text-muted)' }}>×</span> {pair.entityB}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                  }}
                >
                  {pair.count} {pair.count === 1 ? 'cena' : 'cenas'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pair.kindA} + {pair.kindB} • {pair.sceneTitles.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
