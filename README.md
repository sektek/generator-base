# @sektek/generator-base

Base Yeoman generator for scaffolding new SEKTEK projects, driven by
[`@sektek/gen`](https://github.com/sektek/gen) (or, in principle, still installable as a `yo`
generator).

`BaseGenerator` extends `@sektek/generator`'s `CoreGenerator` and sets `package = '@sektek/base'`.
Sub-generators:

- `app` — the entrypoint, composes `editorconfig`, `git`, `gitconfig`, `github`, `license`, and
  `readme` in sequence.
- `editorconfig`, `gitconfig`, `readme` — copy EJS templates for the corresponding project files.
- `git` — initializes a local git repository and creates an initial commit once every other composed
  generator has written its files. Default-on (`gitInit: true`); opt out via `--no-git-init`. Only
  ever auto-commits when it performed the `git init` itself against an empty destination.
- `github` — creates a GitHub repository and pushes the scaffolded project to it; composes `git`
  itself, so it's self-sufficient run standalone. Opt-in (`createRepo: false` by default) via
  `--create-repo`.
- `license` — writes a `LICENSE` file naming `author` as the copyright holder when `license` is
  `'MIT'`; writes nothing for any other value (including the default, `'UNLICENSED'`).
- `devcontainer` — writes `.devcontainer/Dockerfile` plus either a standalone or
  docker-compose-based `devcontainer.json`, depending on a `default`/`workspace` profile option.
- `workspace` — composes `devcontainer`, `editorconfig`, `gitconfig`, and `readme` together and adds
  `.vscode/settings.json`/`launch.json`; the root-level variant of `app` for a workspace-style
  project rather than a single package.

## Installation

```sh
npm install @sektek/generator-base
```
