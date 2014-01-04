import Orbit from 'orbit/core';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import clone from 'orbit/lib/clone';

var RestStore = function(options) {
  Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

  options = options || {};
  this.remoteIdField = options['remoteIdField'] || 'id';
  this.namespace = options['namespace'];
  this.headers = options['headers'];

  this.idField = Orbit.idField;

  this._cache = new Document();
  this.configure(options.schema);
  this._remoteIdMap = {};

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove']);
};

RestStore.prototype = {
  constructor: RestStore,

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

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this,
        path  = operation.path,
        data  = operation.value,
        type  = path[0],
        id    = path[1],
        remoteId,
        record;

    if (path.length > 2) {
      remoteId = this._lookupRemoteId(type, id);
      if (!remoteId) throw new Orbit.NotFoundException(type, data);

      var baseURL = this._buildURL(type, remoteId),
          pathURL = baseURL + '/' + path.slice(2).join('/');

      return this._ajax(baseURL, 'PATCH', {data: {op: operation.op, path: pathURL, value: data}}).then(
        function() {
          if (operation.op === 'replace') operation.op = 'add';
          _this._transformCache(operation);
        }
      );

    } else {
      if (operation.op === 'add') {
        if (id) {
          var recordInCache = _this.retrieve([type, id]);
          if (recordInCache) {
            throw new Orbit.AlreadyExistsException(type, data);
          }
        }

        return this._ajax(this._buildURL(type), 'POST', {data: this._serialize(type, data)}).then(
          function(raw) {
            record = _this._deserialize(type, raw);
            record[_this.idField] = id;
            _this._addToCache(type, record);
          }
        );

      } else {
        remoteId = this._lookupRemoteId(type, data || id);
        if (!remoteId) throw new Orbit.NotFoundException(type, data);

        if (operation.op === 'replace') {
          return this._ajax(this._buildURL(type, remoteId), 'PUT', {data: this._serialize(type, data)}).then(
            function(raw) {
              record = _this._deserialize(type, raw);
              record[_this.idField] = id;
              _this._addToCache(type, record);
            }
          );

        } else if (operation.op === 'remove') {
          return this._ajax(this._buildURL(type, remoteId), 'DELETE').then(function() {
            _this._transformCache(operation);

            // Track deleted records (Note: cache transforms won't be tracked)
            _this._cache.transform({op: 'add', path: ['deleted', type, id], value: true});
          });
        }
      }
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    if (id && (typeof id === 'number' || typeof id === 'string')) {
      var remoteId = this._lookupRemoteId(type, id);
      if (!remoteId) throw new Orbit.NotFoundException(type, id);
      return this._findOne(type, remoteId);

    } else if (id && (typeof id === 'object' && id[this.remoteIdField])) {
      return this._findOne(type, id[this.remoteIdField]);

    } else {
      return this._findQuery(type, id);
    }
  },

  _add: function(type, data) {
    var id = this._generateId(),
        path = [type, id],
        _this = this;

    data[this.idField] = id;

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path,
        _this = this;

    if (id === undefined) {
      id = this._generateId();
      data[this.idField] = id;
    }

    path = [type, id];

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _patch: function(type, data, property, value) {
    var id,
        path,
        _this = this;

    if (typeof data === 'object') {
      id = data[this.idField];
      if (id === undefined) {
        this._addToCache(type, data);
        id = data[this.idField];
      }
    } else {
      id = data;
    }

    path = [type, id].concat(this._cache.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value});
  },

  _remove: function(type, data) {
    var id;

    if (typeof data === 'object') {
      id = data[this.idField];
      if (id === undefined) {
        this._addToCache(type, data);
        id = data[this.idField];
      }
    } else {
      id = data;
    }

    return this.transform({op: 'remove', path: [type, id]});
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _configureModel: function(name) {
    this._cache.add([name], {});
    this._cache.add(['deleted', name], {});
  },

  _findOne: function(type, remoteId) {
    var _this = this;
    return this._ajax(this._buildURL(type, remoteId), 'GET').then(
      function(raw) {
        var record = _this._deserialize(type, raw);
        _this._recordFound(type, record);
        return record;
      }
    );
  },

  _findQuery: function(type, query) {
    var _this = this;

    return this._ajax(this._buildURL(type), 'GET', {data: query}).then(
      function(raw) {
        var eachRaw,
            record,
            records = [];

        raw.forEach(function(eachRaw) {
          record = _this._deserialize(type, eachRaw);
          _this._recordFound(type, record);
          records.push(record);
        });

        return records;
      }
    );
  },

  _recordFound: function(type, record) {
    var remoteId = record[this.remoteIdField],
        id = this._remoteToLocalId(type, remoteId),
        newRecord = (id === undefined);

    if (newRecord) {
      id = record[this.idField] = this._generateId();
    }
    this._addToCache(type, record);

    this.didTransform.call(this, (newRecord ? 'add' : 'replace'), type, record);
  },

  _remoteToLocalId: function(type, remoteId) {
    var dataForType = this._remoteIdMap[type];
    if (dataForType) return dataForType[remoteId];
  },

  _lookupRemoteId: function(type, data) {
    var remoteId;
    if (typeof data === 'object') {
      remoteId = data[this.remoteIdField];
    }
    if (!remoteId) {
      var record = this.retrieve([type, data]);
      if (record) {
        remoteId = record[this.remoteIdField];
      }
    }
    return remoteId;
  },

  _transformCache: function(operation) {
    var inverse = this._cache.transform(operation, true);
    this.didTransform(operation, inverse);
  },

  _addToCache: function(type, record) {
    var id = record[this.idField];
    if (id === undefined) record[this.idField] = id = this._generateId();

    this._transformCache({op: 'add', path: [type, id], value: record});
    this._updateRemoteIdMap(type, id, record[this.remoteIdField]);
  },

  _updateRemoteIdMap: function(type, id, remoteId) {
    if (remoteId) {
      var mapForType = this._remoteIdMap[type];
      if (!mapForType) mapForType = this._remoteIdMap[type] = {};
      mapForType[remoteId] = id;
    }
  },

  _ajax: function(url, method, hash) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      hash = hash || {};
      hash.url = url;
      hash.type = method;
      hash.dataType = 'json';
      hash.context = _this;

//TODO-log      console.log('ajax start', method);

      if (hash.data && method !== 'GET') {
        hash.contentType = 'application/json; charset=utf-8';
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.headers !== undefined) {
        var headers = _this.headers;
        hash.beforeSend = function (xhr) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        };
      }

      hash.success = function(json) {
//TODO-log        console.log('ajax success', method, json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
//TODO-log        console.log('ajax error', method, jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  _buildURL: function(type, remoteId) {
    var host = this.host,
        namespace = this.namespace,
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this._pathForType(type));
    if (remoteId) { url.push(remoteId); }

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  _pathForType: function(type) {
    return this._pluralize(type);
  },

  _pluralize: function(name) {
    // TODO - allow for pluggable inflector
    return name + 's';
  },

  _serialize: function(type, data) {
    var serialized = clone(data);
    delete serialized[this.idField];
    return serialized;
  },

  _deserialize: function(type, data) {
    return data;
  },

  _generateId: function() {
    return Orbit.generateId();
  }
};

export default RestStore;