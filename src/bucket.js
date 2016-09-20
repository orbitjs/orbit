import Orbit from './main';
import Evented from './evented';

/**
 * Buckets are used by sources to persist transient state, such as logs and
 * queues, that should not be lost in the event of an unexpected exception or
 * shutdown.
 */
export default class Bucket {
  constructor(settings = {}) {
    this._name = settings.name;

    if (settings.version === undefined) {
      settings.version = 1;
    }

    this._applySettings(settings);
  }

  get name() {
    return this._name;
  }

  get namespace() {
    return this._namespace;
  }

  get version() {
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
  upgrade(settings = {}) {
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
  _applySettings(settings) {
    if (settings.namespace) {
      this._namespace = settings.namespace;
    }
    this._version = settings.version;
    return Orbit.Promise.resolve();
  }

  getItem(/* key */) {
    console.error('Bucket#getItem not implemented');
  }

  setItem(/* key, value */) {
    console.error('Bucket#setItem not implemented');
  }

  removeItem(/* key */) {
    console.error('Bucket#removeItem not implemented');
  }
}

Evented.extend(Bucket.prototype);
