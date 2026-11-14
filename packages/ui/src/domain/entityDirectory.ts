import type {
  CanonStatus,
  EntityRelationship,
  EpistemicSecret,
  ProjectData,
} from '../types/project';

export type LoreDirectoryKind = 'character' | 'faction' | 'location' | 'system' | 'object';

export interface LoreDirectoryEntry {
  id: string;
  kind: LoreDirectoryKind;
  name: string;
  aliases: string[];
  status: CanonStatus;
  tags: string[];
  folderPath?: string;
  color: string;
  subtitle: string;
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
}

export interface IncomingEntityLink {
  sourceId: string;
  sourceName: string;
  sourceKind: LoreDirectoryKind;
  relationLabel: string;
  sentiment: number;
}

/**
 * Projects all entity types (characters, factions, locations, systems, objects)
 * into a unified directory contract so search, relationships, and epistemic tools
 * work uniformly without fragmenting by entity table.
 */
export function listDirectoryEntities(project: ProjectData): LoreDirectoryEntry[] {
  const entries: LoreDirectoryEntry[] = [];

  for (const c of project.characters) {
    entries.push({
      id: c.id,
      kind: 'character',
      name: c.name,
      aliases: c.aliases ?? [],
      status: c.status,
      tags: c.tags ?? [],
      color: c.avatarColor || '#3b82f6',
      subtitle: c.role || 'Personagem',
      relationships: c.relationships ?? [],
      epistemicSecrets: c.epistemicSecrets ?? [],
    });
  }

  for (const f of project.factions) {
    entries.push({
      id: f.id,
      kind: 'faction',
      name: f.name,
      aliases: f.aliases ?? [],
      status: f.status,
      tags: f.tags ?? [],
      color: f.color || '#a855f7',
      subtitle: f.subtype || 'Facção',
      relationships: f.relationships ?? [],
      epistemicSecrets: f.epistemicSecrets ?? [],
    });
  }

  for (const world of project.worlds) {
    for (const loc of world.locations) {
      entries.push({
        id: loc.id,
        kind: 'location',
        name: loc.name,
        aliases: loc.aliases ?? [],
        status: loc.status ?? 'canon',
        tags: loc.tags ?? [],
        folderPath: loc.folderPath,
        color: '#10b981',
        subtitle: `${loc.type} · ${world.name}`,
        relationships: loc.relationships ?? [],
        epistemicSecrets: loc.epistemicSecrets ?? [],
      });
    }

    for (const sys of world.systems) {
      entries.push({
        id: sys.id,
        kind: 'system',
        name: sys.name,
        aliases: sys.aliases ?? [],
        status: sys.status ?? 'canon',
        tags: sys.tags ?? [],
        folderPath: sys.folderPath,
        color: '#06b6d4',
        subtitle: `${sys.subtype} · ${world.name}`,
        relationships: sys.relationships ?? [],
        epistemicSecrets: sys.epistemicSecrets ?? [],
      });
    }
  }

  for (const obj of project.objects) {
    entries.push({
      id: obj.id,
      kind: 'object',
      name: obj.name,
      aliases: obj.aliases ?? [],
      status: obj.canonStatus ?? 'canon',
      tags: obj.tags ?? [],
      folderPath: obj.folderPath,
      color: '#f59e0b',
      subtitle: obj.type || 'Objeto',
      relationships: obj.relationships ?? [],
      epistemicSecrets: obj.epistemicSecrets ?? [],
    });
  }

  return entries;
}

/** Resolves an entity by exact ID, case-insensitive name, or alias. */
export function findEntityByIdOrAlias(
  project: ProjectData,
  idOrAlias: string
): LoreDirectoryEntry | undefined {
  const q = idOrAlias.trim().toLowerCase();
  if (!q) return undefined;
  const all = listDirectoryEntities(project);
  return all.find(
    (entry) =>
      entry.id.toLowerCase() === q ||
      entry.name.toLowerCase() === q ||
      entry.aliases.some((al) => al.toLowerCase() === q)
  );
}

/**
 * Computes outgoing relationships, incoming reverse links across all entity types,
 * and scene appearances for any entity in the unified directory.
 */
export function getEntityNeighborhood(project: ProjectData, entityId: string) {
  const all = listDirectoryEntities(project);
  const entry = all.find((item) => item.id === entityId);
  const incoming: IncomingEntityLink[] = [];

  for (const candidate of all) {
    if (candidate.id === entityId) continue;
    for (const rel of candidate.relationships) {
      if (rel.targetId === entityId) {
        incoming.push({
          sourceId: candidate.id,
          sourceName: candidate.name,
          sourceKind: candidate.kind,
          relationLabel: rel.label || rel.type,
          sentiment: rel.sentiment,
        });
      }
    }
  }

  const sceneMentions = project.scenes.filter(
    (sc) =>
      sc.povCharacterId === entityId ||
      sc.locationId === entityId ||
      sc.characterIds.includes(entityId) ||
      sc.objectIds.includes(entityId)
  );

  return {
    entry,
    outgoing: entry?.relationships ?? [],
    incoming,
    sceneMentions,
  };
}

