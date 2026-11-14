# InkGraph

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](https://pnpm.io/)
[![MCP Ready](https://img.shields.io/badge/MCP-Protocolo%20Nativo-emerald.svg)](https://modelcontextprotocol.io/)

O **InkGraph** é um estúdio literário *local-first* e multiplataforma (Web/PWA, Desktop via Tauri v2 e Mobile), motor de construção de mundos (*worldbuilding*) e gerenciador de lore epistêmica — utilizável **100% sem IA** ou integrado via **Model Context Protocol (MCP Hub v2)** e modelos locais/nuvem.

Ele une a filosofia *Markdown-first* com índice efêmero SQLite/FTS5, editor canônico dual-mode (TipTap ↔ CodeMirror 6), grafo de relações multicamada, quadro de cenas, auditoria híbrida de continuidade, sincronização P2P em rede local / Google Drive (`drive.file`), cofre cifrado `.inkpack` e compilação editorial 100% offline para EPUB 3, DOCX, PDF de corte e Lauda padrão.

---

## Sumário

- [O que o InkGraph faz](#o-que-o-inkgraph-faz)
- [Por que o InkGraph](#por-que-o-inkgraph)
- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Como Começar](#como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Executando o Estúdio Web / PWA](#executando-o-estúdio-web--pwa)
  - [Executando o Servidor MCP Hub v2 e LAN Sync](#executando-o-servidor-mcp-hub-v2-e-lan-sync)
  - [Testes Automatizados e Tipagem](#testes-automatizados-e-tipagem)
- [Estrutura do Cofre e Contrato de Dados](#estrutura-do-cofre-e-contrato-de-dados)
- [Servidor MCP Nativo (Ferramentas, Recursos e Prompts)](#servidor-mcp-nativo-ferramentas-recursos-e-prompts)
- [Documentação e Suporte](#documentação-e-suporte)
- [Contribuição e Manutenção](#contribuição-e-manutenção)

---

## O que o InkGraph faz

- **Meu Espaço & Busca Global:** Catálogo multi-workspace com suporte a séries/livros compartilhados (`promoteCharacterToSeriesSiblings`), busca global entre cenas, personagens, facções e mundos, cursor contínuo de leitura/edição ("Continuar de onde parou") e importação com pré-visualização (`.md`, `.docx`, `.json` e Novelcrafter `.zip`).
- **Editor Dual-Mode Canônico:** Alternância livre entre **Editor Rico (TipTap)** e **Código-Fonte Markdown (CodeMirror 6)** sem perda de dados, com menções `[Nome](kb:id)`, menu `/` (incluindo divisão de cenas), blocos colapsáveis `::beat{...}` e `::epistemic-reveal{...}`, ditado por voz (STT), leitura em voz alta (TTS) e integração opcional com LanguageTool em `localhost`.
- **Zero-IA por Padrão + Modos Flexíveis:** O InkGraph inicia em `aiMode: 'off'` (todos os painéis de IA ocultos). Quando desejado, suporta os modos `eco`, `local` (Ollama / LM Studio + recuperador BM25 offline, com bloqueio estrito de envio externo), `cloud` (chave BYOK) e `hybrid`.
- **Multi-Dispositivo & Backups Criptografados:** Funciona offline como PWA (IndexedDB/OPFS), sincroniza deltas Markdown por **LAN P2P** ou **Google Drive** (escopo restrito `drive.file`, sem enviar bancos SQLite e preservando conflitos em `staging/`), além de exportar pacotes `.inkpack` cifrados com `PBKDF2 (600.000 iterações) + AES-256-GCM` sem vazar chaves de API.
- **Grafo, Quadro de Cenas & Consistência:** Grafo de relações multicamada, quadro em Três Atos / Tela 2D / Linha do Tempo com curva de tensão interativa e duplo-clique direto na cena, 8 heurísticas determinísticas de continuidade, scanner *Auto-Codex* de nomes próprios e auditoria semântica opcional.
- **Publicação 100% Offline & Preflight Gate:** Exportação nativa sem servidores externos para **EPUB 3** (`.epub`), **Microsoft Word** (`.docx`), **PDF Editorial** (`.pdf` com cortes `6×9`, `5.5×8.5`, `A5` e Carta), **Lauda Padrão 60×30** (`.txt` com `\f`) e **Vault Markdown** (`.zip`), precedida por verificação de preflight.

---

## Por que o InkGraph

1. **Local-First com Markdown Autoritativo:**
   O cofre privado do usuário (`./workspace/`) é a fonte única da verdade em Markdown + YAML frontmatter. O banco SQLite (`@inkgraph/core`) é derivado e pode ser 100% reconstruído a partir dos arquivos.
2. **Design Silencioso e Profissional:**
   Sem anúncios, slogans promocionais ou geração falsa simulada. Menus concisos, alta legibilidade e tutorial guiado opcional em 4 passos (`PT-BR` e `EN`).
3. **Separação Cânone vs. Staging:**
   Propostas de IA e capturas rápidas entram em `./workspace/staging/` com diff palavra-a-palavra antes de tocar o cânone. Edições assistidas em modo `draft_copilot` exigem `expected_version` e oferecem reversão em 24h (`undo_change_set`).
4. **Arquitetura Modular (Clean Architecture / SRP):**
   Núcleo puro de domínio isomórfico desacoplado de banco, camada de IA, transporte MCP e interface React.

---

## Visão Geral da Arquitetura

```text
inkgraph/
├── packages/
│   ├── domain/        # Lógica pura (Browser + Node): parser YAML/MD, codecs dual-mode,
│   │                  # heurísticas narrativas, Auto-Codex, métricas e motor de sync delta
│   ├── capabilities/  # Briefing epistêmico por cena e governança de ChangeSets
│   ├── ai/            # Gateway de IA com IncarnationTracker, BM25 local e agente ProForge
│   ├── core/          # Motor Node: indexador SQLite FTS5, sync completo do cofre e watcher
│   ├── mcp/           # Servidor MCP Hub v2 (stdio + HTTP/SSE + LAN Sync + Bearer Token)
│   ├── ui/            # Estúdio visual PWA offline-first (React + Vite + TipTap + CodeMirror 6)
│   └── desktop/       # Scaffold desktop nativo em Tauri v2 (Rust + Webview)
├── workspace/         # [Ignorado no Git] Cofre privado local do autor
└── docs/              # Documentação técnica e decisões arquiteturais (ADRs)
```

---

## Como Começar

### Pré-requisitos

- **Node.js**: v18.0.0 ou superior (v20+ recomendado)
- **pnpm**: v9+ (ou `corepack pnpm`)
- **Opcional (Desktop Nativo):** Rust + Cargo (`rustup`) para compilar `@inkgraph/desktop` via Tauri v2

### Instalação

```bash
git clone https://github.com/WiltonGabriel/inkgraph.git
cd inkgraph
pnpm install
```

### Executando o Estúdio Web / PWA

```bash
pnpm dev
```

O estúdio inicia em `http://localhost:5173` com acesso liberado na rede local (`vite --host`) para testes em celular ou tablet.

### Executando o Servidor MCP Hub v2 e LAN Sync

Primeiro compile os pacotes base (`pnpm build`) e inicie o servidor MCP:

```bash
# Modo stdio (clientes locais como Antigravity / Claude Desktop / Codex)
pnpm mcp

# Modo HTTP Streamable + SSE + Sync LAN (opcional, via variáveis de ambiente)
INKGRAPH_MCP_HTTP_PORT=3333 INKGRAPH_MCP_TOKEN="seu-token" node packages/mcp/dist/index.js
```

Exemplo de configuração para clientes MCP via `stdio`:

```json
{
  "mcpServers": {
    "inkgraph": {
      "command": "node",
      "args": ["/caminho/para/inkgraph/packages/mcp/dist/index.js"],
      "env": {
        "INKGRAPH_WORKSPACE": "/caminho/para/inkgraph/workspace"
      }
    }
  }
}
```

### Testes Automatizados e Tipagem

Para validar todo o monorepo em ordem topológica:

```bash
# Build e verificação de tipos
pnpm build
pnpm typecheck

# Suíte completa de testes unitários e de integração (Vitest)
pnpm test
```

> No Windows sem `pnpm` direto no `PATH` filho, utilize `corepack.cmd pnpm` para os scripts por pacote (`corepack.cmd pnpm --filter @inkgraph/ui test`).

---

## Estrutura do Cofre e Contrato de Dados

Os arquivos do usuário ficam em `./workspace/` (estritamente ignorados pelo Git):

- `workspace/lore/`: Dossiês de personagens, facções, locais, objetos e sistemas de regras.
- `workspace/manuscript/`: Capítulos e cenas estruturadas (compatível com diretivas `::beat` e `::epistemic-reveal`).
- `workspace/staging/`: Propostas provisórias e capturas aguardando aprovação.
- `workspace/timeline/`: Marcadores temporais e batidas de enredo.
- `workspace/assets/`: Mapas, retratos e elementos gráficos.

Exemplo de frontmatter YAML padrão de uma entidade canônica:

```yaml
---
id: "char_elias_vance"
type: "character" # character | faction | location | item | concept | event | rule_system
subtype: "militar"
name: "Elias Vance"
aliases: ["O Corvo Cego", "Lorde Comandante"]
status: "canon" # canon | provisional | draft
tags: ["militar", "nobreza"]
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
    - "char_morrigan"
---
Comandante exilado após o Cerco de Vael.
```

---

## Servidor MCP Nativo (Ferramentas, Recursos e Prompts)

O pacote `@inkgraph/mcp` expõe:

| Ferramenta | Descrição |
| :--- | :--- |
| `list_entities` | Lista e filtra entidades por tipo, tag ou status (`canon`, `provisional`, `draft`). |
| `get_entity` | Resolve qualquer ID ou alias para o dossiê completo. |
| `search_lore` | Busca textual FTS5 ou exata no cânone, notas e manuscritos. |
| `query_epistemic_state` | Consulta o que uma entidade sabe ou quais segredos guarda em determinado ponto da história. |
| `get_timeline` | Retorna sequência causal, localização de personagens e transições de relacionamentos. |
| `get_relationships` | Retorna o grafo de vínculos entre entidades. |
| `propose_lore` | Cria rascunhos provisórios em `workspace/staging/` sem afetar o cânone. |
| `propose_scene` | Propõe novas cenas em `workspace/staging/` respeitando regras de continuidade. |
| `resume_work` | Gera briefing instantâneo do estúdio (cenas, staging pendente, erros e histórico de undo). |
| `read_manuscript` | Lê cenas com paginação por palavras (`cursor` e `max_words`). |
| `get_scene_context` | Retorna prosa da cena, POV e briefing epistêmico (`known` vs `withheld`). |
| `propose_prose_edit` | Edita rascunho ou propõe em staging usando `expected_version` e `dry_run`. |
| `undo_change_set` | Reverte uma edição direta recente dentro da janela de 24 horas. |
| `upsert_beat` | Insere ou atualiza diretivas `::beat` ou `::epistemic-reveal` em rascunhos staged. |

- **Recursos (`resources/read`):** `inkgraph://books`, `inkgraph://lore/<id>`, `inkgraph://scene/<id>` e `inkgraph://epistemic/<scene_id>`.
- **Prompts (`prompts/get`):** `resume`, `draft-scene`, `audit-epistemic` e `canon-check`.

---

## Documentação e Suporte

- **Constituição Operacional de Agentes:** [AGENTS.md](AGENTS.md)
- **Decisões de Arquitetura (ADR):** [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md)
- **Guia de Contribuição:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Shell Desktop Tauri v2:** [packages/desktop/README.md](packages/desktop/README.md)

---

## Contribuição e Manutenção

O InkGraph é distribuído sob a Licença MIT ([LICENSE](LICENSE)). Contribuições que preservem a privacidade local, a arquitetura limpa (SRP) e a filosofia de design silencioso são bem-vindas.

1. Crie uma branch para sua funcionalidade (`git checkout -b feature/minha-feature`).
2. Garanta que builds, tipagem e testes passem sem erros (`pnpm build && pnpm typecheck && pnpm test`).
3. Envie commits claros e semânticos.
4. Abra um Pull Request descrevendo as modificações.
