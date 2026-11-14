# Decisões Arquiteturais: InkGraph (ADR 001)

Este documento registra a arquitetura vigente do **InkGraph**, projetada para privacidade absoluta do cofre local do autor (`./workspace/`), operação *offline/local-first*, separação estrita de Cânone vs. Staging, UI silenciosa e integração nativa com clientes MCP via `stdio`.

---

## 1. Visão Geral das Decisões Técnicas

| Critério / Capacidade | Decisão Arquitetural no InkGraph |
| :--- | :--- |
| **Estrutura de Monorepo** | Workspace `pnpm` com 4 pacotes (`@inkgraph/core`, `@inkgraph/mcp`, `@inkgraph/ui`, `@inkgraph/desktop`) |
| **Motor Puro Isomórfico** | 14 módulos puros em `packages/ui/src/domain/` sem dependência de DOM direto, permitindo execução e testes em Node (`Vitest`) e Browser |
| **Persistência Web** | Catálogo e preferências salvos com *debounce* em `localStorage` + binários/mapas pesados em `IndexedDB` (`AssetStore`) atrás de `storageAdapter.ts`, com leitura de verificação imediata |
| **Cofre em Disco & SQLite** | Arquivos Markdown + YAML frontmatter em `./workspace/` (ignorados no Git) indexados em `@inkgraph/core` com SQLite FTS5 efêmero |
| **Tematização Dual-Mode** | 6 paletas com suporte a `light`, `dark`, `sepia` e `system` injetando variáveis semânticas `--bg-*`, `--text-*`, `--border-*` e `--accent-*` via `themes.ts` |
| **Editor Markdown** | **CodeMirror 6 (MIT)** (`@codemirror/{state,view,commands,lang-markdown,search,autocomplete}`) com autocomplete `@`/`#`/`&`/`!`/`/` e 3 modos (`write`, `split`, `read`) |
| **Controle de Versões** | Motor LCS determinístico (`gitEngine.ts`) com estado completo por ramificação (`Branch.snapshotData`), diff por linha e por palavra, resolução *Ours/Theirs* e auto-backup antes de restaurar snapshots |
| **Memória & Epistemologia** | Compilador em 4 camadas (`memoryCompiler.ts`) com orçamento de tokens, detecção de vazamentos epistêmicos por POV, resumo de continuidade e bloqueio de egress nos modos `eco`/`local` |
| **Servidor MCP** | `@inkgraph/mcp` em `stdio` conectado ao `@inkgraph/core` com 8 ferramentas de consulta e propostas confinadas a `./workspace/staging/` |
| **Empacotamento Desktop** | Scaffold nativo em **Tauri v2** (`@inkgraph/desktop`, Rust + Webview), sem empacotamento Electron |
| **Maturidade & Radar de Cânone** | Pontuação universal `1–10` (`canonScoreCalculator.ts`) nos 10 pilares do mundo e entidades, combinada a varredura de prosa (`canonRadarEngine.ts`) com 3 níveis de permissão (`observer`, `staging`, `auto`) sem mutação da prosa |

---

## 2. Camadas do Sistema

