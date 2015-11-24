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
var LocalStorageSource = MemorySource.extend({
  init: function(options) {
    assert('LocalStorageSource constructor requires `options`', options);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    this._super.apply(this, arguments);

    this.namespace = options['namespace'] || 'orbit'; // local storage key
    this._autosave = options['autosave'] !== undefined ? options['autosave'] : true;
    var autoload = options['autoload'] !== undefined ? options['autoload'] : true;

    this._isDirty = false;

    this.on('transform', function() {
      this._saveData();
    }, this);

    if (autoload) this.load();
  },

  load: function() {
    var storage = window.localStorage.getItem(this.namespace);
    if (storage) {
      this.cache.reset(JSON.parse(storage));
    }
  },

  enableAutosave: function() {
    if (!this._autosave) {
      this._autosave = true;
      if (this._isDirty) this._saveData();
    }
  },

  disableAutosave: function() {
    if (this._autosave) {
      this._autosave = false;
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _saveData: function(forceSave) {
    if (!this._autosave && !forceSave) {
      this._isDirty = true;
      return;
    }
    window.localStorage.setItem(this.namespace, JSON.stringify(this.cache.get()));
    this._isDirty = false;
  }
});

export default LocalStorageSource;
