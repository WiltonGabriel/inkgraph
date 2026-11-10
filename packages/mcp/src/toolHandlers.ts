import { basename } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import {
  InkGraphError,
  type LoreDatabase,
  parseLoreMarkdown,
  resolveSafeStagingPath,
} from "@inkgraph/core";

export function executeMcpTool(
  name: string,
  rawArgs: Record<string, unknown> | undefined,
  db: LoreDatabase,
  stagingDir: string
): { isError?: boolean; content: { type: "text"; text: string }[] } {
  const args = (rawArgs ?? {}) as Record<string, any>;

  try {
    if (name === "list_entities") {
      const nested = (args.filter ?? {}) as Record<string, string | undefined>;
      const filter = {
        type: args.type ?? nested.type,
        status: args.status ?? nested.status,
        tag: args.tag ?? nested.tag,
      };
      const entities = db.listEntities(filter);
      return {
        content: [{ type: "text", text: JSON.stringify(entities, null, 2) }],
      };
    }

    if (name === "get_entity") {
      const lookup = String(args.id_or_alias ?? args.query ?? "").trim();
      if (!lookup) {
        throw new InkGraphError("validation", "Parameter 'id_or_alias' (or 'query') is required.");
      }

      const entity = db.getEntityByIdOrAlias(lookup);
      if (!entity) {
        throw new InkGraphError(
          "not_found",
          `Entity not found for '${lookup}'. Use list_entities or search_lore to discover available entities.`,
          { query: lookup }
        );
      }

      return {
        content: [{ type: "text", text: JSON.stringify(entity, null, 2) }],
      };
    }

    if (name === "search_lore") {
      const query = String(args.query ?? "").trim();
      const limit = typeof args.limit === "number" ? args.limit : 10;
      if (!query) {
        throw new InkGraphError("validation", "Parameter 'query' is required.");
      }

      const results = db.search(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }

    if (name === "query_epistemic_state") {
      const entityId = String(args.entity_id ?? "").trim();
      const sceneId = args.scene_id ? String(args.scene_id).trim() : undefined;
      if (!entityId) {
        throw new InkGraphError("validation", "Parameter 'entity_id' is required.");
      }

      const state = db.queryEpistemicState(entityId, sceneId);
      return {
        content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
      };
    }

    if (name === "get_timeline") {
      const fromScene = args.from_scene ? String(args.from_scene).trim() : undefined;
      const toScene = args.to_scene ? String(args.to_scene).trim() : undefined;
      const timeline = db.getTimeline(fromScene, toScene);
      return {
        content: [{ type: "text", text: JSON.stringify(timeline, null, 2) }],
      };
    }

    if (name === "get_relationships") {
      const rels = db.getAllRelationships();
      return {
        content: [{ type: "text", text: JSON.stringify(rels, null, 2) }],
      };
    }

    if (name === "propose_lore") {
      const markdownContent = String(args.markdown_content ?? args.entity_data ?? "");
      const rationale = String(args.rationale ?? "").trim();
      if (!markdownContent || !rationale) {
        throw new InkGraphError(
          "validation",
          "Both 'markdown_content' (or 'entity_data') and 'rationale' are required."
        );
      }

      const rawFilename = String(args.filename ?? "proposed_lore.md");
      const targetPath = resolveSafeStagingPath(stagingDir, rawFilename);
      const safeName = basename(targetPath);

      parseLoreMarkdown(markdownContent, safeName);

      if (!existsSync(stagingDir)) {
        mkdirSync(stagingDir, { recursive: true });
      }

      const contentWithRationale = `<!-- PROPOSAL RATIONALE: ${rationale.replace(/-->/g, "")} -->\n${markdownContent}`;
      writeFileSync(targetPath, contentWithRationale, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Proposal successfully staged at ./workspace/staging/${safeName}. It remains isolated from canon until approved.`,
          },
        ],
      };
    }

    if (name === "propose_scene") {
      const sceneId = String(args.scene_id ?? args.filename ?? "scene_draft").replace(/\.md$/i, "");
      const rawFilename = String(args.filename ?? `${sceneId}.md`);
      const targetPath = resolveSafeStagingPath(stagingDir, rawFilename);
      const safeName = basename(targetPath);

      const outlineRef = String(args.outline_ref ?? "").trim();
      if (!outlineRef) {
        throw new InkGraphError("validation", "Parameter 'outline_ref' is required.");
      }

      const title = String(args.title ?? sceneId).trim();
      const body = String(args.scene_data ?? args.markdown_content ?? "").trim();
      const rationale = String(args.rationale ?? "Scene draft proposal").replace(/-->/g, "");

      const documentContent = body.startsWith("---")
        ? `<!-- SCENE PROPOSAL | OUTLINE_REF: ${outlineRef} | RATIONALE: ${rationale} -->\n${body}\n`
        : `---
id: "${sceneId.replace(/[^a-zA-Z0-9_-]/g, "_")}"
type: "event"
subtype: "scene_draft"
name: "${title.replace(/"/g, '\\"')}"
status: "draft"
tags: ["scene_draft", "${outlineRef.replace(/"/g, "")}"]
---
<!-- SCENE PROPOSAL | OUTLINE_REF: ${outlineRef} | RATIONALE: ${rationale} -->

${body}
`;

      if (!existsSync(stagingDir)) {
        mkdirSync(stagingDir, { recursive: true });
      }

      writeFileSync(targetPath, documentContent, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Scene draft successfully staged at ./workspace/staging/${safeName} (outline_ref: ${outlineRef}).`,
          },
        ],
      };
    }

    throw new InkGraphError("not_found", `Unknown tool '${name}'`, { tool: name });
  } catch (err: any) {
    if (err instanceof InkGraphError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                code: err.code,
                error: err.message,
                ...(err.details ? { details: err.details } : {}),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              code: "validation",
              error: `Error executing ${name}: ${err.message || String(err)}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
