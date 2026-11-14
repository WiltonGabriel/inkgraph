# AGENTS.md — Constituição Operacional de Agentes e Regras de Arquitetura do InkGraph

`AGENTS.md` é a especificação operacional autoritativa para qualquer agente de IA, assistente de codificação ou desenvolvedor atuando na base de código do **InkGraph**. Siga todas as regras abaixo rigorosamente.

---

## 1. Missão Central e Filosofia

O **InkGraph** é um estúdio literário open-source *local-first*, motor de construção de mundos (*worldbuilding*) e gerenciador de lore epistêmica, projetado com um **motor de conhecimento estruturado e servidor nativo do Model Context Protocol (MCP)** para clientes compatíveis — funcionando 100% offline/sem nuvem quando o autor preferir escrever manualmente ou nos modos locais (`eco`, `local`).

### Princípios Fundamentais
1. **Filosofia do Design Silencioso e Minimalista (Regra Absoluta):**
   - **Zero Ruído / Zero Nomes Comerciais Externos:** Todo botão, aba e rótulo deve ser conciso, silencioso, funcional e estritamente focado no trabalho criativo. Nunca injete nomes comerciais proprietários externos, textos publicitários ou slogans em títulos, código ou cabeçalhos.
   - Utilize terminologia de domínio limpa e direta: "Painel", "Grafo", "Personagens", "Construção Mundial", "Linha do Tempo", "Manuscrito", "Radar de Cânone", "Revisão".
   - Créditos Open Source (MIT/ISC), como *CodeMirror 6* e a inspiração arquitetural de memória em camadas no projeto aberto *AI Memory* de Fabio Akita, ficam documentados na aba **Sobre** e na documentação técnica.
2. **Privacidade Local Absoluta (Fronteira do Cofre):**
   - `./workspace/` é o cofre privado do usuário contendo dados confidenciais do livro, manuscritos, dossiês de personagens, lore e arquivos enviados.
   - **NUNCA** comite, rastreie ou vaze qualquer arquivo ou diretório dentro de `./workspace/` para o Git ou repositórios remotos. O `.gitignore` e o CI bloqueiam estritamente `./workspace/`, bancos SQLite locais e arquivos `.env`.
3. **Markdown-First (Fonte Única da Verdade):**
   - A fonte autoritativa da verdade em disco para lore e manuscrito são arquivos Markdown padrão com frontmatter YAML em `./workspace/` (no estúdio Web, persistidos com *debounce* em `localStorage` + ativos gráficos em `IndexedDB` por trás de `storageAdapter.ts`).
   - O banco SQLite (`@inkgraph/core`) é uma **projeção e índice derivado em tempo real** (usando FTS5 e tabelas relacionais). Se o banco for removido ou corrompido, ele pode ser 100% reconstruído a partir de `./workspace/`.
4. **Separação Estrita de Cânone e Rastreamento Epistêmico:**
   - **Cânone (`workspace/lore/`, `workspace/manuscript/`):** Fatos e textos confirmados e aprovados pelo autor.
   - **Staging (`workspace/staging/` e `project.stagingProposals`):** Propostas da IA, capturas e rascunhos provisórios aguardando revisão humana com diff visual antes de tocar o cânone. No estúdio UI, edições diretas assistidas criam previamente um instantâneo automático de segurança.
   - **Rastreamento Epistêmico:** O sistema distingue o que o **Autor** sabe, o que o **Leitor** descobriu até a cena X e o que o **Personagem A** conhece versus o **Personagem B**.
5. **Leve e Multiplataforma (Web/PWA + Tauri v2, sem Electron):**
   - Estúdio Web responsivo e leve baseado em React + Vite + CodeMirror 6 (`@inkgraph/ui`) e scaffold nativo em **Tauri v2** (`@inkgraph/desktop`), sem empacotar Electron/Chromium.

---

## 2. Arquitetura e Estrutura do Monorepo

