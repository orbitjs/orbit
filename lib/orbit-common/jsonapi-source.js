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
import { toIdentifier, parseIdentifier } from 'orbit-common/lib/identifiers';

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
    var merged;

    for (var i = 0, len = ops.length; i < len; i++) {
      operation = ops[i];

      merged = action && this._mergeOperationWithAction(action, operation);

      if (!merged) {
        // Not able to merge operation with previous action, so we need to
        // queue a new action.
        method = this._operationMethod(operation);
        action = this._createTransformAction(method, operation, fullResult);
        queue.push(action);
      }
    }

    return queue.process()
      .then(function() {
        return fullResult;
      });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id, options) {
    if (options) throw new Exception('`JSONAPISource#findRelationship` does not support `options` argument');

    if (isNone(id)) {
      return this._findAll(type);

    } else {
      return this._findOne(type, id);
    }
  },

  _findRelationship: function(type, id, relationship, options) {
    var _this = this;

    if (options) throw new Exception('`JSONAPISource#findRelationship` does not support `options` argument');

    id = this.getId(type, id);

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), 'GET').then(
      function(raw) {
        var relId = _this.serializer.deserializeRelationship(raw.data);
        return relId;
      }
    );
  },

 // _findLinked: function(type, id, link, options) {
 //   var _this = this;
 //
 //   if (options) throw new Exception('`JSONAPISource#findLinked` does not support `options` argument');
 //
 //   id = this.getId(type, id);
 //
 //   return this.ajax(this.resourceLinkedURL(type, id, link), 'GET').then(
 //     function(raw) {
 //       var linkDef = _this.schema.linkDefinition(type, link);
 //
 //       var result = _this.deserialize(linkDef.model, null, raw);
 //
 //       return _this.transformed(result.result).then(function() {
 //         return result.data;
 //       });
 //     }
 //   );
 // },
 //
 // _query: function(type, query, options) {
 //   var _this = this;
 //
 //   if (options) throw new Exception('`JSONAPISource#query` does not support `options` argument');
 //
 //   return this.ajax(this.resourceURL(type), 'GET', {data: {filter: query}}).then(
 //     function(raw) {
 //       var deserialized = _this.deserialize(raw);
 //       return _this.transformed(deserialized.result).then(function() {
 //         return deserialized.data;
 //       });
 //     }
 //   );
 // },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformAdd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var json = this.serializer.serialize(operation.value);

    return this.ajax(this.resourceURL(type), 'POST', {data: json}).then(
      function(raw) {
        var result = _this._transformCache(operation);

        var resourceKey = _this.serializer.resourceKey(type);
        if (resourceKey) {
          _this.schema.registerKeyMapping(type, id, resourceKey, raw.data.id);
        }

        var deserialized = _this.deserialize(raw);

        if (!deserialized.result.isEmpty()) {
          _this.transformed(deserialized.result);

          result.concat(deserialized.result);
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

    var record = {
      type: type,
      id: id
    };

    ops.forEach(function(operation) {
      var path = operation.path;
      var value = operation.value;
      if (path[2]) {
        if (path[2] === 'relationships') {
          record.relationships = record.relationships || {};
          record.relationships[path[3]] = value;

        } else if (path[2] === 'attributes') {
          record.attributes = record.attributes || {};
          record.attributes[path[3]] = value;

        } else {
          record[path[2]] = value;
        }
      } else {
        record = merge(record, value);
      }
    });

    var json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json}).then(
      function(raw) {
        var result = _this._transformCache(ops);

        // TODO - better 204 (no content) checking
        if (raw && Object.keys(raw).length > 0) {
          var deserialized = _this.deserialize(raw);

          if (!deserialized.result.isEmpty()) {
            _this.transformed(deserialized.result);

            result.concat(deserialized.result);
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

  _transformReplaceAttribute: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var attr = operation.path[3];
    var modelDef = this.schema.modelDefinition(type);

    var record = {
      type: type,
      id: id,
      attributes: {}
    };
    record.attributes[attr] = operation.value;

    var json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json}).then(
      function(raw) {
        return _this._transformCache(operation);
      }
    );
  },

  _transformAddRelationship: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var relationship = operation.path[3];
    var relId = parseIdentifier(operation.path[5]);
    var method = 'POST';
    var json = {
      data: [this.serializer.serializeIdentifier(relId)]
    };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json})
      .then(
        function() {
          return _this._transformCache(operation);
        }
      );
  },

  _transformRemoveRelationship: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var relationship = operation.path[3];
    var relId = parseIdentifier(operation.path[5]);
    var method = 'DELETE';
    var json = {
      data: [this.serializer.serializeIdentifier(relId)]
    };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json})
      .then(
        function() {
          return _this._transformCache(operation);
        }
      );
  },

  _transformReplaceRelationship: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var relationship = operation.path[3];
    var relValue = operation.path[5] || operation.value;
    var relationshipDef = this.schema.relationshipDefinition(type, relationship);
    var relType = relationshipDef.model;
    var data;

    if (relationshipDef.type === 'hasMany') {
      // Convert a map of ids to an array
      if (isObject(relValue)) {
        data = Object.keys(relValue).map(function(eachValue) {
          return this.serializer.serializeIdentifier(parseIdentifier(eachValue));
        }, this);
      } else {
        data = [];
      }
    } else {
      if (relValue) {
        data = this.serializer.serializeIdentifier(parseIdentifier(relValue));
      } else {
        data = null;
      }
    }

    var method = 'PATCH';
    var json = {
      data: data
    };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json})
      .then(
        function() {
          return _this._transformCache(operation);
        }
      );
  },

  _operationMethod: function(operation) {
    var op = operation.op;
    var path = operation.path;

    if (path.length > 2) {
      if (path[2] === 'relationships') {
        if (op === 'add') {
          return '_transformAddRelationship';
        } else if (op === 'remove') {
          return '_transformRemoveRelationship';
        } else if (op === 'replace') {
          return '_transformReplaceRelationship';
        }
      } else if (path[2] === 'attributes') {
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
        var deserialized = _this.deserialize(raw);
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
        var deserialized = _this.deserialize(raw);
        return _this.transformed(deserialized.result).then(function() {
          return deserialized.data;
        });
      }
    );
  },

  _addRecordsToCache: function(records) {
    var result = new TransformResult();

    records.forEach(function(record) {
      result.concat(this._addRecordToCache(record));
    }, this);

    return result;
  },

  _addRecordToCache: function(record) {
    var operation = {
      op: 'add',
      path: [record.type, record.id],
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
      var resourceId = this.serializer.resourceId(type, id);
      if (resourceId) {
        path.push(resourceId);
      }
    }
    return path.join('/');
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

  resourceRelationshipURL: function(type, id, relationship) {
    return this.resourceURL(type, id) +
           '/relationships/' + this.serializer.resourceRelationship(type, relationship);
  },

  deserialize: function(data) {
    var records = this.serializer.deserialize(data);
    var primaryData = records.primary;

    var result;

    if (isArray(primaryData)) {
      result = this._addRecordsToCache(primaryData);
    } else {
      result = this._addRecordToCache(primaryData);
    }

    if (records.included) {
      this._addRecordsToCache(records.included);
    }

    return {
      result: result,
      data: primaryData
    };
  }
});
