import { z } from "zod";

export const CustomFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "boolean",
  "tags",
  "entity_ref",
]);

export const CustomFieldSchemaZod = z.object({
  key: z.string().min(1, "Field key is required"),
  label: z.string().min(1, "Field label is required"),
  type: CustomFieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  targetEntityType: z.string().optional(),
  group: z.string().optional(),
  completenessWeight: z.number().min(0).max(20).optional(),
  includeInMemory: z.boolean().optional(),
});

export const ActDefinitionSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  color: z.string().min(1),
  description: z.string().optional(),
});

export const EntityTypeDefinitionSchema = z.object({
  id: z.string().min(1, "Entity type ID is required"),
  label: z.string().min(1, "Entity type label is required"),
  pluralLabel: z.string().min(1, "Entity type plural label is required"),
  iconName: z.string().min(1).default("Box"),
  color: z.string().min(1).default("#6366f1"),
  isBuiltin: z.boolean().default(false),
  builtinTarget: z
    .enum(["character", "faction", "location", "rule_system", "object"])
    .optional(),
  mentionPrefix: z.string().optional(),
  hiddenNativeFields: z.array(z.string()).default([]),
  customFields: z.array(CustomFieldSchemaZod).default([]),
  sourcePluginId: z.string().optional(),
});

export const PluginSnippetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  markdown: z.string().min(1),
});

export const PluginConsistencyRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  pattern: z.string().min(1),
  flags: z.string().optional(),
  message: z.string().min(1),
  target: z.enum(["scenes", "entities", "all"]).optional(),
});

export const PluginManifestSchema = z.object({
  id: z.string().min(1, "Plugin ID is required"),
  name: z.string().min(1, "Plugin name is required"),
  version: z.string().min(1, "Plugin version is required"),
  description: z.string().default(""),
  author: z.string().optional(),
  enabled: z.boolean().default(true),
  isBuiltinSample: z.boolean().optional(),
  entityTypes: z.array(EntityTypeDefinitionSchema).optional(),
  fieldExtensions: z
    .array(
      z.object({
        targetType: z.string().min(1),
        fields: z.array(CustomFieldSchemaZod),
      }),
    )
    .optional(),
  narrativeTemplates: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        genre: z.string().min(1),
        description: z.string().default(""),
        acts: z.array(ActDefinitionSchema).default([]),
        sections: z
          .array(
            z.object({
              title: z.string().min(1),
              description: z.string().default(""),
              act: z.number().int().min(1),
              isTwist: z.boolean().optional(),
            }),
          )
          .default([]),
      }),
    )
    .optional(),
  snippets: z.array(PluginSnippetSchema).optional(),
  consistencyRules: z.array(PluginConsistencyRuleSchema).optional(),
  settingsSchema: z.array(CustomFieldSchemaZod).optional(),
  settingsValues: z.record(z.string(), z.unknown()).optional(),
});

export type PluginManifestZod = z.infer<typeof PluginManifestSchema>;
