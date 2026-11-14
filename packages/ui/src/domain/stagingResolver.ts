import type { Character, Faction, ProjectData } from '../types/project';

/**
 * Applies or rejects a staging proposal without mutating canonical records
 * unless explicitly approved. Extracted from ProjectContext to uphold SRP.
 */
export function applyStagingDecision(
  prev: ProjectData,
  id: string,
  decision: 'approved' | 'rejected'
): ProjectData {
  const target = prev.stagingProposals.find((p) => p.id === id);
  if (!target) return prev;

  let nextCharacters = prev.characters;
  let nextFactions = prev.factions;
  let nextWorlds = prev.worlds;
  let nextObjects = prev.objects;
  let nextScenes = prev.scenes;

  if (decision === 'approved') {
    const fm = target.proposedFrontmatter ?? {};
    const proposedId = String(fm.id || `${target.entityType}_${Date.now()}`);
    const proposedTags = Array.isArray(fm.tags) ? fm.tags.map(String) : ['canonizado'];
    const proposedAliases = Array.isArray(fm.aliases) ? fm.aliases.map(String) : [];

    if (target.entityType === 'character') {
      const existing = prev.characters.find(
        (c) =>
          c.id === proposedId || c.name.toLowerCase() === target.entityName.toLowerCase()
      );
      if (target.action === 'update' && existing) {
        nextCharacters = prev.characters.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                status: 'canon',
                backstory: target.rationale || c.backstory,
                notes: target.proposedMarkdown || c.notes,
                tags: Array.from(new Set([...c.tags, ...proposedTags])),
              }
            : c
        );
      } else if (!existing) {
        const newChar: Character = {
          id: proposedId,
          name: target.entityName,
          aliases: proposedAliases,
          role: String(fm.subtype || 'Personagem Canonizado'),
          archetype: 'ally',
          status: 'canon',
          avatarColor: '#a855f7',
          appearance: '',
          backstory: target.rationale,
          motivation: '',
          personalityTraits: '',
          flaws: '',
          want: '',
          need: '',
          lieBelieved: '',
          ghost: '',
          arcAct1: '',
          arcAct2: '',
          arcAct3: '',
          characterArc: '',
          notes: target.proposedMarkdown,
          tags: proposedTags,
          relationships: [],
          epistemicSecrets: [],
        };
        nextCharacters = [...prev.characters, newChar];
      }
    } else if (target.entityType === 'faction') {
      const existing = prev.factions.find(
        (f) =>
          f.id === proposedId || f.name.toLowerCase() === target.entityName.toLowerCase()
      );
      if (target.action === 'update' && existing) {
        nextFactions = prev.factions.map((f) =>
          f.id === existing.id
            ? {
                ...f,
                status: 'canon',
                doctrine: target.proposedMarkdown || f.doctrine,
                notes: target.rationale || f.notes,
                tags: Array.from(new Set([...f.tags, ...proposedTags])),
              }
            : f
        );
      } else if (!existing) {
        const newFac: Faction = {
          id: proposedId,
          name: target.entityName,
          aliases: proposedAliases,
          subtype: String(fm.subtype || 'Organização'),
          motto: '',
          color: '#a855f7',
          status: 'canon',
          publicAgenda: target.rationale,
          secretAgenda: '',
          doctrine: target.proposedMarkdown,
          history: '',
          resourcesAndPower: '',
          internalConflicts: '',
          notes: '',
          ranks: [],
          controlledLocationIds: [],
          tags: proposedTags,
          relationships: [],
          epistemicSecrets: [],
        };
        nextFactions = [...prev.factions, newFac];
      }
    } else if (target.entityType === 'location' && prev.worlds.length > 0) {
      const firstWorld = prev.worlds[0];
      const existing = firstWorld.locations.find(
        (l) =>
          l.id === proposedId || l.name.toLowerCase() === target.entityName.toLowerCase()
      );
      const updatedLocations =
        target.action === 'update' && existing
          ? firstWorld.locations.map((l) =>
              l.id === existing.id
                ? {
                    ...l,
                    status: 'canon' as const,
                    description: target.proposedMarkdown || l.description,
                    notes: target.rationale || l.notes,
                  }
                : l
            )
          : existing
            ? firstWorld.locations
            : [
                ...firstWorld.locations,
                {
                  id: proposedId,
                  worldId: firstWorld.id,
                  name: target.entityName,
                  aliases: proposedAliases,
                  type: 'city' as const,
                  status: 'canon' as const,
                  climateOrAtmosphere: 'Padrão',
                  description: target.proposedMarkdown,
                  strategicValue: target.rationale,
                  coordinates: { x: 50, y: 50 },
                  connectedLocationIds: [],
                  notes: '',
                  tags: proposedTags,
                  relationships: [],
                  epistemicSecrets: [],
                },
              ];
      nextWorlds = [
        { ...firstWorld, locations: updatedLocations },
        ...prev.worlds.slice(1),
      ];
    } else if (target.entityType === 'system' && prev.worlds.length > 0) {
      const firstWorld = prev.worlds[0];
      const existing = firstWorld.systems.find(
        (s) =>
          s.id === proposedId || s.name.toLowerCase() === target.entityName.toLowerCase()
      );
      const updatedSystems =
        target.action === 'update' && existing
          ? firstWorld.systems.map((s) =>
              s.id === existing.id
                ? {
                    ...s,
                    status: 'canon' as const,
                    notes: target.proposedMarkdown || s.notes,
                    costsAndToll: target.rationale || s.costsAndToll,
                  }
                : s
            )
          : existing
            ? firstWorld.systems
            : [
                ...firstWorld.systems,
                {
                  id: proposedId,
                  worldId: firstWorld.id,
                  name: target.entityName,
                  aliases: proposedAliases,
                  subtype: String(fm.subtype || 'Sistema de Regras'),
                  status: 'canon' as const,
                  coreSource: target.rationale,
                  fundamentalRules: [target.proposedMarkdown],
                  costsAndToll: '',
                  hardLimits: [],
                  socialTaboos: '',
                  knownPractitionerIds: [],
                  notes: target.proposedMarkdown,
                  tags: proposedTags,
                  relationships: [],
                  epistemicSecrets: [],
                },
              ];
      nextWorlds = [
        { ...firstWorld, systems: updatedSystems },
        ...prev.worlds.slice(1),
      ];
    } else if (target.entityType === 'item') {
      const existing = prev.objects.find(
        (o) =>
          o.id === proposedId || o.name.toLowerCase() === target.entityName.toLowerCase()
      );
      if (target.action === 'update' && existing) {
        nextObjects = prev.objects.map((o) =>
          o.id === existing.id
            ? {
                ...o,
                canonStatus: 'canon',
                description: target.proposedMarkdown || o.description,
                notes: target.rationale || o.notes,
              }
            : o
        );
      } else if (!existing) {
        nextObjects = [
          ...prev.objects,
          {
            id: proposedId,
            name: target.entityName,
            aliases: proposedAliases,
            type: 'artifact',
            canonStatus: 'canon',
            status: 'Ativo',
            description: target.proposedMarkdown,
            significance: target.rationale,
            rulesOrCapabilities: '',
            linkedCharacterIds: [],
            linkedSceneIds: [],
            notes: '',
            tags: proposedTags,
            relationships: [],
            epistemicSecrets: [],
          },
        ];
      }
    } else if (target.entityType === 'scene') {
      const existing = prev.scenes.find(
        (s) =>
          s.id === proposedId || s.title.toLowerCase() === target.entityName.toLowerCase()
      );
      if (target.action === 'update' && existing) {
        nextScenes = prev.scenes.map((s) =>
          s.id === existing.id
            ? {
                ...s,
                content: target.proposedMarkdown || s.content,
                notes: target.rationale || s.notes,
                lastEditedAt: new Date().toISOString(),
              }
            : s
        );
      } else if (!existing) {
        nextScenes = [
          ...prev.scenes,
          {
            id: proposedId,
            chapterNumber: prev.scenes.length + 1,
            title: target.entityName,
            summary: target.rationale,
            content: target.proposedMarkdown,
            act: 2,
            status: 'draft',
            tension: 60,
            subplotIds: [],
            characterIds: [],
            objectIds: [],
            secretsRevealed: [],
            notes: target.rationale,
            position: { x: 140 + prev.scenes.length * 220, y: 140 },
            comments: [],
            revisions: [],
            lastEditedAt: new Date().toISOString(),
          },
        ];
      }
    }
  }

  return {
    ...prev,
    characters: nextCharacters,
    factions: nextFactions,
    worlds: nextWorlds,
    objects: nextObjects,
    scenes: nextScenes,
    stagingProposals: prev.stagingProposals.map((p) =>
      p.id === id ? { ...p, status: decision } : p
    ),
  };
}
