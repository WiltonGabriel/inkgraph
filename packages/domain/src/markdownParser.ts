import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
  BaseEntitySchema,
  type BaseEntity,
  type LoreDocument,
  type VaultDocumentRecord,
  type VaultSection,
} from "./entity";
import { InkGraphError, type InkGraphErrorCode } from "./errors";

export class FrontmatterParseError extends InkGraphError {
  public override readonly code: InkGraphErrorCode = "validation";

  constructor(
    message: string,
    public readonly filePath?: string,
    public override readonly cause?: unknown
  ) {
    super("validation", filePath ? `[${filePath}] ${message}` : message, {
      filePath,
    });
    this.name = "FrontmatterParseError";
  }
}

export interface ParsedRawFrontmatter {
  readonly frontmatter: Record<string, unknown> | null;
  readonly markdownBody: string;
}

/**
 * Splits optional YAML frontmatter (`---`) from a Markdown body without failing
 * when a plain Markdown note has no frontmatter header.
 */
export function splitFrontmatterAndBody(rawContent: string): ParsedRawFrontmatter {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = frontmatterRegex.exec(rawContent.trimStart());
  if (!match) {
    return {
      frontmatter: null,
      markdownBody: rawContent.trim(),
    };
  }

  const [, rawYaml, markdownBody] = match;
  let parsed: unknown;
  try {
    parsed = parseYaml(rawYaml);
  } catch (err) {
    throw new FrontmatterParseError("YAML syntax parsing failed", undefined, err);
  }

  const normalized =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  return {
    frontmatter: normalized,
    markdownBody: (markdownBody ?? "").trim(),
  };
}

/**
 * Pure function to extract YAML frontmatter and Markdown body from lore files.
 */
export function parseLoreMarkdown(rawContent: string, filePath = "unknown.md"): LoreDocument {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = frontmatterRegex.exec(rawContent.trimStart());

  if (!match) {
    throw new FrontmatterParseError(
      "Document is missing valid YAML frontmatter delimiters ('---')",
      filePath
    );
  }

  const [, rawYaml, markdownBody] = match;

  let parsedObject: unknown;
  try {
    parsedObject = parseYaml(rawYaml);
  } catch (err) {
    throw new FrontmatterParseError("YAML syntax parsing failed", filePath, err);
  }

  const validation = BaseEntitySchema.safeParse(parsedObject);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new FrontmatterParseError(`Schema validation failed: ${errorDetails}`, filePath);
  }

  return {
    frontmatter: validation.data,
    markdownBody: (markdownBody ?? "").trim(),
    filePath,
  };
}

/**
 * Canonical frontmatter + Markdown serializer for round-trip safe vault storage.
 */
export function serializeLoreMarkdown(
  entity: BaseEntity,
  markdownBody: string
): string {
  const yamlBlock = stringifyYaml(entity, { lineWidth: 0 }).trimEnd();
  const cleanBody = markdownBody.replace(/\r\n/g, "\n").trim();
  return cleanBody
    ? `---\n${yamlBlock}\n---\n\n${cleanBody}\n`
    : `---\n${yamlBlock}\n---\n`;
}

function inferTitleFromMarkdown(filePath: string, body: string): string {
  const headingMatch = /^#\s+(.+)$/m.exec(body);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }
  const filename = filePath.split(/[/\\]/).pop() ?? filePath;
  return filename.replace(/\.[^.]+$/, "") || "untitled";
}

function inferIdFromPath(filePath: string, section: VaultSection): string {
  const cleanName = (filePath.split(/[/\\]/).pop() ?? filePath)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
  return `${section}_${cleanName || "doc"}`;
}

/**
 * Non-destructively parses non-lore vault Markdown files (manuscript scenes,
 * timeline notes, staging proposals, upload captions) for full-vault indexing.
 */
export function parseVaultDocument(
  rawContent: string,
  filePath: string,
  section: VaultSection,
  now = Date.now()
): VaultDocumentRecord {
  const { frontmatter, markdownBody } = splitFrontmatterAndBody(rawContent);
  const title =
    (typeof frontmatter?.title === "string" && frontmatter.title.trim()) ||
    (typeof frontmatter?.name === "string" && frontmatter.name.trim()) ||
    inferTitleFromMarkdown(filePath, markdownBody);

  const id =
    typeof frontmatter?.id === "string" && frontmatter.id.trim()
      ? frontmatter.id.trim()
      : inferIdFromPath(filePath, section);

  const status =
    typeof frontmatter?.status === "string" && frontmatter.status.trim()
      ? frontmatter.status.trim()
      : "draft";

  const archivedAt =
    typeof frontmatter?.archived_at === "string" ? frontmatter.archived_at : null;
  const fractionalOrder =
    typeof frontmatter?.fractional_order === "string" ? frontmatter.fractional_order : null;

  return {
    id,
    section,
    title,
    status,
    filePath,
    body: markdownBody,
    metadataJson: JSON.stringify(frontmatter ?? {}),
    archivedAt,
    fractionalOrder,
    updatedAt: now,
  };
}
