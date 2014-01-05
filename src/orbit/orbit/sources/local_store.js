import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';

var LocalStore = function(options) {
  Orbit.assert('LocalStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('Your browser does not support local storage!', supportsLocalStorage());

  options = options || {};
  this.namespace = options['namespace'] || 'orbit'; // local storage key
  this._autosave = options['autosave'] !== undefined ? options['autosave'] : true;
  var autoload = options['autoload'] !== undefined ? options['autoload'] : true;

  this._store = new MemoryStore({schema: options.schema});
  this._isDirty = false;

  // Evented interface
  Orbit.expose(this, this._store, 'on', 'off', 'emit', 'poll', 'listeners', 'resolve', 'settle');

  // Transformable interface
  Orbit.expose(this, this._store, 'transform', 'didTransform', 'transformQueue');

  // Requestable interface
  Orbit.expose(this, this._store, 'find', 'add', 'update', 'patch', 'remove');

  // Cache interface
  Orbit.expose(this, this._store, 'retrieve', 'length', 'isDeleted');

  this._store.on('didTransform', function() {
    this._saveData();
  }, this);

  if (autoload) this.load();
};

var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch(e) {
    return false;
  }
};

LocalStore.prototype = {
  constructor: LocalStore,

  load: function() {
    var storage = window.localStorage.getItem(this.namespace);
    this._store.reset(storage ? JSON.parse(storage) : {});
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
    window.localStorage.setItem(this.namespace, JSON.stringify(this._store.retrieve()));
    this._isDirty = false;
  }
};

export default LocalStore;