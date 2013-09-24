import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var LocalStore = function(idField, namespace) {
  Orbit.assert('LocalStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('Your browser does not support local storage!', supportsLocalStorage());

  this.idField = idField || 'id';
  this.length = 0;
  this._newId = 0;
  this._data = undefined;

  this._autosave = true;
  this._isDirty = false;

  // namespace used for local storage
  this.namespace = namespace || 'orbit';

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch(e) {
    return false;
  }
};

var updateRecord = function(record, data) {
  for (var i in data) {
    if (data.hasOwnProperty(i)) {
      record[i] = data[i];
    }
  }
  for (i in record) {
    if (data.hasOwnProperty(i) && data[i] === undefined) {
      delete record[i];
    }
  }
};

var patchRecord = function(record, data) {
  for (var i in data) {
    if (data.hasOwnProperty(i)) {
      record[i] = data[i];
    }
  }
};

LocalStore.prototype = {
  constructor: LocalStore,

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

  _insertRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      _this._loadData();

      data[_this.idField] = _this._generateId();
      _this._data[data[_this.idField]] = data;
      _this.length++;

      _this._saveData();

      resolve(data);
    });
  },

  _updateRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      _this._loadData();

      var record = _this._data[data[_this.idField]];
      if (record) {
        updateRecord(record, data);

        _this._saveData();

        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _patchRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      _this._loadData();

      var record = _this._data[data[_this.idField]];
      if (record) {
        patchRecord(record, data);

        _this._saveData();

        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _destroyRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this._data[data[_this.idField]];
      if (record) {
        _this._loadData();

        delete _this._data[data[_this.idField]];
        _this.length--;

        _this._saveData();

        resolve();
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _generateId: function() {
    this._newId++;
    return this._newId;
  },

  _find: function(id) {
    var _this = this;
    return new Orbit.Promise(function(resolve, reject) {
      _this._loadData();

      if (id === undefined) {
        var all = [];
        for (var i in _this._data) {
          if (_this._data.hasOwnProperty(i)) {
            all.push(_this._data[i]);
          }
        }
        resolve(all);
      } else {
        var record = _this._data[id];
        if (record) {
          resolve(record);
        } else {
          reject(Orbit.NOT_FOUND);
        }
      }
    });
  },

  _create: function(data) {
    return this.insertRecord(data);
  },

  _update: function(id, data) {
    data[this.idField] = id;
    return this.updateRecord(data);
  },

  _patch: function(id, data) {
    data[this.idField] = id;
    return this.patchRecord(data);
  },

  _destroy: function(id) {
    var data = {};
    data[this.idField] = id;
    return this.destroyRecord(data);
  },

  // Local storage access

  _loadData: function(forceReload) {
    if (this._data === undefined || forceReload) {
      var storage = window.localStorage.getItem(this.namespace);
      this._data = storage ? JSON.parse(storage) : {};
    }
  },

  _saveData: function(forceSave) {
    if (!this._autosave && !forceSave) {
      this._isDirty = true;
      return;
    }
    if (this._data === undefined) {
      this._loadData();
    } else {
      window.localStorage.setItem(this.namespace, JSON.stringify(this._data));
    }
    this._isDirty = false;
  }
};

export default LocalStore;