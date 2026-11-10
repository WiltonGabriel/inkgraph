import { basename, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  InkGraphError,
  buildSceneEpistemicBriefing,
  evaluateDirectSceneEdit,
  formatCanonicalDirective,
  parseLoreMarkdown,
  resolveSafeStagingPath,
  type AgentWriteGovernance,
  type BaseEntity,
  type LoreDatabase,
} from "@inkgraph/core";
import { McpChangeSetStore } from "./changeSetStore.js";

export interface McpToolExecutionOptions {
  readonly governance?: AgentWriteGovernance;
  readonly changeSetStore?: McpChangeSetStore;
  readonly workspaceRoot?: string;
  readonly onVaultMutated?: (event: { tool: string; target: string; undoId?: string }) => void;
}

const DEFAULT_CHANGE_STORE = new McpChangeSetStore();

function safeWriteStagedFile(stagingDir: string, rawFilename: string, content: string): string {
  const targetPath = resolveSafeStagingPath(stagingDir, rawFilename);
  if (!existsSync(stagingDir)) {
    mkdirSync(stagingDir, { recursive: true });
  }
  writeFileSync(targetPath, content, "utf-8");
  return basename(targetPath);
}

function formatToolError(name: string, err: unknown): {
  isError: true;
  content: { type: "text"; text: string }[];
} {
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
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ code: "validation", error: `Error executing ${name}: ${message}` }, null, 2),
      },
    ],
  };
}

