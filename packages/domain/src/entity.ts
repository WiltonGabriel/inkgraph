import { z } from "zod";

/**
 * Universal entity categories for any fiction genre.
 */
export const EntityCategorySchema = z.enum([
  "character",
  "faction",
  "location",
  "item",
  "concept",
  "event",
  "rule_system",
]);

export type EntityCategory = z.infer<typeof EntityCategorySchema>;

export const EntityStatusSchema = z.enum(["canon", "provisional", "draft"]);
export type EntityStatus = z.infer<typeof EntityStatusSchema>;

/**
 * Relationship edge between two entities.
 */
export const RelationshipSchema = z.object({
  target: z.string().min(1, "Target entity ID is required"),
  relation: z.string().min(1, "Relation label is required"),
  since_scene: z.string().optional(),
  until_scene: z.string().optional(),
  sentiment: z.number().min(-1).max(1).default(0),
  notes: z.string().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Epistemic tracking: who knows what and when.
 */
export const EpistemicSchema = z.object({
  secrets_kept: z.array(z.string()).default([]),
  known_by: z.array(z.string()).default([]),
  revealed_at_scene: z.string().optional(),
});

export type Epistemic = z.infer<typeof EpistemicSchema>;

/**
 * Base Frontmatter Schema shared by all lore entities.
 */
export const BaseEntitySchema = z.object({
  id: z.string().min(1, "Entity ID is required"),
  type: EntityCategorySchema,
  subtype: z.string().optional(),
  name: z.string().min(1, "Entity name is required"),
  aliases: z.array(z.string()).default([]),
  status: EntityStatusSchema.default("canon"),
  tags: z.array(z.string()).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  epistemic: EpistemicSchema.default({ secrets_kept: [], known_by: [] }),
  archived_at: z.string().nullable().optional(),
  fractional_order: z.string().optional(),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Parsed lore Markdown document with validated YAML frontmatter.
 */
export interface LoreDocument {
  readonly frontmatter: BaseEntity;
  readonly markdownBody: string;
  readonly filePath: string;
}

export const VaultSectionSchema = z.enum([
  "lore",
  "manuscript",
  "timeline",
  "staging",
  "uploads",
  "series",
]);

export type VaultSection = z.infer<typeof VaultSectionSchema>;

export const SceneFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  chapter_number: z.number().int().positive().optional(),
  act: z.number().int().positive().default(1),
  status: z.enum(["outline", "draft", "revised", "canon", "final"]).default("draft"),
  pov_character_id: z.string().optional(),
  location_id: z.string().optional(),
  fractional_order: z.string().optional(),
  archived_at: z.string().nullable().optional(),
});

export type SceneFrontmatter = z.infer<typeof SceneFrontmatterSchema>;

/**
 * Generalized index record covering manuscript scenes, timeline docs,
 * staging proposals, uploads metadata, and shared series lore.
 */
export interface VaultDocumentRecord {
  readonly id: string;
  readonly section: VaultSection;
  readonly title: string;
  readonly status: string;
  readonly filePath: string;
  readonly body: string;
  readonly metadataJson: string;
  readonly archivedAt: string | null;
  readonly fractionalOrder: string | null;
  readonly updatedAt: number;
}

export interface VaultParseFailure {
  readonly filePath: string;
  readonly section: VaultSection;
  readonly error: string;
}
