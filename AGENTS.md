# AGENTS.md — InkGraph Agent Operating Constitution & Architecture Rules

`AGENTS.md` is the authoritative operational specification for any AI agent, coding assistant, or developer working on the **InkGraph** codebase. Follow all rules here strictly.

---

## 1. Core Mission & Philosophy

**InkGraph** is an open-source, local-first literary writing, worldbuilding, and lore-management studio designed from the ground up to act as a **structured knowledge engine and native Model Context Protocol (MCP) server** for Google Antigravity and AI agents.

### Key Tenets
1. **Silent & Minimalist Design Philosophy (Absolute Rule):**
   - **Zero Noise / Zero Promotional Slogans in UI:** Every button, tab, and label must be concise, quiet, functional, and purely focused on the creative work. Never inject external product names, libraries, or promotional suffixes into UI titles or headers.
   - Use clean, silent domain terminology: "Grafo", "Personagens", "Mundo", "Linha do Tempo", "Manuscrito", "Revisão".
   - Keep the visual aesthetic dark, distraction-free, and high-density, respecting the user's tiling window manager (Niri/Wayland).
2. **Absolute Local Privacy (Vault Boundary):**
   - `./workspace/` is the user's private vault containing their confidential book data, manuscripts, character dossiers, lore, and uploads.
   - **NEVER** commit, track, or leak any file or directory under `./workspace/` to Git or any remote repository. The `.gitignore` must strictly ignore `./workspace/` and all local SQLite/DuckDB databases.
2. **Markdown-First (Single Source of Truth):**
   - The authoritative source of truth for all lore and manuscript content is standard Markdown files with YAML frontmatter located in `./workspace/`.
   - The SQLite database is an **ephemeral/derived real-time projection & index** (using FTS5 and relational tables). If the database is deleted or corrupted, it can be re-indexed 100% from `./workspace/`.
3. **Strict Epistemic & Canon Separation:**
   - **Canon (`workspace/lore/`, `workspace/manuscript/`):** Confirmed truths approved by the author.
   - **Staging (`workspace/staging/`):** AI proposals, draft variations, and provisional lore awaiting user review.
   - **Epistemic Tracking:** The system must distinguish what the **Author** knows, what the **Reader** has discovered up to scene $X$, and what **Character $A$** knows versus **Character $B$**.
4. **Lightweight & Desktop-Ready (No Bloated Electron):**
   - Native desktop application powered by **Tauri v2** (Rust + system WebKitGTK / Wayland on Linux / Niri).
   - Fast, local-first, offline-capable PWA client compatible with mobile devices via local network or Tailscale.

---

## 2. Architecture & Monorepo Layout

```
inkgraph/
├── AGENTS.md                  # This constitution
├── README.md                  # Public documentation & getting started
├── package.json               # Root workspace configuration
├── pnpm-workspace.yaml        # Workspace configuration (pnpm only)
├── .gitignore                 # Strict isolation of ./workspace/ and builds
│
├── workspace/                 # [GITIGNORED] User's local private vault
│   ├── uploads/               # Raw input (PDFs, DOCX, TXTs, notes for indexing)
│   ├── lore/                  # Authoritative lore files (characters, factions, etc.)
│   ├── manuscript/            # Structured manuscript (acts, chapters, scenes)
│   ├── staging/               # AI proposals & pending diffs awaiting canonization
│   ├── timeline/              # Event logs, beat sheets, and chronological markers
│   └── assets/                # Maps (SVG/HTML/images), character portraits, heraldry
│
├── docs/                      # Public architectural documentation
│   ├── architecture/          # ADRs, decisions, and system diagrams
│   └── specs/                 # MCP schemas, Markdown frontmatter formats
│
└── packages/                  # Modular source packages
    ├── core/                  # Engine: Markdown parser, frontmatter validator,
    │                          # SQLite/FTS5 indexer, temporal graph resolver
    ├── mcp/                   # MCP Server (stdio & streamable HTTP) for Antigravity
    ├── ui/                    # React/Vite UI components (Graph visualizers,
    │                          # timeline, tension curves, interactive maps, dossiers)
    └── desktop/               # Tauri v2 wrapper (Rust + Webview)
```

