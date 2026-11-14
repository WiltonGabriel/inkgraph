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
});
