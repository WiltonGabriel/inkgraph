# Relatório de Auditoria UI/UX, Correções, Grau de Uso e Requisitos Operacionais por Aba

Este documento registra a auditoria completa de interface (UI), experiência de uso (UX), correções de bugs e análise funcional de **todas as 22 visões e painéis** do estúdio **InkGraph**, seguindo a **Filosofia do Design Silencioso e Minimalista** definida em [`AGENTS.md`](../AGENTS.md).

---

## 1. Resumo Executivo das Correções Estruturais e de Cabeçalho/Sidebar

| Componente / Área | O Que Foi Descoberto | O Que Foi Corrigido |
| :--- | :--- | :--- |
| **Cabeçalho — Botão `Meu Espaço`** (`Header.tsx`) | Exibia ícone + rótulo textual `"Meu Espaço"`, ocupando espaço horizontal desnecessário antes do breadcrumb. | Removido o texto; mantido **apenas o ícone** (`<LayoutGrid size={14} />`) com `title` e `aria-label` acessíveis. |
| **Cabeçalho — Botão de Salvar/Verificar** (`SaveVerifyButton.tsx`) | Exibia a palavra `"Salvo ✓"` / `"Verificando…"` ao lado da barra de pesquisa. | Removido o texto; mantido **apenas o ícone semântico** (`<CheckCircle2 />`, `<Loader2 />`, `<ShieldCheck />`, `<AlertTriangle />`) com animação de pulso/giro e tooltip detalhado no hover. |
| **Cabeçalho — Contador de Palavras** (`Header.tsx`) | Exibia a pílula `442 / 80.000 palavras` no canto superior direito, gerando ruído visual constante no topo. | Removido completamente do cabeçalho superior (as métricas já vivem no **Painel**, **Progresso** e rodapé opcional do **Manuscrito**). |
| **Cabeçalho — Duplicação `InkGraph`** (`BreadcrumbBar.tsx`) | O nome `InkGraph` aparecia duplicado tanto na Sidebar quanto no início do Breadcrumb (com botão de cópia redundante no cabeçalho). | Removido do cabeçalho/breadcrumb; o caminho agora inicia diretamente na seção ativa (`Planejamento / Painel`). |
| **Sidebar — Marca `INKGRAPH` acima de Planejamento** (`Sidebar.tsx`) | O título `INKGRAPH` acima de *Planejamento* era apenas texto estático sem ação de cópia rápida. | Transformado em botão interativo sutil: ao passar o mouse (`hover`), revela o ícone `<Copy />`; ao clicar, copia `"InkGraph"` para a área de transferência, exibe `<Check />` verde por `1,5s` e dispara notificação silenciosa. |
| **Gate Unificado de Conexão de IA** (`aiAvailability.ts` + `SubtleAiGatePopover.tsx`) | Na configuração padrão (`DEFAULT_SETTINGS`), nenhuma chave de API está conectada, mas botões de IA (como em **Facções**, **Personagens**, **Contorno** e **Estúdio de Redação**) executavam ações falsas ou inseriam textos fixos sem avisar que não havia IA conectada. Em **Facções**, clicar em `IA` criava `"Coalizão de <título do projeto>"` (ex.: `"Coalizão de As Cinzas de Vael (Cópia)"`), parecendo que estava copiando o nome do projeto. | Criado o verificador puro `checkAiAvailability(settings)` e o pop-up sutil `SubtleAiGatePopover`. Quando nenhuma IA está conectada, os botões de IA exibem borda tracejada discreta e, ao clicar, abrem um pop-up sutil (*"Nenhuma IA conectada"*) com atalho direto para `Configurações → IA & Servidor MCP`, sem jamais criar entidades copiadas/falsas. |
| **Padronização de Temas (Escuro, Claro e Sépia)** | Visões como `Facções`, `Personagens`, `Entrevistas`, `Estúdio de Redação` e `Objetos` ainda continham cores hexadecimais escuras fixas (`#0a0d14`, `#0e1118`, `#111622`, `#141926`). | Todas as cores fixas foram substituídas pelas variáveis CSS semânticas do motor de temas (`var(--bg-canvas)`, `var(--bg-surface)`, `var(--bg-elevated)`, `var(--border-subtle)`, `var(--text-primary)`, `var(--text-secondary)`). |

