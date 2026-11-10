import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { ViewId } from '../../types/project';

interface GlobalSearchHit {
  readonly id: string;
  readonly workspaceId: string;
  readonly workspaceTitle: string;
  readonly kind: 'Obra' | 'Cena' | 'Personagem' | 'Facção' | 'Mundo';
  readonly label: string;
  readonly excerpt: string;
  readonly targetView: ViewId;
  readonly sceneId?: string;
}

export function GlobalWorkspaceSearch() {
  const { workspaces, switchWorkspace, setActiveSceneId } = useProject();
  const [query, setQuery] = useState('');

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: GlobalSearchHit[] = [];
    for (const ws of workspaces) {
      if (ws.isArchived) continue;
      if (`${ws.title} ${ws.logline}`.toLowerCase().includes(q)) {
        results.push({
          id: `ws_${ws.id}`,
          workspaceId: ws.id,
          workspaceTitle: ws.title,
          kind: 'Obra',
          label: ws.title,
          excerpt: ws.logline || ws.genre || '',
          targetView: 'dashboard',
        });
      }

      for (const scene of ws.scenes) {
        if (
          scene.title.toLowerCase().includes(q) ||
          scene.content.toLowerCase().includes(q) ||
          scene.summary.toLowerCase().includes(q)
        ) {
          results.push({
            id: `sc_${ws.id}_${scene.id}`,
            workspaceId: ws.id,
            workspaceTitle: ws.title,
            kind: 'Cena',
            label: `Cap. ${scene.chapterNumber}: ${scene.title}`,
            excerpt: scene.summary || scene.content.slice(0, 110),
            targetView: 'manuscript',
            sceneId: scene.id,
          });
        }
      }

      for (const char of ws.characters) {
        if (`${char.name} ${char.role} ${char.motivation}`.toLowerCase().includes(q)) {
          results.push({
            id: `ch_${ws.id}_${char.id}`,
            workspaceId: ws.id,
            workspaceTitle: ws.title,
            kind: 'Personagem',
            label: char.name,
            excerpt: `${char.role} — ${char.motivation}`.slice(0, 100),
            targetView: 'characters',
          });
        }
      }

      for (const fac of ws.factions) {
        if (`${fac.name} ${fac.publicAgenda}`.toLowerCase().includes(q)) {
          results.push({
            id: `fa_${ws.id}_${fac.id}`,
            workspaceId: ws.id,
            workspaceTitle: ws.title,
            kind: 'Facção',
            label: fac.name,
            excerpt: fac.publicAgenda.slice(0, 100),
            targetView: 'factions',
          });
        }
      }

      for (const world of ws.worlds) {
        if (`${world.name} ${world.premise}`.toLowerCase().includes(q)) {
          results.push({
            id: `wd_${ws.id}_${world.id}`,
            workspaceId: ws.id,
            workspaceTitle: ws.title,
            kind: 'Mundo',
            label: world.name,
            excerpt: world.premise.slice(0, 100),
            targetView: 'worlds',
          });
        }
      }

      if (results.length >= 24) break;
    }
    return results.slice(0, 24);
  }, [query, workspaces]);

  return (
    <section style={{ marginBottom: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#11151f', border: '1px solid #242b3d', borderRadius: 8, padding: '8px 12px' }}>
        <Search size={15} color="#64748b" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar em todos os workspaces (cenas, personagens, facções, mundos)…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f1f5f9',
            fontSize: 13,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {query.trim().length >= 2 && (
        <div
          style={{
            marginTop: 6,
            backgroundColor: '#11151f',
            border: '1px solid #2b3448',
            borderRadius: 8,
            maxHeight: 280,
            overflowY: 'auto',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {hits.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>
              Nenhum resultado encontrado nos workspaces.
            </div>
          ) : (
            hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  switchWorkspace(hit.workspaceId, hit.targetView);
                  if (hit.sceneId) {
                    setActiveSceneId(hit.sceneId);
                  }
                  setQuery('');
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: '#0c1018',
                  border: '1px solid #1e2536',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: '#1e293b', color: '#93c5fd', fontWeight: 600 }}>
                    {hit.kind}
                  </span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{hit.label}</span>
                  <span style={{ color: '#64748b', marginLeft: 'auto', fontSize: 11 }}>{hit.workspaceTitle}</span>
                </div>
                {hit.excerpt && (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{hit.excerpt}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
