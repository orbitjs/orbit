import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, toArray, isObject, isNone, merge } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import ActionQueue from 'orbit/action-queue';
import Source from './source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi-serializer';
import { OperationNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';
import TransformResult from 'orbit/transform-result';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import DeletionTrackingProcessor from 'orbit-common/operation-processors/deletion-tracking-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';

/**
 Source for accessing a JSON API compliant RESTful API with AJAX

 @class JSONAPISource
 @extends Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @param {Boolean}   [options.useCache=true]
 @param {Object}    [options.cacheOptions] Options for cache, if used.
 @constructor
 */
export default Source.extend({

  init: function(options) {
    assert('JSONAPISource constructor requires `options`', options);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

    options.useCache = options.useCache !== undefined ? options.useCache : true;
    if (options.useCache) {
      options.cacheOptions = options.cacheOptions || {};
      options.cacheOptions.processors =  options.cacheOptions.processors || [SchemaConsistencyProcessor, CacheIntegrityProcessor, DeletionTrackingProcessor];
    }

    this._super.call(this, options);

    this.namespace        = options.namespace || this.namespace;
    this.host             = options.host || this.host;
    this.headers          = options.headers || this.headers;
    this.SerializerClass  = options.SerializerClass || this.SerializerClass;
    this.appendSlash      = options.appendSlash || this.appendSlash;

    // If `SerializerClass` is obtained through the _super chain, dereference
    // its wrapped function, which will be the constructor.
    //
    // Note: This is only necessary when retrieving a *constructor* from a
    //       class hierarchy. Otherwise, `superWrapper` "just works".
    if (this.SerializerClass && this.SerializerClass.wrappedFunction) {
      this.SerializerClass = this.SerializerClass.wrappedFunction;
    }

    this.serializer = new this.SerializerClass(this.schema);

    assert('Serializer must be an instance of OC.Serializer', this.serializer instanceof Serializer);
  },

  namespace: null,
  host: null,
  headers: null,
  SerializerClass: JSONAPISerializer,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(ops) {
    var fullResult = new TransformResult();
    var queue = new ActionQueue({autoProcess: false});
    var operation;
    var method;
    var action;

    for (var i = 0, len = ops.length; i < len; i++) {
      operation = ops[i];

      if (action && this._mergeOperationWithAction(action, operation)) {
        // Operation merged with previous action.
      } else {
        // Not able to merge operation with previous action, so we need to
        // queue a new action.
        method = this._operationMethod(operation);
        action = this._createTransformAction(method, operation, fullResult);
        queue.push(action);
      }
    }

    return queue.process().then(function() {
      return fullResult;
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id, options) {
    if (options) throw new Exception('`JSONAPISource#findLink` does not support `options` argument');

    if (isNone(id)) {
      return this._findAll(type);

    } else if (isArray(id)) {
      return this._findMany(type, id);

    } else {
      return this._findOne(type, id);
    }
  },

  _findLink: function(type, id, link, options) {
    var _this = this;

    if (options) throw new Exception('`JSONAPISource#findLink` does not support `options` argument');

    id = this.getId(type, id);

    return this.ajax(this.resourceLinkURL(type, id, link), 'GET').then(
      function(raw) {
        var relId = _this.serializer.deserializeLink(raw.data);
        return relId;
      }
    );
  },

 _findLinked: function(type, id, link, options) {
   var _this = this;

   if (options) throw new Exception('`JSONAPISource#findLinked` does not support `options` argument');

   id = this.getId(type, id);

   return this.ajax(this.resourceLinkedURL(type, id, link), 'GET').then(
     function(raw) {
       var linkDef = _this.schema.linkDefinition(type, link);

       var result = _this.deserialize(linkDef.model, null, raw);

       return _this.transformed(result.result).then(function() {
         return result.data;
       });
     }
   );
 },

 _query: function(type, query, options) {
   var _this = this;

   if (options) throw new Exception('`JSONAPISource#query` does not support `options` argument');

   return this.ajax(this.resourceURL(type), 'GET', {data: {filter: query}}).then(
     function(raw) {
       var deserialized = _this.deserialize(type, null, raw);
       return _this.transformed(deserialized.result).then(function() {
         return deserialized.data;
       });
     }
   );
 },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformAdd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var json = this.serializer.serialize(type, operation.value);

    return this.ajax(this.resourceURL(type), 'POST', {data: json}).then(
      function(raw) {
        var result = _this._transformCache(operation);

        var deserialized = _this.deserialize(type, id, raw);
        if (!deserialized.result.isEmpty()) {
          _this.transformed(deserialized.result);
        }

        return result;
      }
    );
  },

  _transformReplace: function(ops) {
    ops = toArray(ops);

    var _this = this;
    var type = ops[0].path[0];
    var id = ops[0].path[1];
    var modelDef = this.schema.modelDefinition(type);

    var record = {};

    ops.forEach(function(operation) {
      var path = operation.path;
      var value = operation.value;
      if (path[2]) {
        if (path[2] === '__rel') {
          record.__rel = record.__rel || {};
          record.__rel[path[3]] = value;
        } else {
          record[path[2]] = value;
        }
      } else {
        record = merge(record, value);
      }
    });

    record[modelDef.primaryKey.name] = id;

    var json = this.serializer.serialize(type, record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json}).then(
      function(raw) {
        var result = _this._transformCache(ops);

        // TODO - better 204 (no content) checking
        if (raw && Object.keys(raw).length > 0) {
          var deserialized = _this.deserialize(type, id, raw);
          if (!deserialized.result.isEmpty()) {
            _this.transformed(deserialized.result);
          }
        }

        return result;
      }
    );
  },

  _transformRemove: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];

    return this.ajax(this.resourceURL(type, id), 'DELETE').then(function() {
      return _this._transformCache({op: 'remove', path: [type, id]});
    });
  },

  _transformAddLink: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;
    var relType = this.schema.linkDefinition(type, link).model;
    var method = 'POST';
    var json = {
      data: [this.serializer.serializeRelationshipIdentifier(relType, relId)]
    };

    return this.ajax(this.resourceLinkURL(type, id, link), method, {data: json}).then(
      function() {
        return _this._transformCache(operation);
      }
    );
  },

  _transformRemoveLink: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4];
    var relType = this.schema.linkDefinition(type, link).model;
    var method = 'DELETE';
    var json = {
      data: [this.serializer.serializeRelationshipIdentifier(relType, relId)]
    };

    return this.ajax(this.resourceLinkURL(type, id, link), method, {data: json}).then(
      function() {
        return _this._transformCache(operation);
      }
    );
  },

  _transformReplaceLink: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;
    var linkDef = this.schema.linkDefinition(type, link);
    var relType = linkDef.model;
    var data;

    if (linkDef.type === 'hasMany') {
      // Convert a map of ids to an array
      if (isObject(relId)) {
        data = Object.keys(relId).map(function(id) {
          return this.serializer.serializeRelationshipIdentifier(relType, id);
        }, this);
      } else {
        data = [this.serializer.serializeRelationshipIdentifier(relType, relId)];
      }
    } else {
      data = this.serializer.serializeRelationshipIdentifier(relType, relId);
    }

    var method = 'PATCH';
    var json = {
      data: data
    };

    return this.ajax(this.resourceLinkURL(type, id, link), method, {data: json}).then(
      function() {
        return _this._transformCache(operation);
      }
    );
  },

  _transformReplaceAttribute: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var attr = operation.path[2];
    var modelDef = this.schema.modelDefinition(type);

    var record = {};
    record[attr] = operation.value;
    record[modelDef.primaryKey.name] = id;

    var json = this.serializer.serialize(type, record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json}).then(
      function(raw) {
        return _this._transformCache(operation);
      }
    );
  },

  _operationMethod: function(operation) {
    var op = operation.op;
    var path = operation.path;

    if (path.length > 2) {
      if (path[2] === '__rel') {
        if (op === 'add') {
          return '_transformAddLink';
        } else if (op === 'remove') {
          return '_transformRemoveLink';
        } else if (op === 'replace') {
          return '_transformReplaceLink';
        }
      } else {
        return '_transformReplaceAttribute';
      }

    } else if (path.length > 1) {
      if (op === 'add') {
        return '_transformAdd';

      } else if (op === 'replace') {
        return '_transformReplace';

      } else if (op === 'remove') {
        return '_transformRemove';
      }
    }
  },

  _mergeOperationWithAction: function(action, operation) {
    var actionOperation = toArray(action.data.operation)[0];

    // Merge replace operations with previous replace operations that update
    // the same record.
    if (actionOperation.op === 'replace' && operation.op === 'replace' &&
        actionOperation.path[0] === operation.path[0] &&
        actionOperation.path[1] === operation.path[1]) {

      action.data.method = '_transformReplace';
      action.data.operation = toArray( action.data.operation ).concat([operation]);

      return true;
    }
  },

  _createTransformAction: function(method, operation, fullResult) {
    var _this = this;

    return {
      data: {
        method: method,
        operation: operation
      },
      process: function() {
        return _this[this.data.method].call(_this, this.data.operation).then(function(result) {
          if (result) {
            fullResult.concat(result);
          }
        });
      }
    };
  },

  _findAll: function(type) {
    var _this = this;
    return this.ajax(this.resourceURL(type), 'GET').then(
      function(raw) {
        var deserialized = _this.deserialize(type, null, raw);
        return _this.transformed(deserialized.result).then(function() {
          return deserialized.data;
        });
      }
    );
  },

  _findOne: function(type, id) {
    var _this = this;
    return this.ajax(this.resourceURL(type, id), 'GET').then(
      function(raw) {
        var deserialized = _this.deserialize(type, null, raw);
        return _this.transformed(deserialized.result).then(function() {
          return deserialized.data;
        });
      }
    );
  },

  _findMany: function(type, ids) {
    var _this = this;
    return this.ajax(this.resourceURL(type, ids), 'GET').then(
      function(raw) {
        var deserialized = _this.deserialize(type, null, raw);
        return _this.transformed(deserialized.result).then(function() {
          return deserialized.data;
        });
      }
    );
  },

  _addRecordsToCache: function(type, records) {
    var result = new TransformResult();

    records.forEach(function(record) {
      result.concat(this._addRecordToCache(type, record));
    }, this);

    return result;
  },

  _addRecordToCache: function(type, record) {
    var operation = {
      op: 'add',
      path: [type, this.getId(type, record)],
      value: record
    };

    return this._transformCache(operation);
  },

  _transformCache: function(ops) {
    if (this._cache) {
      return this._cache.transform( toArray(ops) );
    } else {
      return new TransformResult(ops);
    }
  },

  _resourceIdURLSegment: function(type, id) {
    var resourceId = this.serializer.resourceId(type, id);
    if (isArray(resourceId)) {
      resourceId = resourceId.join(',');
    }
    return resourceId;
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

      // console.log('ajax start', method, url);

      if (hash.data && method !== 'GET') {
        if (!hash.contentType) {
          hash.contentType = _this.ajaxContentType(hash);
        }
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.ajaxHeaders) {
        var headers = _this.ajaxHeaders();
        hash.beforeSend = function (xhr) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        };
      }

      hash.success = function(json) {
        // console.log('ajax success', method, json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
        // console.log('ajax error', method, jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  ajaxContentType: function(url, method) {
    return 'application/vnd.api+json; charset=utf-8';
  },

  ajaxHeaders: function() {
    return this.headers;
  },

  resourceNamespace: function(type) {
    return this.namespace;
  },

  resourceHost: function(type) {
    return this.host;
  },

  resourcePath: function(type, id) {
    var path = [this.serializer.resourceType(type)];
    if (id) {
      path.push(this._resourceIdURLSegment(type, id));
    }
    if (this.appendSlash) {
        return path.join('/') + '/';
    } else {
        return path.join('/');
    }
  },

  resourceURL: function(type, id) {
    var host = this.resourceHost(type),
        namespace = this.resourceNamespace(type),
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.resourcePath(type, id));

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  resourceLinkURL: function(type, id, link, relId) {
    var url = this.resourceURL(type, id);
    url += '/relationships/' + this.serializer.resourceLink(type, link);

    if (relId) {
      var linkDef = this.schema.linkDefinition(type, link);

      url += '/' + this._resourceIdURLSegment(linkDef.model, relId);
    }

    return url;
  },

  resourceLinkedURL: function(type, id, link) {
    var url = this.resourceURL(type, id);
    url += '/' + this.serializer.resourceLink(type, link);
    return url;
  },

  deserialize: function(type, id, data) {
    var records = this.serializer.deserialize(type, id, data);
    var primaryData = records.primary;

    var result;

    if (isArray(primaryData)) {
      result = this._addRecordsToCache(type, primaryData);
    } else {
      result = this._addRecordToCache(type, primaryData);
    }

    if (records.included) {
      Object.keys(records.included).forEach(function(relType) {
        var relRecords = records.included[relType];
        result.concat(this._addRecordsToCache(relType, relRecords));
      }, this);
    }

    return {
      result: result,
      data: primaryData
    };
  }
});