---

## 2. Matriz Resumo: Grau de Uso, Importância e Requisitos por Aba

| # | Aba / Visão | Grupo | Importância | Grau de Uso pelo Autor | O Que Precisa para Funcionar? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Painel** (`dashboard`) | Planejamento | **Alta** | Diário (abertura e fechamento de sessão) | **100% Offline / Local** (cálculo determinístico sobre cenas e logs) |
| 2 | **Gerador de Contorno** (`outline`) | Planejamento | **Muito Alta** | Intenso na estruturação; médio na revisão | **100% Offline** para edição e 22 modelos; **IA opcional** para geração generativa |
| 3 | **Quadro de Cenas** (`plotboard`) | Planejamento | **Muito Alta** | Frequente (organização de atos e subtramas) | **100% Offline / Local** (Kanban por atos + Tela 2D espacial) |
| 4 | **Linha do Tempo** (`timeline`) | Planejamento | **Alta** | Frequente (checagem causal e curva de tensão) | **100% Offline / Local** (sequenciamento cronológico e gráfico SVG) |
| 5 | **Cenário / Roteiro** (`scenario`) | Planejamento | **Média / Tática** | Consulta panorâmica (visão de bíblia da história) | **100% Offline / Local** (compilação viva do projeto em documento único) |
| 6 | **Radar de Cânone** (`canon-radar`) | Planejamento | **Muito Alta** | Frequente após escrever ou revisar capítulos | **100% Offline / Algorítmico Local** (scanner heurístico/epistêmico + Score 1–10) |
| 7 | **Personagens** (`characters`) | Personagens & Rede | **Essencial** | Diário / Constante durante toda a obra | **100% Offline** para dossiês, arcos e segredos; **IA opcional** no botão `+ IA` |
| 8 | **Entrevistas** (`interviews`) | Personagens & Rede | **Complementar** | Uso criativo pontual (desbloqueio de voz/psicologia) | **Híbrido**: funciona offline com voz heurística do dossiê; **IA conectada** expande respostas livres |
| 9 | **Grafo de Relações** (`graph`) | Personagens & Rede | **Alta** | Frequente em tramas com muitas alianças/intrigas | **100% Offline / Local** (motor físico 2D em HTML5 Canvas + foco 1-hop) |
| 10 | **Mapas Mentais** (`mindmap`) | Personagens & Rede | **Média / Tática** | Brainstorming livre no início de atos ou mistérios | **100% Offline / Local** (canvas SVG 360° livre com pan/zoom) |
| 11 | **Construção Mundial** (`worlds`) | Universo | **Essencial** | Constante (referência dos 10 pilares e Atlas) | **100% Offline / Local** (10 pilares + mapas em `IndexedDB` + Score 1–10) |
| 12 | **Facções** (`factions`) | Universo | **Alta** | Frequente em fantasia, sci-fi, thriller e política | **100% Offline** para doutrina, patentes e segredos; **IA opcional** no botão `+ IA` |
| 13 | **Objetos** (`objects`) | Universo | **Média** | Moderado (rastreamento de relíquias, armas, pistas) | **100% Offline / Local** (grupos coloridos + vínculo com portadores e cenas) |
| 14 | **Manuscrito** (`manuscript`) | Escrita | **Crítica (Núcleo)** | **Uso Contínuo (80%+ do tempo do escritor)** | **100% Offline / Local** (CodeMirror 6 Markdown, 3 modos + Inspetor Epistêmico) |
| 15 | **Estúdio de Redação** (`writer`) | Escrita | **Média / Opcional** | Uso focado em rascunho experimental e revisão ProForge | **Requer IA Conectada** para geração livre nas 9 ferramentas (ou usa molde heurístico local explícito) |
| 16 | **Consistência** (`consistency`) | Revisão & Publicação | **Alta** | Frequente na revisão de capítulos e segredos | **100% Offline / Algorítmico Local** (auditoria epistêmica cena a cena + co-ocorrência) |
| 17 | **Crítico Literário** (`critic`) | Revisão & Publicação | **Alta** | Uso ao finalizar cenas (ritmo, diálogo, Flesch) | **100% Offline / Algorítmico Local** (análise estatística de frases, diálogos e léxico sensorial) |
| 18 | **Visualização do Livro** (`preview`) | Revisão & Publicação | **Alta** | Leitura de prova ao fechar capítulos ou atos | **100% Offline / Local** (leitor tipográfico paginado e contínuo) |
| 19 | **Progresso / Programação** (`progress`) | Revisão & Publicação | **Média / Alta** | Diário para autores orientados a metas e prazos | **100% Offline / Local** (cronômetro de sessão, anéis de meta e heatmap de 140 dias) |
| 20 | **Versões & Staging** (`versions`) | Revisão & Publicação | **Muito Alta** | Constante ao criar snapshots, ramos ou aprovar IA | **100% Offline / Local** (`gitEngine` local + fila de aprovação `StagingProposal`) |
| 21 | **Exportar** (`export`) | Revisão & Publicação | **Essencial no Fechamento** | Ao compartilhar, fazer backup ou compilar o livro | **100% Offline / Local** (compilador `.md`, `.txt`, lauda 60×30, `.html`, `.json`) |
| 22 | **Configurações & Ajuda** (`settings`/`help`) | Sistema | **Essencial (Suporte)** | Configuração de temas, atalhos, IA/MCP e consulta | **100% Offline / Local** (persistência em `localStorage` + teste de conexão IA) |