---

## 3. Operational Rules for Coding Agents

### Rule 1: No Unapproved Dependencies & Single Responsibility Principle (SRP)
- Default package manager is **pnpm**. Do not use `npm` or `yarn`.
- Always prefer standard library or lightweight zero-dependency utilities before adding external libraries.
- Never add Electron or Chromium bundling. Use Tauri v2 for desktop builds.
- **Strict Single Responsibility Principle (SRP) & File Granularity:**
  - Every file, module, and component must have **one single reason to change** and **one single responsibility**.
  - **Never dump an entire feature into a single monolithic file.** Split domain types, pure calculators, data seeds/factories, state hooks, and UI sub-components into dedicated subdirectories (e.g., `domain/`, `data/`, `components/dashboard/`, `components/manuscript/`, `components/scene-board/`, `components/graph/`, `components/mind-map/`, `components/writing/`, `components/copilot/`, `components/roster/`).
  - Top-level `views/*View.tsx` files must act only as thin orchestrators (~30–80 lines) composing focused sub-components.

### Rule 2: Non-Destructive File Operations
- Writing lore or manuscript updates from AI tools must target `./workspace/staging/` unless explicitly instructed by the user to overwrite a canonical file.
- Preserved-first safety: Do not quarantine, silently alter, or delete malformed user notes in `./workspace/uploads/`. Report parsing errors cleanly.

### Rule 3: Error Handling & API Responses
- All MCP tools and core engine functions must return structured errors with standard codes:
  - `not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation`, `unauthorized`.
- Never fail silently; return informative messages explaining what frontmatter or rule caused the issue.

### Rule 4: Data Schemas & Frontmatter Contract
Every entity in `./workspace/lore/` must start with standardized YAML frontmatter.
The taxonomy is completely genre-agnostic (works for Fantasy, Sci-Fi, Cyberpunk, Historical, Thriller, etc.):
```yaml
---
id: "char_elias_vance"
type: "character" # Generic categories: character | faction | location | item | concept | event | rule_system
subtype: "magic_system" # Completely freeform (e.g.: magic_system, cyberware, legal_code, religion, space_tech)
name: "Elias Vance"
aliases: ["The Blind Crow", "Lord Commander Vance"]
status: "canon" # canon | provisional | draft
tags: ["nobility", "military"]
relationships:
  - target: "faction_iron_order"
    relation: "exiled_member"
    since_scene: "scene_01_prologue"
    sentiment: -0.8
epistemic:
  secrets_kept:
    - "Killed his brother during the Siege of Vael"
  known_by:
    - "self"
    - "char_queen_morrigan" # Only she knows as of Chapter 2
---
```

---

## 4. MCP Tools Contract (for Antigravity & AI Agents)

The `packages/mcp` package must implement the following foundational tool suite:

1. **`list_entities(filter)`**: Filter lore items by type, tag, or status.
2. **`get_entity(id_or_alias)`**: Resolves any alias, title, or ID to the full dossier.
3. **`search_lore(query, mode)`**: Full-text search (FTS5) across canonical lore, uploads, and manuscripts.
4. **`query_epistemic_state(scene_id, entity_id)`**: Inspects what an entity knows or what secrets are hidden at a given story point.
5. **`get_timeline(from_scene, to_scene)`**: Returns causal sequence, character locations, and tension curve values.
6. **`propose_lore(entity_data, rationale)`**: Creates a pending draft in `./workspace/staging/` without contaminating canon.
7. **`propose_scene(scene_data, outline_ref)`**: Generates a scene draft in `./workspace/staging/` respecting continuity rules.

---

## 5. Development Gate & Quality Verification
Before completing any major code change:
- Run typecheck: `pnpm --filter @inkgraph/core run typecheck`
- Run unit tests: `pnpm test`
- Verify `.gitignore` integrity: Ensure `./workspace/` remains 100% untracked.
