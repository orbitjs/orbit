import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function() {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  this.idField = Orbit.idField;

  this._data = {};
  this._length = {};

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _insertRecord: function(type, data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var id = data[_this.idField];
      var dataForType = _this._data[type];

      if (dataForType && dataForType[id]) {
        reject(new Orbit.AlreadyExistsException(data));
      } else {
        var record = Orbit.clone(data);
        if (!id) {
          id = record[_this.idField] = _this._generateId();
        }
        if (!dataForType) {
          dataForType = _this._data[type] = {};
          _this._length[type] = 1;
        } else {
          _this._length[type]++;
        }
        dataForType[id] = record;

        Orbit.incrementVersion(record);

        resolve(record);
      }
    });
  },

  _updateRecord: function(type, data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(type, data);
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
        reject(new Orbit.NotFoundException(data));
      }
    });
  },

  _patchRecord: function(type, data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(type, data);
      if (record) {
        for (var i in data) {
          if (data.hasOwnProperty(i)) {
            record[i] = data[i];
          }
        }

        Orbit.incrementVersion(record);

        resolve(record);
      } else {
        reject(new Orbit.NotFoundException(data));
      }
    });
  },

  _destroyRecord: function(type, data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this.retrieve(type, data);
      if (record) {
        record.deleted = true;
        _this._length[type]--;

        Orbit.incrementVersion(record);

        resolve(record);
      } else {
        reject(new Orbit.NotFoundException(data));
      }
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (id === undefined || typeof id === 'object') {
        resolve(_this._filter.call(_this, type, id));
      } else {
        var record = _this.retrieve(type, id);
        if (record) {
          resolve(record);
        } else {
          reject(new Orbit.NotFoundException(id));
        }
      }
    });
  },

  _create: function(type, data) {
    return this.insertRecord(type, data);
  },

  _update: function(type, data) {
    return this.updateRecord(type, data);
  },

  _patch: function(type, data) {
    return this.patchRecord(type, data);
  },

  _destroy: function(type, data) {
    return this.destroyRecord(type, data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Public
  /////////////////////////////////////////////////////////////////////////////

  retrieve: function(type, id) {
    var dataForType = this._data[type];
    if (id && typeof id === 'object') id = id[this.idField];
    if (dataForType) return dataForType[id];
  },

  length: function(type) {
    return this._length[type] || 0;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(type, query) {
    var all = [],
        dataForType = this._data[type],
        i,
        prop,
        match;

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        if (query === undefined) {
          match = true;
        } else {
          match = false;
          for (prop in query) {
            if (dataForType[i][prop] === query[prop]) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
        }
        if (match) {
          all.push(dataForType[i]);
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