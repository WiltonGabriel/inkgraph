# Guia do Usuário — InkGraph Studio

Este guia reúne o funcionamento prático da navegação, controle de versões, editor Markdown (CodeMirror 6), memória em 4 camadas e todos os **26 atalhos padrão** do InkGraph.

---

## 1. Navegação Inteligente & Cabeçalho

- **Meu Espaço (`Ctrl+Shift+H`):** gerencie múltiplos livros/workspaces, duplique projetos, aplique filtros ou importe/exporte JSON completo.
- **Breadcrumb Editável por Triplo Clique:**
  - A trilha no topo exibe sua localização exata sem repetir o título do aplicativo (ex.: `As Cinzas de Vael / Construção Mundial / Locais`).
  - Clique **3 vezes seguidas** sobre a trilha para convertê-la em um campo editável estilo pastas; digite o destino (ou escolha do autocompletar) e pressione `Enter` para saltar diretamente.
  - Em janelas estreitas, os segmentos intermediários recolhem automaticamente em `...` clicável para evitar quebra de layout.
- **Botão Salvar & Verificar (à direita da busca `Ctrl+K`):**
  - Pressione sempre que desejar gravação imediata sem esperar o *debounce*. O botão grava em `localStorage`/`IndexedDB`, relê o registro para validar integridade e confirma visualmente.
- **Barra Lateral em Acordeão:** clique no cabeçalho de qualquer grupo (*Planejamento*, *Personagens & Conexões*, *Mundo & Lore*, *Escrita & Revisão*) para recolher ou expandir suas opções.
- **Configurações Explícitas (`Ctrl+,`):** alterações feitas em *Geral*, *Aparência*, *Editor*, *IA & MCP*, *Atalhos* e *Avisos* ficam em rascunho até clicar em **Salvar Configurações** na barra persistente inferior (ou cancelar em **Descartar Alterações**).

---

## 2. Referência dos 26 Atalhos de Teclado Padrão

Todos os 26 atalhos abaixo podem ser editados, pesquisados e restaurados na aba **Configurações → Atalhos**, com detecção automática de conflitos.

### Navegação & Painéis
| Atalho Padrão | Ação |
| :--- | :--- |
| `Ctrl+K` | Paleta de Comandos Global |
| `Alt+B` | Recolher / Expandir Barra Lateral |
| `Ctrl+Shift+C` | Alternar Painel Copiloto |
| `Ctrl+Shift+Z` | Alternar Modo Zen |
| `Ctrl+Shift+H` | Abrir Meu Espaço (Início) |
| `Ctrl+,` | Configurações do Programa |
| `F1` | Ajuda & Documentação |

### Pulos Rápidos de Visão
| Atalho Padrão | Ação |
| :--- | :--- |
| `Alt+1` | Ir para Painel / Visão Geral |
| `Alt+2` | Ir para Contorno |
| `Alt+3` | Ir para Linha do Tempo |
| `Alt+4` | Ir para Quadro de Cenas |
| `Alt+5` | Ir para Radar de Cânone |
| `Alt+6` | Ir para Personagens |
| `Alt+7` | Ir para Grafo de Relações |
| `Alt+8` | Ir para Mapas Mentais |
| `Alt+9` | Ir para Construção Mundial |
| `Alt+F` | Ir para Facções |
| `Alt+O` | Ir para Objetos |
| `Alt+M` | Ir para o Manuscrito |
| `Alt+R` | Ir para Revisão / Consistência |

### Escrita & Editor Markdown
| Atalho Padrão | Ação |
| :--- | :--- |
| `Ctrl+E` | Alternar Modo do Editor (`Escrever` / `Dividido` / `Leitura`) |
| `Ctrl+Shift+I` | Alternar Inspetor da Cena |
| `Alt+N` | Criar Nova Cena Rápida |
| `Ctrl+Shift+S` | Criar Snapshot Rápido |

### Grafo, Mapa Mental & Cânone
| Atalho Padrão | Ação |
| :--- | :--- |
| `Alt+0` | Enquadrar Grafo / Mapa Mental |
| `Ctrl+Shift+R` | Escanear Cânone Agora |

---

## 3. Controle de Versões Local, Diff Visual & Staging

1. **Popover de Ramificação no Cabeçalho:** clique no nome do ramo ativo (ex.: `Principal`) no topo para trocar de ramo, criar uma nova linha alternativa ou gravar um snapshot rápido sem perder o contexto da tela.
2. **Estado Isolado por Ramo:** cada ramificação guarda um retrato independente de cenas, elenco, facções, mundos, objetos, contorno e conexões.
3. **Comparação & Merge Visual:** clique em **Comparar / Mesclar...** para inspecionar diffs linha a linha e palavra por palavra (adições em verde, remoções em vermelho) e decidir por cena entre **Manter Ramo Atual (Ours)** ou **Adotar Ramo Fonte (Theirs)**.
4. **Viagem no Tempo Segura:** ao restaurar qualquer snapshot anterior, o sistema cria antes um **Backup automático** do estado atual.
5. **Fila de Staging:** propostas geradas pelo Copiloto ou ferramentas externas aparecem em *Versões / Revisão* com diff completo antes de ingressarem no cânone.

