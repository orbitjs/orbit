import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';

var LocalStore = function(namespace) {
  Orbit.assert('LocalStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('Your browser does not support local storage!', supportsLocalStorage());

  this._store = new MemoryStore();

  this._autosave = true;
  this._isDirty = false;

  this.length = 0;

  // namespace used for local storage
  this.namespace = namespace || 'orbit';

  var _this = this;
  ['insertRecord', 'updateRecord', 'patchRecord', 'destroyRecord',
   'find', 'create', 'update', 'patch', 'destroy',
   'retrieve'].forEach(function(method) {

    _this[method] = _this._store[method];
  });

  _this._store.on('didInsertRecord didUpdateRecord didPatchRecord didDestroyRecord', function() {
    _this.length = _this._store.length;
    _this._saveData();
  });
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

  /////////////////////////////////////////////////////////////////////////////
  // Public
  /////////////////////////////////////////////////////////////////////////////

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

  _loadData: function(forceReload) {
    if (this._store._data === undefined || forceReload) {
      var storage = window.localStorage.getItem(this.namespace);
      this._store._data = storage ? JSON.parse(storage) : {};
    }
  },

  _saveData: function(forceSave) {
    if (!this._autosave && !forceSave) {
      this._isDirty = true;
      return;
    }
    if (this._store._data === undefined) {
      this._loadData();
    } else {
      window.localStorage.setItem(this.namespace, JSON.stringify(this._store._data));
    }
    this._isDirty = false;
  }
};

export default LocalStore;