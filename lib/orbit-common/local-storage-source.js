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
 @param {OC.Schema} schema
 @param {Object}    [options]
 @constructor
 */
var LocalStorageSource = MemorySource.extend({
  init: function(schema, options) {
    assert('Your browser does not support local storage!', supportsLocalStorage());

    this._super.apply(this, arguments);

    options = options || {};
    this.namespace = options['namespace'] || 'orbit'; // local storage namespace
    this.delimiter = options['delimiter'] || '/'; // local storage key
    this._autosave = options['autosave'] !== undefined ? options['autosave'] : true;
    var autoload = options['autoload'] !== undefined ? options['autoload'] : true;

    this._isDirty = false;

    this.on('didTransform', this._saveData, this);

    if (autoload) this.load();
  },

  load: function() {
    for (var key in window.localStorage) {
      if (key.indexOf(this.namespace) === 0) {
        var path = key.split(this.delimiter);
        var item = JSON.parse(window.localStorage.getItem(key));
        this._cache._doc._data[path[1]][path[2]] = item;
      }
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

  getKey: function(path) {
    return [this.namespace, path[0], path[1]].join(this.delimiter);
  },


  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _saveData: function(operation) {
    if (!this._autosave && !operation) {
      this._isDirty = true;
      return;
    }
    var obj = this.retrieve([operation.path[0], operation.path[1]]);

    if (operation.op === 'add' || operation.op === 'replace') {
      window.localStorage.setItem(this.getKey(operation.path), JSON.stringify(obj));
    }
    if (operation.op === 'remove') {
      window.localStorage.removeItem(this.getKey(operation.path));
    }
    this._isDirty = false;
  }
});

export default LocalStorageSource;
