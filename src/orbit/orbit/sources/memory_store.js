import Orbit from 'orbit/core';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function(options) {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  options = options || {};

  this.idField = Orbit.idField;
  this._cache = new Document();
  this.configure(options.schema);

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  configure: function(schema) {
    this.schema = schema;
    schema.models.forEach(function(model) {
      this._cache.add([model], {});
    }, this);
  },

  push: function(data) {
    var ops = [],
        type,
        dataForType,
        id,
        dataForItem,
        i,
        _this = this;

    for (type in data) {
      if (data.hasOwnProperty(type)) {
        dataForType = data[type];
        for (i = 0; i < dataForType.length; i++) {
          dataForItem = dataForType[i];
          if (dataForItem[this.idField] === undefined) {
            id = this._generateId();
            dataForItem[this.idField] = id;
          }
          Orbit.incrementVersion(dataForItem);
          ops.push({op: 'add', path: [type, id], value: dataForItem});
        }
      }
    }

    return this.transform(ops).then(function() {
      var records = [];
      for (i = 0; i < ops.length; i++) {
        records.push(_this.retrieve(ops[i].path));
      }
      return records;
    });
  },

  retrieve: function(path) {
    return this._cache.retrieve(path);
  },

  length: function(type) {
    return Object.keys(this.retrieve([type])).length;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (Object.prototype.toString.call(operation) === '[object Array]') {
        var inverse = [];
        for (var i = 0; i < operation.length; i++) {
          try {
            inverse.push(_this._cache.transform(operation[i], true));
          } catch(e) {
            inverse.reverse();
            for (var j = 0; j < inverse.length; j++) {
              _this._cache.transform(inverse[j]);
            }
            reject(e);
            return;
          }
        }
      } else {
        _this._cache.transform(operation);
      }
      resolve();
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
        var record = _this.retrieve([type, id]);
        if (record && !record.deleted) {
          resolve(record);
        } else {
          reject(new Orbit.NotFoundException(type, id));
        }
      }
    });
  },

  _add: function(type, data) {
    var id = this._generateId(),
        path = [type, id],
        _this = this;

    data[this.idField] = id;
    Orbit.incrementVersion(data);

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    Orbit.incrementVersion(data);

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _patch: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        ops = [],
        _this = this;

    for (var i in data) {
      if (data.hasOwnProperty(i) && i !== this.idField) {
        ops.push({op: 'replace', path: path.concat([i]), value: data[i]});
      }
    }

    return this.transform(ops).then(function() {
      return _this.retrieve(path);
    }, function(e) {
      debugger;
    });
  },

  _remove: function(type, data) {
    var id = (typeof data === 'object' ? data[this.idField] : data),
        path = [type, id];

    return this.transform({op: 'remove', path: path});
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        prop,
        match,
        record;

    dataForType = this.retrieve([type]);

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