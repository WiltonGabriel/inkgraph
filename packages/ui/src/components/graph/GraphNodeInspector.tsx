import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  type EntityRelationship,
  type EpistemicSecret,
} from '../../types/project';
import { CompletenessRing } from '../ui/CompletenessRing';
import type { GraphNode } from './graphDataBuilder';
import {
  GraphInspectorAttributes,
  type SelectedGraphEntity,
} from './GraphInspectorAttributes';
import { GraphInspectorRelations } from './GraphInspectorRelations';
import { GraphInspectorEpistemic } from './GraphInspectorEpistemic';

interface GraphNodeInspectorProps {
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
  allEntities: GraphNode[];
  onOpenDossier?: (node: GraphNode) => void;
}

type InspectorTabId = 'formulation' | 'deep' | 'relations' | 'epistemic';

type EntityMetaPatch = {
  relationships?: EntityRelationship[];
  epistemicSecrets?: EpistemicSecret[];
};

export function GraphNodeInspector({
  selectedNodeId,
  setSelectedNodeId,
  allEntities,
  onOpenDossier,
}: GraphNodeInspectorProps) {
  const { project, upsertCharacter, upsertFaction, upsertWorld, upsertObject } = useProject();
  const [inspectorTab, setInspectorTab] = useState<InspectorTabId>('formulation');

  const allLocationsWithWorld = useMemo(
    () => project.worlds.flatMap((world) => (world.locations ?? []).map((loc) => ({ world, loc }))),
    [project.worlds]
  );

  const allSystemsWithWorld = useMemo(
    () => project.worlds.flatMap((world) => (world.systems ?? []).map((sys) => ({ world, sys }))),
    [project.worlds]
  );

  const selectedEntity = useMemo<SelectedGraphEntity | null>(() => {
    const char = project.characters.find((c) => c.id === selectedNodeId);
    if (char) return { kind: 'character', entity: char };

    const faction = project.factions.find((f) => f.id === selectedNodeId);
    if (faction) return { kind: 'faction', entity: faction };

    const locMatch = allLocationsWithWorld.find((item) => item.loc.id === selectedNodeId);
    if (locMatch) return { kind: 'location', entity: locMatch.loc, world: locMatch.world };

    const sysMatch = allSystemsWithWorld.find((item) => item.sys.id === selectedNodeId);
    if (sysMatch) return { kind: 'system', entity: sysMatch.sys, world: sysMatch.world };

    const obj = project.objects.find((o) => o.id === selectedNodeId);
    if (obj) return { kind: 'object', entity: obj };

    return null;
  }, [
    selectedNodeId,
    project.characters,
    project.factions,
    project.objects,
    allLocationsWithWorld,
    allSystemsWithWorld,
  ]);

  const supportsDeepTab =
    selectedEntity?.kind === 'character' || selectedEntity?.kind === 'faction';

  useEffect(() => {
    if (!supportsDeepTab && inspectorTab === 'deep') {
      setInspectorTab('formulation');
    }
  }, [supportsDeepTab, inspectorTab]);

  const effectiveTab: InspectorTabId =
    !supportsDeepTab && inspectorTab === 'deep' ? 'formulation' : inspectorTab;

  const tabs: { id: InspectorTabId; label: string }[] = [
    { id: 'formulation', label: '1. Perfil & Formulação' },
    ...(supportsDeepTab
      ? [
          {
            id: 'deep' as const,
            label:
              selectedEntity?.kind === 'faction'
                ? '2. Poder & Hierarquia'
                : '2. Psicologia & Arco',
          },
        ]
      : []),
    { id: 'relations', label: '3. Relações & Grafo' },
    { id: 'epistemic', label: '4. Epistêmico' },
  ];

  const patchEntityMeta = (patch: EntityMetaPatch) => {
    if (!selectedEntity) return;
    switch (selectedEntity.kind) {
      case 'character':
        upsertCharacter({ ...selectedEntity.entity, ...patch });
        return;
      case 'faction':
        upsertFaction({ ...selectedEntity.entity, ...patch });
        return;
      case 'location':
        upsertWorld({
          ...selectedEntity.world,
          locations: selectedEntity.world.locations.map((loc) =>
            loc.id === selectedEntity.entity.id ? { ...loc, ...patch } : loc
          ),
        });
        return;
      case 'system':
        upsertWorld({
          ...selectedEntity.world,
          systems: selectedEntity.world.systems.map((sys) =>
            sys.id === selectedEntity.entity.id ? { ...sys, ...patch } : sys
          ),
        });
        return;
      case 'object':
        upsertObject({ ...selectedEntity.entity, ...patch });
        return;
    }
  };

  const currentNode = allEntities.find((e) => e.id === selectedNodeId);

  return (
    <aside
      aria-label="Inspetor de Entidade no Grafo"
      style={{
        width: 'clamp(320px, 34vw, 450px)',
        minWidth: 0,
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <label
              htmlFor="graph-inspector-entity-select"
              style={{
                fontSize: 10.5,
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              Dossiê & Formulação no Grafo
            </label>
            {onOpenDossier && currentNode && (
              <button
                type="button"
                onClick={() => onOpenDossier(currentNode)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 7px',
                  minHeight: 24,
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={11} aria-hidden="true" />
                Abrir Dossiê
              </button>
            )}
          </div>

          <select
            id="graph-inspector-entity-select"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            style={{
              marginTop: 5,
              width: '100%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '6px 8px',
              color: 'var(--text-primary)',
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            <optgroup label="Personagens">
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </optgroup>
            <optgroup label="Facções & Organizações">
              {project.factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.subtype})
                </option>
              ))}
            </optgroup>
            <optgroup label="Locais">
              {allLocationsWithWorld.map(({ loc }) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </optgroup>
            <optgroup label="Sistemas & Regras">
              {allSystemsWithWorld.map(({ sys }) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name} ({sys.subtype})
                </option>
              ))}
            </optgroup>
            <optgroup label="Objetos">
              {project.objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {selectedEntity?.kind === 'character' && (
          <CompletenessRing
            percent={calculateCharacterCompleteness(selectedEntity.entity)}
            size={42}
          />
        )}
        {selectedEntity?.kind === 'faction' && (
          <CompletenessRing
            percent={calculateFactionCompleteness(selectedEntity.entity)}
            size={42}
          />
        )}
      </div>

      <div
        role="tablist"
        aria-label="Seções do inspetor"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        {tabs.map((tab) => {
          const active = effectiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setInspectorTab(tab.id)}
              style={{
                flex: 1,
                padding: '9px 6px',
                border: 'none',
                borderBottom: active
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
                backgroundColor: 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {!selectedEntity && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Selecione uma entidade no grafo ou na lista acima para editar seu dossiê.
          </div>
        )}

        {selectedEntity && (effectiveTab === 'formulation' || effectiveTab === 'deep') && (
          <GraphInspectorAttributes
            selected={selectedEntity}
            mode={effectiveTab}
            onUpdateCharacter={upsertCharacter}
            onUpdateFaction={upsertFaction}
            onUpdateWorld={upsertWorld}
            onUpdateObject={upsertObject}
          />
        )}

        {selectedEntity && effectiveTab === 'relations' && (
          <GraphInspectorRelations
            entityId={selectedEntity.entity.id}
            relationships={selectedEntity.entity.relationships ?? []}
            allEntities={allEntities}
            onUpdateRelationships={(relationships) => patchEntityMeta({ relationships })}
            onSelectNode={setSelectedNodeId}
          />
        )}

        {selectedEntity && effectiveTab === 'epistemic' && (
          <GraphInspectorEpistemic
            entityId={selectedEntity.entity.id}
            secrets={selectedEntity.entity.epistemicSecrets ?? []}
            allEntities={allEntities}
            scenes={project.scenes}
            onUpdateSecrets={(epistemicSecrets) => patchEntityMeta({ epistemicSecrets })}
          />
        )}
      </div>
    </aside>
  );
}
