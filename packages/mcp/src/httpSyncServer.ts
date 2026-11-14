import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import {
  computeContentDigest,
  computeSyncDeltaPlan,
  type AgentWriteGovernance,
  type LoreDatabase,
  type SessionCursor,
  type SyncFileEntry,
} from "@inkgraph/core";
import { McpChangeSetStore } from "./changeSetStore.js";
import { MCP_TOOL_DEFINITIONS } from "./toolDefinitions.js";
import { executeMcpTool } from "./toolHandlers.js";
import {
  getMcpPromptMessages,
  listAllMcpResources,
  MCP_PROMPTS,
  readMcpResource,
} from "./resourcesAndPrompts.js";

export type McpTokenScope = "read" | "write" | "generate";

export interface HttpMcpServerOptions {
  readonly port: number;
  readonly host?: string;
  readonly workspaceRoot: string;
  readonly stagingDir: string;
  readonly db: LoreDatabase;
  readonly governance?: AgentWriteGovernance;
  readonly changeSetStore?: McpChangeSetStore;
  readonly authTokens?: Record<string, readonly McpTokenScope[]>;
}

const SYNCABLE_DIRS = ["lore", "manuscript", "timeline", "staging"];

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf-8").trim();
        resolveBody(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

function collectWorkspaceSyncFiles(workspaceRoot: string): SyncFileEntry[] {
  const results: SyncFileEntry[] = [];
  for (const dir of SYNCABLE_DIRS) {
    const rootDir = join(workspaceRoot, dir);
    if (!existsSync(rootDir)) continue;

    function walk(curr: string): void {
      for (const entry of readdirSync(curr)) {
        const full = join(curr, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          walk(full);
        } else if (st.isFile() && full.endsWith(".md")) {
          const content = readFileSync(full, "utf-8");
          results.push({
            path: relative(workspaceRoot, full).replace(/\\/g, "/"),
            hash: computeContentDigest(content),
            updatedAt: st.mtime.toISOString(),
            deviceName: "Host PC",
            content,
          });
        }
      }
    }
    walk(rootDir);
  }
  return results;
}

function resolveSafeWorkspaceSyncPath(workspaceRoot: string, relPath: string): string {
  const cleanRel = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleanRel || cleanRel.includes("..") || !SYNCABLE_DIRS.some((d) => cleanRel.startsWith(`${d}/`))) {
    throw new Error(`Invalid sync path '${relPath}'.`);
  }
  const resolvedRoot = resolve(workspaceRoot);
  const resolvedTarget = resolve(resolvedRoot, cleanRel);
  if (!resolvedTarget.startsWith(resolvedRoot + sep)) {
    throw new Error("Path escapes workspace root.");
  }
  return resolvedTarget;
}

/**
 * Starts InkGraph's Streamable HTTP MCP endpoint (`/mcp`), SSE live updates (`/subscriptions/listen`),
 * and Local/LAN P2P vault sync (`/sync/manifest`, `/sync/push`) with scoped bearer token auth.
 */
export class InkGraphHttpHub {
  private server: Server | null = null;
  private readonly sseClients = new Set<ServerResponse>();
  private readonly changeStore: McpChangeSetStore;
  private boundPort: number;

  constructor(private readonly opts: HttpMcpServerOptions) {
    this.changeStore = opts.changeSetStore ?? new McpChangeSetStore();
    this.boundPort = opts.port;
  }

  public get port(): number {
    return this.boundPort;
  }

