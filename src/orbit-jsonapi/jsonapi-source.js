/* globals fetch */
/* eslint-disable valid-jsdoc */
import Orbit from 'orbit';
import { assert } from 'orbit/lib/assert';
import Pullable from 'orbit/interfaces/pullable';
import Pushable from 'orbit/interfaces/pushable';
import Source from 'orbit-common/source';
import Serializer from 'orbit-common/serializer';
import { QueryNotAllowed, TransformNotAllowed, ClientError, ServerError, NetworkError } from 'orbit-common/lib/exceptions';
import JSONAPISerializer from './jsonapi-serializer';
import { encodeQueryParams } from './lib/query-params';
import { getQueryRequests, QueryRequestProcessors } from './lib/queries';
import { getTransformRequests, TransformRequestProcessors } from './lib/transform-requests';

if (typeof fetch !== 'undefined' && Orbit.fetch === undefined) {
  Orbit.fetch = fetch;
}

/**
 Source for accessing a JSON API compliant RESTful API with a network fetch
 request.

 If a single transform or query requires more than one fetch request,
 requests will be performed sequentially and resolved together. From the
 perspective of Orbit, these operations will all succeed or fail together. The
 `maxRequestsPerTransform` and `maxRequestsPerQuery` options allow limits to be
 set on this behavior. These options should be set to `1` if your client/server
 configuration is unable to resolve partially successful transforms / queries.

 @class JSONAPISource
 @extends Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @param {Number}    [options.maxRequestsPerQuery] Maximum number of AJAX requests allowed per query.
 @param {Number}    [options.maxRequestsPerTransform] Maximum number of AJAX requests allowed per transform.
 @constructor
 */
export default class JSONAPISource extends Source {
  constructor(options = {}) {
    assert('JSONAPISource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    assert('JSONAPISource\'s `keyMap` must be specified in `options.keyMap` constructor argument', options.keyMap);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.fetch be defined', Orbit.fetch);

    super(options);

    this.name                = options.name || 'jsonapi';
    this.namespace           = options.namespace;
    this.host                = options.host;
    this.defaultFetchHeaders = options.defaultFetchHeaders || { Accept: 'application/vnd.api+json' };

    this.maxRequestsPerQuery     = options.maxRequestsPerQuery;
    this.maxRequestsPerTransform = options.maxRequestsPerTransform;

    const SerializerClass = options.SerializerClass || JSONAPISerializer;
    this.serializer       = new SerializerClass({ schema: options.schema, keyMap: options.keyMap });

    assert('Serializer must be an instance of OC.Serializer', this.serializer instanceof Serializer);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform) {
    const requests = getTransformRequests(transform);

    if (this.maxRequestsPerTransform && requests.length > this.maxRequestsPerTransform) {
      return Orbit.Promise.resolve()
        .then(() => {
          throw new TransformNotAllowed(
            `This transform requires ${requests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerTransform} requests per transform.`,
            transform);
        });
    }

    return this._processRequests(requests, TransformRequestProcessors)
      .then(transforms => {
        transforms.unshift(transform);
        return transforms;
      });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _pull(query) {
    const requests = getQueryRequests(query);

    if (this.maxRequestsPerQuery && requests.length > this.maxRequestsPerQuery) {
      return Orbit.Promise.resolve()
        .then(() => {
          throw new QueryNotAllowed(
            `This query requires ${requests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerQuery} requests per query.`,
            query);
        });
    }

    return this._processRequests(requests, QueryRequestProcessors);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  fetch(_url, settings = {}) {
    settings.headers = settings.headers || this.defaultFetchHeaders;

    let url = _url;
    let headers = settings.headers;
    let method = settings.method || 'GET';

    // console.log('fetch', url, settings, 'polyfill', fetch.polyfill);

    if (settings.json) {
      assert('`json` and `body` can\'t both be set for fetch requests.', !settings.body);
      settings.body = JSON.stringify(settings.json);
      delete settings.json;
    }

    if (settings.body && method !== 'GET') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/vnd.api+json; charset=utf-8';
    }

    if (settings.params) {
      if (url.indexOf('?') === -1) {
        url += '?';
      } else {
        url += '&';
      }
      url += encodeQueryParams(settings.params);

      delete settings.params;
    }

    return Orbit.fetch(url, settings)
      .catch(e => this.handleFetchError(e))
      .then(response => this.handleFetchResponse(response));
  }

  handleFetchResponse(response) {
    if (response.status >= 200 && response.status < 300) {
      return response.json();
    } else {
      return response.json()
        .then(data => this.handleFetchResponseError(response, data));
    }
  }

  handleFetchResponseError(response, data) {
    let error;
    if (response.status >= 400 && response.status < 500) {
      error = new ClientError(response.statusText);
    } else {
      error = new ServerError(response.statusText);
    }
    error.response = response;
    error.data = data;
    throw error;
  }

  handleFetchError(e) {
    throw new NetworkError(e);
  }

  resourceNamespace(/* type */) {
    return this.namespace;
  }

  resourceHost(/* type */) {
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

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _processRequests(requests, processors) {
    let transforms = [];
    let result = Orbit.Promise.resolve();

    requests.forEach(request => {
      let processor = processors[request.op];

      result = result.then(() => {
        return processor(this, request)
          .then(additionalTransforms => {
            if (additionalTransforms) {
              Array.prototype.push.apply(transforms, additionalTransforms);
            }
          });
      });
    });

    return result.then(() => transforms);
  }
}

Pullable.extend(JSONAPISource.prototype);
Pushable.extend(JSONAPISource.prototype);
