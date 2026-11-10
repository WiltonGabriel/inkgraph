import type { Character, Faction, World } from '../types/project';

export function calculateCharacterCompleteness(c: Character): number {
  const checks = [
    Boolean(c.name?.trim()),
    Boolean(c.role?.trim()),
    Boolean(c.appearance?.trim()),
    Boolean(c.backstory?.trim()),
    Boolean(c.motivation?.trim()),
    Boolean(c.personalityTraits?.trim()),
    Boolean(c.flaws?.trim()),
    Boolean(c.want?.trim() || c.need?.trim()),
    Boolean(c.characterArc?.trim() || c.arcAct1?.trim()),
    c.relationships.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function calculateFactionCompleteness(f: Faction): number {
  const checks = [
    Boolean(f.name?.trim()),
    Boolean(f.subtype?.trim()),
    Boolean(f.motto?.trim()),
    Boolean(f.publicAgenda?.trim()),
    Boolean(f.secretAgenda?.trim()),
    Boolean(f.doctrine?.trim()),
    Boolean(f.history?.trim()),
    Boolean(f.resourcesAndPower?.trim()),
    f.ranks.length > 0,
    f.relationships.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function calculateWorldCompleteness(w: World): number {
  const checks = [
    Boolean(w.name?.trim()),
    Boolean(w.description?.trim()),
    Boolean(w.geography?.trim()),
    Boolean(w.culture?.trim()),
    Boolean(w.history?.trim()),
    Boolean(w.magicOrTechSummary?.trim()),
    w.locations.length > 0,
    w.timeline.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
