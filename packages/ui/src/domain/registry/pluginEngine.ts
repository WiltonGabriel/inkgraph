import { createDefaultWorkspaceConfig } from '../../data/defaultWorkspaceConfig';
import type {
  CustomFieldSchema,
  EntityTypeDefinition,
  InkGraphPluginManifest,
  PluginConsistencyRule,
  PluginSnippetDefinition,
  ProjectData,
  WorkspaceConfig,
  WorkspaceTemplateBundle,
} from '../../types/project';

export interface PluginValidationResult {
  ok: boolean;
  manifest?: InkGraphPluginManifest;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function validateFieldList(raw: unknown): CustomFieldSchema[] {
  if (!Array.isArray(raw)) return [];
  const validTypes = new Set([
    'text',
    'textarea',
    'number',
    'select',
    'boolean',
    'tags',
    'entity_ref',
  ]);
  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter((item) => typeof item.key === 'string' && item.key.trim() && typeof item.label === 'string')
    .map((item) => ({
      key: String(item.key).trim(),
      label: String(item.label).trim(),
      type: validTypes.has(String(item.type))
        ? (String(item.type) as CustomFieldSchema['type'])
        : 'text',
      required: Boolean(item.required),
      placeholder: typeof item.placeholder === 'string' ? item.placeholder : undefined,
      options: Array.isArray(item.options)
        ? item.options.filter((o): o is string => typeof o === 'string')
        : undefined,
      targetEntityType:
        typeof item.targetEntityType === 'string' ? item.targetEntityType : undefined,
      group: typeof item.group === 'string' ? item.group : undefined,
      completenessWeight:
        typeof item.completenessWeight === 'number' ? item.completenessWeight : undefined,
      includeInMemory: Boolean(item.includeInMemory),
    }));
}

export function validatePluginManifest(raw: unknown): PluginValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: 'Manifesto de plugin inválido: esperado um objeto JSON.' };
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const version = typeof raw.version === 'string' ? raw.version.trim() : '1.0.0';

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return {
      ok: false,
      error: 'ID de plugin inválido. Utilize apenas letras, números, hífen ou underscore.',
    };
  }
  if (!name) {
    return { ok: false, error: 'O manifesto do plugin precisa informar um nome (`name`).' };
  }

  const entityTypes: EntityTypeDefinition[] = Array.isArray(raw.entityTypes)
    ? raw.entityTypes
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .filter((item) => typeof item.id === 'string' && typeof item.label === 'string')
        .map((item) => ({
          id: String(item.id).trim(),
          label: String(item.label).trim(),
          pluralLabel:
            typeof item.pluralLabel === 'string' && item.pluralLabel.trim()
              ? item.pluralLabel.trim()
              : `${String(item.label).trim()}s`,
          iconName: typeof item.iconName === 'string' ? item.iconName : 'Box',
          color: typeof item.color === 'string' ? item.color : '#06b6d4',
          isBuiltin: false,
          mentionPrefix: typeof item.mentionPrefix === 'string' ? item.mentionPrefix : '@',
          hiddenNativeFields: [],
          customFields: validateFieldList(item.customFields),
          sourcePluginId: id,
        }))
    : [];

  const fieldExtensions = Array.isArray(raw.fieldExtensions)
    ? raw.fieldExtensions
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .filter((item) => typeof item.targetType === 'string' && item.targetType.trim())
        .map((item) => ({
          targetType: String(item.targetType).trim(),
          fields: validateFieldList(item.fields),
        }))
    : [];

  const snippets: PluginSnippetDefinition[] = Array.isArray(raw.snippets)
    ? raw.snippets
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .filter(
          (item) =>
            typeof item.id === 'string' &&
            typeof item.label === 'string' &&
            typeof item.markdown === 'string'
        )
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          description: typeof item.description === 'string' ? item.description : undefined,
          markdown: String(item.markdown),
        }))
    : [];

  const consistencyRules: PluginConsistencyRule[] = Array.isArray(raw.consistencyRules)
    ? raw.consistencyRules
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .filter(
          (item) =>
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.pattern === 'string' &&
            typeof item.message === 'string'
        )
        .map((item) => ({
          id: String(item.id),
          title: String(item.title),
          severity:
            item.severity === 'error' || item.severity === 'info' ? item.severity : 'warning',
          pattern: String(item.pattern).slice(0, 240),
          flags: typeof item.flags === 'string' ? item.flags : 'i',
          message: String(item.message),
          target:
            item.target === 'scenes' || item.target === 'entities' ? item.target : 'all',
        }))
    : [];

  const settingsSchema = validateFieldList(raw.settingsSchema);

  return {
    ok: true,
    manifest: {
      id,
      name,
      version,
      description: typeof raw.description === 'string' ? raw.description : '',
      author: typeof raw.author === 'string' ? raw.author : undefined,
      enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true,
      entityTypes: entityTypes.length > 0 ? entityTypes : undefined,
      fieldExtensions: fieldExtensions.length > 0 ? fieldExtensions : undefined,
      snippets: snippets.length > 0 ? snippets : undefined,
      consistencyRules: consistencyRules.length > 0 ? consistencyRules : undefined,
      settingsSchema: settingsSchema.length > 0 ? settingsSchema : undefined,
      settingsValues: isRecord(raw.settingsValues) ? { ...raw.settingsValues } : undefined,
    },
  };
}

