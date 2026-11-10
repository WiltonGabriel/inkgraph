import { z } from "zod";

/**
 * Universal entity categories for any fiction genre
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
 * Relationship edge between two entities
 */
export const RelationshipSchema = z.object({
  target: z.string().min(1, "Target entity ID is required"),
  relation: z.string().min(1, "Relation label is required"),
  since_scene: z.string().optional(),
  until_scene: z.string().optional(),
  sentiment: z.number().min(-1).max(1).default(0), // -1.0 (enemy/hostile) to +1.0 (devoted ally)
  notes: z.string().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Epistemic tracking: who knows what and when
 */
export const EpistemicSchema = z.object({
  secrets_kept: z.array(z.string()).default([]),
  known_by: z.array(z.string()).default([]), // entity IDs who are aware of this entity or its core secret
  revealed_at_scene: z.string().optional(),
});

export type Epistemic = z.infer<typeof EpistemicSchema>;

/**
 * Base Frontmatter Schema shared by all lore entities
 */
export const BaseEntitySchema = z.object({
  id: z.string().min(1, "Entity ID is required"),
  type: EntityCategorySchema,
  subtype: z.string().optional(), // Freeform: magic_system, cyberware, feudal_rank, etc.
  name: z.string().min(1, "Entity name is required"),
  aliases: z.array(z.string()).default([]),
  status: EntityStatusSchema.default("canon"),
  tags: z.array(z.string()).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  epistemic: EpistemicSchema.default({ secrets_kept: [], known_by: [] }),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Parsed Markdown document with YAML frontmatter
 */
export interface LoreDocument {
  readonly frontmatter: BaseEntity;
  readonly markdownBody: string;
  readonly filePath: string;
}
