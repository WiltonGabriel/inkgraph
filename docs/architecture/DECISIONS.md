# Decisões Arquiteturais: InkGraph (ADR 001)

Este documento estabelece a arquitetura do **InkGraph**, voltada para desempenho local, privacidade do cofre do autor e integração nativa via protocolo MCP.

---

## 1. Diretrizes Arquiteturais

| Critério / Capacidade | Decisão Técnica no InkGraph |
| :--- | :--- |
| **Arquitetura Base** | Monorepo TypeScript (`pnpm`) + Core SQLite/FTS5 + React/Vite UI + Wrapper Tauri v2 |
| **Fonte Única da Verdade** | Arquivos Markdown puros com YAML Frontmatter em `./workspace/` |
| **Integração com Agentes** | Servidor MCP nativo (`@inkgraph/mcp`) via `stdio` + suporte a provedores locais (Ollama) e nuvem |
| **Universo & Dossiês** | Dossiês completos para Personagens, Facções, Locais, Sistemas de Regras e Objetos com aliases indexados |
| **Narrativa & Linha do Tempo** | Quadro de cenas (Atos, Tela 2D e Linha do Tempo), curva de tensão e rastreamento epistêmico |
| **Proteção de Cânone** | Propostas provisórias gravadas exclusivamente em `./workspace/staging/` até aprovação humana |

---

## 2. Camadas do Sistema

### A. Persistência (Markdown-First + Projeção SQLite Reativa)
- **Cofre `./workspace/`:** Todo conteúdo do autor permanece em texto puro legível por humanos e ignorado pelo Git.
- **SQLite + FTS5 Derivado (`@inkgraph/core`):**
  - Se o banco SQLite for apagado, ele é reconstruído integralmente a partir dos arquivos `.md` de `./workspace/`.
  - Suporta resolução de apelidos/títulos com detecção de ambiguidade (`ambiguous`), busca textual FTS5 sanitizada e consultas de estado epistêmico.

### B. Servidor MCP e Ferramentas de Contexto (`@inkgraph/mcp`)
O pacote `@inkgraph/mcp` expõe 7 ferramentas fundamentais com códigos de erro padronizados (`not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation`, `unauthorized`):
1. `list_entities(filter)`: Lista e filtra entidades por categoria, status ou tag.
2. `get_entity(id_or_alias)`: Resolve qualquer ID ou alias para o dossiê completo.
3. `search_lore(query, mode)`: Executa busca textual FTS5 ou exata no cânone.
4. `query_epistemic_state(entity_id, scene_id)`: Inspeciona segredos guardados e conhecimentos compartilhados até determinado ponto.
5. `get_timeline(from_scene, to_scene)`: Retorna eventos cronológicos e transições de vínculos.
6. `propose_lore(...)`: Grava propostas de entidades em `./workspace/staging/` com proteção contra *path traversal*.
7. `propose_scene(...)`: Grava rascunhos de cenas em `./workspace/staging/`.

### C. Estúdio Visual Modular (`@inkgraph/ui`)
- **Meu Espaço (Home):** Gerenciador de catálogo multi-workspace com filtros, busca, favoritos, métricas globais e criação rápida.
- **Configurações do Programa:** Preferências globais da aplicação (idioma `pt-BR`/`en`, temas, densidade de interface, tipografia do editor, atalhos de teclado, IA/MCP e backup do catálogo) desacopladas de cada workspace.
- **Princípio da Responsabilidade Única (SRP):** Calculadores de domínio puros em `src/domain/`, sementes isoladas em `src/data/`, componentes granulares por contexto em `src/components/` e orquestradores enxutos em `src/views/`.
