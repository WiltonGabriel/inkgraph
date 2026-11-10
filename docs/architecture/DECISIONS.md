# Decisões Arquiteturais: InkGraph (ADR 001)

Este documento estabelece formalmente a arquitetura definitiva do **InkGraph**, sintetizando as melhores soluções encontradas nos projetos de referência (**Codex Suite** e **WorldScript Studio**) e adaptando-as às nossas metas de desempenho, privacidade absoluta e integração nativa com o Google Antigravity e Google AI Studio.

---

## 1. Visão Geral Comparativa

| Critério / Capacidade | Codex Suite (`codexsuite/codex`) | WorldScript Studio (`qnbs/WorldScript-Studio`) | **InkGraph (Nossa Solução)** |
| :--- | :--- | :--- | :--- |
| **Arquitetura Base** | Monólito C# (.NET 10) + React SPA + PostgreSQL | PWA (React) + Tauri v2 (Rust) + IndexedDB | **Tauri v2 (Rust) + TypeScript/Bun Core + SQLite Indexado** |
| **Single Source of Truth** | Banco de dados relacional PostgreSQL | IndexedDB local do navegador | **Markdown puro + YAML Frontmatter em `./workspace/`** |
| **Integração com IA** | Servidor MCP nativo completo (`stdio` e HTTP `/mcp`) | Prompts locais + RAG no frontend + BYOK API | **Híbrido: Servidor MCP Nativo (Antigravity) + Google AI Studio Inline (Gemini SDK)** |
| **Worldbuilding & Dossiers** | Knowledge Base com aliases e links | Dossiês psicológicos profundos, entrevistas com IA | **Dossiês Vivos + Sistema de Aliases Automáticos** |
| **Narrativa & Linha do Tempo** | Linha do tempo por entidade e atos | Grafo causal de cenas, curva de tensão e subplots | **Grafo Causal de Cenas + Curva de Tensão + Ledger Epistêmico ("Quem Sabe o Quê")** |
| **Proteção de Cânone** | Staging / rascunhos pendentes antes de aprovação | Salva diretamente no projeto | **Staging Gatekeeper: IA só propõe em `./workspace/staging/`; autor aprova na UI** |
| **Multiplataforma** | Web SPA / Docker / Expo Mobile | Tauri v2 Desktop + PWA | **Tauri v2 Nativo (Linux/Wayland) + PWA Responsivo para Celular (Sync local/Tailscale)** |
| **Mapas e Mídias** | Gestão de blobs simples | Referências visuais | **Mapas Interativos Vetoriais (SVG/Leaflet) gerados/marcados via IA + Portfólio de Ativos** |

---

## 2. A Arquitetura do InkGraph em Detalhes

### A. Camada de Persistência (Markdown-First + SQLite Reativo)
- **Cofre `./workspace/`:** Todo conteúdo do autor vive em texto puro legível por humanos.
  - Se qualquer banco de dados for corrompido ou apagado, o banco SQLite é 100% reconstruído a frio em menos de 1 segundo a partir dos arquivos `.md`.
  - Zero lock-in de software: se você abrir o VSCode, Neovim ou Obsidian, os arquivos estão perfeitamente formatados.
- **SQLite + FTS5 em Tempo Real:**
  - O motor observa (`fs watcher`) as pastas de `./workspace/`. Quando um arquivo é alterado, o SQLite atualiza as tabelas de entidades, arestas de relacionamento e termos de busca textual rápida (FTS5).

### B. O Motor MCP e IA Dupla
1. **Google Antigravity (Nível Arquiteto e Mestre de Lore):**
   - Conectado via protocolo oficial MCP (`packages/mcp`).
   - O Antigravity ganha ferramentas cirúrgicas para investigar seu mundo sem alucinar:
     - `get_entity(alias_ou_id)`: Resolve títulos, apelidos e variações.
     - `query_epistemic_state(cena_id, personagem_id)`: Impede que o personagem use conhecimento que ele só vai descobrir no futuro.
     - `propose_scene(...)`: Escreve rascunhos diretamente na pasta `./workspace/staging/`.
2. **Google AI Studio / Gemini API (Nível Operacional Inline):**
   - Embutido direto na interface visual para comandos rápidos sem sair do aplicativo.
   - Suporte a modelos de janela ultra-longa (Gemini Flash com 1 milhão de tokens) para auditar coerência de manuscritos inteiros.

### C. Visualizações Conectadas aos Dados (Zero Diagramas Estáticos)
- **Árvores Genealógicas e Hierarquias:** Calculadas via layout DAG a partir dos campos `parent_of` / `member_of` dos arquivos `.md`.
- **Matriz de Alianças e Fricção:** Grafo dinâmico de nós e arestas com cores por sentimento (aliança verde, hostilidade vermelha, segredo roxo).
- **Curva de Tensão Narrativa:** Gráfico de linha temporal acompanhando os picos de ação, revelações e respiros entre cenas e subplots.
- **Mapas do Mundo:** Suporte a arquivos SVG ou mapas base Leaflet com marcadores ancorados nas entidades de localização do lore.
