# Nix configuration

## Purpose

Own the repository's dendritic Nix flake modules.

## Ownership

- Root `flake.nix` is the entry point; `import-tree` automatically loads feature-oriented modules from this directory.
- `development.nix` owns supported systems and the development shell.
- `website.nix` owns the website package and app outputs (builds and runs the adapter-bun server via Bun).
- `_website-libs.nix` owns native libraries shared by development and website execution.

## Local Contracts

- Keep each public `*.nix` file independently valid as a top-level flake-parts module.
- Add or remove public modules without maintaining a manual import list.
- Prefix private helpers with `_` so `import-tree` ignores them.
- Preserve `packages.website`, `apps.website`, their defaults, and `devShells.default`.
- No external flake inputs beyond `nixpkgs`, `flake-parts`, and `import-tree`.

## Work Guidance

- Organize modules by feature rather than output type.

## Verification

- `nix flake check`
- `nix develop -c bun --version`

## Child DOX Index

_none_