---

## 3. Análise Detalhada Aba por Aba

### 3.1. Grupo Planejamento

#### 1. Painel (`dashboard` — `DashboardView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Gráficos SVG interativos (distribuição de cenas por status, curva de velocidade de escrita e termômetro de tensão por capítulo) verificados com animações suaves, tooltips no hover e seleção clicável que filtra/destaca os dados.
  - Atalhos rápidos no cabeçalho do painel levam diretamente ao *Manuscrito* e ao *Estúdio de Redação*.
- **Importância e Grau de Uso**: **Alta (Uso Diário)**. É o centro de comando ao abrir o projeto: mostra imediatamente o progresso da meta de palavras, o estado de maturação do universo e onde o autor parou.
- **O que é preciso para funcionar**: **100% Offline e Local**. Todos os indicadores e gráficos são calculados em tempo real a partir das cenas, personagens e registros de escrita (`writingLogs`) do projeto.

#### 2. Gerador de Contorno (`outline` — `OutlineGeneratorView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug/UX corrigido**: O botão `"Gerar Esboço Estruturado"` tinha ícone de IA (`Sparkles`) e sobrescrevia o contorno com títulos fixos sem avisar que não havia IA conectada. Agora o botão `"Gerar Esboço com IA"` verifica `checkAiAvailability(settings)`: quando desconectado, abre o `SubtleAiGatePopover` oferecendo **"Configurar IA"** ou a ação explícita **"Usar Molde Local (Offline)"**.
  - O catálogo de **22 Modelos Narrativos** (`OutlineTemplateModal`) possui confirmação não-destrutiva antes de substituir um contorno existente.
- **Importância e Grau de Uso**: **Muito Alta**. Fundamental no início do livro e nas viradas de ato para estruturar capítulos, marcar *Plot Twists* e sincronizar a espinha dorsal com o *Manuscrito*.
- **O que é preciso para funcionar**: **100% Offline** para criar/reordenar seções manualmente, aplicar qualquer um dos 22 modelos clássicos (Jornada do Herói, Kishōtenketsu, Save the Cat, Mistério, etc.) e sincronizar com o manuscrito. **IA Conectada (Opcional)** apenas se o autor quiser geração generativa a partir de um prompt livre.

