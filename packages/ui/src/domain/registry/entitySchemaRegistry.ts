import { BUILTIN_ENTITY_SCHEMAS } from '../../data/defaultWorkspaceConfig';
import type {
  CanonStatus,
  CustomFieldSchema,
  EntityRelationship,
  EntityTypeDefinition,
  EpistemicSecret,
  ProjectData,
} from '../../types/project';

export interface NativeFieldOption {
  key: string;
  label: string;
}

/**
 * Optional native fields per built-in entity studio that authors can hide
 * in Workspace Settings without deleting existing project data.
 */
export const NATIVE_FIELD_OPTIONS: Record<string, NativeFieldOption[]> = {
  character: [
    { key: 'age', label: 'Idade / Faixa Etária' },
    { key: 'factionId', label: 'Facção Vinculada' },
    { key: 'locationId', label: 'Local Atual' },
    { key: 'appearance', label: 'Aparência Física' },
    { key: 'backstory', label: 'História Pregressa' },
    { key: 'want', label: 'Desejo (Want)' },
    { key: 'need', label: 'Necessidade (Need)' },
    { key: 'lieBelieved', label: 'Mentira em que Acredita' },
    { key: 'ghost', label: 'Ferida / Fantasma' },
    { key: 'arcsByAct', label: 'Arcos por Ato' },
  ],
  faction: [
    { key: 'motto', label: 'Lema / Divisa' },
    { key: 'secretAgenda', label: 'Agenda Secreta' },
    { key: 'doctrine', label: 'Doutrina / Código' },
    { key: 'resourcesAndPower', label: 'Recursos e Poder' },
    { key: 'internalConflicts', label: 'Conflitos Internos' },
    { key: 'ranks', label: 'Hierarquia e Patentes' },
  ],
  location: [
    { key: 'population', label: 'População / Escala' },
    { key: 'climateOrAtmosphere', label: 'Clima e Atmosfera' },
    { key: 'strategicValue', label: 'Valor Estratégico' },
    { key: 'controlledByFactionId', label: 'Controle Territorial' },
  ],
  rule_system: [
    { key: 'coreSource', label: 'Fonte / Princípio Central' },
    { key: 'costsAndToll', label: 'Custos e Desgastes' },
    { key: 'socialTaboos', label: 'Tabus e Leis Sociais' },
  ],
  object: [
    { key: 'ownerCharacterId', label: 'Portador Atual' },
    { key: 'significance', label: 'Importância Narrativa' },
    { key: 'rulesOrCapabilities', label: 'Regras / Capacidades' },
  ],
};

function mergeCustomFields(
  baseFields: CustomFieldSchema[],
  extraFields: CustomFieldSchema[]
): CustomFieldSchema[] {
  const byKey = new Map<string, CustomFieldSchema>();
  for (const field of baseFields) {
    byKey.set(field.key, field);
  }
  for (const field of extraFields) {
    byKey.set(field.key, field);
  }
  return Array.from(byKey.values());
}

export function getPluginProvidedFieldKeys(
  project: ProjectData,
  typeId: string
): Set<string> {
  const keys = new Set<string>();
  const enabledPlugins = (project.workspaceConfig?.plugins ?? []).filter((p) => p.enabled);
  for (const plugin of enabledPlugins) {
    for (const pt of plugin.entityTypes ?? []) {
      if (pt.id === typeId) {
        for (const f of pt.customFields) keys.add(f.key);
      }
    }
    for (const ext of plugin.fieldExtensions ?? []) {
      if (ext.targetType === typeId) {
        for (const f of ext.fields) keys.add(f.key);
      }
    }
  }
  return keys;
}

/**
 * Resolves the effective entity schemas for a workspace by combining:
 * 1. Built-in default schemas
 * 2. Custom entity types and field extensions from enabled plugins
 * 3. Author customizations in `project.workspaceConfig.entitySchemas` (always take precedence)
 * 4. Filtering out any fields listed in `hiddenCustomFields`
 */
