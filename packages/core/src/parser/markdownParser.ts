import { parse as parseYaml } from "yaml";
import { BaseEntitySchema, type LoreDocument } from "../domain/entity";
import { InkGraphError, type InkGraphErrorCode } from "../domain/errors";

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

/**
 * Pure function to extract YAML frontmatter and Markdown body from raw file contents.
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
