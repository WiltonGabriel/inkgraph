import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import {
  LoreDatabase,
  WorkspaceVaultWatcher,
  resolveSafeStagingPath,
  type AgentWriteGovernance,
} from "@inkgraph/core";
import { McpChangeSetStore } from "./changeSetStore.js";
import { InkGraphHttpHub } from "./httpSyncServer.js";
import {
  getMcpPromptMessages,
  listAllMcpResources,
  MCP_PROMPTS,
  readMcpResource,
} from "./resourcesAndPrompts.js";
import { MCP_TOOL_DEFINITIONS } from "./toolDefinitions.js";
import { executeMcpTool } from "./toolHandlers.js";

export {
  resolveSafeStagingPath,
  executeMcpTool,
  MCP_TOOL_DEFINITIONS,
  McpChangeSetStore,
  InkGraphHttpHub,
  listAllMcpResources,
  readMcpResource,
  MCP_PROMPTS,
  getMcpPromptMessages,
};

const defaultWorkspace = existsSync(resolve(process.cwd(), "workspace"))
  ? resolve(process.cwd(), "workspace")
  : resolve(process.cwd(), "../../workspace");

const WORKSPACE_ROOT =
  process.env.INKGRAPH_WORKSPACE ||
  process.env.WORKSPACE_PATH ||
  defaultWorkspace;

const STAGING_DIR = join(WORKSPACE_ROOT, "staging");
const SERIES_LORE_DIR = process.env.INKGRAPH_SERIES_LORE;
const GOVERNANCE: AgentWriteGovernance =
  process.env.INKGRAPH_MCP_GOVERNANCE === "draft_copilot" ? "draft_copilot" : "staging_strict";

export async function startStdioAndOptionalHttp(): Promise<void> {
  const db = new LoreDatabase({ inMemory: true });
  const changeStore = new McpChangeSetStore();
  let httpHub: InkGraphHttpHub | null = null;

  const watcher = new WorkspaceVaultWatcher(db, {
    workspaceRoot: WORKSPACE_ROOT,
    sharedSeriesDir: SERIES_LORE_DIR,
    onSync: (report) => {
      console.error(
        `[InkGraph MCP] Resynced vault: ${report.loreProcessed} lore, ${report.documentsProcessed} docs.`
      );
      httpHub?.emitEvent("vault_synced", report);
    },
    onError: (err) => {
      console.error("[InkGraph MCP] Watcher error:", err);
    },
  });

  console.error(`[InkGraph MCP] Syncing full vault from: ${WORKSPACE_ROOT}`);
  const initialReport = watcher.start();
  console.error(
    `[InkGraph MCP] Initial sync complete: ${initialReport.loreProcessed} lore entities, ${initialReport.documentsProcessed} documents.`
  );

  if (process.argv.includes("--http") || process.env.INKGRAPH_MCP_HTTP === "1") {
    const port = Number(process.env.INKGRAPH_MCP_PORT || 3333);
    const token = process.env.INKGRAPH_MCP_TOKEN;
    httpHub = new InkGraphHttpHub({
      port,
      workspaceRoot: WORKSPACE_ROOT,
      stagingDir: STAGING_DIR,
      db,
      governance: GOVERNANCE,
      changeSetStore: changeStore,
      authTokens: token ? { [token]: ["read", "write", "generate"] } : undefined,
    });
    const bound = await httpHub.start();
    console.error(`[InkGraph MCP] HTTP Hub & LAN Sync listening on http://127.0.0.1:${bound}/mcp`);
  }

  const server = new Server(
    { name: "inkgraph-mcp", version: "0.2.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    return executeMcpTool(name, rawArgs, db, STAGING_DIR, {
      governance: GOVERNANCE,
      changeSetStore: changeStore,
      workspaceRoot: WORKSPACE_ROOT,
      onVaultMutated: (evt) => httpHub?.emitEvent("vault_mutated", evt),
    });
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: listAllMcpResources(db),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => ({
    contents: [readMcpResource(request.params.uri, db)],
  }));

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [...MCP_PROMPTS],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) =>
    getMcpPromptMessages(request.params.name, request.params.arguments)
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[InkGraph MCP] Server running on stdio.");

  process.on("SIGINT", async () => {
    watcher.stop();
    await httpHub?.stop();
    db.close();
    process.exit(0);
  });
}

// Run CLI entrypoint only when executed directly (not when imported in tests)
const isTestEnv = Boolean(process.env.VITEST);
if (!isTestEnv) {
  startStdioAndOptionalHttp().catch((err) => {
    console.error("[InkGraph MCP] Fatal startup error:", err);
    process.exit(1);
  });
}
