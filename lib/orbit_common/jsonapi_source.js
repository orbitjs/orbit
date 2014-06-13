import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { clone, extend, isArray } from 'orbit/lib/objects';
import Source from './source';
import { RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';

/**
 Source for accessing a JSON API compliant RESTful API with AJAX

 @class JSONAPISource
 @extends Source
 @namespace OC
 @param schema
 @param options
 @constructor
 */
var JSONAPISource = function() {
  this.init.apply(this, arguments);
};

extend(JSONAPISource.prototype, Source.prototype, {
  constructor: JSONAPISource,

  init: function(schema, options) {
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

    Source.prototype.init.apply(this, arguments);

    options = options || {};
    this.schema = schema;
    this.namespace = options['namespace'];
    this.headers = options['headers'];

    this._remoteToLocalIdMap = {};
    this._localToRemoteIdMap = {};
  },

  normalize: function(type, data) {
    var id = data[this.schema.idField],
        remoteId = data[this.schema.remoteIdField];

    if (remoteId && !id) {
      id = data[this.idField] = this._remoteToLocalId(remoteId);
    }

    var record = Source.prototype.normalize.call(this, type, data);

    id = id || this.getId(record);

    this._updateRemoteIdMap(type, id, remoteId);

    return record;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this,
        op    = operation.op,
        path  = operation.path,
        data  = operation.value,
        type  = path[0],
        id    = path[1],
        remoteId,
        record;

    if (path.length > 2) {
      remoteId = this._localToRemoteId(type, id);
      if (!remoteId) throw new RecordNotFoundException(type, id);

      var baseURL = this.buildURL(type, remoteId);

      path = path.slice(2);

      if (path[0] === '__rel') {
        path[0] = 'links';

        var property = path[1];
        var linkDef = this._cache.schema.models[type].links[property];
        var linkedId;

        if (op === 'remove') {
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

      var remoteOp = {op: op, path: baseURL + '/' + path.join('/')};
      if (data) remoteOp.value = data;

      return this.ajax(baseURL, 'PATCH', {data: remoteOp}).then(
        function() {
          _this._transformCache(operation);
        }
      );

    } else {
      if (op === 'add') {
        if (id) {
          var recordInCache = _this.retrieve([type, id]);
          if (recordInCache) throw new RecordAlreadyExistsException(type, id);
        }

        return this.ajax(this.buildURL(type), 'POST', {data: this.serialize(type, data)}).then(
          function(raw) {
            record = _this.deserialize(type, raw);
            record[_this.schema.idField] = id;
            _this._addToCache(type, record);
          }
        );

      } else {
        remoteId = this._localToRemoteId(type, id);
        if (!remoteId) throw new RecordNotFoundException(type, id);

        if (op === 'replace') {
          return this.ajax(this.buildURL(type, remoteId), 'PUT', {data: this.serialize(type, data)}).then(
            function(raw) {
              record = _this.deserialize(type, raw);
              record[_this.schema.idField] = id;
              _this._addToCache(type, record);
            }
          );

        } else if (op === 'remove') {
          return this.ajax(this.buildURL(type, remoteId), 'DELETE').then(function() {
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
    var remoteId;

    if (id && (typeof id === 'number' || typeof id === 'string')) {
      remoteId = this._localToRemoteId(type, id);
      if (!remoteId) throw new RecordNotFoundException(type, id);
      return this._findOne(type, remoteId);

    } else if (id && isArray(id)) {
      var localId,
          remoteIds = [],
          notFound = [];

      for (var i = 0, l = id.length; i < l; i++) {
        localId =  id[i];
        if (typeof localId === 'object' && localId[this.schema.remoteIdField]) {
          remoteId = localId[this.schema.remoteIdField];
        } else {
          remoteId = this._localToRemoteId(type, localId);
        }
        if (remoteId) {
          remoteIds.push(remoteId);
        } else {
          notFound.push(localId);
        }
      }

      if (notFound.length > 0) {
        throw new RecordNotFoundException(type, notFound);
      } else {
        return this._findMany(type, remoteIds);
      }

    } else if (id && (typeof id === 'object' && id[this.schema.remoteIdField])) {
      return this._findOne(type, id[this.schema.remoteIdField]);

    } else {
      return this._findQuery(type, id);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _addToCache: function(type, record) {
    record = this.normalize(type, record);
    this._transformCache({
      op: 'add',
      path: [type, this.getId(record)],
      value: record
    });
    return record;
  },

  _findOne: function(type, remoteId) {
    var _this = this;
    return this.ajax(this.buildURL(type, remoteId), 'GET').then(
      function(raw) {
        var deserialized = _this.deserialize(type, raw);
        var record = _this._addToCache(type, deserialized);
        return _this.settleTransforms().then(function() {
          return record;
        });
      }
    );
  },

  _findMany: function(type, remoteIds) {
    var _this = this;
    return this.ajax(this.buildURL(type, remoteIds), 'GET').then(
      function(raw) {
        var eachRaw,
            deserialized,
            record,
            records = [];

        raw.forEach(function(eachRaw) {
          deserialized = _this.deserialize(type, eachRaw);
          record = _this._addToCache(type, deserialized);
          records.push(record);
        });

        return _this.settleTransforms().then(function() {
          return records;
        });
      }
    );
  },

  _findQuery: function(type, query) {
    var _this = this;

    return this.ajax(this.buildURL(type), 'GET', {data: query}).then(
      function(raw) {
        var eachRaw,
            deserialized,
            record,
            records = [];

        raw.forEach(function(eachRaw) {
          deserialized = _this.deserialize(type, eachRaw);
          record = _this._addToCache(type, deserialized);
          records.push(record);
        });

        return _this.settleTransforms().then(function() {
          return records;
        });
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

    if (this.retrieve(pathToVerify)) {
      // transforming the cache will trigger a call to `_cacheDidTransform`,
      // which will then trigger `didTransform`
      this._cache.transform(operation);

    } else {
      // if the cache can't be transformed because, still trigger `didTransform`
      //
      // NOTE: this is not an error condition, since the local cache will often
      // be sparsely populated compared with the remote store
      this.didTransform(operation, []);
    }
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

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  ajax: function(url, method, hash) {
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

  buildURL: function(type, remoteId) {
    var host = this.host,
        namespace = this.namespace,
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.pathForType(type));
    if (remoteId) {
      if (isArray(remoteId)) {
        url.push(remoteId.join(','));
      } else {
        url.push(remoteId);
      }
    }

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  pathForType: function(type) {
    return this.pluralize(type);
  },

  pluralize: function(name) {
    // TODO - allow for pluggable inflector
    return name + 's';
  },

  serialize: function(type, data) {
    var serialized = clone(data);

    delete serialized.__normalized;
    delete serialized.__rev;

    if (this.schema.idField !== this.schema.remoteIdField) {
      delete serialized[this.schema.idField];
    }

    if (serialized.__rel) {
      var links = {};
      for (var i in serialized.__rel) {
        var link = serialized.__rel[i];
        if (typeof link === 'object') {
          links[i] = Object.keys(link);
        } else {
          links[i] = link;
        }
      }
      delete serialized.__rel;
      serialized.links = links;
    }

    return serialized;
  },

  deserialize: function(type, data) {
    return data;
  }
});

export default JSONAPISource;