#### 3. Quadro de Cenas (`plotboard` — `PlotBoardView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados os 3 modos integrados (`Quadro` em raias por Ato I/II/III, `Tela` espacial 2D com conexões causais e `Linha do Tempo`) e a barra superior de filtragem por **Subtramas** (`SubplotManagerBar`), além da curva de tensão inferior.
- **Importância e Grau de Uso**: **Muito Alta**. Essencial para escritores visuais que precisam enxergar o equilíbrio entre Ato I, Ato II e Ato III e rastrear subtramas paralelas.
- **O que é preciso para funcionar**: **100% Offline e Local**. Não depende de IA em nenhum momento.

#### 4. Linha do Tempo (`timeline` — `PlotBoardView.tsx` [modo `timeline`])
- **O que foi inspecionado e arrumado**:
  - Verificada a sequência cronológica numerada de cenas com indicadores de POV, localização, duração temporal e tensão dramática, permitindo clicar em qualquer batida para abrir a cena correspondente.
- **Importância e Grau de Uso**: **Alta**. Muito utilizada em romances com múltiplos pontos de vista (POVs) ou eventos simultâneos para evitar anacronismos.
- **O que é preciso para funcionar**: **100% Offline e Local**. Baseia-se nos metadados das cenas (`chapterNumber`, `act`, `sceneDuration`, `tension`).

#### 5. Cenário / Roteiro (`scenario` — `ScenarioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Documento mestre canônico consolidando título, *logline*, estatísticas, elenco completo, facções, mundos, esboço estrutural e todas as cenas clicáveis (clicar em uma cena abre diretamente o editor no *Manuscrito*).
- **Importância e Grau de Uso**: **Média / Tática**. Funciona como a "Bíblia da Série / Documento de Pitch" para leitura corrida de toda a arquitetura da obra em uma única página limpa.
- **O que é preciso para funcionar**: **100% Offline e Local**. Compilação reativa instantânea dos dados já cadastrados no cofre.

#### 6. Radar de Cânone (`canon-radar` — `CanonRadarView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados o **Score de Cânone `1–10`** (Personagens, Mundo, Locais, Facções, Objetos, Grafo & Cronologia), os **3 modos de permissão** (`Apenas Observador`, `Propor no Staging`, `Auto-Catalogar no Universo`), os checkboxes de escopo e a lista de achados com envio em lote para Staging ou auto-catalogação segura (que jamais altera a prosa em `scene.content`).
- **Importância e Grau de Uso**: **Muito Alta**. É um dos maiores diferenciais do InkGraph: detecta personagens/locais/objetos citados no texto que ainda não têm ficha na lore e alerta sobre vazamentos epistêmicos.
- **O que é preciso para funcionar**: **100% Offline / Motor Algorítmico Local (`canonRadarEngine.ts` + `canonScoreCalculator.ts`)**. A varredura textual e epistêmica roda localmente de forma determinística e instantânea; quando o servidor MCP ou uma IA externa é conectada, ela respeita rigorosamente a permissão definida nesta aba.

---

### 3.2. Grupo Personagens & Rede

#### 7. Personagens (`characters` — `CharacterStudioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug/UX corrigido**: O botão `+ IA` na barra lateral abria um modal que gerava um personagem com texto estático mesmo sem IA conectada, além de usar cores hexadecimais escuras fixas. Agora o botão `IA` verifica `checkAiAvailability(settings)` e exibe o `SubtleAiGatePopover` quando não há IA conectada.
  - Todas as cores fixas em `CharacterRosterSidebar.tsx`, `CharacterStudioView.tsx` e `CharacterDossierTabs.tsx` foram migradas para variáveis de tema CSS.
- **Importância e Grau de Uso**: **Essencial (Uso Diário)**. Contém os dossiês completos (Perfil, Psicologia `Want`/`Need`/`Lie`/`Ghost`, Arco em 3 Atos, Relacionamentos e Segredos Epistêmicos).
- **O que é preciso para funcionar**: **100% Offline e Manual** para toda a criação, edição, relacionamentos, cálculo de completude (`CompletenessRing`) e segredos epistêmicos. **IA Conectada (Opcional)** apenas para o botão `+ IA`.

