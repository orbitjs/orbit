import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, toArray, isObject, isNone, merge } from 'orbit/lib/objects';
import { diffs } from 'orbit/lib/diffs';
import ActionQueue from 'orbit/action-queue';
import QueryEvaluator from 'orbit/query/evaluator';
import Fetchable from 'orbit/fetchable';
import Updatable from 'orbit/updatable';
import TransformBuilder from './transform/builder';
import Source from './source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi-serializer';
import Transforms from './jsonapi/transforms';
import { OperationNotAllowed, TransformNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';
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
export default class JSONAPISource extends Source {
  constructor(options) {
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

    super(options);

    Fetchable.extend(this);
    Updatable.extend(this);
    this.transformBuilder = new TransformBuilder();

    this.namespace        = options.namespace || this.namespace;
    this.host             = options.host || this.host;
    this.headers          = options.headers || this.headers;
    this.SerializerClass  = options.SerializerClass || JSONAPISerializer;

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
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform) {
    let coalescedOps = transform.operations; //TODO coalesceOperations(transform.operations);

    if (coalescedOps.length === 0) {
      return Orbit.Promise.resolve([transform]);
    } else if (coalescedOps.length > 1) {
      throw new TransformNotAllowed('JSONAPISource can only process one operation at a time.', transform);
    }

    let operation = coalescedOps[0];
    let transformMethod = Transforms[operation.op];

    if (!transformMethod) {
      throw new OperationNotAllowed('JSONAPISource can not process this operation.', operation);
    }

    return transformMethod(this, operation)
      .then((additionalTransforms = []) => [transform].concat(additionalTransforms));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Fetchable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _fetch(query) {
    // return this.queryEvaluator.evaluate(query);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _findRecordsByType(type) {
    return this.ajax(this.resourceURL(type), 'GET')
      .then(raw => this.deserialize(raw));
  }

  _findRecord(type, id) {
    return this.ajax(this.resourceURL(type, id), 'GET')
      .then(raw => this.deserialize(raw));
  }

  _findRelationship(type, id, relationship) {
    return this.ajax(this.resourceRelationshipURL(type, id, relationship), 'GET')
      .then(raw => {
        let relId = this.serializer.deserializeRelationship(raw.data);
        return relId;
      });
  }

  _findRelated(type, id, relationship) {
    return this.ajax(this.relatedResourceURL(type, id, relationship), 'GET')
      .then(raw => this.deserialize(raw));
  }

  _filterRecordsByType(type, filter) {
    return this.ajax(this.resourceURL(type), 'GET', { data: { filter: filter } })
      .then(raw => this.deserialize(raw));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  ajax(url, method, hash) {
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
  }

  ajaxContentType(url, method) {
    return 'application/vnd.api+json; charset=utf-8';
  }

  ajaxHeaders() {
    return this.headers;
  }

  resourceNamespace(type) {
    return this.namespace;
  }

  resourceHost(type) {
    return this.host;
  }

  resourcePath(type, id) {
    let path = [this.serializer.resourceType(type)];
    if (id) {
      let resourceId = this.serializer.resourceId(type, id);
      if (resourceId) {
        path.push(resourceId);
      }
    }
    return path.join('/');
  }

  resourceURL(type, id) {
    let host = this.resourceHost(type);
    let namespace = this.resourceNamespace(type);
    let url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.resourcePath(type, id));

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  }

  resourceRelationshipURL(type, id, relationship) {
    return this.resourceURL(type, id) +
           '/relationships/' + this.serializer.resourceRelationship(type, relationship);
  }

  relatedResourceURL(type, id, relationship) {
    return this.resourceURL(type, id) +
           '/' + this.serializer.resourceRelationship(type, relationship);
  }

  deserialize(data) {
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
}
