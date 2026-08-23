# @sektek/generator-base

Base Yeoman generator for scaffolding new SEKTEK projects, driven by
[`@sektek/gen`](https://github.com/sektek/gen) (or, in principle, still installable as a `yo`
generator).

`BaseGenerator` extends `@sektek/generator`'s `CoreGenerator` and sets `package = '@sektek/base'`.
Sub-generators:

- `app` — the entrypoint, composes `editorconfig`, `gitconfig`, and `readme` in sequence.
- `editorconfig`, `gitconfig`, `readme` — copy EJS templates for the corresponding project files.
- `devcontainer` — writes `.devcontainer/Dockerfile` plus either a standalone or
  docker-compose-based `devcontainer.json`, depending on a `default`/`workspace` profile option.
- `workspace` — composes `devcontainer`, `editorconfig`, `gitconfig`, and `readme` together and adds
  `.vscode/settings.json`/`launch.json`; the root-level variant of `app` for a workspace-style
  project rather than a single package.

## Installation

```sh
npm install @sektek/generator-base
```
