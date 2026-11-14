import type {
  Character,
  Faction,
  ProjectData,
  SceneStatus,
  StoryObject,
  WorldLocation,
} from '../../types/project';

export const SCENE_STATUS_LABELS: Record<SceneStatus, string> = {
  outline: 'Esboço',
  draft: 'Rascunho',
  'first-draft': '1º Tratamento',
  revised: 'Revisado',
  final: 'Final',
};

export const ACT_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Ato I',
  2: 'Ato II',
  3: 'Ato III',
};

export interface DetectedSceneMentions {
  chars: Character[];
  locs: WorldLocation[];
  factions: Faction[];
  objects: StoryObject[];
}

export interface ProjectSecretEntry {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerKind: 'Personagem' | 'Facção' | 'Local' | 'Sistema' | 'Objeto';
  secret: string;
  knownByIds: string[];
  revealedInSceneId?: string;
}

/** Detects canon entities referenced in scene prose via @, #, &, ! or exact aliases. */
export function extractSceneMentions(
  content: string,
  project: ProjectData
): DetectedSceneMentions {
  const text = content.toLowerCase();

  const chars = project.characters.filter(
    (c) =>
      text.includes(c.name.toLowerCase()) ||
      text.includes(`@${c.name.toLowerCase()}`) ||
      c.aliases.some((a) => a.trim().length > 0 && text.includes(a.toLowerCase()))
  );

  const allLocs = project.worlds.flatMap((w) => w.locations);
  const locs = allLocs.filter(
    (l) =>
      text.includes(l.name.toLowerCase()) ||
      text.includes(`#${l.name.toLowerCase()}`) ||
      (l.aliases ?? []).some((a) => a.trim().length > 0 && text.includes(a.toLowerCase()))
  );

  const factions = project.factions.filter(
    (f) =>
      text.includes(f.name.toLowerCase()) ||
      text.includes(`&${f.name.toLowerCase()}`) ||
      f.aliases.some((a) => a.trim().length > 0 && text.includes(a.toLowerCase()))
  );

  const objects = project.objects.filter(
    (o) =>
      text.includes(o.name.toLowerCase()) ||
      text.includes(`!${o.name.toLowerCase()}`) ||
      (o.aliases ?? []).some((a) => a.trim().length > 0 && text.includes(a.toLowerCase()))
  );

  return { chars, locs, factions, objects };
}

/** Collects all epistemic secrets declared across project canon entities. */
export function collectProjectSecrets(project: ProjectData): ProjectSecretEntry[] {
  const entries: ProjectSecretEntry[] = [];

  for (const c of project.characters) {
    for (const s of c.epistemicSecrets) {
      entries.push({
        id: s.id,
        ownerId: c.id,
        ownerName: c.name,
        ownerKind: 'Personagem',
        secret: s.secret,
        knownByIds: s.knownByIds,
        revealedInSceneId: s.revealedInSceneId,
      });
    }
  }

  for (const f of project.factions) {
    for (const s of f.epistemicSecrets) {
      entries.push({
        id: s.id,
        ownerId: f.id,
        ownerName: f.name,
        ownerKind: 'Facção',
        secret: s.secret,
        knownByIds: s.knownByIds,
        revealedInSceneId: s.revealedInSceneId,
      });
    }
  }

  for (const w of project.worlds) {
    for (const loc of w.locations) {
      for (const s of loc.epistemicSecrets ?? []) {
        entries.push({
          id: s.id,
          ownerId: loc.id,
          ownerName: loc.name,
          ownerKind: 'Local',
          secret: s.secret,
          knownByIds: s.knownByIds,
          revealedInSceneId: s.revealedInSceneId,
        });
      }
    }
    for (const sys of w.systems) {
      for (const s of sys.epistemicSecrets ?? []) {
        entries.push({
          id: s.id,
          ownerId: sys.id,
          ownerName: sys.name,
          ownerKind: 'Sistema',
          secret: s.secret,
          knownByIds: s.knownByIds,
          revealedInSceneId: s.revealedInSceneId,
        });
      }
    }
  }

  for (const obj of project.objects) {
    for (const s of obj.epistemicSecrets ?? []) {
      entries.push({
        id: s.id,
        ownerId: obj.id,
        ownerName: obj.name,
        ownerKind: 'Objeto',
        secret: s.secret,
        knownByIds: s.knownByIds,
        revealedInSceneId: s.revealedInSceneId,
      });
    }
  }

  return entries;
}