#### 8. Entrevistas (`interviews` — `CharacterInterviewsView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Substituídas todas as cores escuras fixas (`#0a0d14`, `#0e1118`, `#141926`) em `CharacterInterviewsView.tsx`, `InterviewSidebar.tsx` e `InterviewSessionChat.tsx` por variáveis de tema CSS.
  - Adicionado indicador explícito no topo do chat: **`Modo Offline (Voz do Dossiê)`** (quando sem IA) vs **`IA Conectada`**. Clicar no indicador offline abre o `SubtleAiGatePopover` explicando de forma transparente como a simulação local funciona e como conectar uma IA externa.
- **Importância e Grau de Uso**: **Complementar / Criativa**. Usada quando o autor quer "sabatinar" um personagem sob um Arquétipo Junguiano específico (*Sombra*, *Mentor*, *Vilão*, *Metamorfo*) e copiar boas falas para as notas do dossiê.
- **O que é preciso para funcionar**: **Híbrido**. Funciona **Offline** compondo respostas estruturadas a partir da motivação e dos segredos epistêmicos do dossiê do personagem; com **IA Conectada**, permite improviso generativo profundo.

#### 9. Grafo de Relações (`graph` — `PhysicsForceGraphView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug/UX corrigido**: Antes, o inspetor lateral já iniciava aberto no primeiro nó e o foco de vizinhança só funcionava no hover. Agora o grafo inicia limpo (sem painel forçado), **clicar em um nó trava o foco na sua vizinhança de 1 salto (`Em foco: <Nome>`)** e abre o dossiê lateral, que conta com um **botão `X`** claro para fechar o painel e restaurar a visão geral.
- **Importância e Grau de Uso**: **Alta**. Permite visualizar alianças, hostilidades, vassalagem e tensão política entre personagens, facções, locais e artefatos.
- **O que é preciso para funcionar**: **100% Offline / Motor Físico 2D Local (`GraphCanvas2D.tsx`)**. Não depende de IA.

#### 10. Mapas Mentais (`mindmap` — `MindMapView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificado o canvas SVG livre 360° (arrastar fundo para pan, roda do mouse/botões para zoom, arrastar nós livremente em qualquer direção, criar conexões direcionais ou bidirecionais e vincular nós a entidades do cânone).
- **Importância e Grau de Uso**: **Média / Tática**. Excelente para planejar árvores de mistério, conspirações, genealogias ou brainstorming livre sem formato rígido.
- **O que é preciso para funcionar**: **100% Offline e Local**.

---

### 3.3. Grupo Universo

#### 11. Construção Mundial (`worlds` — `WorldbuildingStudioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados os **10 Pilares de Construção Mundial** (*Visão Geral & Premissa*, *Geografia & Clima*, *Cultura & Sociedade*, *Política & Poder*, *Economia & Comércio*, *História & Eras*, *Sistemas de Regras / Magia / Tecnologia*, *Religião & Cosmologia*, *Ecologia & Criaturas*, *Locais & Assentamentos*) + a aba **Atlas & Mapas** (`WorldAtlasMapTab.tsx`) com upload de mapas persistidos em `IndexedDB`, marcadores interativos (*Pins*), rotas de viagem e selo de **Maturidade Canônica `1–10`** por pilar.
- **Importância e Grau de Uso**: **Essencial**. É o alicerce de qualquer obra de ficção especulativa, histórica, fantasia, sci-fi ou romance de época.
- **O que é preciso para funcionar**: **100% Offline e Local** (`localStorage` para textos estruturados + `IndexedDB` para imagens de mapas de alta resolução).

