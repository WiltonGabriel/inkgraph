# AGENTS.md — Constituição Operacional de Agentes e Regras de Arquitetura do InkGraph

`AGENTS.md` é a especificação operacional autoritativa para qualquer agente de IA, assistente de codificação ou desenvolvedor atuando na base de código do **InkGraph**. Siga todas as regras abaixo rigorosamente.

---

## 1. Missão Central e Filosofia

O **InkGraph** é um estúdio literário open-source *local-first*, motor de construção de mundos (*worldbuilding*) e gerenciador de lore epistêmica, projetado desde a base como um **motor de conhecimento estruturado e servidor nativo do Model Context Protocol (MCP)** para Google Antigravity, Claude, Codex e outros clientes compatíveis — funcionando 100% sem IA por padrão quando o autor preferir escrever manualmente.

### Princípios Fundamentais
1. **Filosofia do Design Silencioso e Minimalista (Regra Absoluta):**
   - **Zero Ruído / Zero Slogans Promocionais na Interface:** Todo botão, aba e rótulo deve ser conciso, silencioso, funcional e estritamente focado no trabalho criativo. Nunca injete nomes comerciais externos, textos publicitários ou sufixos chamativos em títulos ou cabeçalhos da interface.
   - Utilize terminologia de domínio limpa e direta: "Grafo", "Personagens", "Mundo", "Linha do Tempo", "Manuscrito", "Revisão".
   - IA desativada por padrão (`aiMode: 'off'`): modos locais (`off`, `eco`, `local`) nunca devem realizar chamadas de saída para APIs na nuvem (`assertCloudAiAllowed`).
2. **Privacidade Local Absoluta (Fronteira do Cofre):**
   - `./workspace/` é o cofre privado do usuário contendo dados confidenciais do livro, manuscritos, dossiês de personagens, lore e arquivos enviados.
   - **NUNCA** comite, rastreie ou vaze qualquer arquivo ou diretório dentro de `./workspace/` para o Git ou repositórios remotos. O `.gitignore` deve bloquear estritamente `./workspace/`, bancos SQLite locais e arquivos `.env`.
3. **Markdown-First (Fonte Única da Verdade):**
   - A fonte autoritativa da verdade para toda lore e manuscrito são arquivos Markdown padrão com frontmatter YAML em `./workspace/` (no desktop/servidor) ou o espelho OPFS/IndexedDB no PWA.
   - O banco SQLite (`@inkgraph/core`) é uma **projeção e índice derivado em tempo real** (usando FTS5 e tabelas relacionais). Se o banco for removido ou corrompido, ele pode ser 100% reconstruído a partir de `./workspace/`.
4. **Separação Estrita de Cânone e Rastreamento Epistêmico:**
   - **Cânone (`workspace/lore/`, `workspace/manuscript/`):** Fatos e textos confirmados e aprovados pelo autor.
   - **Staging (`workspace/staging/`):** Propostas de IA, capturas rápidas e rascunhos provisórios aguardando revisão humana (modo padrão `staging_strict`). Em projetos que habilitarem explicitamente `draft_copilot`, edições diretas aplicam-se apenas a rascunhos usando controle de versão otimista (`expected_version`) e janela de reversão em 24h (`undo_change_set`).
   - **Rastreamento Epistêmico:** O sistema distingue o que o **Autor** sabe, o que o **Leitor** descobriu até a cena $X$ e o que o **Personagem $A$** conhece versus o **Personagem $B$**.
5. **Leve e Multiplataforma (PWA + Tauri v2, sem Electron):**
   - Aplicativo web progressivo (PWA) offline-first para navegador, tablet e celular, com sincronização LAN P2P ou Google Drive (`drive.file`, nunca enviando arquivos SQLite) e backups cifrados `.inkpack` (`PBKDF2 600k + AES-256-GCM`).
   - Shell desktop nativo baseado em **Tauri v2** (`@inkgraph/desktop`), sem empacotar Electron/Chromium.

---

## 2. Arquitetura e Estrutura do Monorepo