export function getEffectiveEntitySchemas(
  project: ProjectData
): Record<string, EntityTypeDefinition> {
  const result: Record<string, EntityTypeDefinition> = {};
  const workspaceSchemas = project.workspaceConfig?.entitySchemas ?? {};
  const enabledPlugins = (project.workspaceConfig?.plugins ?? []).filter((p) => p.enabled);

  // 1. Built-in baselines
  for (const [id, builtin] of Object.entries(BUILTIN_ENTITY_SCHEMAS)) {
    result[id] = {
      ...builtin,
      hiddenNativeFields: [...builtin.hiddenNativeFields],
      hiddenCustomFields: [...(builtin.hiddenCustomFields ?? [])],
      requiredNativeFields: [...(builtin.requiredNativeFields ?? [])],
      customFields: [...builtin.customFields],
    };
  }

  // 2. Enabled plugin entity types (base)
  for (const plugin of enabledPlugins) {
    for (const pluginType of plugin.entityTypes ?? []) {
      const existing = result[pluginType.id];
      result[pluginType.id] = existing
        ? {
            ...pluginType,
            ...existing,
            customFields: mergeCustomFields(existing.customFields, pluginType.customFields),
            sourcePluginId: existing.sourcePluginId ?? plugin.id,
          }
        : {
            ...pluginType,
            isBuiltin: false,
            hiddenNativeFields: [...(pluginType.hiddenNativeFields ?? [])],
            hiddenCustomFields: [...(pluginType.hiddenCustomFields ?? [])],
            requiredNativeFields: [...(pluginType.requiredNativeFields ?? [])],
            customFields: [...(pluginType.customFields ?? [])],
            sourcePluginId: plugin.id,
          };
    }
  }

  // 3. Enabled plugin field extensions (base)
  for (const plugin of enabledPlugins) {
    for (const ext of plugin.fieldExtensions ?? []) {
      const target = result[ext.targetType];
      if (!target) continue;
      result[ext.targetType] = {
        ...target,
        customFields: mergeCustomFields(target.customFields, ext.fields),
      };
    }
  }

  // 4. Author workspace overrides (always take precedence over plugin defaults)
  for (const [id, custom] of Object.entries(workspaceSchemas)) {
    const base = result[id];
    if (base) {
      result[id] = {
        ...base,
        ...custom,
        id,
        isBuiltin: base.isBuiltin,
        builtinTarget: base.builtinTarget,
        hiddenNativeFields: [...(custom.hiddenNativeFields ?? base.hiddenNativeFields ?? [])],
        hiddenCustomFields: [...(custom.hiddenCustomFields ?? base.hiddenCustomFields ?? [])],
        requiredNativeFields: [...(custom.requiredNativeFields ?? base.requiredNativeFields ?? [])],
        customFields: mergeCustomFields(base.customFields, custom.customFields ?? []),
        sourcePluginId: base.sourcePluginId ?? custom.sourcePluginId,
      };
    } else {
      result[id] = {
        ...custom,
        id,
        hiddenNativeFields: [...(custom.hiddenNativeFields ?? [])],
        hiddenCustomFields: [...(custom.hiddenCustomFields ?? [])],
        requiredNativeFields: [...(custom.requiredNativeFields ?? [])],
        customFields: [...(custom.customFields ?? [])],
      };
    }
  }

  // 5. Filter out hidden plugin/custom fields
  for (const [id, schema] of Object.entries(result)) {
    const hidden = new Set(schema.hiddenCustomFields ?? []);
    if (hidden.size > 0) {
      result[id] = {
        ...schema,
        customFields: schema.customFields.filter((f) => !hidden.has(f.key)),
      };
    }
  }

  return result;
}

export function getEntitySchema(
  project: ProjectData,
  typeId: string
): EntityTypeDefinition | undefined {
  return getEffectiveEntitySchemas(project)[typeId];
}

export function listCustomEntitySchemas(project: ProjectData): EntityTypeDefinition[] {
  return Object.values(getEffectiveEntitySchemas(project)).filter((s) => !s.isBuiltin);
}

export interface UnifiedEntityEntry {
  id: string;
  entityTypeId: string;
  typeLabel: string;
  isBuiltin: boolean;
  name: string;
  aliases: string[];
  status: CanonStatus;
  color: string;
  subtitle: string;
  tags: string[];
  customAttributes: Record<string, unknown>;
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
}

