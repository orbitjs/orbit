import Orbit from 'orbit/core';
import Store from 'orbit/sources/store';
import clone from 'orbit/lib/clone';

var RestStore = function() {
  this.init.apply(this, arguments);
};

Orbit.extend(RestStore.prototype, Store.prototype, {
  constructor: RestStore,

  init: function(schema, options) {
    Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
    Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

    Store.prototype.init.apply(this, arguments);

    options = options || {};
    this.remoteIdField = options['remoteIdField'] || 'id';
    this.namespace = options['namespace'];
    this.headers = options['headers'];

    this._remoteToLocalIdMap = {};
    this._localToRemoteIdMap = {};
  },

  initRecord: function(type, record) {
    var id = record[this.idField],
        remoteId = record[this.remoteIdField];

    if (remoteId && !id) {
      id = record[this.idField] = this._remoteToLocalId(remoteId);
    }

    if (!id) {
      this._cache.initRecord(type, record);
      id = record[this.idField];
    }

    this._updateRemoteIdMap(type, id, remoteId);
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
      remoteId = this._localToRemoteId(type, id);
      if (!remoteId) throw new Orbit.NotFoundException(type, id);

      var baseURL = this._buildURL(type, remoteId);

      path = path.slice(2);

      if (path[0] === 'links') {
        var property = path[1];
        var linkDef = this._cache.schema.models[type].links[property];

        var linkedId;

        if (operation.op === 'remove') {
          if (path.length > 2) {
            linkedId = path.pop();
            path.push(this._localToRemoteId(linkDef.model, linkedId));
          }

        } else {
          if (path.length > 2) {
            linkedId = path.pop();
            path.push('-');
          } else {
            linkedId = data;
          }
          data = this._localToRemoteId(linkDef.model, linkedId);
        }
      }

      var remoteOp = {op: operation.op, path: baseURL + '/' + path.join('/')};
      if (data) remoteOp.value = data;

      return this._ajax(baseURL, 'PATCH', {data: remoteOp}).then(
        function() {
          _this._transformCache(operation);
        }
      );

    } else {
      if (operation.op === 'add') {
        if (id) {
          var recordInCache = _this.retrieve([type, id]);
          if (recordInCache) throw new Orbit.AlreadyExistsException(type, id);
        }

        return this._ajax(this._buildURL(type), 'POST', {data: this._serialize(type, data)}).then(
          function(raw) {
            record = _this._deserialize(type, raw);
            record[_this.idField] = id;
            _this._addToCache(type, record);
          }
        );

      } else {
        remoteId = this._localToRemoteId(type, id);
        if (!remoteId) throw new Orbit.NotFoundException(type, id);

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
      var remoteId = this._localToRemoteId(type, id);
      if (!remoteId) throw new Orbit.NotFoundException(type, id);
      return this._findOne(type, remoteId);

    } else if (id && (typeof id === 'object' && id[this.remoteIdField])) {
      return this._findOne(type, id[this.remoteIdField]);

    } else {
      return this._findQuery(type, id);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _addToCache: function(type, record) {
    this.initRecord(type, record);
    this._transformCache({
      op: 'add',
      path: [type, record[this.idField]],
      value: record
    });
  },

  _findOne: function(type, remoteId) {
    var _this = this;
    return this._ajax(this._buildURL(type, remoteId), 'GET').then(
      function(raw) {
        var record = _this._deserialize(type, raw);
        _this._addToCache(type, record);
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
          _this._addToCache(type, record);
          records.push(record);
        });

        return records;
      }
    );
  },

  _localToRemoteId: function(type, id) {
    var dataForType = this._localToRemoteIdMap[type];
    if (dataForType) return dataForType[id];
  },

  _remoteToLocalId: function(type, remoteId) {
    var dataForType = this._remoteToLocalIdMap[type];
    if (dataForType) return dataForType[remoteId];
  },

  _transformCache: function(operation) {
    var pathToVerify,
        inverse;

    if (operation.op === 'add') {
      pathToVerify = operation.path.slice(0, operation.path.length - 1);
    } else {
      pathToVerify = operation.path;
    }

    if (!this.retrieve(pathToVerify)) {
      console.log('rest store does not have cached', pathToVerify, 'for operation', operation);
      inverse = [];

    } else {
      inverse = this._cache.transform(operation, true);
    }

    this.didTransform(operation, inverse);
  },

  _updateRemoteIdMap: function(type, id, remoteId) {
    if (id && remoteId) {
      var mapForType;

      mapForType = this._remoteToLocalIdMap[type];
      if (!mapForType) mapForType = this._remoteToLocalIdMap[type] = {};
      mapForType[remoteId] = id;

      mapForType = this._localToRemoteIdMap[type];
      if (!mapForType) mapForType = this._localToRemoteIdMap[type] = {};
      mapForType[id] = remoteId;
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

    if (serialized.links) {
      var links = {};
      for (var i in serialized.links) {
        var link = serialized.links[i];
        if (typeof link === 'object') {
          links[i] = Object.keys(link);
        } else {
          links[i] = link;
        }
      }
      serialized.links = links;
    }

    return serialized;
  },

  _deserialize: function(type, data) {
    return data;
  }
});

export default RestStore;