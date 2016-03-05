import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, toArray, isObject, isNone, merge } from 'orbit/lib/objects';
import { diffs } from 'orbit/lib/diffs';
import Operation from 'orbit/operation';
import ActionQueue from 'orbit/action-queue';
import QueryEvaluator from 'orbit/query/evaluator';
import Source from './source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi-serializer';
import { OperationNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';
import CacheIntegrityProcessor from 'orbit-common/cache/operation-processors/cache-integrity-processor';
import DeletionTrackingProcessor from 'orbit-common/cache/operation-processors/deletion-tracking-processor';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';
import { toIdentifier, parseIdentifier } from 'orbit-common/lib/identifiers';
import { coalesceOperations } from 'orbit-common/lib/operations';

/**
 Source for accessing a JSON API compliant RESTful API with AJAX

 @class JSONAPISource
 @extends Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
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

    // TODO - add query operators
    this.queryEvaluator = new QueryEvaluator(this, {});

    // this.registerQueryProcessor('findRecordsByType', (query) => {
    //   return this._findRecordsByType(query.type);
    // });
    //
    // this.registerQueryProcessor('findRecord', (query) => {
    //   return this._findRecord(query.type, query.id);
    // });
    //
    // this.registerQueryProcessor('findRelationship', (query) => {
    //   return this._findRelationship(query.type, query.id, query.relationship);
    // });
    //
    // this.registerQueryProcessor('findRelated', (query) => {
    //   return this._findRelated(query.type, query.id, query.relationship);
    // });
    //
    // this.registerQueryProcessor('filterRecordsByType', (query) => {
    //   return this._filterRecordsByType(query.type, query.filter);
    // });
  },

  namespace: null,
  host: null,
  headers: null,
  SerializerClass: JSONAPISerializer,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(transform) {
    console.log('JSONAPISource.transform', transform);
    let coalescedOps = coalesceOperations(transform.operations);
    let additionalOps = [];

    let applyTransforms = coalescedOps.reduce((chain, operation) => {
      let method = this._operationMethod(operation);
      return chain.then(() => this[method](operation, additionalOps));
    }, Orbit.Promise.resolve());

    let emitTransforms = applyTransforms.then(() => {
      this.transformed(transform);
      additionalOps.forEach(op => this.transformed(op));
    });

    return emitTransforms;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(exp) {
    return this.queryEvaluator.evaluate(exp);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformAdd: function(op, additionalOps) {
    let type = op.path[0];
    let id = op.path[1];
    let record = this.schema.normalize(op.value);
    let json = this.serializer.serialize(record);

    return this.ajax(this.resourceURL(type), 'POST', { data: json })
      .then((raw) => {
        let resourceKey = this.serializer.resourceKey(type);
        if (resourceKey) {
          this.schema.registerKeyMapping(type, id, resourceKey, raw.data.id);
        }

        let data = this.serializer.deserialize(raw);
        let updatedRecord = data.primary;

        let updates = diffs(record, updatedRecord, { basePath: [type, id] });
        if (updates) {
          updates.forEach(update => additionalOps.push(update));
        }
      });
  },

  _transformReplace: function(ops, additionalOps) {
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

    return this.ajax(this.resourceURL(type, id), 'PATCH', { data: json })
      .then((raw) => {
        let data = this.serializer.deserialize(raw);
        let updatedRecord = data.primary;

        let updates = diffs(record, updatedRecord, { basePath: [type, id] });
        if (updates) {
          updates.forEach(update => additionalOps.push(update));
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

    return this.ajax(this.resourceURL(type, id), 'PATCH', { data: json });
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

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, { data: json });
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

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, { data: json });
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

    return this.ajax(this.resourceRelationshipURL(type, id, relationship), method, { data: json });
  },

  _operationMethod: function(op) {
    let path = op.path;

    if (path.length > 2) {
      if (path[2] === 'relationships') {
        switch (op.op) {
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
      switch (op.op) {
        case 'add':
          return '_transformAdd';
        case 'replace':
          return '_transformReplace';
        case 'remove':
          return '_transformRemove';
      }
    }
  },

  _findRecordsByType(type) {
    return this.ajax(this.resourceURL(type), 'GET')
      .then((raw) => {
        return this.deserialize(raw);
      });
  },

  _findRecord(type, id) {
    return this.ajax(this.resourceURL(type, id), 'GET')
      .then((raw) => {
        return this.deserialize(raw);
      });
  },

  _findRelationship(type, id, relationship) {
    return this.ajax(this.resourceRelationshipURL(type, id, relationship), 'GET')
      .then((raw) => {
        let relId = this.serializer.deserializeRelationship(raw.data);
        return relId;
      });
  },

  _findRelated(type, id, relationship) {
   return this.ajax(this.relatedResourceURL(type, id, relationship), 'GET')
     .then((raw) => {
       return this.deserialize(raw);
     });
 },

  _filterRecordsByType(type, filter) {
   return this.ajax(this.resourceURL(type), 'GET', { data: { filter: filter } })
     .then((raw) => {
       return this.deserialize(raw);
     });
 },

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
    let host = this.resourceHost(type);
    let namespace = this.resourceNamespace(type);
    let url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.resourcePath(type, id));

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  resourceRelationshipURL(type, id, relationship) {
    return this.resourceURL(type, id) +
           '/relationships/' + this.serializer.resourceRelationship(type, relationship);
  },

  relatedResourceURL(type, id, relationship) {
    return this.resourceURL(type, id) +
           '/' + this.serializer.resourceRelationship(type, relationship);
  },

  deserialize: function(data) {
    let deserialized = this.serializer.deserialize(data);
    let primaryData = deserialized.primary;
    let records = toArray(primaryData);

    if (deserialized.included) {
      Array.prototype.push.apply(records, deserialized.included);
    }

    let transforms = records.map((record) => {
      return {
        op: 'replace',
        path: [record.type, record.id],
        value: record
      };
    });

    return this.transformed(transforms)
      .then(function() {
        return primaryData;
      });
  }
});