export function listUnifiedEntities(project: ProjectData): UnifiedEntityEntry[] {
  const schemas = getEffectiveEntitySchemas(project);
  const out: UnifiedEntityEntry[] = [];

  for (const c of project.characters) {
    out.push({
      id: c.id,
      entityTypeId: 'character',
      typeLabel: schemas.character?.label ?? 'Personagem',
      isBuiltin: true,
      name: c.name,
      aliases: c.aliases ?? [],
      status: c.status,
      color: c.avatarColor || schemas.character?.color || '#6366f1',
      subtitle: c.role || schemas.character?.label || 'Personagem',
      tags: c.tags ?? [],
      customAttributes: c.customAttributes ?? {},
      relationships: c.relationships ?? [],
      epistemicSecrets: c.epistemicSecrets ?? [],
    });
  }

  for (const f of project.factions) {
    out.push({
      id: f.id,
      entityTypeId: 'faction',
      typeLabel: schemas.faction?.label ?? 'Facção',
      isBuiltin: true,
      name: f.name,
      aliases: f.aliases ?? [],
      status: f.status,
      color: f.color || schemas.faction?.color || '#f59e0b',
      subtitle: f.subtype || schemas.faction?.label || 'Facção',
      tags: f.tags ?? [],
      customAttributes: f.customAttributes ?? {},
      relationships: f.relationships ?? [],
      epistemicSecrets: f.epistemicSecrets ?? [],
    });
  }

  for (const world of project.worlds) {
    for (const loc of world.locations) {
      out.push({
        id: loc.id,
        entityTypeId: 'location',
        typeLabel: schemas.location?.label ?? 'Local',
        isBuiltin: true,
        name: loc.name,
        aliases: loc.aliases ?? [],
        status: loc.status ?? 'canon',
        color: schemas.location?.color || '#10b981',
        subtitle: `${loc.type} · ${world.name}`,
        tags: loc.tags ?? [],
        customAttributes: loc.customAttributes ?? {},
        relationships: loc.relationships ?? [],
        epistemicSecrets: loc.epistemicSecrets ?? [],
      });
    }
    for (const sys of world.systems) {
      out.push({
        id: sys.id,
        entityTypeId: 'rule_system',
        typeLabel: schemas.rule_system?.label ?? 'Sistema / Lei',
        isBuiltin: true,
        name: sys.name,
        aliases: sys.aliases ?? [],
        status: sys.status ?? 'canon',
        color: schemas.rule_system?.color || '#8b5cf6',
        subtitle: `${sys.subtype} · ${world.name}`,
        tags: sys.tags ?? [],
        customAttributes: sys.customAttributes ?? {},
        relationships: sys.relationships ?? [],
        epistemicSecrets: sys.epistemicSecrets ?? [],
      });
    }
  }

  for (const obj of project.objects) {
    out.push({
      id: obj.id,
      entityTypeId: 'object',
      typeLabel: schemas.object?.label ?? 'Objeto',
      isBuiltin: true,
      name: obj.name,
      aliases: obj.aliases ?? [],
      status: obj.canonStatus ?? 'canon',
      color: schemas.object?.color || '#ec4899',
      subtitle: obj.type || schemas.object?.label || 'Objeto',
      tags: obj.tags ?? [],
      customAttributes: obj.customAttributes ?? {},
      relationships: obj.relationships ?? [],
      epistemicSecrets: obj.epistemicSecrets ?? [],
    });
  }

  for (const [typeId, records] of Object.entries(project.customEntities ?? {})) {
    const schema = schemas[typeId];
    for (const rec of records) {
      out.push({
        id: rec.id,
        entityTypeId: typeId,
        typeLabel: schema?.label ?? typeId,
        isBuiltin: false,
        name: rec.name,
        aliases: rec.aliases ?? [],
        status: rec.status,
        color: schema?.color || '#06b6d4',
        subtitle: rec.summary || schema?.label || typeId,
        tags: rec.tags ?? [],
        customAttributes: rec.customAttributes ?? {},
        relationships: rec.relationships ?? [],
        epistemicSecrets: rec.epistemicSecrets ?? [],
      });
    }
  }

  return out;
}
