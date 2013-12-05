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
    this._cache.add(['deleted'], {});
    schema.models.forEach(function(model) {
      this._cache.add([model], {});
      this._cache.add(['deleted', model], {});
    }, this);
  },

  retrieve: function(path) {
    try {
      return this._cache.retrieve(path);
    } catch(e) {
      return null;
    }
  },

  length: function(path) {
    return Object.keys(this.retrieve(path)).length;
  },

  isDeleted: function(path) {
    // TODO - normalize paths
    if (typeof path === 'string') {
      path = path.split('/');
    }
    return this.retrieve(['deleted'].concat(path));
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation, transaction) {
    var _this = this;
    return new Orbit.Promise(function(resolve, reject) {
      if (transaction) {
        transaction.inverse.push(_this._cache.transform(operation, true));
      } else {
        _this._cache.transform(operation);

        // Track deleted records
        if (operation.op === 'remove') {
          // TODO - normalize paths
          var path = operation.path;
          if (typeof path === 'string') {
            path = path.split('/');
          }
          if (path.length === 2) {
            _this._cache.transform({op: 'add', path: ['deleted'].concat(path), value: true});
          }
        }
      }
      resolve(_this.retrieve(operation.path));
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

    return this.transform({op: 'add', path: path, value: data});
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    Orbit.incrementVersion(data);

    return this.transform({op: 'replace', path: path, value: data});
  },

  _patch: function(type, id, property, value) {
    var _this = this,
        path;

    if (typeof id === 'object') id = id[this.idField];
    path = [type, id].concat(this._cache.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value});
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