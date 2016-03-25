import { assert } from 'orbit/lib/assert';
import MemorySource from './memory-source';

var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch(e) {
    return false;
  }
};

/**
 Source for storing data in local storage

 @class LocalStorageSource
 @extends MemorySource
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
 */
export default class LocalStorageSource extends MemorySource {
  constructor(options = {}) {
    assert('Your browser does not support local storage!', supportsLocalStorage());

    super(options);

    this.name      = options.name || 'localStorage';
    this.namespace = options.namespace || 'orbit'; // local storage key
    this._autosave = options.autosave !== undefined ? options.autosave : true;
    let autoload   = options.autoload !== undefined ? options.autoload : true;

    this._isDirty = false;

    this.on('transform', () => this._saveData());

    if (autoload) { this.load(); }
  }

  load() {
    var storage = window.localStorage.getItem(this.namespace);
    if (storage) {
      this.cache.reset(JSON.parse(storage));
    }
  }

  enableAutosave() {
    if (!this._autosave) {
      this._autosave = true;
      if (this._isDirty) { this._saveData(); }
    }
  }

  disableAutosave() {
    if (this._autosave) {
      this._autosave = false;
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _saveData(forceSave) {
    if (!this._autosave && !forceSave) {
      this._isDirty = true;
      return;
    }
    window.localStorage.setItem(this.namespace, JSON.stringify(this.cache.get()));
    this._isDirty = false;
  }
}
