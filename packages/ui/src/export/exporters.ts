import JSZip from 'jszip';
import { Document, HeadingLevel, Packer, PageBreak, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { extractEpistemicDirectives } from '@inkgraph/domain';
import type { ProjectData } from '../types/project';
import { buildMarkdownVaultFiles } from '../storage/vaultFolderExport';

export interface PreflightIssue {
  readonly id: string;
  readonly severity: 'error' | 'warn';
  readonly sceneId?: string;
  readonly message: string;
}

export type PrintTrimFormat = '6x9' | '5.5x8.5' | 'a5' | 'manuscript';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripCanonicalMarkupForPrint(md: string): string {
  return md
    .replace(/^::(beat|epistemic-reveal)\{[^}]*\}\r?\n[\s\S]*?\r?\n::\r?\n?/gm, '')
    .replace(/\[([^\]]+)\]\(kb:[a-zA-Z0-9_-]+\)/g, '$1')
    .trim();
}

export function runPublicationPreflight(project: ProjectData): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const knownEntityIds = new Set<string>([
    ...project.characters.map((c) => c.id),
    ...project.factions.map((f) => f.id),
    ...project.worlds.map((w) => w.id),
    ...project.worlds.flatMap((w) => w.locations.map((l) => l.id)),
    ...project.objects.map((o) => o.id),
  ]);

  if (project.scenes.length === 0) {
    issues.push({
      id: 'pf_no_scenes',
      severity: 'error',
      message: 'Manuscript contains 0 scenes to compile.',
    });
  }

  for (const scene of project.scenes) {
    if (!scene.content.trim()) {
      issues.push({
        id: `pf_empty_${scene.id}`,
        severity: 'error',
        sceneId: scene.id,
        message: `Scene "${scene.title}" is empty.`,
      });
    }
    if (scene.status === 'outline') {
      issues.push({
        id: `pf_outline_${scene.id}`,
        severity: 'warn',
        sceneId: scene.id,
        message: `Scene "${scene.title}" is still marked as 'outline'.`,
      });
    }

    const kbLinkRegex = /\[([^\]]+)\]\(kb:([a-zA-Z0-9_-]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = kbLinkRegex.exec(scene.content)) !== null) {
      const targetId = m[2]!;
      if (!knownEntityIds.has(targetId)) {
        issues.push({
          id: `pf_link_${scene.id}_${targetId}`,
          severity: 'warn',
          sceneId: scene.id,
          message: `Broken entity reference "(kb:${targetId})" in "${scene.title}".`,
        });
      }
    }

    const reveals = extractEpistemicDirectives(scene.content);
    for (const rev of reveals) {
      if (rev.entity && !knownEntityIds.has(rev.entity)) {
        issues.push({
          id: `pf_ep_${scene.id}_${rev.entity}`,
          severity: 'warn',
          sceneId: scene.id,
          message: `Unresolved epistemic reveal entity "${rev.entity}" in "${scene.title}".`,
        });
      }
    }
  }

  return issues;
}

export async function generateEpub3Bytes(project: ProjectData): Promise<Uint8Array> {
  const zip = new JSZip();
  const bookId = `urn:inkgraph:${project.id}`;
  const author = project.compileProfile.authorName || 'Autor';
  const sortedScenes = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);

  // EPUB 3 spec requires uncompressed mimetype as first entry
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/xhtml+xml"/>
  </rootfiles>
</container>
`.replace('application/xhtml+xml', 'application/oebps-package+xml')
  );

  const manifestItems: string[] = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
  ];
  const spineItems: string[] = [];
  const navLinks: string[] = [];

  sortedScenes.forEach((scene, idx) => {
    const filename = `chapter_${idx + 1}.xhtml`;
    const cleanParagraphs = stripCanonicalMarkupForPrint(scene.content)
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((p) => `<p>${escapeXml(p.replace(/^#+\s*/, ''))}</p>`)
      .join('\n    ');

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR" lang="pt-BR">
<head><title>${escapeXml(scene.title)}</title></head>
<body>
  <h1>${escapeXml(scene.title)}</h1>
  ${cleanParagraphs}
</body>
</html>`;
    zip.file(`OEBPS/${filename}`, xhtml);
    manifestItems.push(`<item id="chap_${idx + 1}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="chap_${idx + 1}"/>`);
    navLinks.push(`<li><a href="${filename}">${escapeXml(scene.title)}</a></li>`);
  });

  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(project.title)}</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(project.title)}</h1>
    <ol>${navLinks.join('')}</ol>
  </nav>
