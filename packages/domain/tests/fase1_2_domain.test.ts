import { describe, expect, it } from 'vitest';
import {
  computeContentDigest,
  computeSyncDeltaPlan,
  runAllNarrativeHeuristics,
  scanUncatalogedCodexTerms,
} from '../src/index';

describe('Fase 1 Pure Domain Engines (Heuristics, Codex Scanner & Sync Delta)', () => {
  it('detects structural, epistemic leak, repetition, and filter-word diagnostics across scenes', () => {
    const diagnostics = runAllNarrativeHeuristics({
      locale: 'pt-BR',
      scenes: [
        {
          id: 's1',
          chapterNumber: 1,
          title: 'Abertura',
          content:
            'Ele sentiu muito medo e realmente percebeu o perigo. Ele achou que parecia tarde e notou que o traidor real forjou o tratado secreto antes da festa. ' +
            'Palavras repetidas para testar filtro muito muito muito realmente realmente parecia parecia sentiu sentiu viu viu.\n\n' +
            'O guarda caminhava pelas muralhas frias do porto antigo sob intensa chuva costeira e trovões distantes.\n\n' +
            'O guarda caminhava pelas muralhas frias do porto antigo sob intensa chuva costeira e ventos fortes.',
          act: 1,
          tension: 80,
          povCharacterId: 'char_elias',
          subplotIds: ['sub_1'],
        },
        {
          id: 's2',
          chapterNumber: 2,
          title: 'Descanso',
          content: 'Cena calma no pátio.',
          act: 2,
          tension: 40,
          subplotIds: [],
        },
        {
          id: 's3',
          chapterNumber: 3,
          title: 'Meio',
          content: 'Treino sem conflito.',
          act: 2,
          tension: 45,
          subplotIds: [],
        },
      ],
      secrets: [
        {
          ownerId: 'char_mara',
          ownerName: 'Mara',
          secret: 'traidor real forjou tratado secreto',
          knownByIds: ['char_mara'],
          revealedInSceneId: 's3',
        },
      ],
      subplots: [{ id: 'sub_1', name: 'Conspiração do Tratado' }],
    });

    const ruleIds = new Set(diagnostics.map((d) => d.ruleId));
    expect(ruleIds.has('lexical_repetition')).toBe(true);
    expect(ruleIds.has('missing_act2_midpoint')).toBe(true);
    expect(ruleIds.has('premature_secret_or_intro')).toBe(true);
    expect(ruleIds.has('sudden_tension_drop')).toBe(true);
    expect(ruleIds.has('filter_word_density')).toBe(true);
    expect(ruleIds.has('unclosed_thread')).toBe(true);
  });

  it('discovers recurring uncataloged entities in prose via Story Codex scanner', () => {
    const discovered = scanUncatalogedCodexTerms({
      scenes: [
        { id: 's1', content: 'Elias falou com Corvo Branco perto da Cidadela Cinzenta.' },
        { id: 's2', content: 'Mais tarde, Corvo Branco deixou uma carta na Cidadela Cinzenta.' },
      ],
      knownNamesAndAliases: ['Elias', 'Elias Vance'],
      minMentions: 2,
    });

    expect(discovered.map((d) => d.term)).toContain('Corvo Branco');
    expect(discovered.map((d) => d.term)).toContain('Cidadela Cinzenta');
    expect(discovered.map((d) => d.term)).not.toContain('Elias');
  });

  it('flags offline sync conflicts instead of overwriting divergent edits', () => {
    const delta = computeSyncDeltaPlan({
      workspaceId: 'ws_1',
      localFiles: [
        {
          path: 'manuscript/01.md',
          hash: computeContentDigest('Versão editada no celular no avião'),
          updatedAt: '2026-11-10T12:00:00Z',
          deviceName: 'Celular',
          content: 'Versão editada no celular no avião',
        },
        {
          path: 'manuscript/02.md',
          hash: computeContentDigest('Cena 2 local'),
          updatedAt: '2026-11-10T12:05:00Z',
          deviceName: 'Celular',
          content: 'Cena 2 local',
        },
      ],
      remoteFiles: [
        {
          path: 'manuscript/01.md',
          hash: computeContentDigest('Versão editada no PC de casa'),
          updatedAt: '2026-11-10T12:01:00Z',
          deviceName: 'PC Casa',
          content: 'Versão editada no PC de casa',
        },
      ],
      lastSyncedHashes: {
        'manuscript/01.md': computeContentDigest('Versão original antes de viajar'),
      },
      localCursor: {
        lastWorkspaceId: 'ws_1',
        lastView: 'manuscript',
        lastSceneId: 's1',
        scrollRatio: 0.4,
        deviceName: 'Celular',
        updatedAt: '2026-11-10T12:05:00Z',
      },
      remoteCursor: {
        lastWorkspaceId: 'ws_1',
        lastView: 'dashboard',
        lastSceneId: 's1',
        scrollRatio: 0.1,
        deviceName: 'PC Casa',
        updatedAt: '2026-11-10T11:00:00Z',
      },
    });

    expect(delta.conflicts).toHaveLength(1);
    expect(delta.conflicts[0]?.entityOrSceneId).toBe('manuscript/01.md');
    expect(delta.toUpload).toHaveLength(1);
    expect(delta.toUpload[0]?.path).toBe('manuscript/02.md');
    expect(delta.preferredCursor?.deviceName).toBe('Celular');
  });
});