export function executeMcpTool(
  name: string,
  rawArgs: Record<string, unknown> | undefined,
  db: LoreDatabase,
  stagingDir: string,
  options: McpToolExecutionOptions = {}
): { isError?: boolean; content: { type: "text"; text: string }[] } {
  const args = (rawArgs ?? {}) as Record<string, any>;
  const governance: AgentWriteGovernance = options.governance ?? "staging_strict";
  const store = options.changeSetStore ?? DEFAULT_CHANGE_STORE;

  try {
    if (name === "list_entities") {
      const nested = (args.filter ?? {}) as Record<string, string | undefined>;
      const entities = db.listEntities({
        type: args.type ?? nested.type,
        status: args.status ?? nested.status,
        tag: args.tag ?? nested.tag,
      });
      return { content: [{ type: "text", text: JSON.stringify(entities, null, 2) }] };
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
      return { content: [{ type: "text", text: JSON.stringify(entity, null, 2) }] };
    }

    if (name === "search_lore") {
      const query = String(args.query ?? "").trim();
      const limit = typeof args.limit === "number" ? args.limit : 10;
      if (!query) {
        throw new InkGraphError("validation", "Parameter 'query' is required.");
      }
      const results = db.search(query, limit);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    if (name === "query_epistemic_state") {
      const entityId = String(args.entity_id ?? "").trim();
      const sceneId = args.scene_id ? String(args.scene_id).trim() : undefined;
      if (!entityId) {
        throw new InkGraphError("validation", "Parameter 'entity_id' is required.");
      }
      const state = db.queryEpistemicState(entityId, sceneId);
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
    }

    if (name === "get_timeline") {
      const fromScene = args.from_scene ? String(args.from_scene).trim() : undefined;
      const toScene = args.to_scene ? String(args.to_scene).trim() : undefined;
      return { content: [{ type: "text", text: JSON.stringify(db.getTimeline(fromScene, toScene), null, 2) }] };
    }

    if (name === "get_relationships") {
      return { content: [{ type: "text", text: JSON.stringify(db.getAllRelationships(), null, 2) }] };
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
      parseLoreMarkdown(markdownContent, rawFilename);
      const safeName = safeWriteStagedFile(
        stagingDir,
        rawFilename,
        `<!-- PROPOSAL RATIONALE: ${rationale.replace(/-->/g, "")} -->\n${markdownContent}`
      );
      options.onVaultMutated?.({ tool: name, target: safeName });
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
      const safeName = safeWriteStagedFile(stagingDir, rawFilename, documentContent);
      options.onVaultMutated?.({ tool: name, target: safeName });
      return {
        content: [
          {
            type: "text",
            text: `Scene draft successfully staged at ./workspace/staging/${safeName} (outline_ref: ${outlineRef}).`,
          },
        ],
      };
    }

    if (name === "resume_work") {
      const entities = db.listEntities();
      const scenes = db.listVaultDocuments({ section: "manuscript" });
      const staging = db.listVaultDocuments({ section: "staging" });
      const parseFailures = db.getParseFailures();
      const recentChanges = store.listRecent();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                governance,
                entitiesCount: entities.length,
                manuscriptScenesCount: scenes.length,
                latestScene: scenes[scenes.length - 1]
                  ? {
                      id: scenes[scenes.length - 1]!.id,
                      title: scenes[scenes.length - 1]!.title,
                      status: scenes[scenes.length - 1]!.status,
                      version: store.getSceneVersion(scenes[scenes.length - 1]!.id),
                    }
                  : null,
                pendingStagingCount: staging.length,
                pendingStaging: staging.map((s) => ({ id: s.id, title: s.title, filePath: s.filePath })),
                parseFailures,
                activeUndoCount: recentChanges.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "read_manuscript") {
      const scenes = db.listVaultDocuments({ section: "manuscript" });
      const sceneId = args.scene_id ? String(args.scene_id).trim() : "";

      if (!sceneId) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                scenes.map((s) => ({
                  id: s.id,
                  title: s.title,
                  status: s.status,
                  version: store.getSceneVersion(s.id),
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        throw new InkGraphError("not_found", `Manuscript scene '${sceneId}' not found.`);
      }

      const words = scene.body.trim() ? scene.body.trim().split(/\s+/) : [];
      const cursor = typeof args.cursor === "number" && args.cursor >= 0 ? Math.floor(args.cursor) : 0;
      const maxWords =
        typeof args.max_words === "number" && args.max_words > 0 ? Math.floor(args.max_words) : 400;

      const slice = words.slice(cursor, cursor + maxWords);
      const nextCursor = cursor + slice.length < words.length ? cursor + slice.length : null;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                sceneId: scene.id,
                title: scene.title,
                status: scene.status,
                version: store.getSceneVersion(scene.id),
                totalWords: words.length,
                cursor,
                nextCursor,
                text: slice.join(" "),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_scene_context") {
      const sceneId = String(args.scene_id ?? "").trim();
      const scenes = db.listVaultDocuments({ section: "manuscript" });
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        throw new InkGraphError("not_found", `Manuscript scene '${sceneId}' not found.`);
      }

      const meta = JSON.parse(scene.metadataJson || "{}") as { pov_character_id?: string };
      const povId = args.pov_entity_id ? String(args.pov_entity_id).trim() : (meta.pov_character_id ?? null);
      const fullEntities = db
        .listEntities()
        .map((e) => db.getEntityByIdOrAlias(e.id))
        .filter((e): e is BaseEntity & { body: string; filePath: string } => e !== null);

      const epistemic = buildSceneEpistemicBriefing(
        scene.id,
        povId,
        fullEntities,
        scenes.map((s) => s.id)
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                scene: {
                  id: scene.id,
                  title: scene.title,
                  status: scene.status,
                  version: store.getSceneVersion(scene.id),
                  povEntityId: povId,
                  body: scene.body,
                },
                epistemic,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "propose_prose_edit") {
      const sceneId = String(args.scene_id ?? "").trim();
      const proposedContent = String(args.proposed_content ?? "");
      const rationale = String(args.rationale ?? "").trim();
      const expectedVersion = Number(args.expected_version);
      const dryRun = Boolean(args.dry_run);
      const clientName = String(args.client_name ?? "mcp-client");

      if (!sceneId || !rationale || Number.isNaN(expectedVersion)) {
        throw new InkGraphError(
          "validation",
          "Parameters 'scene_id', 'expected_version', 'proposed_content', and 'rationale' are required."
        );
      }

      const scene = db.listVaultDocuments({ section: "manuscript" }).find((s) => s.id === sceneId);
      if (!scene) {
        throw new InkGraphError("not_found", `Manuscript scene '${sceneId}' not found.`);
      }

      const status = (["outline", "draft", "revised", "canon", "final"].includes(scene.status)
        ? scene.status
        : "draft") as "outline" | "draft" | "revised" | "canon" | "final";

      const provenance = evaluateDirectSceneEdit({
        governance,
        sceneId: scene.id,
        sceneStatus: status,
        currentVersion: store.getSceneVersion(scene.id),
        expectedVersion,
        currentContent: scene.body,
        proposedContent,
        clientName,
        rationale,
        dryRun,
      });

      if (!dryRun) {
        const previousRaw = existsSync(scene.filePath)
          ? readFileSync(scene.filePath, "utf-8")
          : scene.body;
        store.record(provenance, scene.filePath, previousRaw);
        store.bumpSceneVersion(scene.id);
        writeFileSync(scene.filePath, proposedContent, "utf-8");
        db.upsertVaultDocument({ ...scene, body: proposedContent, updatedAt: Date.now() });
        options.onVaultMutated?.({ tool: name, target: scene.id, undoId: provenance.undoId });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                applied: !dryRun,
                newVersion: dryRun ? expectedVersion : store.getSceneVersion(scene.id),
                provenance,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "undo_change_set") {
      const undoId = String(args.undo_id ?? "").trim();
      if (!undoId) {
        throw new InkGraphError("validation", "Parameter 'undo_id' is required.");
      }
      const reverted = store.undo(undoId);
      if (!reverted) {
        throw new InkGraphError("not_found", `Undo ID '${undoId}' not found or expired (>24h).`);
      }
      const scenes = db.listVaultDocuments({ section: "manuscript" });
      const scene = scenes.find((s) => s.id === reverted.provenance.targetId);
      if (scene) {
        db.upsertVaultDocument({
          ...scene,
          body: reverted.previousContent,
          updatedAt: Date.now(),
        });
      }
      options.onVaultMutated?.({ tool: name, target: reverted.provenance.targetId, undoId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ reverted: true, undoId, targetId: reverted.provenance.targetId }, null, 2),
          },
        ],
      };
    }

    if (name === "upsert_beat") {
      const sceneId = String(args.scene_id ?? "").trim();
      const beatId = String(args.beat_id ?? "").trim();
      const body = String(args.body ?? "").trim();
      const kind = args.kind === "epistemic-reveal" ? "epistemic-reveal" : "beat";
      if (!sceneId || !beatId || !body) {
        throw new InkGraphError("validation", "'scene_id', 'beat_id', and 'body' are required.");
      }
      const attrs: Record<string, string> =
        kind === "epistemic-reveal"
          ? {
              entity: String(args.entity_id ?? ""),
              secret: String(args.secret ?? beatId),
              mode: "reveal",
            }
          : { id: beatId, status: "draft" };

      const block = formatCanonicalDirective({ kind, attributes: attrs, body });
      const targetName = `beat_${sceneId}_${beatId}.md`;
      const safeName = safeWriteStagedFile(
        stagingDir,
        targetName,
        `---\nid: "${beatId}"\ntarget_scene: "${sceneId}"\nstatus: "draft"\n---\n\n${block}\n`
      );
      options.onVaultMutated?.({ tool: name, target: safeName });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ stagedFile: join("staging", safeName), directive: block }, null, 2),
          },
        ],
      };
    }

    throw new InkGraphError("not_found", `Unknown tool '${name}'`, { tool: name });
  } catch (err: unknown) {
    return formatToolError(name, err);
  }
}
