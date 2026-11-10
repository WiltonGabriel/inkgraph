import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { LoreDatabase, syncWorkspaceDirectory, parseLoreMarkdown } from "@inkgraph/core";

const WORKSPACE_ROOT = process.env.INKGRAPH_WORKSPACE || join(process.cwd(), "workspace");
const LORE_DIR = join(WORKSPACE_ROOT, "lore");
const STAGING_DIR = join(WORKSPACE_ROOT, "staging");

// Ensure staging directory exists
if (!existsSync(STAGING_DIR)) {
  mkdirSync(STAGING_DIR, { recursive: true });
}

// In-memory projection database
const db = new LoreDatabase({ inMemory: true });

// Initial sync
console.error(`[InkGraph MCP] Syncing lore from: ${LORE_DIR}`);
const initialStats = syncWorkspaceDirectory(LORE_DIR, db);
console.error(`[InkGraph MCP] Initial sync complete: ${initialStats.processed} entities loaded.`);

const server = new Server(
  {
    name: "inkgraph-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP tools list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_entities",
        description: "List all known lore entities (characters, factions, locations, systems, items, events)",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Optional filter by category: character | faction | location | item | concept | event | rule_system",
            },
            status: {
              type: "string",
              description: "Optional filter by status: canon | provisional | draft",
            },
            tag: {
              type: "string",
              description: "Optional filter by tag",
            },
          },
        },
      },
      {
        name: "get_entity",
        description: "Retrieve complete dossier for an entity by ID, name, or alias (e.g. 'The Blind Crow' or 'char_vance')",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "ID, exact name, or alias of the entity",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_lore",
        description: "Full-text search (FTS5) across all lore entity descriptions, backstories, and tags",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Keywords or terms to search for",
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
        name: "get_relationships",
        description: "Get graph of relationships between entities (alliances, hostilities, sentiments)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "propose_lore",
        description: "Safely propose a new lore entity or modification without polluting canon. Writes to ./workspace/staging/",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Target filename (e.g. 'proposed_vance_sword.md')",
            },
            markdown_content: {
              type: "string",
              description: "Full markdown document with valid YAML frontmatter",
            },
            rationale: {
              type: "string",
              description: "Reasoning for the proposal and where it fits in the story",
            },
          },
          required: ["filename", "markdown_content", "rationale"],
        },
      },
    ],
  };
});

// Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_entities") {
      const filter = (args || {}) as { type?: string; status?: string; tag?: string };
      const entities = db.listEntities(filter);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entities, null, 2),
          },
        ],
      };
    }

    if (name === "get_entity") {
      const { query } = (args || {}) as { query: string };
      if (!query) {
        return {
          isError: true,
          content: [{ type: "text", text: "Parameter 'query' is required." }],
        };
      }

      const entity = db.getEntityByIdOrAlias(query);
      if (!entity) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Entity not found for query '${query}'. Use list_entities or search_lore to discover available entities.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(entity, null, 2),
          },
        ],
      };
    }

    if (name === "search_lore") {
      const { query, limit = 10 } = (args || {}) as { query: string; limit?: number };
      const results = db.search(query, limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    if (name === "get_relationships") {
      const rels = db.getAllRelationships();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(rels, null, 2),
          },
        ],
      };
    }

    if (name === "propose_lore") {
      const { filename, markdown_content, rationale } = (args || {}) as {
        filename: string;
        markdown_content: string;
        rationale: string;
      };

      // Validate frontmatter structure before writing
      parseLoreMarkdown(markdown_content, filename);

      const safeFilename = filename.endsWith(".md") ? filename : `${filename}.md`;
      const targetPath = join(STAGING_DIR, safeFilename);

      const contentWithRationale = `<!-- PROPOSAL RATIONALE: ${rationale.replace(/-->/g, "")} -->\n${markdown_content}`;
      writeFileSync(targetPath, contentWithRationale, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Proposal successfully staged at ./workspace/staging/${safeFilename}. It remains isolated from canon until approved.`,
          },
        ],
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool '${name}'` }],
    };
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${err.message || String(err)}`,
        },
      ],
    };
  }
});

async function run(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[InkGraph MCP] Server running on stdio.");
}

run().catch((err) => {
  console.error("[InkGraph MCP] Fatal startup error:", err);
  process.exit(1);
});
