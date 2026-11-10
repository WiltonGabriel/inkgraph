# `@inkgraph/desktop` (Shell Tauri v2)

Shell nativo multiplataforma (Windows, Linux/Wayland, macOS e alvos móveis Tauri v2) apontando diretamente para o estúdio `@inkgraph/ui`.

Consulte também a documentação principal do monorepo em [../../README.md](../../README.md).

## Pré-requisitos
- Rust + Cargo (`rustup`)
- Dependências de sistema do Tauri v2 no sistema operacional alvo

## Comandos
```bash
pnpm --filter @inkgraph/desktop tauri:dev
pnpm --filter @inkgraph/desktop tauri:build
```

> **Observação:** Em ambientes sem a toolchain do Rust instalada (`cargo`/`rustc`), os scripts de verificação de workspace (`typecheck` e `test`) executam apenas a validação de scaffold sem compilar o binário nativo.
