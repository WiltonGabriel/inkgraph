import { useState, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import {
  Network,
  Table,
  Plus,
  Trash2,
  Shield,
  Users,
  MapPin,
  Cpu,
  Lock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  type EntityRelationship,
  type RelationshipType,
} from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';

type ScopeFilter = 'all' | 'character' | 'faction' | 'location' | 'system_object';

interface GraphNode {
  id: string;
  name: string;
  kind: 'character' | 'faction' | 'location' | 'system' | 'object';
  subtitle: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  type: RelationshipType;
  strength: number;
  sentiment: number;
}

const REL_COLORS: Record<RelationshipType, string> = {
  family: '#f59e0b',
  romantic: '#ec4899',
  friend: '#10b981',
  ally: '#34d399',
  mentor: '#60a5fa',
  enemy: '#ef4444',
  rival: '#f97316',
  war: '#dc2626',
  vassal: '#a78bfa',
  sovereign: '#c084fc',
  trade: '#fbbf24',
  infiltrator: '#2dd4bf',
  exiled_member: '#9ca3af',
  acquaintance: '#6b7280',
};

export function PhysicsForceGraphView() {
  const {
    project,
    upsertCharacter,
    upsertFaction,
    upsertWorld,
    upsertObject,
  } = useProject();

  const [scope, setScope] = useState<ScopeFilter>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    project.characters[0]?.id ?? 'char_elias_vance'
  );
  const [inspectorTab, setInspectorTab] = useState<
    'formulation' | 'deep' | 'relations' | 'epistemic'
  >('formulation');

  // Form state for adding a new relationship directly from the graph inspector
  const [newRelTargetId, setNewRelTargetId] = useState<string>('');
  const [newRelType, setNewRelType] = useState<RelationshipType>('ally');
  const [newRelLabel, setNewRelLabel] = useState<string>('');
  const [newRelStrength, setNewRelStrength] = useState<number>(7);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 760, height: 640 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(360, containerRef.current.clientWidth),
          height: Math.max(420, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [viewMode]);

  const primaryWorld = project.worlds[0];

  const { nodes, links, allEntities } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];

    for (const c of project.characters) {
      nodeList.push({
        id: c.id,
        name: c.name,
        kind: 'character',
        subtitle: c.role,
        color: '#3b82f6',
        val: 9,
      });
    }

    for (const f of project.factions) {
      nodeList.push({
        id: f.id,
        name: f.name,
        kind: 'faction',
        subtitle: f.subtype,
        color: '#ef4444',
        val: 12,
      });
    }

    for (const loc of primaryWorld?.locations ?? []) {
      nodeList.push({
        id: loc.id,
        name: loc.name,
        kind: 'location',
        subtitle: loc.type,
        color: '#10b981',
        val: 10,
      });
    }

    for (const sys of primaryWorld?.systems ?? []) {
      nodeList.push({
        id: sys.id,
        name: sys.name,
        kind: 'system',
        subtitle: sys.subtype,
        color: '#a855f7',
        val: 10,
      });
    }

    for (const obj of project.objects) {
      nodeList.push({
        id: obj.id,
        name: obj.name,
        kind: 'object',
        subtitle: obj.type,
        color: '#f59e0b',
        val: 7,
      });
    }

    // Filter nodes by scope
    const filteredNodes = nodeList.filter((n) => {
      if (scope === 'all') return true;
      if (scope === 'character') return n.kind === 'character';
      if (scope === 'faction') return n.kind === 'faction';
      if (scope === 'location') return n.kind === 'location';
      if (scope === 'system_object')
        return n.kind === 'system' || n.kind === 'object';
      return true;
    });

    const visibleIds = new Set(filteredNodes.map((n) => n.id));

    // Character relationships & implicit links
    for (const c of project.characters) {
      for (const rel of c.relationships) {
        if (visibleIds.has(c.id) && visibleIds.has(rel.targetId)) {
          linkList.push({
            id: rel.id,
            source: c.id,
            target: rel.targetId,
            label: rel.label,
            type: rel.type,
            strength: rel.strength,
            sentiment: rel.sentiment,
          });
        }
      }
      if (c.factionId && visibleIds.has(c.id) && visibleIds.has(c.factionId)) {
        const alreadyLinked = c.relationships.some(
          (r) => r.targetId === c.factionId
        );
        if (!alreadyLinked) {
          linkList.push({
            id: `imp_fac_${c.id}_${c.factionId}`,
            source: c.id,
            target: c.factionId,
            label: 'Membro / Vínculo',
            type: 'ally',
            strength: 6,
            sentiment: 0.5,
          });
        }
      }
      if (c.locationId && visibleIds.has(c.id) && visibleIds.has(c.locationId)) {
        linkList.push({
          id: `imp_loc_${c.id}_${c.locationId}`,
          source: c.id,
          target: c.locationId,
          label: 'Presente em',
          type: 'acquaintance',
          strength: 4,
          sentiment: 0,
        });
      }
    }

    // Faction relationships & territorial control
    for (const f of project.factions) {
      for (const rel of f.relationships) {
        if (visibleIds.has(f.id) && visibleIds.has(rel.targetId)) {
          linkList.push({
            id: rel.id,
            source: f.id,
            target: rel.targetId,
            label: rel.label,
            type: rel.type,
            strength: rel.strength,
            sentiment: rel.sentiment,
          });
        }
      }
      for (const locId of f.controlledLocationIds) {
        if (visibleIds.has(f.id) && visibleIds.has(locId)) {
          linkList.push({
            id: `ctrl_${f.id}_${locId}`,
            source: f.id,
            target: locId,
            label: 'Controla Território',
            type: 'sovereign',
            strength: 8,
            sentiment: 0.6,
          });
        }
      }
    }

    // Location trade/border routes
    for (const loc of primaryWorld?.locations ?? []) {
      for (const targetLocId of loc.connectedLocationIds) {
        if (
          visibleIds.has(loc.id) &&
          visibleIds.has(targetLocId) &&
          loc.id < targetLocId
        ) {
          linkList.push({
            id: `route_${loc.id}_${targetLocId}`,
            source: loc.id,
            target: targetLocId,
            label: 'Rota / Fronteira',
            type: 'trade',
            strength: 5,
            sentiment: 0.2,
          });
        }
      }
    }

    // Systems & Objects links
    for (const sys of primaryWorld?.systems ?? []) {
      for (const pracId of sys.knownPractitionerIds) {
        if (visibleIds.has(sys.id) && visibleIds.has(pracId)) {
          linkList.push({
            id: `sys_${sys.id}_${pracId}`,
            source: pracId,
            target: sys.id,
            label: 'Domina Sistema',
            type: 'mentor',
            strength: 7,
            sentiment: 0.5,
          });
        }
      }
    }

    for (const obj of project.objects) {
      if (
        obj.ownerCharacterId &&
        visibleIds.has(obj.id) &&
        visibleIds.has(obj.ownerCharacterId)
      ) {
        linkList.push({
          id: `obj_${obj.id}_${obj.ownerCharacterId}`,
          source: obj.ownerCharacterId,
          target: obj.id,
          label: 'Possui Objeto',
          type: 'ally',
          strength: 7,
          sentiment: 0.6,
        });
      }
    }

    return { nodes: filteredNodes, links: linkList, allEntities: nodeList };
  }, [project, primaryWorld, scope]);

  // Selected entity resolution
  const selectedChar = project.characters.find((c) => c.id === selectedNodeId);
  const selectedFaction = project.factions.find((f) => f.id === selectedNodeId);
  const selectedLocation = primaryWorld?.locations.find(
    (l) => l.id === selectedNodeId
  );
  const selectedSystem = primaryWorld?.systems.find(
    (s) => s.id === selectedNodeId
  );
  const selectedObject = project.objects.find((o) => o.id === selectedNodeId);

  const handleAddRelationship = () => {
    if (!newRelTargetId || !newRelLabel.trim()) return;
    const targetNode = allEntities.find((e) => e.id === newRelTargetId);
    if (!targetNode) return;

    const newRel: EntityRelationship = {
      id: `rel_${Date.now()}`,
      targetId: targetNode.id,
      targetKind: targetNode.kind,
      type: newRelType,
      label: newRelLabel.trim(),
      strength: newRelStrength,
      sentiment:
        newRelType === 'enemy' || newRelType === 'war' || newRelType === 'rival'
          ? -0.8
          : 0.7,
    };

    if (selectedChar) {
      upsertCharacter({
        ...selectedChar,
        relationships: [...selectedChar.relationships, newRel],
      });
    } else if (selectedFaction) {
      upsertFaction({
        ...selectedFaction,
        relationships: [...selectedFaction.relationships, newRel],
      });
    }
    setNewRelLabel('');
  };

  const handleDeleteRelationship = (relId: string) => {
    if (selectedChar) {
      upsertCharacter({
        ...selectedChar,
        relationships: selectedChar.relationships.filter((r) => r.id !== relId),
      });
    } else if (selectedFaction) {
      upsertFaction({
        ...selectedFaction,
        relationships: selectedFaction.relationships.filter((r) => r.id !== relId),
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
        backgroundColor: '#090b10',
      }}
    >
      {/* Left: Graph Canvas or Table View */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1b202c',
          minWidth: 0,
        }}
      >
        {/* Filter & Scope Toolbar */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#0e121b',
            borderBottom: '1px solid #1b202c',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {/* Layer Scope Buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Visão Completa', icon: Network, color: '#60a5fa' },
              { id: 'character', label: 'Só Personagens', icon: Users, color: '#3b82f6' },
              { id: 'faction', label: 'Só Facções', icon: Shield, color: '#ef4444' },
              { id: 'location', label: 'Só Locais & Rotas', icon: MapPin, color: '#10b981' },
              { id: 'system_object', label: 'Sistemas & Objetos', icon: Cpu, color: '#a855f7' },
            ].map((btn) => {
              const Icon = btn.icon;
              const active = scope === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setScope(btn.id as ScopeFilter)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 11px',
                    borderRadius: 6,
                    border: active ? `1px solid ${btn.color}` : '1px solid #232a3b',
                    backgroundColor: active ? 'rgba(59, 130, 246, 0.14)' : '#141824',
                    color: active ? '#f9fafb' : '#9ca3af',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={13} color={btn.color} />
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Graph vs Table Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, color: '#6b7280', marginRight: 4 }}>
              {nodes.length} nós · {links.length} vínculos
            </span>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid #262e40',
                backgroundColor: viewMode === 'graph' ? '#2563eb' : '#141824',
                color: '#fff',
                fontSize: 11.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Network size={13} /> Gráfico
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid #262e40',
                backgroundColor: viewMode === 'table' ? '#2563eb' : '#141824',
                color: '#fff',
                fontSize: 11.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Table size={13} /> Tabela
            </button>
          </div>
        </div>

        {/* Canvas or Accessible Table */}
        <div
          ref={containerRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        >
          {viewMode === 'graph' ? (
            <>
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes, links }}
                backgroundColor="#080a0f"
                nodeRelSize={6}
                linkWidth={(link) => Math.max(1.5, ((link as GraphLink).strength || 5) * 0.35)}
                linkColor={(link) =>
                  REL_COLORS[(link as GraphLink).type] ?? '#4b5563'
                }
                linkDirectionalArrowLength={5}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node) => {
                  setSelectedNodeId(String((node as GraphNode).id));
                }}
                nodeCanvasObject={(nodeObj, ctx, globalScale) => {
                  const n = nodeObj as GraphNode;
                  const x = n.x ?? 0;
                  const y = n.y ?? 0;
                  const isSelected = n.id === selectedNodeId;
                  const r = n.kind === 'faction' ? 9 : 7;

                  if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(x, y, r + 4, 0, 2 * Math.PI, false);
                    ctx.fillStyle = 'rgba(96, 165, 250, 0.28)';
                    ctx.fill();
                  }

                  ctx.beginPath();
                  if (n.kind === 'faction') {
                    // Hexagon for factions
                    for (let i = 0; i < 6; i++) {
                      const angle = (Math.PI / 3) * i;
                      const hx = x + r * Math.cos(angle);
                      const hy = y + r * Math.sin(angle);
                      if (i === 0) ctx.moveTo(hx, hy);
                      else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                  } else if (n.kind === 'location') {
                    // Square/Diamond for locations
                    ctx.rect(x - r, y - r, r * 2, r * 2);
                  } else {
                    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
                  }
                  ctx.fillStyle = n.color;
                  ctx.fill();
                  ctx.lineWidth = isSelected ? 2.2 : 1;
                  ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
                  ctx.stroke();

                  const fontSize = Math.max(10, 12 / globalScale);
                  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = '#f3f4f6';
                  ctx.fillText(n.name, x, y + r + 3);
                }}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(linkObj, ctx, globalScale) => {
                  const l = linkObj as GraphLink;
                  const start = l.source as GraphNode;
                  const end = l.target as GraphNode;
                  if (typeof start !== 'object' || typeof end !== 'object') return;
                  if (start.x === undefined || start.y === undefined || end.x === undefined || end.y === undefined) return;
                  const mx = (start.x + end.x) / 2;
                  const my = (start.y + end.y) / 2;
                  const fontSize = Math.max(8, 10 / globalScale);
                  ctx.font = `${fontSize}px Inter, sans-serif`;
                  ctx.fillStyle = '#9ca3af';
                  ctx.textAlign = 'center';
                  ctx.fillText(l.label, mx, my - 3);
                }}
              />

              {/* Legend Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(13, 17, 26, 0.9)',
                  border: '1px solid #22293a',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 12,
                  fontSize: 11,
                  color: '#d1d5db',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  Personagem
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, backgroundColor: '#ef4444', transform: 'rotate(45deg)' }} />
                  Facção
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, backgroundColor: '#10b981' }} />
                  Local
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#a855f7' }} />
                  Sistema
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Objeto
                </span>
              </div>
            </>
          ) : (
            <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#f3f4f6' }}>
                Relacionamentos como Tabela Acessível ({links.length})
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12.5,
                  color: '#e5e7eb',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #242b3d', textAlign: 'left', color: '#9ca3af' }}>
                    <th style={{ padding: '8px 10px' }}>De</th>
                    <th style={{ padding: '8px 10px' }}>Para</th>
                    <th style={{ padding: '8px 10px' }}>Tipo</th>
                    <th style={{ padding: '8px 10px' }}>Descrição do Vínculo</th>
                    <th style={{ padding: '8px 10px' }}>Força (1–10)</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => {
                    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                    const srcName = allEntities.find((e) => e.id === srcId)?.name ?? srcId;
                    const tgtName = allEntities.find((e) => e.id === tgtId)?.name ?? tgtId;
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #181d29' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{srcName}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{tgtName}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 4,
                              backgroundColor: '#182032',
                              color: REL_COLORS[l.type] ?? '#9ca3af',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {l.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#d1d5db' }}>{l.label}</td>
                        <td style={{ padding: '8px 10px' }}>{l.strength}/10</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right: COMPLETE FORMULATION INSPECTOR & LIVE EDITOR */}
      <aside
        style={{
          width: 470,
          backgroundColor: '#0e1118',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
        }}
      >
        {/* Entity Selector Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #1b202c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700 }}>
              Dossiê & Formulação Completa no Grafo
            </div>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              style={{
                marginTop: 4,
                width: '100%',
                backgroundColor: '#151a26',
                border: '1px solid #283044',
                borderRadius: 6,
                padding: '6px 8px',
                color: '#f9fafb',
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
                {(primaryWorld?.locations ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sistemas & Objetos">
                {(primaryWorld?.systems ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subtype})
                  </option>
                ))}
                {project.objects.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.type})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {selectedChar && (
            <CompletenessRing percent={calculateCharacterCompleteness(selectedChar)} size={42} />
          )}
          {selectedFaction && (
            <CompletenessRing percent={calculateFactionCompleteness(selectedFaction)} size={42} />
          )}
        </div>

        {/* Multi-Tab Bar inside Graph Inspector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1b202c',
            backgroundColor: '#121620',
          }}
        >
          {[
            { id: 'formulation', label: '1. Perfil & Formulação' },
            { id: 'deep', label: selectedFaction ? '2. Poder & Hierarquia' : '2. Psicologia & Arco' },
            { id: 'relations', label: '3. Relações & Grafo' },
            { id: 'epistemic', label: '4. Epistêmico' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setInspectorTab(t.id as typeof inspectorTab)}
              style={{
                flex: 1,
                padding: '9px 6px',
                border: 'none',
                borderBottom:
                  inspectorTab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: inspectorTab === t.id ? '#60a5fa' : '#9ca3af',
                fontSize: 11.5,
                fontWeight: inspectorTab === t.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Inspector Body: 100% Complete Formulation + Direct Editing */}
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
          {/* CASE 1: CHARACTER SELECTED */}
          {selectedChar && inspectorTab === 'formulation' && (
            <>
              <Field label="Nome & Codinomes (Aliases)">
                <input
                  value={selectedChar.name}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, name: e.target.value })
                  }
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  Codinomes: {selectedChar.aliases.join(', ') || 'Nenhum'}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Papel Narrativo">
                  <input
                    value={selectedChar.role}
                    onChange={(e) =>
                      upsertCharacter({ ...selectedChar, role: e.target.value })
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Idade / Status">
                  <input
                    value={selectedChar.age ?? ''}
                    onChange={(e) =>
                      upsertCharacter({ ...selectedChar, age: e.target.value })
                    }
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Aparência Física & Presença">
                <textarea
                  rows={3}
                  value={selectedChar.appearance}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, appearance: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="História de Fundo (Backstory)">
                <textarea
                  rows={4}
                  value={selectedChar.backstory}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, backstory: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Motivação Central">
                <textarea
                  rows={2}
                  value={selectedChar.motivation}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, motivation: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Traços de Personalidade">
                <textarea
                  rows={2}
                  value={selectedChar.personalityTraits}
                  onChange={(e) =>
                    upsertCharacter({
                      ...selectedChar,
                      personalityTraits: e.target.value,
                    })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Imperfeições & Falhas (Flaws)">
                <textarea
                  rows={2}
                  value={selectedChar.flaws}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, flaws: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {selectedChar && inspectorTab === 'deep' && (
            <>
              <Field label="Desejo Consciente (Want)">
                <textarea
                  rows={2}
                  value={selectedChar.want}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, want: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Necessidade Inconsciente (Need)">
                <textarea
                  rows={2}
                  value={selectedChar.need}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, need: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Mentira em que Acredita (The Lie)">
                <textarea
                  rows={2}
                  value={selectedChar.lieBelieved}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, lieBelieved: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Fantasma / Trauma Passado (The Ghost)">
                <textarea
                  rows={2}
                  value={selectedChar.ghost}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, ghost: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Arco — Ato I (Configuração)">
                <textarea
                  rows={2}
                  value={selectedChar.arcAct1}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, arcAct1: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Arco — Ato II (Confronto)">
                <textarea
                  rows={2}
                  value={selectedChar.arcAct2}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, arcAct2: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Arco — Ato III (Resolução)">
                <textarea
                  rows={2}
                  value={selectedChar.arcAct3}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, arcAct3: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Notas de Voz & Detalhes">
                <textarea
                  rows={2}
                  value={selectedChar.notes}
                  onChange={(e) =>
                    upsertCharacter({ ...selectedChar, notes: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {/* CASE 2: FACTION SELECTED */}
          {selectedFaction && inspectorTab === 'formulation' && (
            <>
              <Field label="Nome da Facção">
                <input
                  value={selectedFaction.name}
                  onChange={(e) =>
                    upsertFaction({ ...selectedFaction, name: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Subtipo / Categoria">
                <input
                  value={selectedFaction.subtype}
                  onChange={(e) =>
                    upsertFaction({ ...selectedFaction, subtype: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Lema (Motto)">
                <input
                  value={selectedFaction.motto}
                  onChange={(e) =>
                    upsertFaction({ ...selectedFaction, motto: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Agenda Pública (Oficial)">
                <textarea
                  rows={2}
                  value={selectedFaction.publicAgenda}
                  onChange={(e) =>
                    upsertFaction({
                      ...selectedFaction,
                      publicAgenda: e.target.value,
                    })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Agenda Secreta (Real)">
                <textarea
                  rows={2}
                  value={selectedFaction.secretAgenda}
                  onChange={(e) =>
                    upsertFaction({
                      ...selectedFaction,
                      secretAgenda: e.target.value,
                    })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Doutrina & Ideologia">
                <textarea
                  rows={3}
                  value={selectedFaction.doctrine}
                  onChange={(e) =>
                    upsertFaction({ ...selectedFaction, doctrine: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="História de Fundação">
                <textarea
                  rows={3}
                  value={selectedFaction.history}
                  onChange={(e) =>
                    upsertFaction({ ...selectedFaction, history: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {selectedFaction && inspectorTab === 'deep' && (
            <>
              <Field label="Recursos, Efetivo Militar & Monopólios">
                <textarea
                  rows={3}
                  value={selectedFaction.resourcesAndPower}
                  onChange={(e) =>
                    upsertFaction({
                      ...selectedFaction,
                      resourcesAndPower: e.target.value,
                    })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Conflitos Internos & Cismas">
                <textarea
                  rows={3}
                  value={selectedFaction.internalConflicts}
                  onChange={(e) =>
                    upsertFaction({
                      ...selectedFaction,
                      internalConflicts: e.target.value,
                    })
                  }
                  style={textareaStyle}
                />
              </Field>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', marginTop: 6 }}>
                Estrutura Hierárquica ({selectedFaction.ranks.length} patentes)
              </div>
              {selectedFaction.ranks.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 10,
                    backgroundColor: '#151a26',
                    border: '1px solid #252d40',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#60a5fa' }}>
                    {r.title} (Autoridade {r.authorityLevel}/10)
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 11.5, marginTop: 3 }}>
                    {r.responsibilities}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* CASE 3: LOCATION, SYSTEM OR OBJECT SELECTED */}
          {selectedLocation && (
            <>
              <Field label="Nome do Local">
                <input
                  value={selectedLocation.name}
                  onChange={(e) => {
                    if (!primaryWorld) return;
                    upsertWorld({
                      ...primaryWorld,
                      locations: primaryWorld.locations.map((l) =>
                        l.id === selectedLocation.id
                          ? { ...l, name: e.target.value }
                          : l
                      ),
                    });
                  }}
                  style={inputStyle}
                />
              </Field>
              <Field label="População & Clima/Atmosfera">
                <textarea
                  rows={2}
                  value={`${selectedLocation.population ?? ''} — ${selectedLocation.climateOrAtmosphere}`}
                  readOnly
                  style={textareaStyle}
                />
              </Field>
              <Field label="Descrição Completa">
                <textarea
                  rows={3}
                  value={selectedLocation.description}
                  onChange={(e) => {
                    if (!primaryWorld) return;
                    upsertWorld({
                      ...primaryWorld,
                      locations: primaryWorld.locations.map((l) =>
                        l.id === selectedLocation.id
                          ? { ...l, description: e.target.value }
                          : l
                      ),
                    });
                  }}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Valor Estratégico & Controle">
                <textarea
                  rows={3}
                  value={selectedLocation.strategicValue}
                  onChange={(e) => {
                    if (!primaryWorld) return;
                    upsertWorld({
                      ...primaryWorld,
                      locations: primaryWorld.locations.map((l) =>
                        l.id === selectedLocation.id
                          ? { ...l, strategicValue: e.target.value }
                          : l
                      ),
                    });
                  }}
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {selectedSystem && (
            <>
              <Field label="Nome do Sistema & Subtipo">
                <input value={`${selectedSystem.name} (${selectedSystem.subtype})`} readOnly style={inputStyle} />
              </Field>
              <Field label="Fonte Primária">
                <textarea rows={2} value={selectedSystem.coreSource} readOnly style={textareaStyle} />
              </Field>
              <Field label="Leis Fundamentais">
                <textarea
                  rows={4}
                  value={selectedSystem.fundamentalRules.join('\n• ')}
                  readOnly
                  style={textareaStyle}
                />
              </Field>
              <Field label="Custo, Pedágio & Limites Absolutos">
                <textarea
                  rows={3}
                  value={`${selectedSystem.costsAndToll}\n\nLimites: ${selectedSystem.hardLimits.join('; ')}`}
                  readOnly
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {selectedObject && (
            <>
              <Field label="Nome do Objeto">
                <input
                  value={selectedObject.name}
                  onChange={(e) =>
                    upsertObject({ ...selectedObject, name: e.target.value })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  rows={3}
                  value={selectedObject.description}
                  onChange={(e) =>
                    upsertObject({ ...selectedObject, description: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
              <Field label="Significado Narrativo & Regras">
                <textarea
                  rows={3}
                  value={selectedObject.significance}
                  onChange={(e) =>
                    upsertObject({ ...selectedObject, significance: e.target.value })
                  }
                  style={textareaStyle}
                />
              </Field>
            </>
          )}

          {/* TAB 3: RELATIONSHIPS & LIVE GRAPH EDITOR */}
          {inspectorTab === 'relations' && (selectedChar || selectedFaction) && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f3f4f6', marginBottom: 8 }}>
                Vínculos Diretos ({(selectedChar?.relationships ?? selectedFaction?.relationships ?? []).length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(selectedChar?.relationships ?? selectedFaction?.relationships ?? []).map(
                  (rel) => {
                    const targetName =
                      allEntities.find((e) => e.id === rel.targetId)?.name ??
                      rel.targetId;
                    return (
                      <div
                        key={rel.id}
                        style={{
                          padding: '9px 11px',
                          backgroundColor: '#151a26',
                          border: '1px solid #252d40',
                          borderRadius: 7,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f3f4f6' }}>
                            → {targetName}{' '}
                            <span
                              style={{
                                fontSize: 10.5,
                                color: REL_COLORS[rel.type] ?? '#9ca3af',
                                marginLeft: 4,
                              }}
                            >
                              [{rel.type} · Força {rel.strength}/10]
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                            {rel.label}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRelationship(rel.id)}
                          title="Excluir vínculo"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Add new link directly on the graph */}
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#131824',
                  border: '1px solid #262f45',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
                  + Adicionar Novo Vínculo no Grafo
                </div>
                <select
                  value={newRelTargetId}
                  onChange={(e) => setNewRelTargetId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecione a entidade de destino...</option>
                  {allEntities
                    .filter((e) => e.id !== selectedNodeId)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        [{e.kind}] {e.name}
                      </option>
                    ))}
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select
                    value={newRelType}
                    onChange={(e) => setNewRelType(e.target.value as RelationshipType)}
                    style={inputStyle}
                  >
                    <option value="ally">Aliado</option>
                    <option value="enemy">Inimigo</option>
                    <option value="rival">Rival</option>
                    <option value="mentor">Mentor</option>
                    <option value="family">Família</option>
                    <option value="romantic">Romântico</option>
                    <option value="vassal">Vassalo</option>
                    <option value="sovereign">Suserano</option>
                    <option value="war">Em Guerra</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newRelStrength}
                    onChange={(e) => setNewRelStrength(Number(e.target.value))}
                    placeholder="Força (1-10)"
                    style={inputStyle}
                  />
                </div>
                <input
                  value={newRelLabel}
                  onChange={(e) => setNewRelLabel(e.target.value)}
                  placeholder="Descrição do vínculo (ex.: Pacto de Sangue, Chantagem...)"
                  style={inputStyle}
                />
                <button
                  onClick={handleAddRelationship}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={14} /> Conectar no Grafo
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EPISTEMIC SECRETS */}
          {inspectorTab === 'epistemic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#fbbf24',
                }}
              >
                <Lock size={14} /> Segredos Epistêmicos & Conhecimento Restrito
              </div>
              {(selectedChar?.epistemicSecrets ?? selectedFaction?.epistemicSecrets ?? []).map(
                (sec) => (
                  <div
                    key={sec.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#151a26',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: '#f3f4f6', fontWeight: 600, marginBottom: 6 }}>
                      “{sec.secret}”
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      Conhecido por:{' '}
                      <strong style={{ color: '#34d399' }}>
                        {sec.knownByIds
                          .map((id) => allEntities.find((e) => e.id === id)?.name ?? id)
                          .join(', ')}
                      </strong>
                    </div>
                    {sec.revealedInSceneId && (
                      <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 3 }}>
                        Revelado na cena: {sec.revealedInSceneId}
                      </div>
                    )}
                  </div>
                )
              )}
              {(selectedChar?.epistemicSecrets ?? selectedFaction?.epistemicSecrets ?? [])
                .length === 0 && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Nenhum segredo epistêmico restrito registrado para esta entidade.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '7px 10px',
  color: '#f3f4f6',
  fontSize: 12.5,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#e5e7eb',
  fontSize: 12,
  lineHeight: 1.45,
  resize: 'vertical',
};