```text
inkgraph/
├── AGENTS.md                  # Esta constituição operacional
├── README.md                  # Documentação principal e guia de uso
├── CONTRIBUTING.md            # Diretrizes de contribuição
├── package.json               # Configuração raiz do workspace
├── pnpm-workspace.yaml        # Configuração do workspace (somente pnpm)
├── .gitignore                 # Isolamento estrito de ./workspace/, bancos e builds
│
├── workspace/                 # [IGNORADO NO GIT] Cofre privado local do autor
│   ├── uploads/               # Entradas brutas para indexação
│   ├── lore/                  # Arquivos canônicos de lore (personagens, facções, etc.)
│   ├── manuscript/            # Manuscrito estruturado (atos, capítulos, cenas)
│   ├── staging/               # Propostas da IA e diffs pendentes aguardando canonização
│   ├── timeline/              # Marcadores temporais e batidas de enredo
│   └── assets/                # Mapas, retratos e elementos gráficos
│
├── docs/                      # Documentação arquitetural pública
│   └── architecture/          # Registros de decisões arquiteturais (ADRs)
│
└── packages/                  # Pacotes modulares do monorepo
    ├── domain/                # Lógica pura isomórfica (browser + Node): parser,
    │                          # codecs dual-mode, heurísticas, Auto-Codex e sync delta
    ├── capabilities/          # Briefing epistêmico e governança de ChangeSets
    ├── ai/                    # Gateway de IA, IncarnationTracker, BM25 local e agente ProForge
    ├── core/                  # Motor Node: indexador SQLite/FTS5, sync completo e watcher
    ├── mcp/                   # Servidor MCP Hub v2 (stdio + HTTP/SSE + LAN sync + Bearer)
    ├── ui/                    # Estúdio visual em React + Vite + PWA offline-first
    └── desktop/               # Shell desktop nativo em Tauri v2 (Rust + Webview)
```

---

## 3. Regras Operacionais para Agentes de Código

### Regra 1: Gerenciador Padrão e Princípio da Responsabilidade Única (SRP)
- O gerenciador de pacotes padrão é o **pnpm** (ou `corepack pnpm`). Não utilize `npm` ou `yarn`.
- Prefira utilitários leves ou da biblioteca padrão antes de adicionar dependências externas.
- Nunca adicione Electron. Utilize Tauri v2 (`packages/desktop/`) para empacotamento desktop.
- **SRP Estrito e Granularidade de Arquivos:**
  - Cada arquivo, módulo e componente deve ter **uma única razão para mudar** e **uma única responsabilidade**.
  - **Nunca despeje uma funcionalidade inteira em um arquivo monolítico.** Mantenha lógica pura em `@inkgraph/domain`, políticas em `@inkgraph/capabilities`, orquestração de IA em `@inkgraph/ai`, infraestrutura de banco em `@inkgraph/core`, subcomponentes granulares em `packages/ui/src/components/<contexto>/` e orquestradores enxutos em `packages/ui/src/views/`.

### Regra 2: Operações de Arquivo Não Destrutivas
- Escritas de lore ou atualizações de manuscrito feitas por ferramentas de IA devem ir para `./workspace/staging/` por padrão (`staging_strict`), respeitando as travas de `draft_copilot` quando configurado pelo usuário.
- Segurança *preserve-first*: não altere silenciosamente nem exclua notas malformadas em `./workspace/uploads/`; registre erros em `vault_parse_errors` e reporte de forma limpa.

### Regra 3: Tratamento de Erros e Respostas Estruturadas
- Todas as ferramentas MCP e funções do motor central devem lançar ou retornar `InkGraphError` com códigos padronizados:
  - `not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation`, `unauthorized`.
- Nunca falhe silenciosamente; retorne mensagens claras explicando qual frontmatter ou regra causou o erro.

### Regra 4: Contrato de Schemas e Frontmatter
Toda entidade em `./workspace/lore/` inicia com frontmatter YAML padronizado e agnóstico a gênero (Fantasia, Sci-Fi, Cyberpunk, Histórico, Policial, etc.):

