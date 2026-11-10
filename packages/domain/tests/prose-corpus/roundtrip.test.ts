import { describe, expect, it } from 'vitest';
import {
  canonicalMarkdownToHtml,
  extractEpistemicDirectives,
  formatCanonicalDirective,
  htmlToCanonicalMarkdown,
  splitSceneMarkdownAtOffset,
} from '../../src/canonicalProseCodec';

describe('Canonical Prose Corpus Round-Trip (Fase 2)', () => {
  const CORPUS: readonly { name: string; markdown: string }[] = [
    {
      name: 'Brazilian Portuguese literary dialogue & semantic ID links',
      markdown: [
        '# Capítulo 1: Neblina no Cais',
        '',
        '— Você trouxe a carta, [Elias Vance](kb:char_elias_vance)? — perguntou **Mara**, ajustando o manto *molhado*.',
        '',
        '* * *',
        '',
        'Ninguém respondeu enquanto os sinos da `Catedral` soavam ao longe.',
      ].join('\n'),
    },
    {
      name: 'Inline ::beat and ::epistemic-reveal directives',
      markdown: [
        '## Interrogatório',
        '',
        '::beat{id="b_01" status="draft"}\nCriar tensão silenciosa antes da confissão.\n::',
        '',
        '::epistemic-reveal{entity="char_mara" secret="Assinou o pacto norte" mode="reveal"}\nMara pousou o anel quebrado sobre o mapa.\n::',
        '',
        '> O silêncio vale mais que uma lâmina.',
      ].join('\n'),
    },
    {
      name: 'Bullet list and structured notes',
      markdown: [
        '### Inventário da Viagem',
        '',
        '- Bússola quebrada',
        '- Carta selada em cera',
        '- Mapa da fronteira norte',
      ].join('\n'),
    },
  ];

  for (const sample of CORPUS) {
    it(`preserves exact canonical Markdown round-trip: ${sample.name}`, () => {
      const html = canonicalMarkdownToHtml(sample.markdown);
      const restored = htmlToCanonicalMarkdown(html);
      expect(restored).toBe(sample.markdown);
    });
  }

  it('extracts epistemic reveal markers and formats directives cleanly', () => {
    const dir = formatCanonicalDirective({
      kind: 'epistemic-reveal',
      attributes: { entity: 'char_elias', secret: 'Chave oculta', mode: 'reveal' },
      body: 'Elias abriu o fundo falso da escrivaninha.',
    });

    const markers = extractEpistemicDirectives(`Texto antes.\n\n${dir}\n\nTexto depois.`);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.entity).toBe('char_elias');
    expect(markers[0]?.secret).toBe('Chave oculta');
  });

  it('splits scene prose cleanly at cursor offset', () => {
    const split = splitSceneMarkdownAtOffset('Parágrafo um.\n\nParágrafo dois.', 14);
    expect(split.before).toBe('Parágrafo um.');
    expect(split.after).toBe('Parágrafo dois.');
  });
});