  public emitEvent(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      client.write(payload);
    }
  }

  private authorize(req: IncomingMessage, requiredScope: McpTokenScope): boolean {
    const tokens = this.opts.authTokens;
    if (!tokens || Object.keys(tokens).length === 0) return true;

    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const scopes = token ? tokens[token] : undefined;
    return Boolean(scopes && scopes.includes(requiredScope));
  }

  public async start(): Promise<number> {
    this.server = createServer(async (req, res) => {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
      }

      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, service: "inkgraph-mcp-hub", port: this.boundPort });
        return;
      }

      if (req.method === "GET" && url.pathname === "/subscriptions/listen") {
        if (!this.authorize(req, "read")) {
          sendJson(res, 401, { code: "unauthorized", error: "Missing or invalid Bearer token." });
          return;
        }
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });
        res.write(`event: ready\ndata: ${JSON.stringify({ connected: true })}\n\n`);
        this.sseClients.add(res);
        req.on("close", () => this.sseClients.delete(res));
        return;
      }

      if (req.method === "GET" && url.pathname === "/sync/manifest") {
        if (!this.authorize(req, "read")) {
          sendJson(res, 401, { code: "unauthorized", error: "Unauthorized sync manifest access." });
          return;
        }
        const cursorPath = join(this.opts.workspaceRoot, "workspace-session.json");
        const sessionCursor = existsSync(cursorPath)
          ? (JSON.parse(readFileSync(cursorPath, "utf-8")) as SessionCursor)
          : null;
        sendJson(res, 200, {
          schemaVersion: 1,
          workspaceId: "local-workspace",
          deviceName: "Host PC",
          exportedAt: new Date().toISOString(),
          sessionCursor,
          files: collectWorkspaceSyncFiles(this.opts.workspaceRoot),
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/sync/push") {
        if (!this.authorize(req, "write")) {
          sendJson(res, 401, { code: "unauthorized", error: "Missing write scope for LAN sync." });
          return;
        }
        try {
          const body = (await readJsonBody(req)) as {
            files?: SyncFileEntry[];
            lastSyncedHashes?: Record<string, string>;
            sessionCursor?: SessionCursor | null;
          };
          const localFiles = collectWorkspaceSyncFiles(this.opts.workspaceRoot);
          const plan = computeSyncDeltaPlan({
            workspaceId: "local-workspace",
            localFiles,
            remoteFiles: body.files ?? [],
            lastSyncedHashes: body.lastSyncedHashes,
            remoteCursor: body.sessionCursor,
          });

          // Apply non-conflicting incoming mobile/laptop files safely
          for (const incoming of plan.toDownload) {
            const target = resolveSafeWorkspaceSyncPath(this.opts.workspaceRoot, incoming.path);
            mkdirSync(resolve(target, ".."), { recursive: true });
            writeFileSync(target, incoming.content, "utf-8");
          }

          // Stage divergent conflicts without overwriting local host files
          for (const conflict of plan.conflicts) {
            const safeConflictName = `conflict_${conflict.id}.md`;
            const target = join(this.opts.stagingDir, safeConflictName);
            mkdirSync(this.opts.stagingDir, { recursive: true });
            writeFileSync(
              target,
              `---\nid: ${conflict.id}\nconflict_path: ${JSON.stringify(conflict.entityOrSceneId)}\nremote_device: ${JSON.stringify(conflict.remoteDeviceName)}\n---\n\n${conflict.remoteContent}\n`,
              "utf-8"
            );
          }

          if (plan.preferredCursor) {
            writeFileSync(
              join(this.opts.workspaceRoot, "workspace-session.json"),
              JSON.stringify(plan.preferredCursor, null, 2),
              "utf-8"
            );
          }

          this.emitEvent("sync_applied", {
            written: plan.toDownload.length,
            conflicts: plan.conflicts.length,
          });
          sendJson(res, 200, {
            applied: plan.toDownload.length,
            conflictsStaged: plan.conflicts.length,
            toClient: plan.toUpload,
          });
        } catch (err) {
          sendJson(res, 400, { code: "validation", error: err instanceof Error ? err.message : String(err) });
        }
        return;
      }

      if (req.method === "POST" && url.pathname === "/mcp") {
        if (!this.authorize(req, "read")) {
          sendJson(res, 401, { code: "unauthorized", error: "Invalid Bearer token for MCP." });
          return;
        }
        try {
          const rpc = (await readJsonBody(req)) as {
            id?: string | number | null;
            method?: string;
            params?: Record<string, any>;
          };

          const id = rpc.id ?? null;
          if (rpc.method === "tools/list") {
            sendJson(res, 200, { jsonrpc: "2.0", id, result: { tools: MCP_TOOL_DEFINITIONS } });
            return;
          }

          if (rpc.method === "tools/call") {
            const toolName = String(rpc.params?.name ?? "");
            const writeTools = new Set(["propose_lore", "propose_scene", "propose_prose_edit", "undo_change_set", "upsert_beat"]);
            if (writeTools.has(toolName) && !this.authorize(req, "write")) {
              sendJson(res, 403, { code: "unauthorized", error: `Token lacks 'write' scope for ${toolName}.` });
              return;
            }
            const result = executeMcpTool(toolName, rpc.params?.arguments, this.opts.db, this.opts.stagingDir, {
              governance: this.opts.governance,
              changeSetStore: this.changeStore,
              workspaceRoot: this.opts.workspaceRoot,
              onVaultMutated: (evt) => this.emitEvent("vault_mutated", evt),
            });
            sendJson(res, 200, { jsonrpc: "2.0", id, result });
            return;
          }

          if (rpc.method === "resources/list") {
            sendJson(res, 200, {
              jsonrpc: "2.0",
              id,
              result: { resources: listAllMcpResources(this.opts.db) },
            });
            return;
          }

          if (rpc.method === "resources/read") {
            const content = readMcpResource(String(rpc.params?.uri ?? ""), this.opts.db);
            sendJson(res, 200, { jsonrpc: "2.0", id, result: { contents: [content] } });
            return;
          }

          if (rpc.method === "prompts/list") {
            sendJson(res, 200, { jsonrpc: "2.0", id, result: { prompts: MCP_PROMPTS } });
            return;
          }

          if (rpc.method === "prompts/get") {
            const promptRes = getMcpPromptMessages(String(rpc.params?.name ?? ""), rpc.params?.arguments);
            sendJson(res, 200, { jsonrpc: "2.0", id, result: promptRes });
            return;
          }

          sendJson(res, 404, { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${rpc.method}` } });
        } catch (err) {
          sendJson(res, 400, { code: "validation", error: err instanceof Error ? err.message : String(err) });
        }
        return;
      }

      sendJson(res, 404, { code: "not_found", error: "Route not found." });
    });

    await new Promise<void>((resolveStart) => {
      this.server!.listen(this.opts.port, this.opts.host ?? "127.0.0.1", () => {
        const addr = this.server!.address();
        if (addr && typeof addr === "object") {
          this.boundPort = addr.port;
        }
        resolveStart();
      });
    });
    return this.boundPort;
  }

  public async stop(): Promise<void> {
    for (const client of this.sseClients) {
      client.end();
    }
    this.sseClients.clear();
    if (!this.server) return;
    await new Promise<void>((resolveStop, rejectStop) => {
      this.server!.close((err) => (err ? rejectStop(err) : resolveStop()));
    });
    this.server = null;
  }
}