</body>
</html>`
  );

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${escapeXml(bookId)}</dc:identifier>
    <dc:title>${escapeXml(project.title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>pt-BR</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine>
    ${spineItems.join('\n    ')}
  </spine>
</package>`
  );

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function generateDocxBytes(project: ProjectData): Promise<Uint8Array> {
  const sortedScenes = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const children: Paragraph[] = [
    new Paragraph({
      text: project.compileProfile.titlePageText || project.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: project.compileProfile.authorName || '', italics: true })],
      spacing: { after: 480 },
    }),
  ];

  sortedScenes.forEach((scene, idx) => {
    if (idx > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(
      new Paragraph({
        text: scene.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
    const paras = stripCanonicalMarkupForPrint(scene.content).split(/\n\s*\n/).filter(Boolean);
    for (const para of paras) {
      children.push(
        new Paragraph({
          text: para.replace(/^#+\s*/, ''),
          spacing: { after: 140, line: 360 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ children }],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

/**
 * Generates standard 60 chars x 30 lines Normseite / Lauda pages separated by real form-feed (\f).
 */
export function exportNormseiteText(project: ProjectData): string {
  const COLS = 60;
  const LINES_PER_PAGE = 30;
  const sortedScenes = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const allLines: string[] = [
    project.title.toUpperCase(),
    project.compileProfile.authorName || '',
    '',
  ];

  for (const scene of sortedScenes) {
    allLines.push(`=== ${scene.title.toUpperCase()} ===`, '');
    const clean = stripCanonicalMarkupForPrint(scene.content);
    for (const rawPara of clean.split(/\n+/)) {
      const words = rawPara.trim().split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        if (!line) {
          line = word;
        } else if (line.length + 1 + word.length <= COLS) {
          line += ` ${word}`;
        } else {
          allLines.push(line);
          line = word;
        }
      }
      if (line) allLines.push(line);
      allLines.push('');
    }
  }

  const pages: string[] = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    const pageLines = allLines.slice(i, i + LINES_PER_PAGE);
    const pageNum = Math.floor(i / LINES_PER_PAGE) + 1;
    pages.push(`${pageLines.join('\n')}\n\n--- ${pageNum} ---`);
  }
  return pages.join('\f\n');
}

export function generatePdfBytes(
  project: ProjectData,
  trim: PrintTrimFormat = '6x9'
): Uint8Array {
  const formatMap: Record<PrintTrimFormat, [number, number]> = {
    '6x9': [152.4, 228.6],
    '5.5x8.5': [139.7, 215.9],
    a5: [148, 210],
    manuscript: [215.9, 279.4],
  };
  const [widthMm, heightMm] = formatMap[trim];
  const pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm] });
  const margin = 18;
  const maxWidth = widthMm - margin * 2;
  const sortedScenes = [...project.scenes].sort((a, b) => a.chapterNumber - b.chapterNumber);

  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text(project.title, widthMm / 2, heightMm / 3, { align: 'center' });
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  pdf.text(project.compileProfile.authorName || '', widthMm / 2, heightMm / 3 + 10, { align: 'center' });

  for (const scene of sortedScenes) {
    pdf.addPage([widthMm, heightMm]);
    let y = margin;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.text(scene.title, margin, y);
    y += 10;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10.5);
    const paras = stripCanonicalMarkupForPrint(scene.content).split(/\n\s*\n/).filter(Boolean);
    for (const para of paras) {
      const wrapped = pdf.splitTextToSize(para.replace(/^#+\s*/, ''), maxWidth) as string[];
      for (const line of wrapped) {
        if (y > heightMm - margin) {
          pdf.addPage([widthMm, heightMm]);
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 5.2;
      }
      y += 3;
    }
  }

  return new Uint8Array(pdf.output('arraybuffer'));
}

export async function generateMarkdownZipBytes(project: ProjectData): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const file of buildMarkdownVaultFiles(project)) {
    zip.file(file.relativePath, file.content);
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
