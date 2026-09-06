import { dirname, extname, isAbsolute, join } from 'node:path';
// Default import, not `import { homedir } from 'node:os'`: sinon can't
// stub a named binding off an ES module namespace object, but a default
// import of a CJS-style Node builtin resolves to the same live, mutable
// exports object `require()` returns — the same pattern this codebase
// already uses for `lib/git/git.ts`'s `execFile`/`existsSync` stubbing.
import os from 'node:os';
import { pathToFileURL } from 'node:url';

import { parse as parseYaml } from 'yaml';
import { resolveConfigDefaults } from '@sektek/generator';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

// Precedence order to look for an existing gen.config.* file in the
// destination root when no explicit `configFile` override is given —
// mirrors @sektek/generator's own loadConfig() precedence (js > yaml >
// json). That ordering isn't itself exported (it's an internal constant of
// config-loader.ts), so it's kept here in sync by hand.
const CONFIG_FORMATS = ['js', 'yaml', 'json'] as const;
type ConfigFormat = (typeof CONFIG_FORMATS)[number];

// Options that describe *how*/*where* this run happens, not a scaffolded
// project's own configuration — never written into gen.config.*, even if
// this run "explicitly" supplied them. Two different sources leak
// plumbing keys onto `this.options` alongside real config values:
//
// - yeoman-generator/yeoman-environment themselves inject a small, fixed
//   set of framework-internal keys into every generator instance's own
//   options (found by reading yeoman-environment's loadSharedOptions()/
//   instantiate() — e.g. `namespace`/`resolved` get overwritten to *this*
//   generator's own identity, not whatever CoreOptions.namespace the
//   caller passed in). Not exported as a named list upstream, so this is
//   a hand-maintained best-effort set that may need updating if a future
//   yeoman-generator/yeoman-environment release adds more.
// - @sektek/generator-test's own helper.withOptions() mirrors every
//   option it's given under both camelCase *and* kebab-case spellings
//   (matching a legacy meow-parsing convention), so a real test run of
//   this generator can see e.g. both `configFile` and `config-file` as
//   own keys of `this.options` even though only the camelCase form is
//   ever real in production.
//
// Handled together: any key containing a hyphen is skipped outright
// (never a real key in this codebase's own camelCase-only option schema),
// plus this explicit denylist of camelCase plumbing keys.
const NON_CONFIG_OPTION_KEYS = new Set<string>([
  // This generator's own run-plumbing options.
  'configFile',
  'explicitOptionKeys',
  'force',
  'destinationRoot',
  // yeoman-generator/yeoman-environment's own injected options.
  '_',
  'env',
  'namespace',
  'resolved',
  'sharedData',
  'askAnswered',
  'forceInstall',
  'forwardErrorToEnvironment',
  'initialGenerator',
  'skipCache',
  'skipLocalCache',
  'skipParseOptions',
  'localConfigOnly',
]);

type ConfigEntry = {
  key: string;
  value: unknown;
  commented: boolean;
};

/**
 * Writes/updates the scaffolded project's own `gen.config.*` file with this
 * run's resolved options: every key this run explicitly supplied (a real
 * CLI flag, not just a schema default) is populated; everything else is
 * left as a commented-out placeholder naming the key (and, if one exists,
 * its current defaulted value) — *unless* a higher-up config (an ancestor
 * directory's or the home directory's own `gen.config.*`) already supplies
 * it, per SEK-85. Re-running against a destination that already has a
 * `gen.config.*` file merges into it: an existing real value is kept (an
 * explicit value from *this* run can still update it — see
 * `#buildEntries`), and any option key that exists now but didn't when the
 * file was first written is added, populated or commented per the same
 * rules.
 *
 * Schema-agnostic by design (see SEK-85's design discussion): this package
 * sits upstream of `tools/gen`, which owns the full option schema
 * (`schema.ts`/`OptionSpec`) — duplicating that machinery here would
 * recreate the exact circular dependency the shared
 * `@sektek/generator#resolveConfigDefaults` extraction was meant to avoid.
 * Instead, this only ever looks at whatever keys already happen to be own
 * keys of `this.options` — which, for a real `tools/gen` CLI run, is every
 * schema key (resolve()'s default-merging spreads every schema key onto the
 * resolved options object, even ones whose value is undefined), so nothing
 * schema-specific needs to be known here.
 */
