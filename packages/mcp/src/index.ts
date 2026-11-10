import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import {
  LoreDatabase,
  resolveSafeStagingPath,
  syncWorkspaceDirectory,
} from "@inkgraph/core";
import { MCP_TOOL_DEFINITIONS } from "./toolDefinitions.js";
import { executeMcpTool } from "./toolHandlers.js";

export { resolveSafeStagingPath, executeMcpTool, MCP_TOOL_DEFINITIONS };

const defaultWorkspace = existsSync(resolve(process.cwd(), "workspace"))
  ? resolve(process.cwd(), "workspace")
  : resolve(process.cwd(), "../../workspace");

const WORKSPACE_ROOT =
  process.env.INKGRAPH_WORKSPACE ||
  process.env.WORKSPACE_PATH ||
  defaultWorkspace;

const LORE_DIR = join(WORKSPACE_ROOT, "lore");
const STAGING_DIR = join(WORKSPACE_ROOT, "staging");

const db = new LoreDatabase({ inMemory: true });

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: MCP_TOOL_DEFINITIONS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  return executeMcpTool(name, rawArgs, db, STAGING_DIR);
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
