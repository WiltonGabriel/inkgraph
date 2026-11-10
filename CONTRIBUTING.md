# Guia de Contribuição

Contribuições para o **InkGraph** são bem-vindas. Para manter a integridade arquitetural e a privacidade do cofre local, siga as diretrizes abaixo.

## Princípios Essenciais

1. **Filosofia do Design Silencioso:**
   - Mantenha rótulos, botões e cabeçalhos concisos, diretos e funcionais.
   - Não adicione slogans promocionais, textos exagerados ou referências a produtos externos na interface.
2. **Privacidade do Cofre (`./workspace/`):**
   - Nunca faça commit de arquivos dentro de `./workspace/`, bancos `.db`/`.sqlite` ou arquivos `.env` reais.
3. **Responsabilidade Única (SRP) e Clean Architecture:**
   - Separe regras de domínio e calculadores puros (`domain/`), dados de semente (`data/`), subcomponentes (`components/<contexto>/`) e orquestradores de visualização (`views/`).
   - Evite arquivos monolíticos.
4. **Códigos de Erro Padronizados:**
   - No motor `@inkgraph/core` e no servidor `@inkgraph/mcp`, utilize `InkGraphError` com os códigos `not_found`, `conflict`, `validation`, `ambiguous`, `canon_violation` ou `unauthorized`.

## Fluxo de Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Verificar tipagem em todos os pacotes
pnpm typecheck

# Executar a suíte de testes automatizados
pnpm test

# Compilar todos os pacotes para produção
pnpm build
```

Antes de abrir um Pull Request, certifique-se de que `pnpm typecheck`, `pnpm test` e `pnpm build` finalizam sem erros e que `git status --ignored` confirma que `./workspace/` permanece ignorado.
