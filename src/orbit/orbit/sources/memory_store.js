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

  retrieve: function(type, id) {
    var path;
    if (id !== undefined) {
      if (typeof id === 'object') id = id[this.idField];
      path = [type, id];
    } else {
      path = [type];
    }
    return this._cache.retrieve(path);
  },

  length: function(type) {
    return Object.keys(this.retrieve(type)).length;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var cache = this._cache;
    return new Orbit.Promise(function(resolve, reject) {
      resolve(cache.transform(operation, true));
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

  _add: function(type, data) {
    var id = this._generateId(),
        path = [type, id],
        _this = this;

    data[this.idField] = id;
    Orbit.incrementVersion(data);

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(type, id);
    });
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    Orbit.incrementVersion(data);

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(type, id);
    });
  },

  _patch: function(type, id, property, value) {
    var _this = this,
        path;

    if (typeof id === 'object') id = id[this.idField];
    path = [type, id].concat(this._cache.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value}).then(function() {
      return _this.retrieve(type, id);
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

    dataForType = this.retrieve(type);

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