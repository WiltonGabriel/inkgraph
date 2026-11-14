import { describe, it, expect } from 'vitest';
import { BaseEntitySchema, PluginManifestSchema } from '../src/index';
import { createBlankProjectData } from '../../ui/src/data/blankProjectFactory';
import { normalizeWorkspaceData } from '../../ui/src/domain/workspaceNormalizer';
import {
  getEffectiveEntitySchemas,
  listCustomEntitySchemas,
  listUnifiedEntities,
  isModuleEnabled,
  validatePluginManifest,
  togglePluginEnabled,
  evaluatePluginConsistencyRules,
  exportWorkspaceTemplateBundle,
  parseWorkspaceTemplateBundle,
} from '../../ui/src/domain/registry';
import { calculateCharacterCompleteness } from '../../ui/src/domain/completenessCalculator';
import { buildWorkspaceSystemPrompt } from '../../ui/src/domain/memoryCompiler';
import {
  buildFilteredGraphData,
  getGraphLayersForProject,
} from '../../ui/src/components/graph/graphDataBuilder';

describe('Modular Workspace Config, Registry Kernel & Declarative Plugins', () => {
  it('validates custom_attributes in @inkgraph/core BaseEntitySchema and PluginManifestSchema', () => {
    const parsedEntity = BaseEntitySchema.parse({
      id: 'char_test',
      type: 'character',
      name: 'Aria',
      custom_attributes: { rpg_level: 12, guild: 'Vanguarda' },
    });
    expect(parsedEntity.custom_attributes?.rpg_level).toBe(12);

    const parsedPlugin = PluginManifestSchema.parse({
      id: 'plugin_cyber',
      name: 'Cyberpunk Core',
      version: '1.0.0',
      enabled: true,
      entityTypes: [
        {
          id: 'cyberware',
          label: 'Implante',
          pluralLabel: 'Implantes',
          customFields: [{ key: 'humanity_cost', label: 'Custo de Humanidade', type: 'number' }],
        },
      ],
    });
    expect(parsedPlugin.entityTypes?.[0]?.id).toBe('cyberware');
  });

  it('retroactively populates workspaceConfig and customEntities on legacy workspaces', () => {
    const legacy = { title: 'Obra Antiga', scenes: [{ id: 's1', title: 'Cap 1', content: 'Texto' }] };
    const normalized = normalizeWorkspaceData(legacy);
    expect(normalized).not.toBeNull();
    expect(normalized?.workspaceConfig?.acts.length).toBe(3);
    expect(normalized?.workspaceConfig?.entitySchemas.character.label).toBe('Personagem');
    expect(normalized?.customEntities).toEqual({});
  });

  it('merges enabled plugin entity types & field extensions into effective entity schemas', () => {
    const project = createBlankProjectData('Livro Modular');
    expect(listCustomEntitySchemas(project)).toHaveLength(0);

    project.workspaceConfig = togglePluginEnabled(
      project.workspaceConfig!,
      'plugin_litrpg_stats',
      true
    );

    const schemas = getEffectiveEntitySchemas(project);
    expect(schemas.skill_ability).toBeDefined();
    expect(schemas.skill_ability.label).toBe('Habilidade');
    expect(schemas.character.customFields.some((f) => f.key === 'rpg_class')).toBe(true);
    expect(listCustomEntitySchemas(project)).toHaveLength(1);
  });

  it('lists unified entities including customEntities records', () => {
    const project = createBlankProjectData('Mistério');
    project.workspaceConfig = togglePluginEnabled(
      project.workspaceConfig!,
      'plugin_crime_dossier',
      true
    );
    project.customEntities = {
      clue_evidence: [
        {
          id: 'clue_1',
          entityTypeId: 'clue_evidence',
          name: 'Chave Ensanguentada',
          aliases: ['Chave 4B'],
          status: 'canon',
          summary: 'Encontrada atrás do balcão.',
          notes: '',
          tags: ['forense'],
          customAttributes: { authenticity: 'Genuína' },
          relationships: [],
          epistemicSecrets: [],
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const all = listUnifiedEntities(project);
    const clue = all.find((e) => e.id === 'clue_1');
    expect(clue).toBeDefined();
    expect(clue?.isBuiltin).toBe(false);
    expect(clue?.typeLabel).toBe('Pista / Evidência');
    expect(clue?.customAttributes.authenticity).toBe('Genuína');
  });

  it('protects essential modules from being disabled', () => {
    const project = createBlankProjectData('Teste Módulos');
    project.workspaceConfig!.disabledModules = ['manuscript', 'workspace-settings', 'critic'];

    expect(isModuleEnabled(project, 'manuscript')).toBe(true);
    expect(isModuleEnabled(project, 'workspace-settings')).toBe(true);
    expect(isModuleEnabled(project, 'critic')).toBe(false);
  });

  it('validates plugin manifests, runs plugin consistency rules, and roundtrips workspace templates', () => {
    const bad = validatePluginManifest({ id: 'invalid id!', name: '' });
    expect(bad.ok).toBe(false);

    const good = validatePluginManifest({
      id: 'custom_steampunk',
      name: 'Engrenagens & Vapor',
      version: '1.2.0',
      consistencyRules: [
        {
          id: 'steam_placeholder',
          title: 'Marcador FIXME',
          severity: 'warning',
          pattern: 'FIXME_STEAM',
          message: 'Remova o marcador temporário.',
          target: 'scenes',
        },
      ],
    });
    expect(good.ok).toBe(true);

    const project = createBlankProjectData('Vapor');
    project.workspaceConfig!.plugins.push(good.manifest!);
    project.scenes[0].content = 'A caldeira falhou FIXME_STEAM na estação.';

    const findings = evaluatePluginConsistencyRules(project);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('steam_placeholder');

    const bundle = exportWorkspaceTemplateBundle(project, 'Template Vapor', '4 atos');
    const parsedBundle = parseWorkspaceTemplateBundle(bundle);
    expect(parsedBundle.ok).toBe(true);
    expect(parsedBundle.bundle?.name).toBe('Template Vapor');
  });

  it('persists author field overrides and hiddenCustomFields over plugin defaults', () => {
    const project = createBlankProjectData('RPG Customizado');
    project.workspaceConfig = togglePluginEnabled(
      project.workspaceConfig!,
      'plugin_litrpg_stats',
      true
    );

    // Override plugin field `rank` (from F..S select -> number 1..100) & hide `mana_cost`
    project.workspaceConfig!.entitySchemas.skill_ability = {
      ...getEffectiveEntitySchemas(project).skill_ability,
      hiddenCustomFields: ['mana_cost'],
      customFields: [
        {
          key: 'rank',
          label: 'Potência Numérica (AEF)',
          type: 'number',
          required: true,
          completenessWeight: 5,
          includeInMemory: true,
        },
      ],
    };

    const effective = getEffectiveEntitySchemas(project).skill_ability;
    const rankField = effective.customFields.find((f) => f.key === 'rank');
    expect(rankField?.type).toBe('number');
    expect(rankField?.label).toBe('Potência Numérica (AEF)');
    expect(rankField?.required).toBe(true);
    expect(effective.customFields.some((f) => f.key === 'mana_cost')).toBe(false);
  });

  it('dynamically scores character completeness ignoring hidden native fields and counting required custom fields', () => {
    const project = createBlankProjectData('Completude Dinâmica');
    const charSchema = getEffectiveEntitySchemas(project).character;
    const hero = {
      id: 'char_hero',
      name: 'Kael',
      aliases: [],
      role: 'Protagonista',
      archetype: 'hero' as const,
      status: 'canon' as const,
      avatarColor: '#3b82f6',
      appearance: '',
      backstory: '',
      motivation: 'Proteger a cidadela',
      personalityTraits: 'Determinado',
      flaws: 'Orgulhoso',
      want: '',
      need: '',
      lieBelieved: '',
      ghost: '',
      characterArc: '',
      arcAct1: '',
      arcAct2: '',
      arcAct3: '',
      relationships: [],
      epistemicSecrets: [],
      tags: [],
      notes: '',
    };

    const relaxedSchema = {
      ...charSchema,
      hiddenNativeFields: ['appearance', 'backstory', 'want', 'need', 'arcsByAct'],
      customFields: [
        {
          key: 'poder_especial',
          label: 'Poder Especial',
          type: 'text' as const,
          required: true,
          completenessWeight: 5,
        },
      ],
    };
    const beforeFill = calculateCharacterCompleteness(hero, relaxedSchema);
    const afterFill = calculateCharacterCompleteness(
      { ...hero, customAttributes: { poder_especial: 'Cronocinese' } },
      relaxedSchema
    );
    expect(afterFill).toBeGreaterThan(beforeFill);
  });

  it('renders custom entities and entity_ref custom links in Graph and compiles schema-aware System Prompt', () => {
    const project = createBlankProjectData('Grafo e IA');
    project.workspaceConfig = togglePluginEnabled(
      project.workspaceConfig!,
      'plugin_litrpg_stats',
      true
    );
    project.workspaceConfig!.entitySchemas.skill_ability = {
      ...getEffectiveEntitySchemas(project).skill_ability,
      customFields: [
        ...getEffectiveEntitySchemas(project).skill_ability.customFields,
        {
          key: 'origin_char',
          label: 'Criador da Técnica',
          type: 'entity_ref',
          targetEntityType: 'character',
          includeInMemory: true,
        },
      ],
    };

    const heroId = 'char_kael';
    project.characters = [
      {
        id: heroId,
        name: 'Kael',
        aliases: [],
        role: 'Protagonista',
        archetype: 'hero',
        status: 'canon',
        avatarColor: '#3b82f6',
        appearance: '',
        backstory: '',
        motivation: '',
        personalityTraits: '',
        flaws: '',
        want: '',
        need: '',
        lieBelieved: '',
        ghost: '',
        characterArc: '',
        arcAct1: '',
        arcAct2: '',
        arcAct3: '',
        relationships: [],
        epistemicSecrets: [],
        tags: [],
        notes: '',
      },
    ];
    project.customEntities = {
      skill_ability: [
        {
          id: 'skill_void',
          entityTypeId: 'skill_ability',
          name: 'Corte Dimensional',
          aliases: [],
          status: 'canon',
          summary: 'Golpe espacial.',
          notes: '',
          tags: [],
          customAttributes: { rank: 'S', origin_char: heroId },
          relationships: [],
          epistemicSecrets: [],
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const layers = getGraphLayersForProject(project);
    expect(layers.some((l) => l.kind === 'skill_ability')).toBe(true);

    const graph = buildFilteredGraphData(
      project,
      layers.map((l) => l.kind)
    );
    expect(graph.nodes.some((n) => n.id === 'skill_void' && n.kind === 'skill_ability')).toBe(
      true
    );
    expect(graph.links.some((l) => l.source === 'skill_void' && l.target === heroId)).toBe(true);

    project.workspaceConfig!.agentConfig!.customSystemPrompt =
      'Sempre responder como revisor técnico rigoroso.';
    const prompt = buildWorkspaceSystemPrompt(project);
    expect(prompt).toContain('Sempre responder como revisor técnico rigoroso.');
    expect(prompt).toContain('skill_ability');
    expect(prompt).toContain('origin_char');
  });
});
