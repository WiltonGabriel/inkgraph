import JSZip from 'jszip';
import { splitFrontmatterAndBody } from '@inkgraph/domain';
import type { Character, Scene } from '../types/project';

export interface ImportPreviewResult {
  readonly sourceName: string;
  readonly scenes: Scene[];
  readonly characters: Character[];
  readonly warnings: string[];
}

function makeScene(index: number, title: string, content: string): Scene {
  return {
    id: `scene_imp_${Date.now()}_${index}`,
    chapterNumber: index + 1,
    title: title || `Cena ${index + 1}`,
    summary: content.slice(0, 120).replace(/\s+/g, ' ').trim(),
    content: content.trim(),
    act: 1,
    status: 'draft',
    tension: 50,
    subplotIds: [],
    characterIds: [],
    objectIds: [],
    secretsRevealed: [],
    notes: '',
    position: { x: 100 + index * 200, y: 120 },
    comments: [],
    revisions: [],
    lastEditedAt: new Date().toISOString(),
  };
}

export function previewMarkdownFolderImport(
  files: readonly { name: string; content: string }[]
): ImportPreviewResult {
  const scenes: Scene[] = [];
  const warnings: string[] = [];
  const mdFiles = [...files]
    .filter((f) => f.name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  mdFiles.forEach((file, idx) => {
    try {
      const parsed = splitFrontmatterAndBody(file.content);
      const heading = /^#\s+(.+)$/m.exec(parsed.markdownBody)?.[1]?.trim();
      const title =
        (typeof parsed.frontmatter?.title === 'string' && parsed.frontmatter.title) ||
        heading ||
        file.name.replace(/\.md$/i, '');
      scenes.push(makeScene(idx, title, parsed.markdownBody));
    } catch (err) {
      warnings.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  return {
    sourceName: `${mdFiles.length} Markdown file(s)`,
    scenes,
    characters: [],
    warnings,
  };
}

/**
 * Parses Word .docx word/document.xml cleanly via JSZip, splitting chapters on H1/H2/Title styles.
 */
export async function previewDocxImport(
  bytes: Uint8Array,
  filename: string
): Promise<ImportPreviewResult> {
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) {
    return {
      sourceName: filename,
      scenes: [],
      characters: [],
      warnings: ['Invalid .docx archive: missing word/document.xml.'],
    };
  }

  const paraRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const headingStyleRegex = /<w:pStyle\s+w:val="(Title|Heading1|Heading2|T[ií]tulo1?)"/i;

  const chapters: { title: string; paragraphs: string[] }[] = [];
  let current: { title: string; paragraphs: string[] } = {
    title: filename.replace(/\.docx$/i, ''),
    paragraphs: [],
  };

  let pMatch: RegExpExecArray | null;
  while ((pMatch = paraRegex.exec(docXml)) !== null) {
    const pXml = pMatch[0];
    const parts: string[] = [];
    let tMatch: RegExpExecArray | null;
    textRegex.lastIndex = 0;
    while ((tMatch = textRegex.exec(pXml)) !== null) {
      parts.push(
        (tMatch[1] ?? '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
      );
    }
    const lineText = parts.join('').trim();
    if (!lineText) continue;

    if (headingStyleRegex.test(pXml)) {
      if (current.paragraphs.length > 0) {
        chapters.push(current);
      }
      current = { title: lineText, paragraphs: [] };
    } else {
      current.paragraphs.push(lineText);
    }
  }
  if (current.paragraphs.length > 0 || chapters.length === 0) {
    chapters.push(current);
  }

  const scenes = chapters.map((ch, idx) =>
    makeScene(idx, ch.title, `# ${ch.title}\n\n${ch.paragraphs.join('\n\n')}`)
  );

  return {
    sourceName: filename,
    scenes,
    characters: [],
    warnings: [],
  };
}

/**
 * Extracts characters and scenes from Novelcrafter-style .zip exports.
 */
export async function previewNovelcrafterImport(
  bytes: Uint8Array,
  filename: string
): Promise<ImportPreviewResult> {
  const zip = await JSZip.loadAsync(bytes);
  const scenes: Scene[] = [];
  const characters: Character[] = [];
  const warnings: string[] = [];

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  for (const file of entries) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.md')) {
      const content = await file.async('string');
      const preview = previewMarkdownFolderImport([{ name: file.name, content }]);
      scenes.push(...preview.scenes.map((s, idx) => ({ ...s, chapterNumber: scenes.length + idx + 1 })));
    } else if (lower.endsWith('.json')) {
      try {
        const parsed = JSON.parse(await file.async('string')) as {
          codex?: { name?: string; type?: string; description?: string; aliases?: string[] }[];
          title?: string;
          scenes?: { title?: string; text?: string; summary?: string }[];
        };
        if (Array.isArray(parsed.codex)) {
          for (const entry of parsed.codex) {
            if (!entry.name) continue;
            characters.push({
              id: `char_nc_${Date.now()}_${characters.length}`,
              name: entry.name,
              aliases: entry.aliases ?? [],
              role: entry.type || 'Personagem',
              archetype: 'ally',
              status: 'draft',
              avatarColor: '#3b82f6',
              appearance: '',
              backstory: entry.description ?? '',
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
              notes: '',
              tags: ['novelcrafter-import'],
              relationships: [],
              epistemicSecrets: [],
            });
          }
        }
        if (Array.isArray(parsed.scenes)) {
          parsed.scenes.forEach((sc, idx) => {
            if (sc.text || sc.summary) {
              scenes.push(makeScene(scenes.length + idx, sc.title || `Cena ${idx + 1}`, sc.text || sc.summary || ''));
            }
          });
        }
      } catch (err) {
        warnings.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return { sourceName: filename, scenes, characters, warnings };
}