```text
inkgraph/
├── .github/                   # Workflows CI/CD, template de PR e templates de Issues
├── AGENTS.md                  # Esta constituição operacional
├── README.md                  # Documentação principal e guia de início rápido
├── CONTRIBUTING.md            # Diretrizes de contribuição e SRP
├── SECURITY.md                # Política de segurança e isolamento do cofre local
├── CODE_OF_CONDUCT.md         # Código de conduta da comunidade
├── package.json               # Scripts raiz do monorepo (pnpm -r)
├── pnpm-workspace.yaml        # Configuração do workspace (somente pnpm)
├── .gitignore                 # Isolamento estrito de ./workspace/, bancos, .agents/ e builds
│
├── workspace/                 # [IGNORADO NO GIT] Cofre privado local do autor
│   ├── uploads/               # Entradas brutas para indexação
│   ├── lore/                  # Arquivos canônicos de lore (personagens, facções, etc.)
│   ├── manuscript/            # Manuscrito estruturado (atos, capítulos, cenas)
│   ├── staging/               # Propostas da IA e diffs pendentes aguardando canonização
│   ├── timeline/              # Marcadores temporais e batidas de enredo
│   └── assets/                # Mapas, retratos e elementos gráficos
│
├── docs/                      # Documentação pública (USER_GUIDE.md + architecture/)
│   └── architecture/          # Registros de decisões arquiteturais (ADRs)
│
└── packages/                  # Pacotes modulares do monorepo
    ├── core/                  # Motor Node: parser Markdown/YAML, Zod, indexador SQLite/FTS5 e suíte Vitest
    ├── mcp/                   # Servidor MCP via stdio expondo ferramentas de leitura e staging
    ├── ui/                    # Estúdio visual em React + Vite + CodeMirror 6
    │   └── src/domain/        # Motores puros isomórficos (gitEngine, memoryCompiler, shortcutManager, etc.)
    └── desktop/               # Scaffold desktop nativo em Tauri v2 (Rust + Webview)
```

---

## 3. Regras Operacionais para Agentes de Código

### Regra 1: Gerenciador Padrão e Princípio da Responsabilidade Única (SRP)
- O gerenciador de pacotes padrão é o **pnpm** (ou `corepack pnpm`). Não utilize `npm` ou `yarn`.
- Prefira utilitários leves ou da biblioteca padrão antes de adicionar dependências externas.
- Nunca adicione Electron. Utilize Tauri v2 (`packages/desktop/`) para empacotamento desktop.
- **SRP Estrito e Granularidade de Arquivos:**
  - Cada arquivo, módulo e componente deve ter **uma única razão para mudar** e **uma única responsabilidade**.
  - **Nunca despeje uma funcionalidade inteira em um arquivo monolítico.** Mantenha motores puros e isomórficos (sem referências nuas a `window`/`document` para compatibilidade com testes Node no `@inkgraph/core`) em `packages/ui/src/domain/`, infraestrutura SQLite/parser em `@inkgraph/core`, protocolo MCP em `@inkgraph/mcp`, subcomponentes granulares em `packages/ui/src/components/<contexto>/` e orquestradores enxutos em `packages/ui/src/views/`.

### Regra 2: Operações de Arquivo Não Destrutivas
- Escritas de lore ou atualizações de manuscrito feitas por ferramentas de IA devem ir para `./workspace/staging/` por padrão (ou `project.stagingProposals` no estúdio Web) até revisão humana.
- Em fluxos diretos no rascunho pelo Copiloto, um snapshot automático prévio deve ser criado antes da alteração.
- Nunca utilize `window.confirm()` ou `window.alert()` na interface; utilize `requestConfirm` e `notify` via `ProjectContext`.

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

## 4. Contrato do Servidor MCP (`@inkgraph/mcp`)

O pacote `@inkgraph/mcp` expõe ferramentas sobre transporte `stdio` (`packages/mcp/src/toolDefinitions.ts`):

### Ferramentas Implementadas (`tools/call`)
1. **`list_entities(filter / type / status / tag)`**: Lista e filtra itens de lore por tipo, tag ou status.
2. **`get_entity(id_or_alias)`**: Resolve qualquer alias, nome exato ou ID para o dossiê completo.
3. **`search_lore(query, mode, limit)`**: Busca textual completa (`fts` via FTS5) ou exata (`exact`) no lore indexado.
4. **`query_epistemic_state(entity_id, scene_id)`**: Inspeciona o que uma entidade sabe ou quais segredos estão retidos em determinado ponto da narrativa.
5. **`get_timeline(from_scene, to_scene)`**: Retorna sequência causal, transições de relacionamentos e revelações entre cenas.
6. **`propose_lore(markdown_content, rationale, filename)`**: Cria um rascunho em `./workspace/staging/` com validação de path seguro (`resolveSafeStagingPath`) sem contaminar o cânone.
7. **`propose_scene(outline_ref, scene_data, title, scene_id, rationale)`**: Gera proposta de cena em `./workspace/staging/` respeitando a continuidade.
8. **`get_relationships()`**: Retorna o grafo de relacionamentos entre entidades (alianças, hostilidades, sentimentos).

---

## 5. Gate de Desenvolvimento e Verificação de Qualidade

Antes de concluir qualquer alteração relevante:
- Executar checagem de tipos em todos os pacotes: `pnpm typecheck` (ou `corepack pnpm -r run typecheck`)
- Executar builds em todos os pacotes: `pnpm build` (ou `corepack pnpm -r run build`)
- Executar todas as suítes de testes automatizados (`pnpm test`)
- Verificar integridade do `.gitignore`: confirmar via `git status --ignored -s` que `./workspace/` e bancos locais não estão rastreados no Git.