```yaml
---
id: "char_elias_vance"
type: "character" # character | faction | location | item | concept | event | rule_system
subtype: "militar" # Campo livre (ex.: sistema_magico, cyberware, codigo_juridico, tecnologia)
name: "Elias Vance"
aliases: ["O Corvo Cego", "Lorde Comandante"]
status: "canon" # canon | provisional | draft
tags: ["nobreza", "militar"]
relationships:
  - target: "faction_iron_order"
    relation: "exiled_member"
    since_scene: "scene_01_prologue"
    sentiment: -0.8
epistemic:
  secrets_kept:
    - "Portador da Lâmina de Valdor"
  known_by:
    - "self"
    - "char_queen_morrigan" # Apenas ela sabe a partir do Capítulo 2
---
```

---

## 4. Contrato do Servidor MCP Hub v2 (`@inkgraph/mcp`)

O pacote `@inkgraph/mcp` expõe ferramentas, recursos e prompts sobre transporte dual (`stdio` e HTTP `/mcp` com SSE `/subscriptions/listen`, endpoints `/sync/manifest` e `/sync/push` e autenticação Bearer opcional):

### Ferramentas (`tools/call`)
1. **`list_entities(filter)`**: Lista e filtra itens de lore por `type`, `tag` ou `status`.
2. **`get_entity(id_or_alias)`**: Resolve qualquer alias, título ou ID para o dossiê completo.
3. **`search_lore(query, mode, limit)`**: Busca textual completa (FTS5) ou exata no cânone e manuscritos.
4. **`query_epistemic_state(entity_id, scene_id)`**: Inspeciona o que uma entidade sabe ou quais segredos estão retidos em determinado ponto da narrativa.
5. **`get_timeline(from_scene, to_scene)`**: Retorna sequência causal, localização de personagens e transições de vínculos.
6. **`propose_lore(markdown_content, rationale, filename)`**: Cria um rascunho em `./workspace/staging/` sem contaminar o cânone.
7. **`propose_scene(outline_ref, scene_data, title, scene_id, rationale)`**: Gera proposta de cena em `./workspace/staging/` respeitando a continuidade.
8. **`get_relationships()`**: Retorna o grafo de relacionamentos entre entidades (alianças, hostilidades, sentimentos).
9. **`resume_work()`**: Retorna um briefing instantâneo do estúdio (cenas, staging pendente, erros de parse e histórico de undo ativo).
10. **`read_manuscript(scene_id, cursor, max_words)`**: Lê cenas do manuscrito com paginação por palavras para respeitar limites de contexto.
11. **`get_scene_context(scene_id, pov_entity_id)`**: Retorna prosa da cena, POV e briefing epistêmico filtrado (`known` vs `withheld`).
12. **`propose_prose_edit(scene_id, expected_version, proposed_content, rationale, client_name, dry_run)`**: Edita rascunho ou envia para staging com trava otimista de versão e suporte a `dry_run`.
13. **`undo_change_set(undo_id)`**: Reverte uma edição direta recente em até 24 horas pelo `undo_id`.
14. **`upsert_beat(scene_id, beat_id, body, kind, entity_id, secret)`**: Insere ou atualiza diretivas em linha `::beat{...}` ou `::epistemic-reveal{...}` em rascunhos staged.

### Recursos (`resources/read`) e Prompts (`prompts/get`)
- **Recursos:** `inkgraph://books`, `inkgraph://lore/<id>`, `inkgraph://scene/<id>`, `inkgraph://epistemic/<scene_id>`.
- **Prompts:** `resume`, `draft-scene`, `audit-epistemic`, `canon-check`.

---

## 5. Gate de Desenvolvimento e Verificação de Qualidade

Antes de concluir qualquer alteração relevante:
- Executar checagem de tipos em todos os pacotes: `corepack pnpm --filter @inkgraph/<pacote> typecheck`
- Executar builds topológicos (`domain` -> `capabilities` -> `ai` -> `core` -> `mcp` -> `ui`)
- Executar todas as suítes de testes automatizados (`vitest run` em todos os pacotes)
- Verificar integridade do `.gitignore`: confirmar que `./workspace/` e bancos locais não estão rastreados no Git.
