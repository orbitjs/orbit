import Orbit from 'orbit/core';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function(options) {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  options = options || {};

  this.idField = Orbit.idField;
  this._cache = new Document(null, {arrayBasedPaths: true});
  this.configure(options.schema);

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove', 'link', 'unlink']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  configure: function(schema) {
    this.schema = schema;
    this._cache.add(['deleted'], {});
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._configureModel(model);
      }
    }
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

  initRecord: function(type, data) {
    var modelSchema = this.schema.models[type],
        attributes = modelSchema.attributes,
        links = modelSchema.links;

    // init id
    if (data[this.idField] === undefined) {
      data[this.idField] = this._generateId();
    }

    // init default values
    if (attributes) {
      for (var attribute in attributes) {
        if (data[attribute] === undefined && attributes[attribute].defaultValue) {
          if (typeof attributes[attribute].defaultValue === 'function') {
            data[attribute] = attributes[attribute].defaultValue.call(data);
          } else {
            data[attribute] = attributes[attribute].defaultValue;
          }
        }
      }
    }

    // init links
    if (links) {
      data.links = {};
      for (var link in links) {
        if (data.links[link] === undefined && links[link].type === 'hasMany') {
          data.links[link] = {};
        }
      }
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    this._transformCache(operation);

    // Track deleted records
    // Note: cache transforms won't be tracked because we are directly
    // accessing _this._cache, which will not trigger events
    if (operation.op === 'remove' && operation.path.length === 2) {
      this._cache.transform({op: 'add',
                            path: ['deleted'].concat(operation.path),
                            value: true});
    }
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
    var id,
        path,
        _this = this;

    this.initRecord(type, data);
    id = data[this.idField];
    path = [type, id];

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _patch: function(type, id, property, value) {
    var path = [type, id].concat(this._cache.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value});
  },

  _remove: function(type, id) {
    if (typeof id === 'object') id = id[this.idField];

    return this.transform({op: 'remove', path: [type, id]});
  },

  _link: function(type, id, property, value) {
    var linkDef = this.schema.models[type].links[property],
        ops,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') id = id[this.idField];
    if (typeof value === 'object') value = value[this.idField];

    // Add link to primary resource
    ops = [this._linkOp(linkDef, type, id, property, value)];

    // Add inverse link if necessary
    if (linkDef.inverse) {
      var inverseLinkDef = this.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(this._linkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  _unlink: function(type, id, property, value) {
    var linkDef = this.schema.models[type].links[property],
        ops,
        record,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      record = id;
      id = record[this.idField];
    }
    if (typeof value === 'object') value = value[this.idField];

    // Remove link from primary resource
    ops = [this._unlinkOp(linkDef, type, id, property, value)];

    // Remove inverse link if necessary
    if (linkDef.inverse) {
      if (value === undefined) {
        if (record === undefined) {
          record = this.retrieve(type, id);
        }
        value = record.links[property];
      }

      var inverseLinkDef = this.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(this._unlinkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _configureModel: function(name) {
    this._cache.add([name], {});
    this._cache.add(['deleted', name], {});
  },

  _linkOp: function(linkDef, type, id, property, value) {
    var path = [type, id, 'links', property];

    if (linkDef.type === 'hasMany') {
      path.push(value);
      value = true;
    }

    return {
      op: 'add',
      path: path,
      value: value
    };
  },

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
  },

  _transformCache: function(operation) {
    var inverse = this._cache.transform(operation, true);
    this.didTransform(operation, inverse);
  },

  _unlinkOp: function(linkDef, type, id, property, value) {
    var path = [type, id, 'links', property];

    if (linkDef.type === 'hasMany') path.push(value);

    return {
      op: 'remove',
      path: path
    };
  }
};

export default MemoryStore;