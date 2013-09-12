import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import RSVP from 'rsvp';

var NOT_FOUND = 'Record not found';

var MemoryStore = function(idField) {
  this.idField = idField || 'id';
  this._data = {};
  this.length = 0;
  this._newId = 0;

  Transformable.extend(this);
  Requestable.extend(this, ['find']);
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

MemoryStore.prototype = {
  constructor: MemoryStore,

  _transform: function(operation, data) {
    var _this = this;

    return new RSVP.Promise(function(resolve, reject) {
      var record;

      if (operation === 'insert') {
        data[_this.idField] = _this._generateId();
        _this._data[data[_this.idField]] = data;
        _this.length++;
        resolve(data);

      } else if (operation === 'update') {
        record = _this._data[data[_this.idField]];
        if (record) {
          updateRecord(record, data);
          resolve(record);
        } else {
          reject(NOT_FOUND);
        }

      } else if (operation === 'patch') {
        record = _this._data[data[_this.idField]];
        if (record) {
          patchRecord(record, data);
          resolve(record);
        } else {
          reject(NOT_FOUND);
        }

      } else if (operation === 'destroy') {
        record = _this._data[data[_this.idField]];
        if (record) {
          delete _this._data[data[_this.idField]];
          _this.length--;
          resolve();
        } else {
          reject(NOT_FOUND);
        }
      }
    });
  },

  _generateId: function() {
    this._newId++;
    return this._newId;
  },

  _find: function(id) {
    var _this = this;
    return new RSVP.Promise(function(resolve, reject) {
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
          reject(NOT_FOUND);
        }
      }
    });
  }
};

export default MemoryStore;