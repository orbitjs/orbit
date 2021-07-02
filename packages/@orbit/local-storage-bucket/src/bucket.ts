import { Orbit, Bucket, BucketSettings } from '@orbit/core';
import { supportsLocalStorage } from './lib/local-storage';

const { assert } = Orbit;

export interface LocalStorageBucketSettings extends BucketSettings {
  delimiter?: string;
}

/**
 * Bucket for persisting transient data in localStorage.
 */
export class LocalStorageBucket extends Bucket {
  private _delimiter: string;

  /**
   * Create a new LocalStorageBucket.
   */
  constructor(settings: LocalStorageBucketSettings = {}) {
    assert(
      'Your browser does not support local storage!',
      supportsLocalStorage()
    );

    settings.name = settings.name || 'localStorage';

    super(settings);

    this._delimiter = settings.delimiter || '/';
  }

  get delimiter(): string {
    return this._delimiter;
  }

  getFullKeyForItem(key: string): string {
    return [this.namespace, key].join(this.delimiter);
  }

  getItem(key: string): Promise<unknown> {
    const fullKey = this.getFullKeyForItem(key);
    return Promise.resolve(
      JSON.parse(Orbit.globals.localStorage.getItem(fullKey))
    );
  }

  setItem(key: string, value: unknown): Promise<void> {
    const fullKey = this.getFullKeyForItem(key);
    Orbit.globals.localStorage.setItem(fullKey, JSON.stringify(value));
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    const fullKey = this.getFullKeyForItem(key);
    Orbit.globals.localStorage.removeItem(fullKey);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    Orbit.globals.localStorage.clear();
    return Promise.resolve();
  }
}