---

## 4. Editor Markdown (CodeMirror 6)

- **3 Modos de Visualização:** *Escrever Markdown*, *Painel Dividido* (editor + prévia formatada lado a lado) e *Leitura Formatada*.
- **Autocomplete Contextual:**
  - `@` lista personagens do projeto
  - `#` lista locais cadastrados no mundo
  - `&` lista facções e ordens
  - `!` lista objetos e relíquias
  - `/` no início da linha abre atalhos rápidos (`/h1`, `/h2`, `/divisor`, `/epigrafe`, `/nota`, `/segredo`, `/comentario`, `/checklist`)
- **Blocos Especiais em Markdown:**
  - `***` — Divisor ornamental de cena
  - `> Epígrafe` — Bloco estilizado na leitura formatada
  - `- [ ] Tarefa` — Checklist interativo
  - `[!NOTA]` / `[!SEGREDO]` — Blocos destacados na prévia de leitura
  - `%% comentário do autor %%` — Visível apenas na edição/código-fonte, oculto automaticamente no modo de leitura
- **Localizar & Substituir:** `Ctrl+F` / `Ctrl+H` integrados nativamente via `@codemirror/search`, além de *Modo Foco* e *Máquina de Escrever*.

---

## 5. Memória em 4 Camadas & Controle Epistêmico

No painel lateral **Copiloto → Memória 4 Camadas**, você inspeciona em tempo real o contexto compilado pelo `memoryCompiler.ts`:

1. **Memória de Trabalho (Cena & POV):** cena ativa, ato, capítulo, POV, local e personagens presentes.
2. **Memória Episódica & Epistêmica:** segredos cadastrados, quem os conhece e alertas automáticos caso a prosa mencione algo desconhecido pelo POV atual.
3. **Memória Semântica (Mundo & Cânone):** locais, sistemas/leis, facções e objetos relevantes com status (`canon`, `provisional`, `draft`).
4. **Síntese Contínua & Voz (Procedural):** resumo das cenas anteriores na ordem de leitura, subtramas ativas e resumo de continuidade (`sessionHandoff`).

Quando o modo está em `local` ou `eco` (ou apenas heurística), nenhum dado é liberado para envio externo (`cloudAllowed = false`).

---

## 6. Construção Mundial em 10 Pilares, Atlas & Notas `1–10`

- **Layout Adaptativo:** em telas largas (`>= 960px`), os 10 pilares aparecem em barra lateral vertical recolhível ao lado do conteúdo; em janelas estreitas (`< 960px`), alternam automaticamente para pílulas horizontais roláveis com o respectivo escore `1–10`.
- **10 Pilares:** *Visão Geral*, *Geografia* (com miniatura do mapa principal), *Cultura*, *Política*, *Economia*, *História*, *Locais* (com coordenadas, rotas e planta local opcional em `IndexedDB`), *Atlas / Mapas*, *Sistemas & Leis* e *Linha do Tempo*.
- **Atlas Interativo:** faça upload de múltiplos mapas (`PNG`, `JPG`, `WebP`, `SVG`), marque um deles como *Principal*, filtre camadas temáticas (*Mundo*, *Geografia*, *Político*, *Rotas Comerciais*, *Sistemas*, *Planta Local*), posicione/arraste pinos de *Locais* (`0–100%`) e visualize rotas conectadas.
- **Notas de Maturidade `1–10`:** cada pilar e entidade recebe nota automática (`1–3` vermelho, `4–6` âmbar, `7–8` azul, `9–10` esmeralda) com checklist retrátil do que falta preencher para alcançar `10/10`.

---

## 7. Radar de Cânone (`Ctrl+Shift+R`), 3 Níveis de IA & Checagem Pré-Exportação

1. **Escanear Tudo Agora (`Ctrl+Shift+R`):** analisa cenas do manuscrito em busca de marcações inéditas (`@Personagem`, `#Local`, `&Facção`, `!Objeto`), nomes próprios compostos não catalogados, vínculos de cena ausentes e possíveis vazamentos epistêmicos.
2. **3 Níveis de Permissão da IA (editáveis direto no Radar ou em Configurações → IA & MCP):**
   - **Observador:** apenas destaca inconsistências e achados em modo leitura.
   - **Rascunho / Staging (Padrão):** converte descobertas em propostas YAML+Markdown dentro da fila de *Staging* para aprovação humana.
   - **Auto-Catalogar Universo:** cria fichas provisórias no elenco/mundo/objetos e restaura vínculos de metadados das cenas automaticamente, **sem nunca reescrever a prosa literária do autor**.
3. **Escopos Granulares:** ative ou pause separadamente os filtros de *Entidades & Elenco*, *Mundo & Construção Mundial* e *Grafo, Cronologia & Epistemologia*.
4. **Auditoria Pré-Exportação (`Exportar`):** exibe antes da compilação a nota geral `1–10` do projeto, total de cenas ainda em esboço/rascunho, propostas pendentes em *Staging* e alertas epistêmicos.
