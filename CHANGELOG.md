# Changelog

## [0.10.1](https://github.com/sektek/generator-base/compare/v0.10.0...v0.10.1) (2026-09-24)

### Bug Fixes

* **workspace:** compose @sektek/base:config, matching AppGenerator ([#18](https://github.com/sektek/generator-base/issues/18)) ([8e49131](https://github.com/sektek/generator-base/commit/8e49131fd19d4ef45bc078566ca5f46a37a6e20c))

## [0.10.0](https://github.com/sektek/generator-base/compare/v0.9.0...v0.10.0) (2026-09-23)

### Features

* **generator-base): app/workspace set destinationMode(:** newProjectDir ([#16](https://github.com/sektek/generator-base/issues/16)) ([dfe112e](https://github.com/sektek/generator-base/commit/dfe112ef795e068cb99e4d0e12b0521910bb79fc))

## [0.9.0](https://github.com/sektek/generator-base/compare/v0.8.3...v0.9.0) (2026-09-19)

### Features

* **generator-base:** license consumes shared authorPrompt via PromptBuilder ([#15](https://github.com/sektek/generator-base/issues/15)) ([d8ae243](https://github.com/sektek/generator-base/commit/d8ae243e2548b1db2d08b838a24b2eb7d338a259))

## [0.8.3](https://github.com/sektek/generator-base/compare/v0.8.2...v0.8.3) (2026-09-19)

### Bug Fixes

* **generator-base:** composites()-driven taskInitializing + github's includeGitHub-gated prompts() ([#14](https://github.com/sektek/generator-base/issues/14)) ([e257370](https://github.com/sektek/generator-base/commit/e2573703b1e885f1f015d96c6d568bd6716b6ec6))

## [0.8.2](https://github.com/sektek/generator-base/compare/v0.8.1...v0.8.2) (2026-09-13)

### Bug Fixes

* **generator-base:** skip GitHub repo creation when gitInit is declined ([#13](https://github.com/sektek/generator-base/issues/13)) ([64ae68f](https://github.com/sektek/generator-base/commit/64ae68f8e59f3bd954d80401b18010fe5a2f5aef)), closes [#shouldCreateRepo](https://github.com/sektek/generator-base/issues/shouldCreateRepo) [#shouldInitAndCommit](https://github.com/sektek/generator-base/issues/shouldInitAndCommit) [#shouldCreateRepo](https://github.com/sektek/generator-base/issues/shouldCreateRepo)

## [0.8.1](https://github.com/sektek/generator-base/compare/v0.8.0...v0.8.1) (2026-09-13)

### Bug Fixes

* **generator-base:** title-case the README heading instead of appname's raw casing ([#12](https://github.com/sektek/generator-base/issues/12)) ([ae09580](https://github.com/sektek/generator-base/commit/ae09580185fd9e20d39c7a8814caccef7b9b9055)), closes [Generator#determineAppname](https://github.com/sektek/Generator/issues/determineAppname) [CoreGenerator#projectSlug](https://github.com/sektek/CoreGenerator/issues/projectSlug)

## [0.8.0](https://github.com/sektek/generator-base/compare/v0.7.0...v0.8.0) (2026-09-09)

### Features

* add config sub-generator for gen.config.* files ([#10](https://github.com/sektek/generator-base/issues/10)) ([f5f6b85](https://github.com/sektek/generator-base/commit/f5f6b859ff882e515bbf1d4dd75488cfa4c4fcad))

## [0.7.0](https://github.com/sektek/generator-base/compare/v0.6.0...v0.7.0) (2026-09-08)

### Features

* add license sub-generator (SEK-88) ([#11](https://github.com/sektek/generator-base/issues/11)) ([e4e0fe3](https://github.com/sektek/generator-base/commit/e4e0fe34d3c3cce93200a03d0a4b6c8fd4295764))

## [0.6.0](https://github.com/sektek/generator-base/compare/v0.5.1...v0.6.0) (2026-09-05)

### Features

* expose GithubClient/defaultGithubClient from package root ([#9](https://github.com/sektek/generator-base/issues/9)) ([5195228](https://github.com/sektek/generator-base/commit/51952280988bba991441c5d60e5d5490bd242e1f))

## [0.5.1](https://github.com/sektek/generator-base/compare/v0.5.0...v0.5.1) (2026-09-01)

### Bug Fixes

* **lib/github:** use HTTP Basic auth for git push, not a bearer scheme ([#8](https://github.com/sektek/generator-base/issues/8)) ([e31dc1c](https://github.com/sektek/generator-base/commit/e31dc1c08475418d00915fa78b98e2c031c19406)), closes [remote.ts#push](https://github.com/sektek/remote.ts/issues/push)

## [0.5.0](https://github.com/sektek/generator-base/compare/v0.4.0...v0.5.0) (2026-08-29)

### Features

* **app:** compose git and github sub-generators ([#7](https://github.com/sektek/generator-base/issues/7)) ([ddc1145](https://github.com/sektek/generator-base/commit/ddc1145c80977df1074ace745d27ee98b8541306))

## [0.4.0](https://github.com/sektek/generator-base/compare/v0.3.0...v0.4.0) (2026-08-29)

### Features

* **git:** add git sub-generator to init and commit scaffolded projects ([#4](https://github.com/sektek/generator-base/issues/4)) ([e95ec7f](https://github.com/sektek/generator-base/commit/e95ec7f3caa1c09edd93e3584aa55bc9acff194a)), closes [#shouldInitAndCommit](https://github.com/sektek/generator-base/issues/shouldInitAndCommit)
* **github:** add github sub-generator to create and push a GitHub repo ([#5](https://github.com/sektek/generator-base/issues/5)) ([54989c6](https://github.com/sektek/generator-base/commit/54989c66a8ee96570ce782f65cf029a11d14011e)), closes [#auth](https://github.com/sektek/generator-base/issues/auth)

## [0.3.0](https://github.com/sektek/generator-base/compare/v0.2.0...v0.3.0) (2026-08-29)

### Features

* **github:** add GitHub API/token/remote helper modules ([#3](https://github.com/sektek/generator-base/issues/3)) ([ad2f6cb](https://github.com/sektek/generator-base/commit/ad2f6cb2a8169446b934454a9cdf74788611d475))

## [0.2.0](https://github.com/sektek/generator-base/compare/v0.1.0...v0.2.0) (2026-08-29)

### Features

* **lib:** add local git init/commit helpers ([#2](https://github.com/sektek/generator-base/issues/2)) ([296c6bd](https://github.com/sektek/generator-base/commit/296c6bdf65171ffca4fcd447e4e72ea83dbe8dc8))

## 0.1.0 (2026-08-23)

### Features

* extract @sektek/generator-base from workspace-generator ([25c1011](https://github.com/sektek/generator-base/commit/25c101156db773173e79baa8065cbb331c10203d))
