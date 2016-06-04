/* eslint-disable valid-jsdoc */
import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, toArray, isObject, isNone, merge } from 'orbit/lib/objects';
import { diffs } from 'orbit/lib/diffs';
import ActionQueue from 'orbit/action-queue';
import Fetchable from 'orbit/fetchable';
import Transformable from 'orbit/transformable';
import TransformBuilder from './transform/builder';
import Source from 'orbit/source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi/serializer';
import { getFetchRequests, FetchRequestProcessors } from './jsonapi/fetch-requests';
import { getTransformRequests, TransformRequestProcessors } from './jsonapi/transform-requests';
import { OperationNotAllowed, FetchNotAllowed, TransformNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';
import CacheIntegrityProcessor from 'orbit-common/cache/operation-processors/cache-integrity-processor';
import DeletionTrackingProcessor from 'orbit-common/cache/operation-processors/deletion-tracking-processor';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';

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
  constructor(options = {}) {
    assert('JSONAPISource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

    super(options);

    Fetchable.extend(this);
    Transformable.extend(this);

    this.transformBuilder = new TransformBuilder();

    this.schema           = options.schema;
    this.name             = options.name || 'jsonapi';
    this.namespace        = options.namespace || this.namespace;
    this.host             = options.host || this.host;
    this.headers          = options.headers || this.headers;

    const SerializerClass = options.SerializerClass || JSONAPISerializer;
    this.serializer       = new SerializerClass(this.schema);

    assert('Serializer must be an instance of OC.Serializer', this.serializer instanceof Serializer);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    const requests = getTransformRequests(transform);

    if (requests.length === 0) {
      return Orbit.Promise.resolve([transform]);
    } else if (requests.length > 1) {
      throw new TransformNotAllowed('JSONAPISource can only process one transform request at a time.', transform);
    }

    let request = requests[0];
    let processor = TransformRequestProcessors[request.op];

    if (!processor) {
      throw new TransformNotAllowed('JSONAPISource can not process this transform request.', request);
    }

    return processor(this, request)
      .then((additionalTransforms = []) => [transform].concat(additionalTransforms));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Fetchable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _fetch(query) {
    const requests = getFetchRequests(query);

    if (requests.length === 0) {
      return Orbit.Promise.resolve([]);
    } else if (requests.length > 1) {
      throw new FetchNotAllowed('JSONAPISource can only process one fetch request at a time.', query);
    }

    let request = requests[0];
    let processor = FetchRequestProcessors[request.op];

    if (!processor) {
      throw new FetchNotAllowed('JSONAPISource can not process this fetch request.', request);
    }

    return processor(this, request)
      .then((transforms = []) => transforms);
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
}
