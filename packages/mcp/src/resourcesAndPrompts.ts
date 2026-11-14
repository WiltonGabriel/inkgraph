import type { LoreDatabase } from "@inkgraph/core";
import { InkGraphError, buildSceneEpistemicBriefing, type BaseEntity } from "@inkgraph/core";

export interface McpResourceDescriptor {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
}

export const STATIC_MCP_RESOURCES: readonly McpResourceDescriptor[] = [
  {
    uri: "inkgraph://books",
    name: "Workspace Manuscript & Books",
    description: "List all indexed manuscript scenes, staging proposals, and parse health.",
    mimeType: "application/json",
  },
];

export function listAllMcpResources(db: LoreDatabase): McpResourceDescriptor[] {
  const entities = db.listEntities();
  const scenes = db.listVaultDocuments({ section: "manuscript" });

  return [
    ...STATIC_MCP_RESOURCES,
    ...entities.map((e) => ({
      uri: `inkgraph://lore/${e.id}`,
      name: `Lore: ${e.name}`,
      description: `${e.type} (${e.status})`,
      mimeType: "application/json",
    })),
    ...scenes.map((s) => ({
      uri: `inkgraph://scene/${s.id}`,
      name: `Scene: ${s.title}`,
      description: `Status: ${s.status}`,
      mimeType: "text/markdown",
    })),
    ...scenes.map((s) => ({
      uri: `inkgraph://epistemic/${s.id}`,
      name: `Epistemic State: ${s.title}`,
      description: "Secrets known vs withheld at this scene",
      mimeType: "application/json",
    })),
  ];
}

export function readMcpResource(
  uri: string,
  db: LoreDatabase
): { uri: string; mimeType: string; text: string } {
  if (uri === "inkgraph://books") {
    const scenes = db.listVaultDocuments({ section: "manuscript" }).map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      filePath: s.filePath,
    }));
    const staging = db.listVaultDocuments({ section: "staging" }).map((s) => ({
      id: s.id,
      title: s.title,
      filePath: s.filePath,
    }));
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify({ scenes, staging, parseErrors: db.getParseFailures() }, null, 2),
    };
  }

  if (uri.startsWith("inkgraph://lore/")) {
    const id = uri.slice("inkgraph://lore/".length);
    const entity = db.getEntityByIdOrAlias(id);
    if (!entity) {
      throw new InkGraphError("not_found", `Lore resource not found: ${uri}`);
    }
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(entity, null, 2),
    };
  }

  if (uri.startsWith("inkgraph://scene/")) {
    const id = uri.slice("inkgraph://scene/".length);
    const scene = db.listVaultDocuments({ section: "manuscript" }).find((s) => s.id === id);
    if (!scene) {
      throw new InkGraphError("not_found", `Scene resource not found: ${uri}`);
    }
    return {
      uri,
      mimeType: "text/markdown",
      text: scene.body,
    };
  }

  if (uri.startsWith("inkgraph://epistemic/")) {
    const sceneId = uri.slice("inkgraph://epistemic/".length);
    const scenes = db.listVaultDocuments({ section: "manuscript" });
    const target = scenes.find((s) => s.id === sceneId);
    if (!target) {
      throw new InkGraphError("not_found", `Epistemic scene resource not found: ${uri}`);
    }
    const meta = JSON.parse(target.metadataJson || "{}") as { pov_character_id?: string };
    const fullEntities = db
      .listEntities()
      .map((e) => db.getEntityByIdOrAlias(e.id))
      .filter((e): e is BaseEntity & { body: string; filePath: string } => e !== null);
    const briefing = buildSceneEpistemicBriefing(
      sceneId,
      meta.pov_character_id ?? null,
      fullEntities,
      scenes.map((s) => s.id)
    );
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(briefing, null, 2),
    };
  }

  throw new InkGraphError("not_found", `Unsupported resource URI: ${uri}`);
}

export const MCP_PROMPTS = [
  {
    name: "resume",
    description: "Summarize current InkGraph manuscript status, staging backlog, and open plot continuity risks.",
    arguments: [],
  },
  {
    name: "draft-scene",
    description: "Draft or continue a scene respecting epistemic spoiler locks and staging safety.",
    arguments: [{ name: "scene_id", description: "Target scene ID", required: true }],
  },
  {
    name: "audit-epistemic",
    description: "Check whether a scene leaks any secret prior to its reveal scene.",
    arguments: [{ name: "scene_id", description: "Target scene ID", required: true }],
  },
  {
    name: "canon-check",
    description: "Validate proposed character/lore consistency against existing canon files.",
    arguments: [{ name: "entity_id", description: "Target entity ID", required: true }],
  },
] as const;

export function getMcpPromptMessages(
  name: string,
  args?: Record<string, string>
): { description: string; messages: { role: "user"; content: { type: "text"; text: string } }[] } {
  const prompt = MCP_PROMPTS.find((p) => p.name === name);
  if (!prompt) {
    throw new InkGraphError("not_found", `Unknown prompt '${name}'.`);
  }

  if (name === "resume") {
    return {
      description: prompt.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Call resume_work first, inspect pending staging items and parse warnings, then propose the highest-value next writing step.",
          },
        },
      ],
    };
  }

  if (name === "draft-scene") {
    const sceneId = args?.scene_id ?? "scene_01";
    return {
      description: prompt.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Call get_scene_context(scene_id="${sceneId}") first. Strictly obey withheldSecrets and stage output via propose_scene or propose_prose_edit.`,
          },
        },
      ],
    };
  }

  if (name === "audit-epistemic") {
    const sceneId = args?.scene_id ?? "scene_01";
    return {
      description: prompt.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Call get_scene_context(scene_id="${sceneId}") and verify none of the withheldSecrets appear in the prose.`,
          },
        },
      ],
    };
  }

  const entityId = args?.entity_id ?? "";
  return {
    description: prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Inspect entity "${entityId}" via get_entity and get_relationships, then check for canon contradictions.`,
        },
      },
    ],
  };
}
