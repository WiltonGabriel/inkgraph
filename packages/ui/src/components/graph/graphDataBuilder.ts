import type { ProjectData, RelationshipType } from '../../types/project';

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

export function buildFilteredGraphData(
  project: ProjectData,
  scope: ScopeFilter
): { nodes: GraphNode[]; links: GraphLink[]; allEntities: GraphNode[] } {
  const primaryWorld = project.worlds[0];
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
      const alreadyLinked = c.relationships.some((r) => r.targetId === c.factionId);
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

  for (const loc of primaryWorld?.locations ?? []) {
    for (const targetLocId of loc.connectedLocationIds) {
      if (visibleIds.has(loc.id) && visibleIds.has(targetLocId) && loc.id < targetLocId) {
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
}
