import { describe, it, expect } from 'vitest';
import { countWords, estimateReadingMinutes } from '../../ui/src/domain/wordCounter';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
} from '../../ui/src/domain/completenessCalculator';
import { evaluateProjectHeuristics } from '../../ui/src/domain/narrativeHeuristics';
import { createDemoProjectData } from '../../ui/src/data/demoProjectFactory';
import { createBlankProjectData } from '../../ui/src/data/blankProjectFactory';
import { DEFAULT_SETTINGS } from '../../ui/src/data/defaultSettings';
import { getDictionary } from '../../ui/src/i18n/translations';

describe('UI Domain Calculators, Settings & i18n (SRP Verification)', () => {
  it('accurately counts words and estimates reading time', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('O Comandante Elias Vance caminhou sob as cinzas.')).toBe(8);
    expect(estimateReadingMinutes(450)).toBe(3);
  });

  it('calculates completeness percentages for characters, factions, and worlds', () => {
    const demo = createDemoProjectData();
    const elias = demo.characters[0];
    const order = demo.factions[0];
    const vael = demo.worlds[0];

    expect(calculateCharacterCompleteness(elias)).toBe(100);
    expect(calculateFactionCompleteness(order)).toBe(100);
    expect(calculateWorldCompleteness(vael)).toBe(100);
  });

  it('creates a valid blank project and computes heuristic insights', () => {
    const blank = createBlankProjectData('Teste em Branco');
    expect(blank.title).toBe('Teste em Branco');
    expect(blank.scenes).toHaveLength(1);
    expect(blank.characters).toHaveLength(0);

    const demo = createDemoProjectData();
    const insights = evaluateProjectHeuristics(demo);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.some((i) => i.id === 'ins_staging')).toBe(true);
  });

  it('provides complete bilingual dictionaries (pt-BR and en) and global program settings', () => {
    const pt = getDictionary('pt-BR');
    const en = getDictionary('en');

    expect(pt.home.title).toBe('Meu Espaço');
    expect(en.home.title).toBe('My Space');
    expect(pt.home.openWorkspaceBtn).toBe('Abrir Workspace');
    expect(en.home.openWorkspaceBtn).toBe('Open Workspace');

    expect(DEFAULT_SETTINGS.language).toBe('pt-BR');
    expect(DEFAULT_SETTINGS.startupBehavior).toBe('home');
    expect(DEFAULT_SETTINGS.shortcuts.commandPalette).toBe('Ctrl+K');
    expect(DEFAULT_SETTINGS.mcpServerPort).toBe(3333);
  });
});
