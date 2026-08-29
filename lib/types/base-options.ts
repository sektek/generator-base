import { CoreOptions } from '@sektek/generator';

export type BaseOptions = CoreOptions & {
  /**
   * Whether to initialize a git repository (and commit the scaffolded
   * files) after every other composed generator has run. Defaults to
   * `true` — opt out with `--no-git-init`.
   */
  gitInit?: boolean;
};
