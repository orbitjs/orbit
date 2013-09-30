import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function() {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  this.idField = Orbit.idField;
  this.length = 0;

  this._data = {};

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _insertRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var id = data[_this.idField];
      if (_this._data[id]) {
        reject(Orbit.ALREADY_EXISTS);
      } else {
        var record = Orbit.clone(data);
        if (!id) {
          id = record[_this.idField] = _this._generateId();
        }
        _this._data[id] = record;
        _this.length++;

        Orbit.incrementVersion(record);

        resolve(record);
      }
    });
  },

  _updateRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(data);
      if (record) {
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

        Orbit.incrementVersion(record);

        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _patchRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(data);
      if (record) {
        for (var i in data) {
          if (data.hasOwnProperty(i)) {
            record[i] = data[i];
          }
        }

        Orbit.incrementVersion(record);

        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _destroyRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(data);
      if (record) {
        delete _this._data[record[_this.idField]];
        _this.length--;

        Orbit.incrementVersion(record);

        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(id) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (id === undefined || typeof id === 'object') {
        resolve(_this._filter.call(_this, id));
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

  _update: function(data) {
    return this.updateRecord(data);
  },

  _patch: function(data) {
    return this.patchRecord(data);
  },

  _destroy: function(data) {
    return this.destroyRecord(data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Public
  /////////////////////////////////////////////////////////////////////////////

  retrieve: function(id) {
    if (typeof id === 'object') {
      id = id[this.idField];
    }
    return this._data[id];
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(query) {
    var all = [],
        i,
        prop,
        match;

    for (i in this._data) {
      if (this._data.hasOwnProperty(i)) {
        if (query === undefined) {
          match = true;
        } else {
          match = false;
          for (prop in query) {
            if (this._data[i][prop] === query[prop]) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
        }
        if (match) {
          all.push(this._data[i]);
        }
      }
    }
    return all;
  },

  _generateId: function() {
    return Orbit.generateId();
  }
};

export default MemoryStore;