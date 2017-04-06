import Orbit from './main';
import evented, { Evented } from './evented';
import { assert } from '@orbit/utils';

export interface BucketSettings {
  name?: string;
  namespace?: string;
  version?: number;
}

/**
 * Buckets can persist state. The base `Bucket` class is abstract and should be
 * extended to created buckets with different persistence strategies.
 *
 * Buckets have a simple map-like interface with methods like `getItem`,
 * `setItem`, and `removeItem`. All methods return promises to enable usage with
 * asynchronous stores like IndexedDB.
 *
 * Buckets can be assigned a unique `namespace` in order to avoid collisions.
 * 
 * Buckets can be assigned a version, and can be "upgraded" to a new version.
 * The upgrade process allows buckets to migrate their data between versions.
 *
 * @export
 * @abstract
 * @class Bucket
 * @implements {Evented}
 */
@evented
export abstract class Bucket implements Evented {
  private _name: string;
  private _namespace: string;
  private _version: number;

  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  /**
   * Creates an instance of Bucket.
   * 
   * @param {BucketSettings} [settings={}] 
   * 
   * @memberOf Bucket
   */
  constructor(settings: BucketSettings = {}) {
    if (settings.version === undefined) {
      settings.version = 1;
    }

    settings.namespace = settings.namespace || 'orbit-bucket';

    this._applySettings(settings);
  }

  /**
   * Retrieves an item from the bucket.
   * 
   * @abstract
   * @param {string} key 
   * @returns {Promise<any>} 
   * 
   * @memberOf Bucket
   */
  abstract getItem(key: string): Promise<any>;

  /**
   * Stores an item in the bucket.
   * 
   * @abstract
   * @param {string} key 
   * @param {*} value 
   * @returns {Promise<void>} 
   * 
   * @memberOf Bucket
   */
  abstract setItem(key: string, value: any): Promise<void>;

  /**
   * Removes an item from the bucket.
   * 
   * @abstract
   * @param {string} key 
   * @returns {Promise<void>} 
   * 
   * @memberOf Bucket
   */
  abstract removeItem(key: string): Promise<void>;

  /**
   * Name used for tracking and debugging a bucket instance.
   * 
   * @readonly
   * @type {string}
   * @memberOf Bucket
   */
  get name(): string {
    return this._name;
  }

  /**
   * The namespace used by the bucket when accessing any items.
   * 
   * This is used to distinguish one bucket's contents from another.
   * 
   * @readonly
   * @type {string}
   * @memberOf Bucket
   */
  get namespace(): string {
    return this._namespace;
  }

  /**
   * The current version of the bucket.
   * 
   * To change versions, `upgrade` should be invoked.
   * 
   * @readonly
   * @type {number}
   * @memberOf Bucket
   */
  get version(): number {
    return this._version;
  }

  /**
   * Upgrades Bucket to a new version with new settings.
   *
   * Settings, beyond `version`, are bucket-specific.
   *
   * @param {BucketSettings} settings 
   * @returns {Promise<void>} 
   * @memberOf Bucket
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
   * @param {BucketSettings} settings 
   * @returns {Promise<void>} 
   * @memberOf Bucket
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
