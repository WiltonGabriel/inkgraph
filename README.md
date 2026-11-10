# InkGraph

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](https://pnpm.io/)
[![MCP Ready](https://img.shields.io/badge/MCP-Protocolo%20Nativo-emerald.svg)](https://modelcontextprotocol.io/)

O **InkGraph** é um estúdio literário *local-first*, motor de construção de mundos (*worldbuilding*) e gerenciador de lore epistêmica, projetado desde a base como uma plataforma de conhecimento estruturado e um servidor nativo do **Model Context Protocol (MCP)** para agentes de IA e desenvolvedores.

Ele une a filosofia *Markdown-first* com um índice efêmero em SQLite/FTS5, grafo de física de relações multicamada, dossiês completos de personagens e facções, quadro de cenas (Board 2D, Atos e Linha do Tempo), análise de curvas de tensão e separação estrita entre o cânone do autor e as propostas da IA via Staging.

---

## Sumário

- [O que o InkGraph faz](#o-que-o-inkgraph-faz)
- [Por que o InkGraph](#por-que-o-inkgraph)
- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Como Começar](#como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Executando o Estúdio Web](#executando-o-estúdio-web)
  - [Executando o Servidor MCP](#executando-o-servidor-mcp)
  - [Testes Automatizados e Tipagem](#testes-automatizados-e-tipagem)
- [Estrutura do Cofre e Contrato de Dados](#estrutura-do-cofre-e-contrato-de-dados)
- [Ferramentas do Servidor MCP Nativo](#ferramentas-do-servidor-mcp-nativo)
- [Documentação e Suporte](#documentação-e-suporte)
- [Contribuição e Manutenção](#contribuição-e-manutenção)

---

## O que o InkGraph faz

O InkGraph oferece um ambiente de trabalho completo, sem ruídos e focado na criação literária:

- **Meu Espaço (Home):** Catálogo multi-workspace para gerenciar múltiplos livros e universos. Suporta filtros (todos, favoritos, recentes, arquivados), criação rápida com modelos narrativos clássicos, backup/exportação em JSON e telemetria global.
- **Grafo de Relações Multicamada:** Visualização interativa com filtros de camadas isoladas (Apenas Personagens, Apenas Facções, Apenas Locais, Apenas Objetos ou Visão Completa) e inspetor lateral com editor de formulação de entidades e criação de vínculos.
- **Quadro de Cenas v2:** Planejamento flexível em raias de Três Atos, tela 2D livre com conexões visuais e minimapa, e visualização em linha do tempo com curvas de tensão dramática.
- **Manuscrito e Fichário de Pesquisa:** Painel dividido que combina o editor de capítulos com um fichário de notas, árvore de cenas e inspetor contextual.
- **Universo & Facções de Primeira Classe:** Dossiês com anéis de completude para personagens, facções e ordens, locais, sistemas de regras (magia, tecnologia, códigos legais), objetos de história e entrevistas com personagens.
- **Rastreamento Epistêmico e Auditoria de Consistência:** Controle fino sobre segredos e conhecimento: o que o autor sabe, o que o leitor descobriu até o ponto $X$, e quais segredos o personagem $A$ conhece versus o personagem $B$.
- **Pipeline de Staging e Canonização:** Ferramentas de IA gravam rascunhos em `./workspace/staging/` com diff visual, permitindo ao autor aprovar ou rejeitar alterações antes de contaminar o cânone.
- **Configurações Gerais do Programa:** Painel desacoplado do workspace para controle de idioma (`pt-BR` e `en`), atalhos de teclado, tipografia do editor, tema e conexão com modelos de IA locais (Ollama) ou em nuvem.

---

## Por que o InkGraph

1. **Local-First com Markdown Autoritativo:**
   O cofre privado do usuário (`./workspace/`) é a fonte única da verdade. Todas as entidades e cenas são arquivos Markdown com frontmatter YAML padrão. O banco SQLite é derivado e pode ser 100% reconstruído a partir dos arquivos.
2. **Filosofia do Design Silencioso:**
   Sem slogans promocionais, banners de marketing ou créditos desnecessários na interface. Termos funcionais, silenciosos e diretos.
3. **Separação Cânone vs. Rascunhos:**
   O cânone do autor (`workspace/lore/`, `workspace/manuscript/`) nunca é sobrescrito automaticamente por IA sem revisão humana prévia.
4. **Nativo para Agentes via MCP:**
   Assistentes inteligentes interagem com o projeto diretamente através do protocolo MCP (`search_lore`, `get_entity`, `query_epistemic_state`, `propose_lore`, `propose_scene`).
5. **Clean Architecture e Responsabilidade Única (SRP):**
   Monorepo modular sem arquivos monolíticos. Calculadores puros desacoplados da interface e componentes enxutos.

---

## Visão Geral da Arquitetura

O InkGraph é estruturado como um monorepo via pnpm:

```text
inkgraph/
├── packages/
│   ├── core/         # Parser de frontmatter, schemas Zod, indexador SQLite FTS5 e grafo temporal
│   ├── mcp/          # Servidor Model Context Protocol (MCP) para agentes de IA
│   ├── ui/           # Estúdio visual em React + Vite
│   └── desktop/      # Wrapper desktop nativo em Tauri v2 (Rust)
├── workspace/        # [Ignorado no Git] Cofre privado local do autor
└── docs/             # Documentação pública e registros de decisões de arquitetura
```

---

## Como Começar

### Pré-requisitos

- **Node.js**: v18.0.0 ou superior (v20+ recomendado)
- **pnpm**: v9.0.0 ou superior

### Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/WiltonGabriel/inkgraph.git
cd inkgraph
pnpm install
```

### Executando o Estúdio Web

Inicie a interface visual:

```bash
pnpm dev
```

O estúdio estará disponível em `http://localhost:5173`.

### Executando o Servidor MCP

Inicie o servidor MCP via stdio:

```bash
pnpm mcp
```

Para conectar assistentes externos (como Google Antigravity ou Claude Desktop), configure o executável:

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

Para validar a integridade do código:

```bash
# Checagem de tipos TypeScript
pnpm typecheck

# Execução da suíte de testes unitários
pnpm test

# Build de produção de todos os pacotes
pnpm build
```

---

## Estrutura do Cofre e Contrato de Dados

Os arquivos do usuário ficam armazenados em `./workspace/` (estritamente ignorados pelo Git):

- `workspace/lore/`: Dossiês de personagens, facções, locais, objetos e sistemas de regras.
- `workspace/manuscript/`: Capítulos e cenas estruturadas do manuscrito.
- `workspace/staging/`: Propostas provisórias e rascunhos aguardando aprovação do autor.
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

## Ferramentas do Servidor MCP Nativo

O pacote `@inkgraph/mcp` fornece as ferramentas oficiais de contexto para IA:

| Ferramenta | Descrição |
| :--- | :--- |
| `list_entities` | Lista e filtra itens de lore por tipo, tag ou status. |
| `get_entity` | Resolve qualquer ID ou alias para o dossiê completo. |
| `search_lore` | Busca textual completa (FTS5) no cânone, notas e manuscritos. |
| `query_epistemic_state` | Consulta o que uma entidade sabe ou quais segredos guarda em determinado ponto da história. |
| `get_timeline` | Retorna a sequência cronológica, valores de tensão e localização de personagens. |
| `propose_lore` | Cria rascunhos provisórios em `workspace/staging/` sem afetar o cânone. |
| `propose_scene` | Propõe novas cenas em `workspace/staging/` respeitando as regras de continuidade. |

---

## Documentação e Suporte

- **Decisões de Arquitetura:** Consulte [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md) para detalhes técnicos de arquitetura e decisões de projeto.
- **Problemas e Sugestões:** Utilize o rastreador de *Issues* do repositório para reportar falhas ou sugerir funcionalidades.

---

## Contribuição e Manutenção

O InkGraph é distribuído sob a Licença MIT. Contribuições que sigam a privacidade local, a arquitetura limpa (SRP) e a filosofia de design silencioso são bem-vindas.

1. Crie um branch para sua funcionalidade (`git checkout -b feature/minha-feature`).
2. Garanta que os testes e tipagem passem sem erros (`pnpm typecheck && pnpm test`).
3. Envie commits claros e semânticos.
4. Abra um Pull Request descrevendo as modificações.
