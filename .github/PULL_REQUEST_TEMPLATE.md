## Resumo das Alterações

Descreva de forma clara e concisa o que foi modificado e qual problema/funcionalidade resolve.

## Pacotes Afetados

- [ ] `@inkgraph/core`
- [ ] `@inkgraph/mcp`
- [ ] `@inkgraph/ui`
- [ ] `@inkgraph/desktop`
- [ ] Documentação / CI (`README.md`, `docs/`, `.github/`)

## Checklist de Qualidade e Arquitetura (SRP)

- [ ] Sem arquivos em `./workspace/`, bancos locais (`.db`, `.sqlite`) ou arquivos `.env` no commit (`git status --ignored -s`)
- [ ] Lógica pura de domínio isolada em `packages/ui/src/domain/` ou `@inkgraph/core` sem acoplamento monolítico
- [ ] Interface segue o **Design Silencioso** (sem slogans promocionais ou referências a softwares proprietários externos)
- [ ] Tematização compatível com modos **Claro**, **Escuro** e **Sépia** usando variáveis CSS semânticas
- [ ] `pnpm run typecheck` passa sem erros
- [ ] `pnpm run test` passa sem erros
- [ ] `pnpm run build` conclui sem erros
