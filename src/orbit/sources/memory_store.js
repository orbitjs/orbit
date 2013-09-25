import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function(idField) {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  this.idField = idField || '__id';
  this._data = {};
  this.length = 0;
  this._newId = 0;

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  _localId: function(data) {
    if (typeof data === 'object') {
      if (data[this.idField]) {
        return data[this.idField];

      } else {
        var i,
            prop,
            match;

        for (i in this._data) {
          if (this._data.hasOwnProperty(i)) {
            match = false;
            for (prop in data) {
              if (this._data[i][prop] === data[prop]) {
                match = true;
              } else {
                match = false;
                break;
              }
            }
            if (match) return i;
          }
        }
      }
    } else {
      return data;
    }
  },

  _generateId: function() {
    this._newId++;
    return this._newId;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _insertRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (data[_this.idField]) {
        reject(Orbit.ALREADY_EXISTS);
      } else {
        data[_this.idField] = _this._generateId();
        _this._data[data[_this.idField]] = data;
        _this.length++;
        resolve(data);
      }
    });
  },

  _updateRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this._data[_this._localId(data)];
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
        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _patchRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var record = _this._data[_this._localId(data)];
      if (record) {
        for (var i in data) {
          if (data.hasOwnProperty(i)) {
            record[i] = data[i];
          }
        }
        resolve(record);
      } else {
        reject(Orbit.NOT_FOUND);
      }
    });
  },

  _destroyRecord: function(data) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      var localId = _this._localId(data),
          record = _this._data[localId];

      if (record) {
        delete _this._data[localId];
        _this.length--;
        resolve();
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
      var all,
          i,
          prop,
          match;

      if (id === undefined) {
        all = [];
        for (i in _this._data) {
          if (_this._data.hasOwnProperty(i)) {
            all.push(_this._data[i]);
          }
        }
        resolve(all);

      } else if (typeof id === 'object') {
        all = [];
        for (i in _this._data) {
          if (_this._data.hasOwnProperty(i)) {
            match = false;
            for (prop in id) {
              if (_this._data[i][prop] === id[prop]) {
                match = true;
              } else {
                match = false;
                break;
              }
            }
            if (match) {
              all.push(_this._data[i]);
            }
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
  }
};

export default MemoryStore;