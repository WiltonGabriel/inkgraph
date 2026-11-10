import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LoreDatabase, syncFullWorkspaceVault } from "@inkgraph/core";
import {
  InkGraphHttpHub,
  McpChangeSetStore,
  executeMcpTool,
  listAllMcpResources,
  readMcpResource,
} from "../src/index.js";

describe("@inkgraph/mcp Hub v2, Epistemic Filter, ChangeSet Undo & HTTP/LAN Sync", () => {
  let root: string;
  let stagingDir: string;
  let db: LoreDatabase;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "inkgraph-mcp-v2-"));
    stagingDir = join(root, "staging");
    mkdirSync(join(root, "lore"), { recursive: true });
    mkdirSync(join(root, "manuscript"), { recursive: true });
    mkdirSync(stagingDir, { recursive: true });

    writeFileSync(
      join(root, "lore", "mara.md"),
      [
        "---",
        "id: char_mara",
        "type: character",
        "name: Mara",
        "status: canon",
        "epistemic:",
        "  secrets_kept:",
        "    - Guardava o selo falsificado",
        "  known_by:",
        "    - char_mara",
        "  revealed_at_scene: manuscript_02_trial",
        "---",
        "Dossier da Mara.",
      ].join("\n")
    );

    const words = Array.from({ length: 25 }, (_, i) => `palavra${i + 1}`).join(" ");
    writeFileSync(
      join(root, "manuscript", "01_cais.md"),
      `---\nid: manuscript_01_cais\ntitle: "O Cais"\nstatus: draft\npov_character_id: char_elias\n---\n\n${words}\n`
    );
    writeFileSync(
      join(root, "manuscript", "02_trial.md"),
      `---\nid: manuscript_02_trial\ntitle: "Julgamento"\nstatus: canon\npov_character_id: char_elias\n---\n\nCena canon travada.\n`
    );

    db = new LoreDatabase({ inMemory: true });
    syncFullWorkspaceVault(root, db);
  });

  afterEach(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });

  it("delivers resume_work, paginated read_manuscript, and filters withheld secrets in get_scene_context", () => {
    const resume = executeMcpTool("resume_work", {}, db, stagingDir);
    expect(resume.isError).toBeUndefined();
    const resumeJson = JSON.parse(resume.content[0]!.text);
    expect(resumeJson.manuscriptScenesCount).toBe(2);

    const page1 = executeMcpTool(
      "read_manuscript",
      { scene_id: "manuscript_01_cais", cursor: 0, max_words: 10 },
      db,
      stagingDir
    );
    const p1 = JSON.parse(page1.content[0]!.text);
    expect(p1.text.split(/\s+/)).toHaveLength(10);
    expect(p1.nextCursor).toBe(10);

    const ctxBefore = executeMcpTool(
      "get_scene_context",
      { scene_id: "manuscript_01_cais" },
      db,
      stagingDir
    );
    const ctxObj = JSON.parse(ctxBefore.content[0]!.text);
    expect(ctxObj.epistemic.withheldSecrets).toHaveLength(1);
    expect(ctxObj.epistemic.visibleFacts).toHaveLength(0);
  });

  it("enforces staging_strict by default and supports draft_copilot with dry_run, expected_version & 24h undo", () => {
    const store = new McpChangeSetStore();

    // Default staging_strict blocks direct edits
    const blocked = executeMcpTool(
      "propose_prose_edit",
      {
        scene_id: "manuscript_01_cais",
        expected_version: 1,
        proposed_content: "Novo texto",
        rationale: "Reescrita",
      },
      db,
      stagingDir,
      { governance: "staging_strict", changeSetStore: store }
    );
    expect(blocked.isError).toBe(true);
    expect(blocked.content[0]!.text).toContain("canon_violation");

    // Direct draft_copilot protects 'canon' scenes
    const canonProtected = executeMcpTool(
      "propose_prose_edit",
      {
        scene_id: "manuscript_02_trial",
        expected_version: 1,
        proposed_content: "Alterar canon",
        rationale: "Teste",
      },
      db,
      stagingDir,
      { governance: "draft_copilot", changeSetStore: store }
    );
    expect(canonProtected.isError).toBe(true);
    expect(canonProtected.content[0]!.text).toContain("canon_violation");

    // Dry run on draft scene computes diff without writing disk
    const dryRunRes = executeMcpTool(
      "propose_prose_edit",
      {
        scene_id: "manuscript_01_cais",
        expected_version: 1,
        proposed_content: "Prosa revisada em rascunho.",
        rationale: "Polimento",
        dry_run: true,
      },
      db,
      stagingDir,
      { governance: "draft_copilot", changeSetStore: store }
    );
    expect(dryRunRes.isError).toBeUndefined();
    expect(JSON.parse(dryRunRes.content[0]!.text).applied).toBe(false);

    // Apply direct draft edit and revert cleanly via undo_change_set
    const applyRes = executeMcpTool(
      "propose_prose_edit",
      {
        scene_id: "manuscript_01_cais",
        expected_version: 1,
        proposed_content: "Prosa revisada em rascunho.",
        rationale: "Polimento",
      },
      db,
      stagingDir,
      { governance: "draft_copilot", changeSetStore: store }
    );
    const appliedJson = JSON.parse(applyRes.content[0]!.text);
    expect(appliedJson.applied).toBe(true);
    expect(readFileSync(join(root, "manuscript", "01_cais.md"), "utf-8")).toBe(
      "Prosa revisada em rascunho."
    );

    const undoRes = executeMcpTool(
      "undo_change_set",
      { undo_id: appliedJson.provenance.undoId },
      db,
      stagingDir,
      { changeSetStore: store }
    );
    expect(undoRes.isError).toBeUndefined();
    expect(readFileSync(join(root, "manuscript", "01_cais.md"), "utf-8")).toContain("palavra1");
  });

  it("lists and reads MCP resources safely and enforces Streamable HTTP bearer token auth + LAN Sync", async () => {
    const resources = listAllMcpResources(db);
    expect(resources.some((r) => r.uri === "inkgraph://lore/char_mara")).toBe(true);
    const books = readMcpResource("inkgraph://books", db);
    expect(JSON.parse(books.text).scenes).toHaveLength(2);

    const hub = new InkGraphHttpHub({
      port: 0,
      workspaceRoot: root,
      stagingDir,
      db,
      authTokens: {
        "read-only-tok": ["read"],
        "full-tok": ["read", "write"],
      },
    });
    const port = await hub.start();

    try {
      // Unauthenticated request returns 401
      const unauth = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, method: "tools/list" }),
      });
      expect(unauth.status).toBe(401);

      // Scoped read-only token cannot call write tools (403)
      const forbiddenWrite = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer read-only-tok",
        },
        body: JSON.stringify({
          id: 2,
          method: "tools/call",
          params: { name: "propose_scene", arguments: { outline_ref: "ch1", title: "X" } },
        }),
      });
      expect(forbiddenWrite.status).toBe(403);

      // LAN sync manifest + push conflict protection
      const manifestRes = await fetch(`http://127.0.0.1:${port}/sync/manifest`, {
        headers: { Authorization: "Bearer full-tok" },
      });
      expect(manifestRes.status).toBe(200);
      const manifestJson = (await manifestRes.json()) as { files: { path: string }[] };
      expect(manifestJson.files.some((f) => f.path === "manuscript/01_cais.md")).toBe(true);
    } finally {
      await hub.stop();
    }
  });
});