#### 12. Facções (`factions` — `FactionsStudioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug Crítico Corrigido**: Clicar no botão `IA` executava `handleCreateFaction(true)` que criava silenciosamente uma facção com `name: "Coalizão de " + project.title` (resultando em `"Coalizão de As Cinzas de Vael (Cópia)"`, aparentando copiar o título do projeto). Esse comportamento foi **eliminado**.
  - Agora o botão `IA` verifica `checkAiAvailability(settings)`: quando não há IA conectada, abre imediatamente o pop-up sutil `SubtleAiGatePopover` (*"Nenhuma IA conectada"*) sem criar nenhuma facção falsa. Quando há IA conectada, abre um modal limpo solicitando o conceito político/institucional da facção.
  - Todas as cores fixas em `FactionsStudioView.tsx`, `FactionRosterSidebar.tsx` e `FactionDossierTabs.tsx` foram convertidas para variáveis de tema CSS.
- **Importância e Grau de Uso**: **Alta**. Essencial para modelar governos, ordens secretas, corporações, guildas, suas patentes hierárquicas e segredos de estado.
- **O que é preciso para funcionar**: **100% Offline e Manual** para criar facções (`+ Nova`), editar doutrina, agendas pública/secreta, patentes e segredos. **IA Conectada (Opcional)** apenas para o botão `+ IA`.

#### 13. Objetos (`objects` — `ObjectsStudioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Migradas todas as cores escuras fixas (`#111622`, `#182030`, `#0a0d14`, `#242f44`) em `ObjectsStudioView.tsx`, `ObjectGroupsSidebar.tsx` e `ObjectDetailEditor.tsx` para variáveis de tema CSS (`var(--bg-surface)`, `var(--bg-elevated)`, `var(--border-subtle)`, `var(--text-primary)`).
- **Importância e Grau de Uso**: **Média**. Muito útil para rastrear "MacGuffins", armas lendárias, documentos confidenciais, veículos ou provas forenses, sabendo exatamente quem é o portador atual e em quais cenas o objeto aparece.
- **O que é preciso para funcionar**: **100% Offline e Local**.

---

### 3.4. Grupo Escrita

#### 14. Manuscrito (`manuscript` — `ManuscriptView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Prioridade na Barra Lateral**: Os grupos **Escrita** e **Revisão** foram posicionados no topo da barra lateral, acima de **Planejamento**, colocando o **Manuscrito** no acesso imediato do escritor.
  - **5 Modos de Escrita e Visualização (`Interface`, `Markdown`, `Código`, `Dividido`, `Leitura`)**:
    - **Interface (`visual`)**: editor visual de blocos literários (`ManuscriptVisualBlockEditor.tsx`) sem código aparente, onde cada parágrafo, fala com travessão (`—`), título (`H1–H3`), epígrafe, quebra de cena (`✦ ✦ ✦`), nota do autor, segredo epistêmico e checklist é editado, reordenado (`↑`/`↓`), duplicado ou inserido por controles visuais com sincronização bidirecional ao Markdown.
    - **Markdown (`write`)**: editor literário CodeMirror 6 com realce tipográfico e autocompletar `@Personagem`, `#Local`, `&Facção`, `!Objeto` e `/`.
    - **Código (`code`)**: editor em fonte monoespaçada com numeração de linhas e cabeçalho de frontmatter YAML da cena copiável.
    - **Dividido (`split`)** e **Leitura (`read`)**: visualização formatada lado a lado ou página cheia (com correção da regex Unicode em `ManuscriptMarkdownPreview.tsx`).
  - **Oficina do Escritor Integrada (`ManuscriptWriterToolsDrawer.tsx` + `proseStyleAnalyzer.ts`)**:
    - **Cronômetro de Sprint Literário (`15m`, `25m`, `45m`)** com rastreamento de palavras escritas no sprint (`+X palavras`) e velocidade (`pal/min`).
    - **Meta da Cena ao Vivo** (`500` a `5.000` palavras) com barra de progresso e seletores rápidos de **POV** e **Status Editorial** (`Rascunho`, `Em Revisão`, `Finalizado`) no topo da cena.
    - **Raio-X de Estilo & Ritmo**: proporção `% Diálogo vs. Narração`, média de palavras por frase, alerta de frases longas (`>28 palavras`), detecção de advérbios terminados em `-mente` e palavras repetidas (`3x+`).
    - **Pontuação Literária Direta**: botões para travessão de diálogo (`—`), aspas tipográficas (`“ ”`), tachado (`~~`) e seção `H3`.
