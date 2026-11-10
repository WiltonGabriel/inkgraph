export const MCP_TOOL_DEFINITIONS = [
  {
    name: "list_entities",
    description:
      "List lore entities filtered by type, tag, or status (canon | provisional | draft)",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description:
            "Optional category: character | faction | location | item | concept | event | rule_system",
        },
        status: {
          type: "string",
          description: "Optional status: canon | provisional | draft",
        },
        tag: {
          type: "string",
          description: "Optional tag filter",
        },
        filter: {
          type: "object",
          description: "Optional nested filter object ({ type, status, tag })",
          properties: {
            type: { type: "string" },
            status: { type: "string" },
            tag: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "get_entity",
    description:
      "Resolve any alias, title, or ID to the full entity dossier",
    inputSchema: {
      type: "object",
      properties: {
        id_or_alias: {
          type: "string",
          description: "ID, exact name, or alias of the entity",
        },
        query: {
          type: "string",
          description: "Alias for id_or_alias (backwards-compatible)",
        },
      },
    },
  },
  {
    name: "search_lore",
    description:
      "Full-text search (FTS5) across canonical lore descriptions, backstories, and tags",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keywords or terms to search for",
        },
        mode: {
          type: "string",
          enum: ["fts", "exact"],
          description: "Search mode: 'fts' (default) or 'exact'",
        },
        limit: {
          type: "number",
          description: "Max number of matches (default 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "query_epistemic_state",
    description:
      "Inspect what an entity knows or what secrets are hidden at a given story point",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "ID or alias of the entity whose knowledge state to inspect",
        },
        scene_id: {
          type: "string",
          description: "Optional scene marker to bound revealed secrets",
        },
      },
      required: ["entity_id"],
    },
  },
  {
    name: "get_timeline",
    description:
      "Return causal sequence, relationship transitions, and revelations between scenes",
    inputSchema: {
      type: "object",
      properties: {
        from_scene: {
          type: "string",
          description: "Optional starting scene ID (inclusive)",
        },
        to_scene: {
          type: "string",
          description: "Optional ending scene ID (inclusive)",
        },
      },
    },
  },
  {
    name: "propose_lore",
    description:
      "Create a pending lore draft in ./workspace/staging/ without contaminating canon",
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "Target filename inside staging (e.g. 'proposed_vance_sword.md')",
        },
        markdown_content: {
          type: "string",
          description: "Full markdown document with valid YAML frontmatter",
        },
        entity_data: {
          type: "string",
          description: "Alias for markdown_content",
        },
        rationale: {
          type: "string",
          description: "Reasoning for the proposal and where it fits in the story",
        },
      },
      required: ["rationale"],
    },
  },
  {
    name: "propose_scene",
    description:
      "Generate a scene draft in ./workspace/staging/ respecting continuity rules",
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "Target filename inside staging (e.g. 'scene_04_draft.md')",
        },
        scene_id: {
          type: "string",
          description: "Scene identifier (e.g. 'scene_04_siege')",
        },
        title: {
          type: "string",
          description: "Scene title",
        },
        scene_data: {
          type: "string",
          description: "Markdown prose content for the proposed scene",
        },
        markdown_content: {
          type: "string",
          description: "Alternative field for scene prose content",
        },
        outline_ref: {
          type: "string",
          description: "Reference to chapter or beat outline node",
        },
        rationale: {
          type: "string",
          description: "Continuity rationale for the scene draft",
        },
      },
      required: ["outline_ref"],
    },
  },
  {
    name: "get_relationships",
    description:
      "Get graph of relationships between entities (alliances, hostilities, sentiments)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
