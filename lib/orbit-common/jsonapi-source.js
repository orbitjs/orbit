import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, toArray, isObject, isNone, merge } from 'orbit/lib/objects';
import { diffs } from 'orbit/lib/diffs';
import Operation from 'orbit/operation';
import ActionQueue from 'orbit/action-queue';
import Source from './source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi-serializer';
import { OperationNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';
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
    // assert('JSONAPISource constructor requires `options`', options);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

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

  _transform: function(transform) {
    let ops = transform.operations;
    let queue = new ActionQueue({autoProcess: false});
    let operation;
    let method;
    let action;
    let merged;

    for (let i = 0, len = ops.length; i < len; i++) {
      operation = ops[i];

      merged = action && this._mergeOperationWithAction(action, operation);

      if (!merged) {
        // Not able to merge operation with previous action, so we need to
        // queue a new action.
        method = this._operationMethod(operation);
        action = this._createTransformAction(method, operation);
        queue.push(action);
      }
    }

    return queue.process();
  },

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  // _find: function(type, id, options) {
  //   if (options) throw new Exception('`JSONAPISource#findRelationship` does not support `options` argument');
  //
  //   if (isNone(id)) {
  //     return this._findAll(type);
  //
  //   } else {
  //     return this._findOne(type, id);
  //   }
  // },
  //
  // _findRelationship: function(type, id, relationship, options) {
  //   if (options) throw new Exception('`JSONAPISource#findRelationship` does not support `options` argument');
  //
  //   id = this.getId(type, id);
  //
  //   return this.ajax(this.resourceRelationshipURL(type, id, relationship), 'GET').then(
  //     (raw) => {
  //       let relId = this.serializer.deserializeRelationship(raw.data);
  //       return relId;
  //     }
  //   );
  // },
  //
 // _findLinked: function(type, id, link, options) {
 //   if (options) throw new Exception('`JSONAPISource#findLinked` does not support `options` argument');
 //
 //   id = this.getId(type, id);
 //
 //   return this.ajax(this.resourceLinkedURL(type, id, link), 'GET').then(
 //     (raw) => {
 //       let linkDef = this.schema.linkDefinition(type, link);
 //
 //       let result = this.deserialize(linkDef.model, null, raw);
 //
 //       return this.transformed(result.result).then(function() {
 //         return result.data;
 //       });
 //     }
 //   );
 // },
 //
 // _query: function(type, query, options) {
 //   if (options) throw new Exception('`JSONAPISource#query` does not support `options` argument');
 //
 //   return this.ajax(this.resourceURL(type), 'GET', {data: {filter: query}}).then(
 //     (raw) => {
 //       let deserialized = this.deserialize(raw);
 //       return this.transformed(deserialized.result).then(function() {
 //         return deserialized.data;
 //       });
 //     }
 //   );
 // },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformAdd: function(op) {
    let type = op.path[0];
    let id = op.path[1];
    let record = this.schema.normalize(op.value);
    let json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type), 'POST', {data: json})
      .then((raw) => {
        let resourceKey = this.serializer.resourceKey(type);
        if (resourceKey) {
          this.schema.registerKeyMapping(type, id, resourceKey, raw.data.id);
        }

        let data = this.serializer.deserialize(raw);
        let updatedRecord = data.primary;

        let updates = diffs(record, updatedRecord, {basePath: [type, id]});
        if (updates) {
          this.transformed(updates);
        }
      });
  },

  _transformReplace: function(ops) {
    ops = toArray(ops);

    let type = ops[0].path[0];
    let id = ops[0].path[1];
    let modelDef = this.schema.modelDefinition(type);

    let record = {
      type: type,
      id: id
    };

    ops.forEach((op) => {
      let path = op.path;
      let value = op.value;
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

    let json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json})
      .then((raw) => {
        let data = this.serializer.deserialize(raw);
        let updatedRecord = data.primary;

        let updates = diffs(record, updatedRecord, {basePath: [type, id]});
        if (updates) {
          this.transformed(updates);
        }
      });
  },

  _transformRemove: function(op) {
    let type = op.path[0];
    let id = op.path[1];

    return this.ajax(this.resourceURL(type, id), 'DELETE');
  },

  _transformReplaceAttribute: function(op) {
    let type = op.path[0];
    let id = op.path[1];
    let attr = op.path[3];
    let modelDef = this.schema.modelDefinition(type);

    let record = {
      type: type,
      id: id,
      attributes: {}
    };
    record.attributes[attr] = op.value;

    let json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: json});
  },

  _transformAddRelationship: function(op) {
    let type = op.path[0];
    let id = op.path[1];
    let relationship = op.path[3];
    let relId = parseIdentifier(op.path[5]);
    let method = 'POST';
    let json = {
      data: [this.serializer.serializeIdentifier(relId)]
    };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json});
  },

  _transformRemoveRelationship: function(op) {
    let type = op.path[0];
    let id = op.path[1];
    let relationship = op.path[3];
    let relId = parseIdentifier(op.path[5]);
    let method = 'DELETE';
    let json = {
      data: [this.serializer.serializeIdentifier(relId)]
    };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json});
  },

  _transformReplaceRelationship: function(op) {
    let type = op.path[0];
    let id = op.path[1];
    let relationship = op.path[3];
    let relValue = op.path[5] || op.value;
    let relationshipDef = this.schema.relationshipDefinition(type, relationship);
    let relType = relationshipDef.model;
    let data;

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

    let method = 'PATCH';
    let json = { data };

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, {data: json});
  },

  _operationMethod: function(op) {
    let path = op.path;

    if (path.length > 2) {
      if (path[2] === 'relationships') {
        switch(op.op) {
          case 'add':
            return '_transformAddRelationship';
          case 'replace':
            return '_transformReplaceRelationship';
          case 'remove':
            return '_transformRemoveRelationship';
        }
      } else if (path[2] === 'attributes') {
        return '_transformReplaceAttribute';
      }

    } else if (path.length > 1) {
      switch(op.op) {
        case 'add':
          return '_transformAdd';
        case 'replace':
          return '_transformReplace';
        case 'remove':
          return '_transformRemove';
      }
    }
  },

  _mergeOperationWithAction: function(action, op) {
    let actionOperation = toArray(action.data.operation)[0];

    // Merge replace operations with previous replace operations that update
    // the same record.
    if (actionOperation.op === 'replace' && op.op === 'replace' &&
        actionOperation.path[0] === op.path[0] &&
        actionOperation.path[1] === op.path[1]) {

      action.data.method = '_transformReplace';
      action.data.operation = toArray( action.data.operation ).concat([ op ]);

      return true;
    }
  },

  _createTransformAction: function(method, operation) {
    let _this = this;

    return {
      data: {
        method: method,
        operation: operation
      },
      process: function() {
        return _this[this.data.method].call(_this, this.data.operation);
      }
    };
  },

  // _findAll: function(type) {
  //   return this.ajax(this.resourceURL(type), 'GET').then(
  //     (raw) => {
  //       let deserialized = this.deserialize(raw);
  //       return this.transformed(deserialized.result)
  //         .then(function() {
  //           return deserialized.data;
  //         });
  //     }
  //   );
  // },
  //
  // _findOne: function(type, id) {
  //   return this.ajax(this.resourceURL(type, id), 'GET').then(
  //     (raw) => {
  //       let deserialized = this.deserialize(raw);
  //       return this.transformed(deserialized.result)
  //         .then(function() {
  //           return deserialized.data;
  //         });
  //     }
  //   );
  // },

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  ajax: function(url, method, hash) {
    return new Orbit.Promise((resolve, reject) => {
      hash = hash || {};
      hash.url = url;
      hash.type = method;
      hash.dataType = 'json';
      hash.context = this;

      // console.log('ajax start', method, url);

      if (hash.data && method !== 'GET') {
        if (!hash.contentType) {
          hash.contentType = this.ajaxContentType(hash);
        }
        hash.data = JSON.stringify(hash.data);
      }

      if (this.ajaxHeaders) {
        let headers = this.ajaxHeaders();
        hash.beforeSend = function (xhr) {
          for (let key in headers) {
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
    let path = [this.serializer.resourceType(type)];
    if (id) {
      let resourceId = this.serializer.resourceId(type, id);
      if (resourceId) {
        path.push(resourceId);
      }
    }
    return path.join('/');
  },

  resourceURL: function(type, id) {
    let host = this.resourceHost(type),
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

  // deserialize: function(data) {
  //   let records = this.serializer.deserialize(data);
  //   let primaryData = records.primary;
  //
  //   let result;
  //
  //   if (isArray(primaryData)) {
  //     result = this._addRecordsToCache(primaryData);
  //   } else {
  //     result = this._addRecordToCache(primaryData);
  //   }
  //
  //   if (records.included) {
  //     this._addRecordsToCache(records.included);
  //   }
  //
  //   return {
  //     result: result,
  //     data: primaryData
  //   };
  // }
});
