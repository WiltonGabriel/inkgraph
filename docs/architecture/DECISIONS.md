# Decisões Arquiteturais: InkGraph (ADR 001)

Este documento estabelece a arquitetura do **InkGraph**, voltada para privacidade absoluta do cofre do autor, operação 100% offline/local-first, uso opcional de IA e integração nativa com agentes via MCP Hub v2.

---

## 1. Diretrizes Arquiteturais

| Critério / Capacidade | Decisão Técnica no InkGraph |
| :--- | :--- |
| **Arquitetura Base** | Monorepo TypeScript (`pnpm`) com 7 pacotes (`domain`, `capabilities`, `ai`, `core`, `mcp`, `ui`, `desktop`) |
| **Fonte Única da Verdade** | Arquivos Markdown puros com YAML Frontmatter em `./workspace/` (espelhados em IndexedDB/OPFS no PWA) |
| **Editor Canônico** | Dual-mode sem perda entre TipTap (blocos/foco) e CodeMirror 6 (Markdown fonte), menções `[Nome](kb:id)` e diretivas `::beat` / `::epistemic-reveal` |
| **Modo Sem IA & Modos de IA** | `aiMode: 'off'` como padrão silencioso; suporte a `eco`, `local` (Ollama + BM25 sem egress), `cloud` e `hybrid` com `IncarnationTracker` |
| **Multi-Dispositivo & Backup** | PWA offline-first, LAN P2P Sync, Google Drive (`drive.file` não sensível) com delta + preservação de conflitos e cofre cifrado `.inkpack` (`PBKDF2 600k + AES-256-GCM`) |
| **Integração com Agentes** | Servidor MCP Hub v2 (`@inkgraph/mcp`) via `stdio` e HTTP `/mcp` + SSE `/subscriptions/listen` com Bearer Token |
| **Proteção de Cânone** | Modo padrão `staging_strict` em `./workspace/staging/`; `draft_copilot` opcional apenas em rascunhos com `expected_version`, `dry_run` e `undo_change_set` (24h) |
| **Publicação Offline** | Geração local de EPUB 3, DOCX, PDF por corte (`6x9`, `5.5x8.5`, `a5`, `manuscript`), Lauda 60×30 (`\f`) e Vault `.zip` com Preflight Gate |

---

## 2. Camadas do Sistema

### A. Núcleo Puro e Capabilities (`@inkgraph/domain`, `@inkgraph/capabilities`)
- **Isomorfia Browser + Node:** Parser de frontmatter e texto, métricas de legibilidade PT-BR/EN, chaves fracionárias, diff por palavra (LCS), codec dual-mode (`canonicalProseCodec`), 8 heurísticas estruturais (`narrativeHeuristics`), scanner Auto-Codex (`storyCodexScanner`) e motor de delta sync (`syncDeltaEngine`).
- **Epistêmica e Governança (`@inkgraph/capabilities`):** Briefing epistêmico filtrado por ponto de vista e cena (`buildSceneEpistemicBriefing`) e controle de governança para ChangeSets.

### B. Gateway de IA e Recuperação Local (`@inkgraph/ai`)
- Bloqueia tráfego externo automaticamente nos modos `off`, `eco` e `local` (`assertCloudAiAllowed`).
- Cancela gerações obsoletas por cena/sessão via `IncarnationTracker`.
- Inclui recuperador léxico local BM25 (`hybridRetriever`) e supervisor estruturado (`ProForgeSupervisorAgent`) com aplicação reversa de patches por offset.

### C. Persistência e Indexação (`@inkgraph/core`)
- **Cofre `./workspace/`:** Todo conteúdo do autor permanece em texto puro legível por humanos e estritamente ignorado pelo Git.
- **SQLite + FTS5 Derivado:** Mantém tabelas para entidades, documentos completos (`vault_documents`, `vault_documents_fts`) e falhas de leitura (`vault_parse_errors`), além de watcher em tempo real (`WorkspaceVaultWatcher`). Se o banco for apagado, é 100% reconstruído a partir de `./workspace/`.

### D. Servidor MCP Hub v2 (`@inkgraph/mcp`)
- Expõe 14 ferramentas (`list_entities`, `get_entity`, `search_lore`, `query_epistemic_state`, `get_timeline`, `get_relationships`, `propose_lore`, `propose_scene`, `resume_work`, `read_manuscript`, `get_scene_context`, `propose_prose_edit`, `undo_change_set`, `upsert_beat`), além de `resources` (`inkgraph://books`, `inkgraph://lore/<id>`, `inkgraph://scene/<id>`, `inkgraph://epistemic/<id>`) e `prompts` (`resume`, `draft-scene`, `audit-epistemic`, `canon-check`).
- Transporte dual: `stdio` padrão para IDEs/assistentes locais e servidor HTTP opcional (`/mcp`, SSE `/subscriptions/listen`, `/sync/manifest`, `/sync/push`) protegido por Bearer Token para pareamento LAN e clientes remotos.

### E. Estúdio Visual PWA e Shell Nativo (`@inkgraph/ui`, `@inkgraph/desktop`)
- **PWA Offline-First & Design Silencioso:** Interface responsiva para desktop, tablet e celular, com `QuickCaptureModal`, `GlobalWorkspaceSearch`, tutorial guiado opcional em 4 passos (`PT-BR`/`EN`), importação com preview (`.md`, `.docx`, Novelcrafter `.zip`) e publicação 100% offline.
- **Tauri v2 (`@inkgraph/desktop`):** Wrapper desktop nativo leve para empacotamento em sistemas operacionais desktop sem sobrecarga de Electron.
