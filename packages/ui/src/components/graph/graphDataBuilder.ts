import type {
  EntityRelationship,
  ProjectData,
  RelationshipType,
} from '../../types/project';

export type ScopeFilter = 'all' | 'character' | 'faction' | 'location' | 'system_object';

export interface GraphNode {
  id: string;
  name: string;
  kind: 'character' | 'faction' | 'location' | 'system' | 'object';
  subtitle: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  type: RelationshipType;
  strength: number;
  sentiment: number;
}

export interface OneHopNeighborhood {
  neighborNodeIds: Set<string>;
  incidentLinkIds: Set<string>;
}

export const REL_COLORS: Record<RelationshipType, string> = {
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

export const REL_LABELS_PT: Record<RelationshipType, string> = {
  ally: 'Aliado',
  friend: 'Amigo',
  family: 'Família',
  romantic: 'Romântico',
  mentor: 'Mentor',
  enemy: 'Inimigo',
  rival: 'Rival',
  war: 'Em Guerra',
  vassal: 'Vassalo',
  sovereign: 'Suserano',
  trade: 'Comércio / Rota',
  infiltrator: 'Infiltrado',
  exiled_member: 'Ex-Membro / Exilado',
  acquaintance: 'Conhecido / Vínculo',
};

function resolveEndpointId(endpoint: string | GraphNode): string {
  return typeof endpoint === 'object' && endpoint !== null
    ? String(endpoint.id)
    : String(endpoint);
}

/**
 * Pure helper returning direct 1-hop adjacent node IDs (excluding centerNodeId)
 * and all incident link IDs connected to centerNodeId.
 */
export function computeOneHopNeighborhood(
  links: GraphLink[],
  centerNodeId: string | null
): OneHopNeighborhood {
  const neighborNodeIds = new Set<string>();
  const incidentLinkIds = new Set<string>();
  if (!centerNodeId) return { neighborNodeIds, incidentLinkIds };

  for (const link of links) {
    const srcId = resolveEndpointId(link.source);
    const tgtId = resolveEndpointId(link.target);
    if (srcId === centerNodeId) {
      incidentLinkIds.add(link.id);
      if (tgtId !== centerNodeId) neighborNodeIds.add(tgtId);
    } else if (tgtId === centerNodeId) {
      incidentLinkIds.add(link.id);
      if (srcId !== centerNodeId) neighborNodeIds.add(srcId);
    }
  }
  return { neighborNodeIds, incidentLinkIds };
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function buildFilteredGraphData(
  project: ProjectData,
  scope: ScopeFilter
): { nodes: GraphNode[]; links: GraphLink[]; allEntities: GraphNode[] } {
  const allLocations = project.worlds.flatMap((w) => w.locations ?? []);
  const allSystems = project.worlds.flatMap((w) => w.systems ?? []);

  const nodeList: GraphNode[] = [
    ...project.characters.map((c) => ({
      id: c.id,
      name: c.name,
      kind: 'character' as const,
      subtitle: c.role,
      color: '#3b82f6',
      val: 9,
    })),
    ...project.factions.map((f) => ({
      id: f.id,
      name: f.name,
      kind: 'faction' as const,
      subtitle: f.subtype,
      color: '#ef4444',
      val: 12,
    })),
    ...allLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      kind: 'location' as const,
      subtitle: loc.type,
      color: '#10b981',
      val: 10,
    })),
    ...allSystems.map((sys) => ({
      id: sys.id,
      name: sys.name,
      kind: 'system' as const,
      subtitle: sys.subtype,
      color: '#a855f7',
      val: 10,
    })),
    ...project.objects.map((obj) => ({
      id: obj.id,
      name: obj.name,
      kind: 'object' as const,
      subtitle: obj.type,
      color: '#f59e0b',
      val: 7,
    })),
  ];

  const filteredNodes = nodeList.filter((n) => {
    if (scope === 'all') return true;
    if (scope === 'system_object') return n.kind === 'system' || n.kind === 'object';
    return n.kind === scope;
  });

  const visibleIds = new Set(filteredNodes.map((n) => n.id));
  const linkList: GraphLink[] = [];
  const seenLinkIds = new Set<string>();
  const seenDirectedRels = new Set<string>();
  const connectedPairs = new Set<string>();

  const pushCustomRel = (sourceId: string, rel: EntityRelationship) => {
    if (!visibleIds.has(sourceId) || !visibleIds.has(rel.targetId) || sourceId === rel.targetId) {
      return;
    }
    const directedKey = `${sourceId}::${rel.targetId}::${rel.type}`;
    if (seenLinkIds.has(rel.id) || seenDirectedRels.has(directedKey)) return;
    seenLinkIds.add(rel.id);
    seenDirectedRels.add(directedKey);
    connectedPairs.add(pairKey(sourceId, rel.targetId));
    linkList.push({
      id: rel.id,
      source: sourceId,
      target: rel.targetId,
      label: rel.label,
      type: rel.type,
      strength: rel.strength,
      sentiment: rel.sentiment,
    });
  };

  const pushStructural = (
    id: string,
    source: string,
    target: string,
    label: string,
    type: RelationshipType,
    strength: number,
    sentiment: number
  ) => {
    if (!visibleIds.has(source) || !visibleIds.has(target) || source === target) return;
    const key = pairKey(source, target);
    if (seenLinkIds.has(id) || connectedPairs.has(key)) return;
    seenLinkIds.add(id);
    connectedPairs.add(key);
    linkList.push({ id, source, target, label, type, strength, sentiment });
  };

  // Pass 1: Explicit custom relationships across all 5 entity kinds
  for (const entity of [
    ...project.characters,
    ...project.factions,
    ...allLocations,
    ...allSystems,
    ...project.objects,
  ]) {
    for (const rel of entity.relationships ?? []) {
      pushCustomRel(entity.id, rel);
    }
  }

  // Pass 2: Intrinsic structural links (deduplicated against Pass 1 and each other)
  for (const f of project.factions) {
    if (f.leaderCharacterId) {
      pushStructural(`ldr_${f.id}_${f.leaderCharacterId}`, f.leaderCharacterId, f.id, 'Líder da Facção', 'sovereign', 9, 0.7);
    }
    if (f.headquartersLocationId) {
      pushStructural(`hq_${f.id}_${f.headquartersLocationId}`, f.id, f.headquartersLocationId, 'Sede da Facção', 'sovereign', 8, 0.6);
    }
    for (const locId of f.controlledLocationIds ?? []) {
      pushStructural(`ctrl_${f.id}_${locId}`, f.id, locId, 'Controla Território', 'sovereign', 8, 0.6);
    }
  }

  for (const c of project.characters) {
    if (c.factionId) {
      pushStructural(`imp_fac_${c.id}_${c.factionId}`, c.id, c.factionId, 'Membro / Vínculo', 'ally', 6, 0.5);
    }
    if (c.locationId) {
      pushStructural(`imp_loc_${c.id}_${c.locationId}`, c.id, c.locationId, 'Presente em', 'acquaintance', 4, 0);
    }
  }

  for (const loc of allLocations) {
    if (loc.controlledByFactionId) {
      pushStructural(`ctrl_${loc.controlledByFactionId}_${loc.id}`, loc.controlledByFactionId, loc.id, 'Controla Território', 'sovereign', 8, 0.6);
    }
    for (const targetLocId of loc.connectedLocationIds ?? []) {
      const [first, second] = loc.id < targetLocId ? [loc.id, targetLocId] : [targetLocId, loc.id];
      pushStructural(`route_${first}_${second}`, loc.id, targetLocId, 'Rota / Fronteira', 'trade', 5, 0.2);
    }
  }

  for (const sys of allSystems) {
    for (const pracId of sys.knownPractitionerIds ?? []) {
      pushStructural(`sys_${sys.id}_${pracId}`, pracId, sys.id, 'Domina Sistema', 'mentor', 7, 0.5);
    }
  }

  for (const obj of project.objects) {
    if (obj.ownerCharacterId) {
      pushStructural(`obj_${obj.id}_${obj.ownerCharacterId}`, obj.ownerCharacterId, obj.id, 'Possui Objeto', 'ally', 7, 0.6);
    }
    if (obj.factionId) {
      pushStructural(`obj_fac_${obj.id}_${obj.factionId}`, obj.factionId, obj.id, 'Custódia da Facção', 'ally', 6, 0.4);
    }
    if (obj.locationId) {
      pushStructural(`obj_loc_${obj.id}_${obj.locationId}`, obj.id, obj.locationId, 'Localizado em', 'acquaintance', 4, 0);
    }
    for (const charId of obj.linkedCharacterIds ?? []) {
      pushStructural(`obj_char_${obj.id}_${charId}`, charId, obj.id, 'Vinculado ao Objeto', 'acquaintance', 5, 0.2);
    }
  }

  return { nodes: filteredNodes, links: linkList, allEntities: nodeList };
}
