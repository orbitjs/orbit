import Orbit from './main';
import evented, { Evented } from './evented';
import { assert } from '@orbit/utils';

export interface BucketSettings {
  name?: string;
  namespace?: string;
  version?: number;
}

/**
 * Buckets are used by sources to persist transient state, such as logs and
 * queues, that should not be lost in the event of an unexpected exception or
 * shutdown.
 */
@evented
export default class Bucket implements Evented {
  private _name: string;
  private _namespace: string;
  private _version: number;

  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(settings: BucketSettings = {}) {
    if (settings.version === undefined) {
      settings.version = 1;
    }

    settings.namespace = settings.namespace || 'orbit-bucket';

    this._applySettings(settings);
  }

  getItem: (key: string) => Promise<any>;

  setItem: (key: string, value: any) => Promise<void>;

  removeItem: (key: string) => Promise<void>;

  get name(): string {
    return this._name;
  }

  get namespace(): string {
    return this._namespace;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Upgrades Bucket to a new version with new settings.
   *
   * Settings, beyond `version`, are bucket-specific.
   *
   * @param  {Object}   [settings={}]      Settings.
   * @param  {Integer}  [settings.version] Optional. Version. Defaults to the current version + 1.
   * @return {Promise}                     Promise that resolves when upgrade has completed.
   */
  upgrade(settings: BucketSettings = {}): Promise<void> {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }
    return this._applySettings(settings)
      .then(() => this.emit('upgrade', this._version));
  }

  /**
   * Applies settings passed from a `constructor` or `upgrade`.
   *
   * @private
   * @param  {Object}   settings          Settings.
   * @param  {Integer}  settings.version  Bucket version.
   * @return {Promise}                    Promise that resolves when settings have been applied.
   */
  _applySettings(settings: BucketSettings): Promise<void> {
    if (settings.name) {
      this._name = settings.name;
    }
    if (settings.namespace) {
      this._namespace = settings.namespace;
    }
    this._version = settings.version;
    return Orbit.Promise.resolve();
  }
}
