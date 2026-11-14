import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createDemoProjectData } from '../src/data/demoProjectFactory';
import {
  exportNormseiteText,
  generateDocxBytes,
  generateEpub3Bytes,
  generateMarkdownZipBytes,
  generatePdfBytes,
  runPublicationPreflight,
} from '../src/export/exporters';
import {
  previewDocxImport,
  previewMarkdownFolderImport,
  previewNovelcrafterImport,
} from '../src/import/importers';

describe('@inkgraph/ui Fase 3 Editorial Export, Preflight & Importers', () => {
  it('flags empty manuscripts, broken kb links, and unresolved epistemic entities in preflight', () => {
    const emptyProj = createDemoProjectData();
    emptyProj.scenes = [];
    const emptyIssues = runPublicationPreflight(emptyProj);
    expect(emptyIssues.some((i) => i.severity === 'error')).toBe(true);

    const project = createDemoProjectData();
    project.scenes = [
      {
        ...project.scenes[0]!,
        id: 'sc_pf_1',
        title: 'Cena com Problemas',
        status: 'final',
        content: [
          'Texto mencionando [Fantasma](kb:char_missing_999).',
          '::epistemic-reveal{entity="char_unknown_888" knownTo="protagonist" timing="late"}',
          'Segredo oculto.',
          '::',
        ].join('\n'),
      },
    ];
    const issues = runPublicationPreflight(project);
    expect(issues.some((i) => i.id.includes('pf_link'))).toBe(true);
    expect(issues.some((i) => i.id.includes('pf_ep'))).toBe(true);
  });

  it('builds standards-compliant EPUB 3 archive stripping private directives', async () => {
    const project = createDemoProjectData();
    const firstChar = project.characters[0];
    project.scenes = [
      {
        ...project.scenes[0]!,
        chapterNumber: 1,
        title: 'Despertar na Torre',
        content: [
          '::beat{goal="Abrir capítulo"}',
          'Nota privada de beat que não pode ir para o livro.',
          '::',
          '',
          `O vento cortava a janela enquanto [${firstChar?.name ?? 'Kaela'}](kb:${firstChar?.id ?? 'c1'}) observava o vale.`,
        ].join('\n'),
      },
    ];

    const epubBytes = await generateEpub3Bytes(project);
    const zip = await JSZip.loadAsync(epubBytes);

    expect(await zip.file('mimetype')?.async('string')).toBe('application/epub+zip');
    expect(zip.file('META-INF/container.xml')).not.toBeNull();
    const opf = await zip.file('OEBPS/content.opf')?.async('string');
    const chapter1 = await zip.file('OEBPS/chapter_1.xhtml')?.async('string');

    expect(opf).toContain(project.title);
    expect(chapter1).toContain('Despertar na Torre');
    expect(chapter1).not.toContain('Nota privada de beat');
    expect(chapter1).toContain(firstChar?.name ?? 'Kaela');
  });

  it('round-trips generated DOCX cleanly through previewDocxImport', async () => {
    const project = createDemoProjectData();
    project.scenes = [
      {
        ...project.scenes[0]!,
        chapterNumber: 1,
        title: 'Prólogo de Ferro',
        content: 'Primeiro parágrafo narrativo.\n\nSegundo parágrafo com diálogos.',
      },
      {
        ...project.scenes[0]!,
        id: 'sc_2',
        chapterNumber: 2,
        title: 'A Travessia',
        content: 'Navios zarparam antes do amanhecer.',
      },
    ];

    const docxBytes = await generateDocxBytes(project);
    expect(docxBytes[0]).toBe(0x50); // 'P'
    expect(docxBytes[1]).toBe(0x4b); // 'K'

    const imported = await previewDocxImport(docxBytes, 'livro.docx');
    expect(imported.warnings).toHaveLength(0);
    expect(imported.scenes.length).toBeGreaterThanOrEqual(2);
    expect(imported.scenes.some((s) => s.title.includes('Prólogo de Ferro'))).toBe(true);
    expect(imported.scenes.some((s) => s.content.includes('Navios zarparam'))).toBe(true);
  });

  it('exports Normseite with \\f form-feeds, PDF binary header, and Markdown vault ZIP', async () => {
    const project = createDemoProjectData();
    project.scenes = [
      {
        ...project.scenes[0]!,
        chapterNumber: 1,
        title: 'Capítulo Extenso',
        content: Array.from(
          { length: 45 },
          (_, i) => `Linha ${i + 1}: Esta é uma frase suficientemente longa para validar quebra de lauda padrão de sessenta colunas.`
        ).join('\n\n'),
      },
    ];

    const norm = exportNormseiteText(project);
    expect(norm).toContain('\f');
    const longLines = norm.split('\n').filter((line) => line.length > 60 && !line.startsWith('==='));
    expect(longLines).toHaveLength(0);

    const pdfBytes = generatePdfBytes(project, '6x9');
    const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 5));
    expect(pdfHeader).toBe('%PDF-');

    const mdZipBytes = await generateMarkdownZipBytes(project);
    const mdZip = await JSZip.loadAsync(mdZipBytes);
    const mdNames = Object.keys(mdZip.files);
    expect(mdNames.some((n) => n.startsWith('manuscript/'))).toBe(true);
    expect(mdNames.some((n) => n.startsWith('lore/characters/'))).toBe(true);
  });

  it('previews Markdown folders and Novelcrafter codex+scene ZIP packages', async () => {
    const mdResult = previewMarkdownFolderImport([
      {
        name: '01_abertura.md',
        content: '---\ntitle: Abertura Silenciosa\n---\n\nNeve caía sobre o porto.',
      },
      {
        name: '02_chegada.md',
        content: '# A Chegada\n\nO mensageiro bateu três vezes.',
      },
    ]);
    expect(mdResult.scenes).toHaveLength(2);
    expect(mdResult.scenes[0]?.title).toBe('Abertura Silenciosa');
    expect(mdResult.scenes[1]?.title).toBe('A Chegada');

    const zip = new JSZip();
    zip.file(
      'novel.json',
      JSON.stringify({
        codex: [{ name: 'Dorian Voss', type: 'Antagonista', description: 'Almirante exilado' }],
        scenes: [{ title: 'Cais Norte', text: 'As lanternas se apagaram.' }],
      })
    );
    const ncBytes = await zip.generateAsync({ type: 'uint8array' });
    const ncPreview = await previewNovelcrafterImport(ncBytes, 'export.zip');
    expect(ncPreview.characters).toHaveLength(1);
    expect(ncPreview.characters[0]?.name).toBe('Dorian Voss');
    expect(ncPreview.scenes).toHaveLength(1);
    expect(ncPreview.scenes[0]?.title).toBe('Cais Norte');
  });
});
