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

  retrieve: function(type, id) {
    var dataForType = this._data[type];
    if (id && typeof id === 'object') id = id[this.idField];
    if (dataForType) return dataForType[id];
  },

  length: function(type) {
    return this._length[type] || 0;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(action, type, data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record;

      if (action === 'insert') {
        var id = data[_this.idField];
        var dataForType = _this._data[type];

        if (dataForType && dataForType[id]) {
          reject(new Orbit.AlreadyExistsException(type, data));
          return;
        } else {
          record = Orbit.clone(data);
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
        }

      } else {
        record = _this.retrieve(type, data);
        if (record && !record.deleted) {
          if (action === 'update' || action === 'patch') {
            for (var i in data) {
              if (data.hasOwnProperty(i)) {
                record[i] = data[i];
              }
            }
            if (action === 'update') {
              for (i in record) {
                if (data.hasOwnProperty(i) && data[i] === undefined) {
                  delete record[i];
                }
              }
            }

          } else if (action === 'delete') {
            record.deleted = true;
            _this._length[type]--;
          }

        } else {
          reject(new Orbit.NotFoundException(type, data));
          return;
        }
      }

      Orbit.incrementVersion(record);
      resolve(record);
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
        if (record && !record.deleted) {
          resolve(record);
        } else {
          reject(new Orbit.NotFoundException(type, id));
        }
      }
    });
  },

  _create: function(type, data) {
    return this.transform('insert', type, data);
  },

  _update: function(type, data) {
    return this.transform('update', type, data);
  },

  _patch: function(type, data) {
    return this.transform('patch', type, data);
  },

  _destroy: function(type, data) {
    return this.transform('delete', type, data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(type, query) {
    var all = [],
        dataForType = this._data[type],
        i,
        prop,
        match,
        record;

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        if (query === undefined) {
          match = true;
        } else {
          match = false;
          for (prop in query) {
            if (record[prop] === query[prop]) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
        }
        if (match && !record.deleted) {
          all.push(record);
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