### A. Núcleo Puro de Domínio (`packages/ui/src/domain/`)
Todos os cálculos críticos e regras de negócio ficam isolados da camada de visualização React em 14 módulos puros:
- `storageAdapter.ts`: persistência em `localStorage` + `IndexedDB` (`inkgraph-assets-v1`) com `flush` síncrono e verificação de integridade (`verifyAndReloadStorage`).
- `entityDirectory.ts`: visão unificada de entidades, vizinhança de vínculos, resolução por alias e exclusão em cascata sem órfãos (`cascadeDeleteEntity`).
- `stagingResolver.ts`: aplicação de decisões de aprovação ou rejeição (`applyStagingDecision`) para propostas de *Staging*.
- `shortcutManager.ts`: catálogo dos 26 atalhos personalizáveis, captura de teclado, normalização e detecção de conflitos em tempo real.
- `breadcrumbResolver.ts`: interpretação e geração de caminhos editáveis por triplo clique (`Planejamento / Painel`, `Mundo / Geografia`, etc.) e histórico recente de navegação.
- `themes.ts`: definição das paletas Dual-Mode, fontes tipográficas, cantos, superfícies e geração de tokens CSS.
- `gitEngine.ts`: algoritmo LCS de diff linha a linha (`computeLineDiff`) e palavra por palavra (`computeWordDiff`), isolamento de estado de ramificações (`createBranchFromActive`, `checkoutBranchState`), diff de workspace (`computeWorkspaceBranchDiff`), mesclagem com resolução de conflitos (`mergeBranchIntoActive`) e restauração segura de snapshots (`restoreSnapshotWithAutoBackup`).
- `memoryCompiler.ts`: compilação em 4 camadas (*Memória de Trabalho*, *Memória Episódica & Epistêmica*, *Memória Semântica*, *Síntese Contínua & Voz*), estimativa e recorte por orçamento de tokens (`budgetTokens`), detecção de vazamentos de segredos na prosa (`epistemicAlerts`) e portão `cloudAllowed`.
- `completenessCalculator.ts`, `narrativeHeuristics.ts`, `wordCounter.ts` e `workspaceNormalizer.ts`: métricas de completude, heurísticas narrativas locais, contagem de palavras e sanitização/normalização segura de workspaces JSON (incluindo `sanitizeExternalUrl`).
- `canonScoreCalculator.ts`: cálculo universal de maturidade `1–10` e faixas cromáticas para cada um dos 10 pilares mundiais (`WORLD_PILLARS`), personagens, facções, locais, sistemas, objetos e score agregado do projeto (`computeProjectCanonScoreSummary`).
- `canonRadarEngine.ts`: scanner local de citações `@`/`#`/`&`/`!`, nomes próprios compostos, vínculos de cena ausentes e vazamentos epistêmicos (`scanProjectCanon`) com geração de `StagingProposal` ou auto-catalogação segura sem mutação de `scene.content` (`applyAutoCatalogFinding`, `applyAutoCatalogBatch`).

### B. Motor Node, Parser & SQLite FTS5 (`@inkgraph/core`)
- **Parser (`markdownParser.ts`):** lê arquivos Markdown com frontmatter YAML e valida contra o esquema Zod de entidades (`entity.ts`).
- **Indexador SQLite FTS5 (`database.ts`, `sync.ts`, `epistemicQueries.ts`):** projeta entidades e índices full-text no SQLite local e valida caminhos seguros de staging (`resolveSafeStagingPath`) contra travessia de diretórios.
- **Erros Estruturados (`errors.ts`):** `InkGraphError` com códigos padronizados (`not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation`, `unauthorized`).

### C. Servidor MCP (`@inkgraph/mcp`)
- Transporta chamadas MCP sobre `stdio` (`packages/mcp/src/index.ts`).
- Expõe 8 ferramentas (`list_entities`, `get_entity`, `search_lore`, `query_epistemic_state`, `get_timeline`, `propose_lore`, `propose_scene`, `get_relationships`) delegando escrita exclusivamente para `./workspace/staging/`.

### D. Estúdio Visual & Shell Desktop (`@inkgraph/ui`, `@inkgraph/desktop`)
- **`@inkgraph/ui`:** Orquestração via `SettingsContext` (`draftSettings` vs `committedSettings`) e `ProjectContext`, views lazy-loaded (`React.lazy`), componentes granulares por domínio em `src/components/{canon-radar,common,dashboard,graph,manuscript,mind-map,publishing,scene-board,settings,shell,ui,world}` e testes cross-package em `packages/core/tests/`.
- **`@inkgraph/desktop`:** Estrutura nativa em Tauri v2 (`src-tauri/`) pronta para geração de binários desktop leves sem runtime Chromium acoplado.
