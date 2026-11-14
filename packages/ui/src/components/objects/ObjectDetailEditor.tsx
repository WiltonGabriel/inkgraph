import { useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { StoryObject, StoryObjectType } from '../../types/project';

interface ObjectDetailEditorProps {
  selectedGroupId: string | null;
}

const OBJECT_TYPE_LABELS: Record<StoryObjectType, string> = {
  artifact: 'Artefato',
  weapon: 'Arma',
  document: 'Documento',
  prop: 'Objeto Comum',
  vehicle: 'Veículo',
  'place-item': 'Item de Cenário',
  other: 'Outro',
};

export function ObjectDetailEditor({ selectedGroupId }: ObjectDetailEditorProps) {
  const { project, upsertObject, deleteObject } = useProject();
  const filtered = project.objects.filter(
    (o) => !selectedGroupId || o.groupId === selectedGroupId
  );

  const [selectedId, setSelectedId] = useState<string>(filtered[0]?.id ?? '');
  const selectedObj =
    filtered.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  const handleCreate = () => {
    const newObj: StoryObject = {
      id: `obj_${Date.now()}`,
      name: `Novo Objeto ${project.objects.length + 1}`,
      type: 'artifact',
      groupId: selectedGroupId ?? undefined,
      status: 'Ativo',
      description: '',
      significance: '',
      rulesOrCapabilities: '',
      linkedCharacterIds: [],
      linkedSceneIds: [],
      notes: '',
    };
    upsertObject(newObj);
    setSelectedId(newObj.id);
  };

  const updateField = (patch: Partial<StoryObject>) => {
    if (!selectedObj) return;
    upsertObject({ ...selectedObj, ...patch });
  };

  const toggleSceneLink = (sceneId: string) => {
    if (!selectedObj) return;
    const exists = selectedObj.linkedSceneIds.includes(sceneId);
    updateField({
      linkedSceneIds: exists
        ? selectedObj.linkedSceneIds.filter((id) => id !== sceneId)
        : [...selectedObj.linkedSceneIds, sceneId],
    });
  };

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, overflow: 'hidden' }}>
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #111623)',
          border: '1px solid var(--border-subtle, #263046)',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle, #263046)', backgroundColor: 'var(--bg-elevated, #171d2e)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            <Package size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} /> Objetos ({filtered.length})
          </span>
          <button
            onClick={handleCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 5,
              backgroundColor: 'var(--accent-primary, #3b82f6)',
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            <Plus size={13} /> Novo
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {filtered.map((o) => {
            const active = o.id === selectedObj?.id;
            return (
              <div
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: active ? 'var(--bg-hover, #1f273d)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent-primary, #3b82f6)' : 'transparent'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)' }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748b)' }}>
                    {OBJECT_TYPE_LABELS[o.type]}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteObject(o.id);
                  }}
                  style={{ background: 'transparent', color: 'var(--text-muted, #64748b)', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-surface, #111623)',
          border: '1px solid var(--border-subtle, #263046)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 16,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {selectedObj ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 10 }}>
              <div>
                <label style={lbl}>Nome do Objeto</label>
                <input
                  value={selectedObj.name}
                  onChange={(e) => updateField({ name: e.target.value })}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Categoria</label>
                <select
                  value={selectedObj.type}
                  onChange={(e) => updateField({ type: e.target.value as StoryObjectType })}
                  style={inp}
                >
                  {Object.entries(OBJECT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Grupo</label>
                <select
                  value={selectedObj.groupId ?? ''}
                  onChange={(e) => updateField({ groupId: e.target.value || undefined })}
                  style={inp}
                >
                  <option value="">Sem grupo</option>
                  {project.objectGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Personagem Portador</label>
                <select
                  value={selectedObj.ownerCharacterId ?? ''}
                  onChange={(e) => updateField({ ownerCharacterId: e.target.value || undefined })}
                  style={inp}
                >
                  <option value="">Nenhum</option>
                  {project.characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Facção Vinculada</label>
                <select
                  value={selectedObj.factionId ?? ''}
                  onChange={(e) => updateField({ factionId: e.target.value || undefined })}
                  style={inp}
                >
                  <option value="">Nenhuma</option>
                  {project.factions.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Significado Narrativo</label>
              <textarea
                rows={2}
                value={selectedObj.significance}
                onChange={(e) => updateField({ significance: e.target.value })}
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Regras e Capacidades</label>
              <textarea
                rows={2}
                value={selectedObj.rulesOrCapabilities}
                onChange={(e) => updateField({ rulesOrCapabilities: e.target.value })}
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Cenas Vinculadas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {project.scenes.map((s) => {
                  const active = selectedObj.linkedSceneIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSceneLink(s.id)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        backgroundColor: active ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-elevated, #171d2e)',
                        border: `1px solid ${active ? 'var(--accent-primary, #3b82f6)' : 'var(--border-subtle, #263046)'}`,
                        color: active ? '#fff' : 'var(--text-secondary, #94a3b8)',
                      }}
                    >
                      #{s.chapterNumber} {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 12.5 }}>Selecione ou crie um objeto.</div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--text-secondary, #94a3b8)',
  marginBottom: 4,
};

const inp: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-elevated, #171d2e)',
  border: '1px solid var(--border-subtle, #263046)',
  borderRadius: 'var(--radius-sm, 6px)',
  padding: '6px 9px',
  fontSize: 12,
  color: 'var(--text-primary, #f1f5f9)',
};
