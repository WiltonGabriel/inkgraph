# InkGraph

[![CI](https://github.com/WiltonGabriel/inkgraph/actions/workflows/ci.yml/badge.svg)](https://github.com/WiltonGabriel/inkgraph/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](https://pnpm.io/)
[![MCP Ready](https://img.shields.io/badge/MCP-Protocolo%20Nativo-emerald.svg)](https://modelcontextprotocol.io/)

O **InkGraph** é um estúdio literário open-source *local-first*, motor de construção de mundos (*worldbuilding*) e gerenciador de lore epistêmica — utilizável **100% offline/sem IA na nuvem** ou integrado via **Model Context Protocol (MCP)** em `stdio`.

Projetado sob a filosofia de **Design Silencioso** e **Responsabilidade Única (SRP)**, o projeto combina um estúdio visual em React com editor **CodeMirror 6 (MIT)**, controle de versões local por ramificações com diff visual linha/palavra, grafo de relações 2D, mapas mentais 360°, compilador de memória em 4 camadas e motor de indexação SQLite/FTS5 sobre cofres Markdown (`./workspace/`).

---

## Sumário

- [Recursos Implementados (Fases 1 a 4)](#recursos-implementados-fases-1-a-4)
- [Arquitetura do Monorepo](#arquitetura-do-monorepo)
- [Como Começar](#como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Executando o Estúdio Web](#executando-o-estúdio-web)
  - [Executando o Servidor MCP](#executando-o-servidor-mcp)
  - [Verificação de Tipos, Build e Testes](#verificação-de-tipos-build-e-testes)
- [Estrutura do Cofre e Frontmatter YAML](#estrutura-do-cofre-e-frontmatter-yaml)
- [Servidor MCP Nativo (`@inkgraph/mcp`)](#servidor-mcp-nativo-inkgraphmcp)
- [Documentação e Padrões do Repositório](#documentação-e-padrões-do-repositório)
- [Créditos e Licença](#créditos-e-licença)

---

## Recursos Implementados (Fases 1 a 4)

- **Meu Espaço & Cabeçalho Navegável:**
  - Catálogo multi-workspace com criação, duplicação, favoritos, arquivo e importação/exportação JSON.
  - **Breadcrumb com Triplo Clique:** clicar 3 vezes sobre a trilha (`InkGraph / ...`) abre edição direta de caminho estilo pastas com autocompletar e truncamento responsivo em telas estreitas.
  - **Botão Salvar & Verificar:** posicionado ao lado direito da pesquisa global (`Ctrl+K`), executa gravação imediata (`flush`), relê os dados no armazenamento local (`localStorage` / `IndexedDB`) e confirma a integridade visualmente.
- **Tematização Dual-Mode, 26 Atalhos & Configurações Explícitas:**
  - 6 paletas com suporte a **Claro | Escuro | Sépia**, fonte/escala/cantos da interface, barra lateral retrátil em acordeão e **SettingsSaveBar** confirmando alterações em todas as abas.
  - Central de **26 atalhos de teclado editáveis** em 4 categorias com gravação ao vivo e detecção de conflitos, além da aba **Sobre** com diagnóstico do armazenamento local e créditos Open Source.
- **Painel Vivo, Grafo 2D, Mapas Mentais 360° & Quadro de Cenas:**
  - Gráficos SVG interativos no Painel e no Rastreador de Progresso (hover rico com tooltip e clique direto para a cena/módulo correspondente) e Curva de Tensão interativa.
  - Grafo de Relações 2D (`d3-force` / `react-force-graph-2d`) com física calibrada, fixação de nós (`fx`/`fy`), foco de vizinhança de 1 salto (`computeOneHopNeighborhood`), duplo clique para o dossiê e inspetor lateral modular.
  - Mapas Mentais em SVG com pan livre 360°, zoom focado no cursor (`0.35x–2.5x`), curvas Bézier e criação de conexões no canvas; Quadro de Cenas em Três Atos, Tela 2D e Linha do Tempo.
- **Controle de Versões Local & Fila de Staging (`gitEngine.ts`):**
  - Popover direto no cabeçalho para alternar, criar ramificações e gravar instantâneos (*snapshots*) sem sair da tela atual.
  - Estado completo isolado por ramificação, diff determinístico LCS linha a linha e palavra por palavra (`computeLineDiff`, `computeWordDiff`), modal de mesclagem com resolução de conflitos (*Manter Ramo Atual* vs *Adotar Ramo Fonte*), Viagem no Tempo com backup automático pré-restauração e revisão visual em `StagingGatekeeperPanel`.
- **Estúdio Markdown CodeMirror 6 (`CodeMirrorEditorSurface.tsx`):**
  - 3 modos alternáveis (`Escrever Markdown`, `Painel Dividido`, `Leitura Formatada`), barra de formatação (`H1–H3`, negrito, itálico, epígrafe, checklist, divisor `***`, blocos `[!NOTA]`/`[!SEGREDO]`, comentários ocultos `%%...%%`).
  - Autocomplete contextual para `@Personagem`, `#Local`, `&Facção`, `!Objeto` e comandos `/`, localizar & substituir (`Ctrl+F`/`Ctrl+H`), modos *Máquina de Escrever*, *Foco* e *Zen*, leitura em voz alta (`speechSynthesis`) e inspetor lateral em PT-BR com checklist epistêmico.
- **Memória em 4 Camadas & Copiloto Epistêmico (`memoryCompiler.ts`):**
  - Compilação local de contexto em 4 camadas (*1. Memória de Trabalho*, *2. Memória Episódica & Epistêmica*, *3. Memória Semântica*, *4. Síntese Contínua & Voz*), respeitando orçamento de tokens, detectando possíveis vazamentos epistêmicos na cena ativa e mantendo o envio externo bloqueado nos modos `local` e `eco`.
  - Sugestões de prosa enviadas para **Staging** com diff visual ou aplicadas ao rascunho após criação automática de snapshot de segurança.
- **Construção Mundial em 10 Pilares Adaptativos & Atlas (`WorldbuildingStudioView.tsx`):**
  - 10 pilares completos (*Visão Geral*, *Geografia*, *Cultura*, *Política*, *Economia*, *História*, *Locais*, *Atlas / Mapas*, *Sistemas & Leis* e *Linha do Tempo*) com sub-barra lateral retrátil em telas largas (`>= 960px`) e pílulas horizontais roláveis em janelas estreitas (`< 960px`).
  - Upload múltiplo de mapas (`PNG`, `JPG`, `WebP`, `SVG`) e plantas locais armazenados em `IndexedDB` (`storageAdapter.ts`), filtro de camadas temáticas, pinos arrastáveis por porcentagem (`0–100%`) e rotas visuais conectando locais.
- **Notas Universais `1–10` (`canonScoreCalculator.ts`), Radar de Cânone (`canonRadarEngine.ts`) & Pré-Exportação:**
  - Escala universal de maturidade de `1` a `10` (`#ef4444` Esboço Inicial → `#f59e0b` Em Construção → `#3b82f6` Consistente → `#10b981` Cânone Maduro) com checklist acionável do que falta preencher em cada pilar e entidade.
  - Varredura ao vivo via **"Escanear Tudo Agora"** (`Ctrl+Shift+R`) detectando citações `@`/`#`/`&`/`!`, nomes compostos não catalogados, vínculos pendentes de cena e alertas epistêmicos, operando nos **3 níveis de permissão** (*Observador*, *Rascunho Staging* e *Auto-Catalogar Universo* sem reescrever a prosa) com escopos granulares.
  - Auditoria pré-exportação (`ExportPreflightCard.tsx`) resumindo cenas em rascunho, propostas em *Staging* e alertas epistêmicos antes da compilação. Acompanhe o detalhamento no [Guia do Usuário](docs/USER_GUIDE.md) e nos [Registros de Arquitetura](docs/architecture/DECISIONS.md).

---

## Arquitetura do Monorepo

```text
inkgraph/
├── .github/
│   ├── workflows/ci.yml       # Pipeline CI (isolamento de ./workspace/, typecheck, test, build)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/        # Templates padronizados de bug e melhoria
├── AGENTS.md                  # Constituição operacional de agentes e regras de arquitetura
├── CODE_OF_CONDUCT.md         # Código de conduta da comunidade (Contributor Covenant)
├── CONTRIBUTING.md            # Diretrizes de contribuição e SRP
├── LICENSE                    # Licença MIT
├── README.md                  # Documentação principal
├── SECURITY.md                # Política de segurança e proteção do cofre local
├── docs/
│   ├── STUDIO_TABS_REPORT.md  # Auditoria funcional, grau de uso e requisitos de todas as 22 abas
│   ├── USER_GUIDE.md          # Guia de uso, Markdown e referência dos 26 atalhos
│   └── architecture/
│       └── DECISIONS.md       # Registro de decisões arquiteturais (ADR 001)
├── packages/
│   ├── core/                  # Motor Node: parser Markdown/YAML, validação Zod e SQLite + FTS5
│   ├── mcp/                   # Servidor MCP via stdio conectado ao @inkgraph/core
│   ├── ui/                    # Estúdio visual React + Vite + CodeMirror 6 + motores puros em src/domain/
│   └── desktop/               # Scaffold desktop nativo em Tauri v2 (Rust + Webview, sem Electron)
└── workspace/                 # [IGNORADO NO GIT] Cofre privado local do autor
```

---

## Como Começar

### Pré-requisitos

- **Node.js**: v20.0.0 ou superior (v18+ suportado)
- **pnpm**: v9+ (ou `corepack pnpm`)
- **Opcional (Desktop Nativo):** Toolchain Rust (`rustup`) e dependências do Tauri v2 para `@inkgraph/desktop`

### Instalação

```bash
git clone https://github.com/WiltonGabriel/inkgraph.git
cd inkgraph
pnpm install
```

### Executando o Estúdio Web

```bash
pnpm dev
```

O servidor Vite inicia por padrão em `http://localhost:5173`.

### Executando o Servidor MCP

Compile primeiro `@inkgraph/core` e `@inkgraph/mcp` e inicie o servidor `stdio`:

```bash
pnpm --filter @inkgraph/core run build
pnpm --filter @inkgraph/mcp run build
pnpm mcp
```

Exemplo de configuração para clientes MCP locais via `stdio`:

```json
{
  "mcpServers": {
    "inkgraph": {
      "command": "node",
      "args": ["/caminho/absoluto/para/inkgraph/packages/mcp/dist/index.js"],
      "env": {
        "INKGRAPH_WORKSPACE": "/caminho/absoluto/para/inkgraph/workspace"
      }
    }
  }
}
```

### Verificação de Tipos, Build e Testes

```bash
# Verificação de tipos em todos os pacotes do workspace
pnpm typecheck

# Suíte de testes unitários e de integração (Vitest)
pnpm test

# Build completo em todos os pacotes
pnpm build
```

> Em ambientes sem `pnpm` diretamente no `PATH`, utilize `corepack pnpm <comando>` (ou `corepack.cmd pnpm` no Windows).

---

## Estrutura do Cofre e Frontmatter YAML

Todo dado criativo do usuário no disco reside em `./workspace/`, diretório **estritamente bloqueado no `.gitignore`**:

- `workspace/lore/` — Dossiês canônicos de personagens, facções, locais, objetos, conceitos, eventos e sistemas de regras.
- `workspace/manuscript/` — Capítulos e cenas do manuscrito.
- `workspace/staging/` — Propostas pendentes aguardando revisão e aprovação do autor.
- `workspace/timeline/` — Marcadores temporais e batidas narrativas.
- `workspace/assets/` — Mapas, retratos e ativos gráficos.

Exemplo de frontmatter YAML reconhecido por `@inkgraph/core`:

```yaml
---
id: "char_elias_vance"
type: "character" # character | faction | location | item | concept | event | rule_system
subtype: "militar"
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
    - "char_queen_morrigan"
---
Comandante exilado após o Cerco de Vael.
```

---

## Servidor MCP Nativo (`@inkgraph/mcp`)

O servidor MCP expõe 8 ferramentas via `stdio` sobre o índice SQLite FTS5 e o diretório de staging (`packages/mcp/src/toolDefinitions.ts`):

| Ferramenta | Descrição |
| :--- | :--- |
| `list_entities` | Lista e filtra entidades por `type`, `tag` ou `status` (`canon`, `provisional`, `draft`). |
| `get_entity` | Resolve qualquer ID, nome exato ou alias para o dossiê completo da entidade. |
| `search_lore` | Busca textual completa (`fts` via FTS5 ou `exact`) em descrições, histórico e tags. |
| `query_epistemic_state` | Inspeciona o que uma entidade sabe e quais segredos permanecem ocultos em dada cena. |
| `get_timeline` | Retorna sequência causal, transições de relacionamentos e revelações entre cenas. |
| `propose_lore` | Grava rascunho Markdown com frontmatter YAML dentro de `./workspace/staging/` sem alterar o cânone. |
| `propose_scene` | Cria proposta de cena em `./workspace/staging/` vinculada a uma referência de contorno. |
| `get_relationships` | Retorna as arestas do grafo de relacionamentos entre entidades. |

---

## Documentação e Padrões do Repositório

- **Relatório e Guia Funcional das 22 Abas do Estúdio:** [docs/STUDIO_TABS_REPORT.md](docs/STUDIO_TABS_REPORT.md)
- **Guia do Usuário & Atalhos:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **Decisões Arquiteturais (ADR 001):** [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md)
- **Constituição Operacional de Agentes:** [AGENTS.md](AGENTS.md)
- **Guia de Contribuição:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Política de Segurança:** [SECURITY.md](SECURITY.md)
- **Código de Conduta:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Shell Desktop Tauri v2:** [packages/desktop/README.md](packages/desktop/README.md)

---

## Créditos e Licença

O **InkGraph** é software livre distribuído sob a [Licença MIT](LICENSE).

- **Editor Markdown:** [CodeMirror 6](https://codemirror.net/) (Licença MIT)
- **Inspiração Arquitetural de Memória em Camadas:** projeto aberto *AI Memory* de Fabio Akita (MIT/Open Source)
- **Visualização & Interface:** React, Vite (`MIT`), Lucide Icons (`ISC`), D3 Force (`ISC`) e React Force Graph 2D (`MIT`)
