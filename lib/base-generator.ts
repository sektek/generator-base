import { CoreGenerator } from '@sektek/generator';

import { BaseConfig } from './types/base-config.js';
import { BaseFeatures } from './types/base-features.js';
import { BaseOptions } from './types/base-options.js';

export class BaseGenerator<
  C extends BaseConfig = BaseConfig,
  O extends BaseOptions = BaseOptions,
  F extends BaseFeatures = BaseFeatures,
> extends CoreGenerator<C, O, F> {
  package = '@sektek/base';

  constructor(args: string[], options: O, features?: F) {
    super(args, options, features);
  }
}

export default BaseGenerator;
