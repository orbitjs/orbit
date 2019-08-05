import Orbit from '@orbit/core';
import MemorySource, { MemorySourceSettings } from '@orbit/memory';
export { MemorySourceMergeOptions as StoreMergeOptions } from '@orbit/memory';

const { deprecate } = Orbit;

/**
 * @deprecated
 */
export default class Store extends MemorySource {
  constructor(settings: MemorySourceSettings = {}) {
    settings.name = settings.name || 'store';
    deprecate('@orbit/store package was renamed to @orbit/memory');
    super(settings);
  }
}

export { MemorySourceSettings as StoreSettings };