- **Importância e Grau de Uso**: **Crítica / Absoluta (Uso Contínuo)**. É o coração do estúdio literário onde o autor passa a maior parte do tempo redigindo os capítulos.
- **O que é preciso para funcionar**: **100% Offline e Local**. Todos os 5 modos de edição, a Oficina do Escritor, a análise de estilo e o checklist epistêmico funcionam sem qualquer dependência de nuvem ou IA.

#### 15. Estúdio de Redação (`writer` — `WriterStudioView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug/UX Corrigido**: As 9 ferramentas laterais (`Continuar Escrita`, `Melhorar Texto`, `Alterar Tom`, `Gerar Diálogo`, etc.) inseriam textos de exemplo no *IA Scratchpad* sem avisar que nenhuma IA estava conectada. Agora o cabeçalho da coluna exibe o selo **`Sem IA`** / **`IA ativa`**, cada botão indica **`Requer IA`** quando desconectado e, ao clicar, abre o `SubtleAiGatePopover` com botão **"Configurar IA"** e opção secundária explícita **"Inserir Molde Local"**.
  - Migradas todas as cores fixas em `WriterStudioView.tsx`, `WriterContextColumn.tsx`, `AiScratchpadColumn.tsx`, `WriterToolsColumn.tsx` e `ProForgePipelinePanel.tsx` para variáveis de tema CSS.
- **Importância e Grau de Uso**: **Média / Opcional**. Voltada para escritores que gostam de experimentar variações de parágrafos em um rascunho separado (*Scratchpad*) ou passar a cena pelo pipeline editorial de 8 estágios (*ProForge*) antes de incorporar ao capítulo.
- **O que é preciso para funcionar**: **Requer IA Conectada** para geração generativa real nas 9 ferramentas (embora o *Scratchpad* livre, o contexto recuperado da cena e a revisão estrutural *ProForge* também ofereçam suporte heurístico local offline).

---

### 3.5. Grupo Revisão & Publicação + Rodapé

#### 16. Consistência (`consistency` — `ConsistencyCheckerView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados o painel de **Auditoria Epistêmica** (`EpistemicAuditList` — que cruza segredos de personagens/facções com a ordem das cenas para alertar se um segredo foi citado antes da cena de revelação) e a **Matriz de Co-ocorrência da Bíblia da História** (`StoryBibleCooccurrenceCard`).
- **Importância e Grau de Uso**: **Alta**. Indispensável na revisão de romances policiais, thrillers e fantasias complexas para garantir que nenhum personagem aja com base em informações que ainda não descobriu.
- **O que é preciso para funcionar**: **100% Offline / Algorítmico Local**.

#### 17. Crítico Literário (`critic` — `CriticView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados os 4 cartões de telemetria estilística por cena ou texto colado: **Ritmo (Pacing)** por média de palavras/frase, **Proporção de Diálogo (%)**, **Densidade Sensorial (%)**, **Índice de Legibilidade Flesch (`0–100`)** e o **Diagnóstico de Lacunas de Enredo** (cenas sem POV, sem local ou clímax curto demais para alta tensão).
- **Importância e Grau de Uso**: **Alta**. Muito útil após terminar o primeiro rascunho de um capítulo para calibrar ritmo e excesso/falta de diálogo.
- **O que é preciso para funcionar**: **100% Offline / Algorítmico Local**. Os cálculos linguísticos e estruturais são matemáticos e instantâneos, sem precisar de IA externa.

