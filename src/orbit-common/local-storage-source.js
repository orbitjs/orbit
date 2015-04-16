/* eslint-disable valid-jsdoc */
import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import Source from 'orbit/source';
import Cache from './cache';
import Transformable from 'orbit/transformable';

var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
};

/**
 Source for storing data in local storage

 @class LocalStorageSource
 @extends Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
 */
export default class LocalStorageSource extends Source {
  constructor(options = {}) {
    assert('LocalStorageSource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    super(options);

    Transformable.extend(this);

    this.schema    = options.schema;
    this.name      = options.name || 'localStorage';
    this.namespace = options['namespace'] || 'orbit'; // local storage namespace
    this.delimiter = options['delimiter'] || '/'; // local storage key
    this._autosave = options.autosave !== undefined ? options.autosave : true;
    let autoload   = options.autoload !== undefined ? options.autoload : true;

    this._isDirty = false;

    // TODO - move away from using a cache in favor of direct reads/writes to
    //        local storage.
    this.cache = new Cache(options.schema, options.cacheOptions);

    this.on('transform', () => this._saveData());

    if (autoload) { this.load(); }
  }

  // load: function() {
  //   for (var key in window.localStorage) {
  //     if (key.indexOf(this.namespace) === 0) {
  //       var path = key.split(this.delimiter);
  //       var item = JSON.parse(window.localStorage.getItem(key));
  //       this._cache._doc._data[path[1]][path[2]] = item;
  //     }
  //   }
  // },

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

  // getKey: function(path) {
  //   return [this.namespace, path[0], path[1]].join(this.delimiter);
  // },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    this.cache.transform(transform);
    return Orbit.Promise.resolve([transform]);
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

  // _saveData: function(operation) {
  //   if (!this._autosave && !operation) {
  //     this._isDirty = true;
  //     return;
  //   }
  //   var obj = this.retrieve([operation.path[0], operation.path[1]]);
  //
  //   if (operation.op === 'add' || operation.op === 'replace') {
  //     window.localStorage.setItem(this.getKey(operation.path), JSON.stringify(obj));
  //   }
  //   if (operation.op === 'remove') {
  //     window.localStorage.removeItem(this.getKey(operation.path));
  //   }
  //   this._isDirty = false;
  // }
}
