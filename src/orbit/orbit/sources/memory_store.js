import Orbit from 'orbit/core';
import Cache from 'orbit/cache';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function(options) {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  options = options || {};

  this.idField = Orbit.idField;

  // Create an internal cache and expose some elements of its interface
  this._cache = new Cache(options.schema);
  Orbit.expose(this, this._cache, 'isDeleted', 'length', 'reset', 'retrieve');

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove', 'link', 'unlink']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

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

  initRecord: function(type, record) {
    this._cache.initRecord(type, record);
  },

  _add: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _patch: function(type, id, property, value) {
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }

    return this.transform({
      op: 'replace',
      path: [type, id].concat(Document.prototype.deserializePath(property)),
      value: value
    });
  },

  _remove: function(type, id) {
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }

    return this.transform({op: 'remove', path: [type, id]});
  },

  _link: function(type, id, property, value) {
    var linkOp = function(linkDef, type, id, property, value) {
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
    };

    var linkDef = this._cache.schema.models[type].links[property],
        ops,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }
    if (typeof value === 'object') {
      var relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.idField];
    }

    // Add link to primary resource
    ops = [linkOp(linkDef, type, id, property, value)];

    // Add inverse link if necessary
    if (linkDef.inverse) {
      var inverseLinkDef = this._cache.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(linkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  _unlink: function(type, id, property, value) {
    var unlinkOp = function(linkDef, type, id, property, value) {
      var path = [type, id, 'links', property];
      if (linkDef.type === 'hasMany') path.push(value);
      return {
        op: 'remove',
        path: path
      };
    };

    var linkDef = this._cache.schema.models[type].links[property],
        ops,
        record,
        relatedRecord,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }
    if (typeof value === 'object') {
      relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.idField];
    }

    // Remove link from primary resource
    ops = [unlinkOp(linkDef, type, id, property, value)];

    // Remove inverse link if necessary
    if (linkDef.inverse) {
      if (value === undefined) {
        if (record === undefined) {
          record = this.retrieve(type, id);
        }
        value = record.links[property];
      }

      var inverseLinkDef = this._cache.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(unlinkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
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

  _transformCache: function(operation) {
    var inverse = this._cache.transform(operation, true);
    this.didTransform(operation, inverse);
  }
};

export default MemoryStore;