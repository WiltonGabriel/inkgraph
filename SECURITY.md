# Política de Segurança — InkGraph

A segurança dos dados criativos do autor e a privacidade do cofre local são requisitos fundamentais do **InkGraph**.

## 1. Garantias de Privacidade e Segurança

- **Isolamento Estrito do Cofre (`./workspace/`):**
  - Todo manuscrito, lore, dossiê e arquivo do usuário reside em `./workspace/`, bloqueado pelo [`.gitignore`](.gitignore) e verificado automaticamente no CI (`git ls-files workspace/`).
- **Prevenção contra Path Traversal (MCP & Core):**
  - Operações de escrita via `@inkgraph/mcp` passam pela função `resolveSafeStagingPath` de `@inkgraph/core`, confinando arquivos propostos exclusivamente ao diretório `./workspace/staging/`.
- **Sanitização de URLs Externas (`@inkgraph/ui`):**
  - Links salvos no fichário de pesquisa são validados por `sanitizeExternalUrl` (`packages/ui/src/domain/workspaceNormalizer.ts`), permitindo apenas os protocolos `http:` e `https:` e bloqueando `javascript:`, `data:`, `vbscript:` e `file:`.
- **Bloqueio de Egress em Modos Locais (`memoryCompiler.ts`):**
  - Nos modos `local` e `eco`, ou quando `copilotHeuristicsOnly` está ativo, `cloudAllowed` permanece `false`, impedindo envio de conteúdo para APIs externas na nuvem.

## 2. Versões Suportadas

| Versão / Branch | Suporte a Correções de Segurança |
| :--- | :--- |
| `main` | Ativo |

## 3. Como Reportar uma Vulnerabilidade

Por favor, **não** abra uma issue pública para falhas de segurança envolvendo travessia de caminhos, vazamento de credenciais ou execução indevida de código.

- Utilize o canal privado de **GitHub Security Advisories** do repositório (`Security → Advisories → Report a vulnerability`) em:
  `https://github.com/WiltonGabriel/inkgraph/security/advisories/new`
- Inclua os passos mínimos para reprodução, o pacote afetado (`@inkgraph/core`, `@inkgraph/mcp`, `@inkgraph/ui` ou `@inkgraph/desktop`) e o impacto esperado.
