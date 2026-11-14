# Guia de Contribuição

Contribuições para o **InkGraph** são bem-vindas. Para preservar a integridade arquitetural, a privacidade do cofre local e a experiência silenciosa do estúdio, siga as diretrizes abaixo.

## Princípios Essenciais

1. **Filosofia do Design Silencioso e Neutralidade Tecnológica:**
   - Mantenha menus, botões e títulos concisos, diretos e estritamente em terminologia literária e arquitetural (`PT-BR` na interface padrão, com suporte a `EN`).
   - Nunca insira slogans promocionais ou nomes comerciais de produtos proprietários externos em telas, identificadores de código ou documentação.
2. **Privacidade do Cofre (`./workspace/`):**
   - Nunca faça commit de arquivos dentro de `./workspace/`, bancos `.db`/`.sqlite`, habilidades privadas (`.agents/`) ou arquivos `.env` reais.
3. **Princípio da Responsabilidade Única (SRP) & Granularidade:**
   - Separe lógica pura isomórfica (diff/merge Git, compilador de memória em 4 camadas, adaptador de armazenamento, gerenciador de atalhos, temas, diretório de entidades) em `packages/ui/src/domain/`.
   - Mantenha indexação SQLite/FTS5 e parser de cofre em `@inkgraph/core`, exposição de protocolo em `@inkgraph/mcp`, subcomponentes granulares em `packages/ui/src/components/<contexto>/` e orquestradores enxutos em `packages/ui/src/views/`.
   - Evite arquivos monolíticos (> 300 linhas por componente) e nunca use `window.confirm` ou `window.alert` (utilize `requestConfirm` e `notify` de `ProjectContext`).
4. **TypeScript Estrito:**
   - Todo pacote compila com `strict: true`, `noUnusedLocals: true` e `noUnusedParameters: true`.
5. **Códigos de Erro Padronizados:**
   - Utilize `InkGraphError` em `@inkgraph/core` e `@inkgraph/mcp` com os códigos `not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation` ou `unauthorized`.

## Fluxo de Desenvolvimento Local

Use **pnpm** (ou `corepack pnpm`) como gerenciador de pacotes padrão:

```bash
# Instalar dependências
pnpm install

# Verificar tipagem em todos os pacotes
pnpm typecheck

# Executar testes automatizados (Vitest)
pnpm test

# Compilar todos os pacotes
pnpm build
```

Antes de abrir um Pull Request, verifique também que `./workspace/` permanece fora do índice do Git:

```bash
git status --ignored -s
```