export function installOrUpdatePlugin(
  config: WorkspaceConfig,
  manifest: InkGraphPluginManifest
): WorkspaceConfig {
  const existingIdx = config.plugins.findIndex((p) => p.id === manifest.id);
  const nextPlugins = [...config.plugins];
  if (existingIdx >= 0) {
    nextPlugins[existingIdx] = manifest;
  } else {
    nextPlugins.push(manifest);
  }
  return { ...config, plugins: nextPlugins };
}

export function togglePluginEnabled(
  config: WorkspaceConfig,
  pluginId: string,
  enabled: boolean
): WorkspaceConfig {
  return {
    ...config,
    plugins: config.plugins.map((p) => (p.id === pluginId ? { ...p, enabled } : p)),
  };
}

export function uninstallPlugin(config: WorkspaceConfig, pluginId: string): WorkspaceConfig {
  return {
    ...config,
    plugins: config.plugins.filter((p) => p.id !== pluginId || p.isBuiltinSample),
  };
}

export function collectPluginSnippets(project: ProjectData): Array<{
  pluginId: string;
  pluginName: string;
  snippet: PluginSnippetDefinition;
}> {
  const enabled = (project.workspaceConfig?.plugins ?? []).filter((p) => p.enabled);
  const items: Array<{
    pluginId: string;
    pluginName: string;
    snippet: PluginSnippetDefinition;
  }> = [];
  for (const plugin of enabled) {
    for (const snippet of plugin.snippets ?? []) {
      items.push({ pluginId: plugin.id, pluginName: plugin.name, snippet });
    }
  }
  return items;
}

export interface PluginRuleFinding {
  ruleId: string;
  pluginId: string;
  pluginName: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  targetType: 'scene' | 'entity';
  targetId: string;
  targetName: string;
}

export function evaluatePluginConsistencyRules(project: ProjectData): PluginRuleFinding[] {
  const enabled = (project.workspaceConfig?.plugins ?? []).filter((p) => p.enabled);
  const findings: PluginRuleFinding[] = [];

  for (const plugin of enabled) {
    for (const rule of plugin.consistencyRules ?? []) {
      if (!rule.pattern || rule.pattern.length > 240) continue;
      let regex: RegExp;
      try {
        regex = new RegExp(rule.pattern, rule.flags?.replace(/[^gimsuy]/g, '') || 'i');
      } catch {
        continue;
      }

      if (rule.target === 'scenes' || rule.target === 'all' || !rule.target) {
        for (const scene of project.scenes) {
          if (regex.test(scene.content) || regex.test(scene.summary)) {
            findings.push({
              ruleId: rule.id,
              pluginId: plugin.id,
              pluginName: plugin.name,
              severity: rule.severity,
              title: rule.title,
              message: rule.message,
              targetType: 'scene',
              targetId: scene.id,
              targetName: scene.title,
            });
          }
        }
      }

      if (rule.target === 'entities' || rule.target === 'all') {
        for (const char of project.characters) {
          if (regex.test(char.notes) || regex.test(char.backstory)) {
            findings.push({
              ruleId: rule.id,
              pluginId: plugin.id,
              pluginName: plugin.name,
              severity: rule.severity,
              title: rule.title,
              message: rule.message,
              targetType: 'entity',
              targetId: char.id,
              targetName: char.name,
            });
          }
        }
      }
    }
  }

  return findings;
}

export function exportWorkspaceTemplateBundle(
  project: ProjectData,
  name: string,
  description: string
): WorkspaceTemplateBundle {
  return {
    format: 'inkgraph-workspace-template',
    schemaVersion: 1,
    name: name.trim() || `${project.title} (Modelo)`,
    description: description.trim() || `Modelo estrutural exportado de ${project.title}.`,
    exportedAt: new Date().toISOString(),
    genre: project.genre,
    workspaceConfig: project.workspaceConfig ?? createDefaultWorkspaceConfig(),
    compileProfile: project.compileProfile,
  };
}

export function parseWorkspaceTemplateBundle(raw: unknown): {
  ok: boolean;
  bundle?: WorkspaceTemplateBundle;
  error?: string;
} {
  if (!isRecord(raw) || raw.format !== 'inkgraph-workspace-template') {
    return {
      ok: false,
      error: 'Arquivo não reconhecido. Esperado um modelo .inktemplate.json do InkGraph.',
    };
  }
  if (!isRecord(raw.workspaceConfig)) {
    return { ok: false, error: 'Modelo incompleto: campo `workspaceConfig` ausente.' };
  }
  return {
    ok: true,
    bundle: raw as unknown as WorkspaceTemplateBundle,
  };
}