function stripDeletedIdFromRelationships(
  rels: EntityRelationship[] | undefined,
  deletedId: string
): EntityRelationship[] {
  return (rels ?? []).filter((r) => r.targetId !== deletedId);
}

/**
 * Deletes an entity and cascades cleanup across relationships, scenes, factions,
 * world locations/systems, objects, interviews, and mind maps to prevent orphan references.
 */
export function cascadeDeleteEntity(
  project: ProjectData,
  kind: LoreDirectoryKind,
  id: string
): ProjectData {
  const characters = project.characters
    .filter((c) => !(kind === 'character' && c.id === id))
    .map((c) => ({
      ...c,
      factionId: kind === 'faction' && c.factionId === id ? undefined : c.factionId,
      locationId: kind === 'location' && c.locationId === id ? undefined : c.locationId,
      relationships: stripDeletedIdFromRelationships(c.relationships, id),
    }));

  const factions = project.factions
    .filter((f) => !(kind === 'faction' && f.id === id))
    .map((f) => ({
      ...f,
      leaderCharacterId:
        kind === 'character' && f.leaderCharacterId === id ? undefined : f.leaderCharacterId,
      headquartersLocationId:
        kind === 'location' && f.headquartersLocationId === id
          ? undefined
          : f.headquartersLocationId,
      controlledLocationIds:
        kind === 'location'
          ? f.controlledLocationIds.filter((lid) => lid !== id)
          : f.controlledLocationIds,
      ranks:
        kind === 'character'
          ? f.ranks.map((r) => ({
              ...r,
              holderIds: r.holderIds.filter((hid) => hid !== id),
            }))
          : f.ranks,
      relationships: stripDeletedIdFromRelationships(f.relationships, id),
    }));

  const worlds = project.worlds.map((w) => ({
    ...w,
    locations: w.locations
      .filter((loc) => !(kind === 'location' && loc.id === id))
      .map((loc) => ({
        ...loc,
        controlledByFactionId:
          kind === 'faction' && loc.controlledByFactionId === id
            ? undefined
            : loc.controlledByFactionId,
        connectedLocationIds:
          kind === 'location'
            ? loc.connectedLocationIds.filter((cid) => cid !== id)
            : loc.connectedLocationIds,
        relationships: stripDeletedIdFromRelationships(loc.relationships, id),
      })),
    systems: w.systems
      .filter((sys) => !(kind === 'system' && sys.id === id))
      .map((sys) => ({
        ...sys,
        knownPractitionerIds:
          kind === 'character'
            ? sys.knownPractitionerIds.filter((pid) => pid !== id)
            : sys.knownPractitionerIds,
        relationships: stripDeletedIdFromRelationships(sys.relationships, id),
      })),
    timeline: w.timeline.map((ev) => ({
      ...ev,
      locationId: kind === 'location' && ev.locationId === id ? undefined : ev.locationId,
      factionIds:
        kind === 'faction' ? ev.factionIds.filter((fid) => fid !== id) : ev.factionIds,
      characterIds:
        kind === 'character' ? ev.characterIds.filter((cid) => cid !== id) : ev.characterIds,
    })),
  }));

  const objects = project.objects
    .filter((o) => !(kind === 'object' && o.id === id))
    .map((o) => ({
      ...o,
      ownerCharacterId:
        kind === 'character' && o.ownerCharacterId === id ? undefined : o.ownerCharacterId,
      factionId: kind === 'faction' && o.factionId === id ? undefined : o.factionId,
      locationId: kind === 'location' && o.locationId === id ? undefined : o.locationId,
      linkedCharacterIds:
        kind === 'character'
          ? o.linkedCharacterIds.filter((cid) => cid !== id)
          : o.linkedCharacterIds,
      relationships: stripDeletedIdFromRelationships(o.relationships, id),
    }));

  const scenes = project.scenes.map((sc) => ({
    ...sc,
    povCharacterId:
      kind === 'character' && sc.povCharacterId === id ? undefined : sc.povCharacterId,
    locationId: kind === 'location' && sc.locationId === id ? undefined : sc.locationId,
    characterIds:
      kind === 'character' ? sc.characterIds.filter((cid) => cid !== id) : sc.characterIds,
    objectIds: kind === 'object' ? sc.objectIds.filter((oid) => oid !== id) : sc.objectIds,
  }));

  const interviews =
    kind === 'character'
      ? project.interviews.filter((iv) => iv.characterId !== id)
      : project.interviews;

  const mindMaps = project.mindMaps.map((mm) => ({
    ...mm,
    nodes: mm.nodes.map((node) =>
      node.linkedEntityId === id
        ? { ...node, type: 'free' as const, linkedEntityKind: undefined, linkedEntityId: undefined }
        : node
    ),
  }));

  return {
    ...project,
    characters,
    factions,
    worlds,
    objects,
    scenes,
    interviews,
    mindMaps,
  };
}