#### 18. Visualização do Livro (`preview` — `BookPreviewView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados a alternância entre **Modo Paginado** (com navegação capítulo a capítulo e barra de progresso de leitura) e **Leitura Contínua**, o sumário lateral retrátil, o seletor tipográfico (`Serif`, `Sistema`, `Monoespaçado`), o ajuste de corpo de fonte (`A-` / `A+`) e o modo Tela Cheia.
- **Importância e Grau de Uso**: **Alta**. Permite ao autor ler o próprio livro com olhos de leitor, fora do ambiente de edição técnica.
- **O que é preciso para funcionar**: **100% Offline e Local**.

#### 19. Progresso / Programação (`progress` — `ProgressTrackerView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados o **Cronômetro de Sessão / Pomodoro** (`SessionTimerBanner`), os **Anéis de Meta Diária, Semanal e Total** (`GoalRingsGrid`), o **Gráfico de Velocidade** (`VelocitySectionCard`) e o **Mapa de Calor de Atividade de 140 Dias** (`ActivityHeatmapCard`) com filtro interativo por data clicada.
- **Importância e Grau de Uso**: **Média / Alta**. Fundamental para manter constância diária de escrita e acompanhar o ritmo rumo ao prazo final do manuscrito.
- **O que é preciso para funcionar**: **100% Offline e Local**.

#### 20. Versões & Staging (`versions` — `StagingApprovalView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados o gerenciador de **Ramos (Branches) e Instantâneos (Snapshots)** (`BranchAndSnapshotPanel`) com comparação visual (*Diff/Merge*) e o **Portão de Aprovação de Staging** (`StagingGatekeeperPanel`), onde toda proposta da IA ou do Radar de Cânone aguarda revisão humana com diff antes de tocar o cânone.
- **Importância e Grau de Uso**: **Muito Alta**. Garante segurança absoluta contra perda de texto (snapshots automáticos e ramos alternativos) e protege a pureza do cânone literário.
- **O que é preciso para funcionar**: **100% Offline e Local** (`gitEngine.ts` + `stagingResolver.ts`). Quando o servidor MCP (`@inkgraph/mcp`) ou o Copiloto propõem alterações, elas pousam aqui para aprovação.

#### 21. Exportar (`export` — `ExportView.tsx`)
- **O que foi inspecionado e arrumado**:
  - Verificados o cartão de **Prontidão de Pré-Voo Editorial** (`ExportPreflightCard` — que alerta se há propostas pendentes em Staging, alertas epistêmicos ou dossiês incompletos antes da compilação), os seletores de seções (Folha de Rosto, Dedicatória, Manuscrito, Personagens, Facções, Mundos, Colofão), os 5 formatos (`.md`, `.txt`, Lauda Normalizada 60×30, `.html`, `.json`) e o Assistente de Compilação (`CompileWizardModal`).
- **Importância e Grau de Uso**: **Essencial no Fechamento e Backup**. Usada para gerar o arquivo final para revisão editorial, submissão a editoras ou backup completo em JSON/Markdown.
- **O que é preciso para funcionar**: **100% Offline e Local**.

#### 22. Configurações (`settings` — `SettingsView.tsx`) & Ajuda (`help` — `HelpView.tsx`)
- **O que foi inspecionado e arrumado**:
  - **Bug/UX Corrigido em `AiProviderSection.tsx`**: O botão `"Testar Conexão"` em *Configurações → IA & Servidor MCP* antes mudava para `"Conexão ativa"` após 400ms mesmo quando o campo de chave de API estava vazio. Agora ele valida com `checkAiAvailability(draftSettings)` e, quando nenhuma chave ou modelo local válido está configurado, exibe o aviso âmbar **`Não conectada`** explicando exatamente o que falta configurar.
  - Verificadas as 7 sub-abas de Configurações (*Geral*, *Aparência* com 6 paletas × 3 modos de brilho, *Editor*, *IA & Servidor MCP*, *Atalhos de Teclado* com 26 atalhos editáveis, *Armazenamento & Notificações*, *Sobre*) e a barra flutuante `SettingsSaveBar`, além da central de *Ajuda* com busca em tempo real.
- **Importância e Grau de Uso**: **Essencial (Configuração e Referência)**.
- **O que é preciso para funcionar**: **100% Offline e Local**.
