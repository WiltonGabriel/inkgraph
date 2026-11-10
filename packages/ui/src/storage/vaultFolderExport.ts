import {
  serializeLoreMarkdown,
  type BaseEntity,
  type Epistemic,
  type Relationship,
} from '@inkgraph/domain';
import type {
  EntityRelationship,
  EpistemicSecret,
  ProjectData,
} from '../types/project';

export interface SerializedVaultFile {
  readonly relativePath: string;
  readonly content: string;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'item'
  );
}

function mapRelationships(items: readonly EntityRelationship[]): Relationship[] {
  return items.map((r) => ({
    target: r.targetId,
    relation: r.label || r.type,
    since_scene: r.sinceScene,
    sentiment: Math.max(-1, Math.min(1, r.sentiment)),
    notes: r.notes,
  }));
}

function mapEpistemic(items: readonly EpistemicSecret[]): Epistemic {
  return {
    secrets_kept: items.map((s) => s.secret),
    known_by: Array.from(new Set(items.flatMap((s) => s.knownByIds))),
    revealed_at_scene: items.find((s) => s.revealedInSceneId)?.revealedInSceneId,
  };
}

/**
 * Converts an in-memory ProjectData catalog entry into InkGraph's canonical
 * `./workspace/` Markdown-first tree (`lore/`, `manuscript/`, `staging/`).
 */
export function buildMarkdownVaultFiles(project: ProjectData): SerializedVaultFile[] {
  const files: SerializedVaultFile[] = [];

  for (const c of project.characters) {
    const entity: BaseEntity = {
      id: c.id,
      type: 'character',
      subtype: c.archetype,
      name: c.name,
      aliases: c.aliases,
      status: c.status,
      tags: c.tags,
      relationships: mapRelationships(c.relationships),
      epistemic: mapEpistemic(c.epistemicSecrets),
    };
    const body = [
      `# ${c.name}`,
      c.role ? `**Papel:** ${c.role}` : '',
      c.appearance ? `## Aparência\n${c.appearance}` : '',
      c.backstory ? `## História\n${c.backstory}` : '',
      c.motivation ? `## Motivação\n${c.motivation}` : '',
      c.notes ? `## Notas\n${c.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    files.push({
      relativePath: `lore/characters/${slugify(c.name)}_${c.id}.md`,
      content: serializeLoreMarkdown(entity, body),
    });
  }

  for (const f of project.factions) {
    const entity: BaseEntity = {
      id: f.id,
      type: 'faction',
      subtype: f.subtype,
      name: f.name,
      aliases: f.aliases,
      status: f.status,
      tags: f.tags,
      relationships: mapRelationships(f.relationships),
      epistemic: mapEpistemic(f.epistemicSecrets),
    };
    const body = [
      `# ${f.name}`,
      f.motto ? `> ${f.motto}` : '',
      f.doctrine ? `## Doutrina\n${f.doctrine}` : '',
      f.history ? `## História\n${f.history}` : '',
      f.notes ? `## Notas\n${f.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    files.push({
      relativePath: `lore/factions/${slugify(f.name)}_${f.id}.md`,
      content: serializeLoreMarkdown(entity, body),
    });
  }

  for (const w of project.worlds) {
    const entity: BaseEntity = {
      id: w.id,
      type: 'location',
      name: w.name,
      aliases: [],
      status: 'canon',
      tags: ['world'],
      relationships: [],
      epistemic: { secrets_kept: [], known_by: [] },
    };
    const body = [
      `# ${w.name}`,
      w.premise ? `**Premissa:** ${w.premise}` : '',
      w.description || '',
      w.geography ? `## Geografia\n${w.geography}` : '',
      w.culture ? `## Cultura\n${w.culture}` : '',
      w.history ? `## História\n${w.history}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    files.push({
      relativePath: `lore/worlds/${slugify(w.name)}_${w.id}.md`,
      content: serializeLoreMarkdown(entity, body),
    });
  }

  for (const scene of project.scenes) {
    const frontmatter = [
      '---',
      `id: ${scene.id}`,
      `title: ${JSON.stringify(scene.title)}`,
      `chapter_number: ${scene.chapterNumber}`,
      `act: ${scene.act}`,
      `status: ${scene.status}`,
      scene.povCharacterId ? `pov_character_id: ${scene.povCharacterId}` : '',
      scene.locationId ? `location_id: ${scene.locationId}` : '',
      '---',
      '',
      scene.content,
      '',
    ]
      .filter((line) => line !== '')
      .join('\n');

    files.push({
      relativePath: `manuscript/${String(scene.chapterNumber).padStart(2, '0')}_${slugify(scene.title)}.md`,
      content: frontmatter,
    });
  }

  for (const prop of project.stagingProposals.filter((p) => p.status === 'pending')) {
    files.push({
      relativePath: `staging/${prop.fileName || `${prop.id}.md`}`,
      content: `---\nid: ${prop.id}\ntitle: ${JSON.stringify(prop.entityName)}\ntarget_type: ${prop.entityType}\nstatus: draft\n---\n\n${prop.proposedMarkdown}\n`,
    });
  }

  return files;
}

interface DirectoryPickerHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryPickerHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<{
    createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  }>;
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Writes the Markdown-first `./workspace/` tree directly to a user-selected folder
 * using the Chromium File System Access API.
 */
export async function exportWorkspaceToLocalFolder(
  project: ProjectData
): Promise<{ filesWritten: number; directoryName: string }> {
  const win = window as unknown as {
    showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryPickerHandle>;
  };
  if (!win.showDirectoryPicker) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  const root = await win.showDirectoryPicker({ mode: 'readwrite' });
  const files = buildMarkdownVaultFiles(project);

  for (const file of files) {
    const parts = file.relativePath.split('/');
    const filename = parts.pop()!;
    let currentDir = root;
    for (const seg of parts) {
      currentDir = await currentDir.getDirectoryHandle(seg, { create: true });
    }
    const fileHandle = await currentDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file.content);
    await writable.close();
  }

  return { filesWritten: files.length, directoryName: root.name };
}
