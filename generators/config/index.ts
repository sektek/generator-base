import { dirname, extname, isAbsolute, join } from 'node:path';
// Default import so sinon can stub it (can't stub a named ESM binding).
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

// Mirrors @sektek/generator's own (unexported) loadConfig() precedence.
const CONFIG_FORMATS = ['js', 'yaml', 'json'] as const;
type ConfigFormat = (typeof CONFIG_FORMATS)[number];

// Run-plumbing keys (this generator's own, plus ones yeoman-generator/
// yeoman-environment inject into every generator's this.options) — never
// written into gen.config.*. Hyphenated keys are skipped too, alongside
// this denylist (a kebab-case mirror only ever appears in tests).
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
 * it. Re-running against a destination that already has a `gen.config.*`
 * file merges into it: an existing real value is kept unless this run
 * explicitly overrides it, and any option key that's new since the file
 * was first written is added, populated or commented per the same rules.
 *
 * Schema-agnostic by design: this package sits upstream of `tools/gen`,
 * which owns the full option schema — this only ever looks at whatever
 * keys already happen to be own keys of `this.options`.
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
    // Starts at the parent, not the destination itself — that's `existing` above.
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

      if (explicit.has(key) && optionValue !== undefined) {
        entries.push({ key, value: optionValue, commented: false });
        continue;
      }

      if (Object.hasOwn(existing, key)) {
        entries.push({ key, value: existing[key], commented: false });
        continue;
      }

      if (Object.hasOwn(ancestorDefaults, key)) continue;

      entries.push({ key, value: optionValue, commented: true });
    }

    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }

  #render(format: ConfigFormat, entries: ConfigEntry[]): string {
    if (format === 'json') {
      // JSON has no comment syntax, so commented placeholders are skipped.
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
