# Guia de Contribuição

Contribuições para o **InkGraph** são bem-vindas. Para manter a integridade arquitetural, o funcionamento offline e a privacidade do cofre local, siga as diretrizes abaixo.

## Princípios Essenciais

1. **Filosofia do Design Silencioso:**
   - Mantenha rótulos, botões e cabeçalhos concisos, diretos e funcionais.
   - Não adicione slogans promocionais, textos exagerados, templates simulados de IA ou referências a produtos externos na interface.
2. **Privacidade do Cofre (`./workspace/`):**
   - Nunca faça commit de arquivos dentro de `./workspace/`, bancos `.db`/`.sqlite` ou arquivos `.env` reais.
3. **Responsabilidade Única (SRP) e Arquitetura Limpa:**
   - Separe lógica pura e codecs em `@inkgraph/domain`, políticas em `@inkgraph/capabilities`, orquestração de IA em `@inkgraph/ai`, indexação SQLite em `@inkgraph/core`, servidor MCP em `@inkgraph/mcp`, subcomponentes por contexto em `packages/ui/src/components/<contexto>/` e orquestradores enxutos em `packages/ui/src/views/`.
   - Evite arquivos monolíticos.
4. **Códigos de Erro Padronizados:**
   - Utilize `InkGraphError` com os códigos `not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation` ou `unauthorized`.

## Fluxo de Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Compilar todos os pacotes na ordem de dependências
pnpm build

# Verificar tipagem em todos os pacotes
pnpm typecheck

# Executar a suíte de testes automatizados
pnpm test
```

Antes de abrir um Pull Request, certifique-se de que `pnpm build`, `pnpm typecheck` e `pnpm test` finalizam sem erros e que `git status --ignored` confirma que `./workspace/` permanece ignorado.