export class ConfigGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  constructor(
    args: string[],
    options: BaseOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  async taskWriting() {
    const { options } = this;
    const destinationRoot = this.destinationRoot();

    const { path: targetPath, format } = this.#resolveTarget(
      destinationRoot,
      options.configFile,
    );

    const existing = await this.#readExisting(targetPath, format);
    const explicit = new Set(
      options.explicitOptionKeys ?? Object.keys(options),
    );
    // "a higher up configuration (such as in the home directory)" — search
    // starts at the destination's *parent*, not the destination itself:
    // the destination's own gen.config.* is `existing` above (the merge
    // target), not an ancestor.
    const ancestorDefaults = await resolveConfigDefaults(
      `${this.package}:app`,
      { cwd: dirname(destinationRoot), homeDir: os.homedir() },
    );

    const entries = this.#buildEntries(
      options as unknown as Record<string, unknown>,
      { existing, explicit, ancestorDefaults },
    );

    this.fs.write(targetPath, this.#render(format, entries));
  }

  #resolveTarget(
    destinationRoot: string,
    configFile: string | undefined,
  ): { path: string; format: ConfigFormat } {
    if (configFile) {
      const path = isAbsolute(configFile)
        ? configFile
        : join(destinationRoot, configFile);
      return { path, format: this.#formatFromExtension(path) };
    }

    for (const format of CONFIG_FORMATS) {
      const path = join(destinationRoot, `gen.config.${format}`);
      if (this.fs.exists(path)) {
        return { path, format };
      }
    }

    return { path: join(destinationRoot, 'gen.config.yaml'), format: 'yaml' };
  }

  #formatFromExtension(path: string): ConfigFormat {
    const ext = extname(path).slice(1);
    const format = ext === 'yml' ? 'yaml' : ext;
    if (!(CONFIG_FORMATS as readonly string[]).includes(format)) {
      throw new Error(
        `Unsupported --config-file extension ${JSON.stringify(extname(path))} for ${path} (expected .js, .yaml/.yml, or .json)`,
      );
    }
    return format as ConfigFormat;
  }

  async #readExisting(
    path: string,
    format: ConfigFormat,
  ): Promise<Record<string, unknown>> {
    if (!this.fs.exists(path)) {
      return {};
    }

    switch (format) {
      case 'json':
        return JSON.parse(this.fs.read(path)) as Record<string, unknown>;
      case 'yaml':
        return (parseYaml(this.fs.read(path)) ?? {}) as Record<string, unknown>;
      case 'js': {
        // Best-effort: a plain dynamic import, not @sektek/generator's own
        // loadConfig() ESM/CJS-mismatch retry dance — that dance exists
        // specifically for loading a conventionally-named gen.config.js by
        // directory; reproducing it here for an arbitrary --config-file
        // path is unnecessary scope for the common case (the default
        // format is YAML). A hand-authored .js config whose module system
        // doesn't match its ambient package.json will fail to merge here —
        // a known limitation, see the PR description.
        const mod = (await import(pathToFileURL(path).href)) as Record<
          string,
          unknown
        >;
        return ('default' in mod ? mod.default : mod) as Record<
          string,
          unknown
        >;
      }
    }
  }

  #buildEntries(
    options: Record<string, unknown>,
    {
      existing,
      explicit,
      ancestorDefaults,
    }: {
      existing: Record<string, unknown>;
      explicit: Set<string>;
      ancestorDefaults: Record<string, unknown>;
    },
  ): ConfigEntry[] {
    const keys = new Set([...Object.keys(options), ...Object.keys(existing)]);

    const entries: ConfigEntry[] = [];
    for (const key of keys) {
      if (key.includes('-') || NON_CONFIG_OPTION_KEYS.has(key)) continue;

      const optionValue = options[key];
      if (typeof optionValue === 'function') continue;

      // An explicit value this run always wins, even over a stale existing
      // value — the user typed it deliberately, this run.
      if (explicit.has(key) && optionValue !== undefined) {
        entries.push({ key, value: optionValue, commented: false });
        continue;
      }

      // Otherwise, an existing real (already-populated) value from a prior
      // run — or a hand-edit — is kept rather than reverted to a comment.
      if (Object.hasOwn(existing, key)) {
        entries.push({ key, value: existing[key], commented: false });
        continue;
      }

      // Not explicit this run, and not already in the file. Don't add even
      // a commented placeholder for a value a higher-up config (e.g.
      // ~/gen.config.*) already supplies.
      if (Object.hasOwn(ancestorDefaults, key)) continue;

      entries.push({ key, value: optionValue, commented: true });
    }

    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }

  #render(format: ConfigFormat, entries: ConfigEntry[]): string {
    if (format === 'json') {
      // JSON has no comment syntax — commented placeholders are simply
      // skipped for this format rather than attempted; a known trade-off
      // called out in the PR description (default to a --config-file
      // ending in .yaml/.js to get placeholders at all).
      const populated = Object.fromEntries(
        entries.filter(entry => !entry.commented).map(e => [e.key, e.value]),
      );
      return `${JSON.stringify(populated, null, 2)}\n`;
    }

    if (format === 'js') {
      const lines = entries.map(({ key, value, commented }) => {
        const line = `  ${JSON.stringify(key)}: ${this.#literal(value)},`;
        return commented ? `  // ${line.trim()}` : line;
      });
      return `${[
        '// Generated by @sektek/base:config — safe to hand-edit.',
        'export default {',
        ...lines,
        '};',
      ].join('\n')}\n`;
    }

    const lines = entries.map(({ key, value, commented }) => {
      const line = `${key}: ${this.#literal(value)}`;
      return commented ? `# ${line}` : line;
    });
    return `${[
      '# Generated by @sektek/base:config — safe to hand-edit.',
      '',
      ...lines,
    ].join('\n')}\n`;
  }

  #literal(value: unknown): string {
    return value === undefined ? 'null' : JSON.stringify(value);
  }
}

export default ConfigGenerator;
