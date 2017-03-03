/* eslint-disable valid-jsdoc */
import Orbit, {
  KeyMap,
  RecordOperation,
  Schema,
  Source, SourceSettings,
  Query, QueryOrExpression,
  Pullable, pullable,
  Pushable, pushable,
  Transform,
  TransformLog,
  TransformOrOperations,
  coalesceRecordOperations,
  QueryNotAllowed, TransformNotAllowed,
  ClientError, 
  ServerError, 
  NetworkError
} from '@orbit/core';
import { assert } from '@orbit/utils';
import JSONAPISerializer from './jsonapi-serializer';
import { encodeQueryParams } from './lib/query-params';
import { getQueryRequests, QueryRequestProcessors } from './lib/queries';
import { getTransformRequests, TransformRequestProcessors } from './lib/transform-requests';
import { InvalidServerResponse } from './lib/exceptions';

declare const self: any;

if (typeof self.fetch !== 'undefined' && Orbit.fetch === undefined) {
  Orbit.fetch = self.fetch;
}

export interface FetchSettings {
  headers?: object;
  method?: string;
  json?: object;
  body?: string;
  params?: any;
}

export interface JSONAPISourceSettings extends SourceSettings {
  maxRequestsPerQuery?: number;
  maxRequestsPerTransform?: number;
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  SerializerClass?: (new () => JSONAPISerializer);
}

/**
 Source for accessing a JSON API compliant RESTful API with a network fetch
 request.

 If a single transform or query requires more than one fetch request,
 requests will be performed sequentially and resolved together. From the
 perspective of Orbit, these operations will all succeed or fail together. The
 `maxRequestsPerTransform` and `maxRequestsPerQuery` settings allow limits to be
 set on this behavior. These settings should be set to `1` if your client/server
 configuration is unable to resolve partially successful transforms / queries.

 @class JSONAPISource
 @extends Source
 */
@pullable
@pushable
export default class JSONAPISource extends Source implements Pullable, Pushable {
  maxRequestsPerQuery: number;
  maxRequestsPerTransform: number;
  namespace: string;
  host: string;
  defaultFetchHeaders: object;
  serializer: JSONAPISerializer;

  // Pullable interface stubs
  pull: (query: Query) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transform: Transform) => Promise<Transform[]>;

  constructor(settings: JSONAPISourceSettings = {}) {
    assert('JSONAPISource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.fetch be defined', Orbit.fetch);

    settings.name = settings.name || 'jsonapi';

    super(settings);

    this.namespace           = settings.namespace;
    this.host                = settings.host;
    this.defaultFetchHeaders = settings.defaultFetchHeaders || { Accept: 'application/vnd.api+json' };

    this.maxRequestsPerQuery     = settings.maxRequestsPerQuery;
    this.maxRequestsPerTransform = settings.maxRequestsPerTransform;

    const SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer       = new SerializerClass({ schema: settings.schema, keyMap: settings.keyMap });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform: Transform): Promise<Transform[]> {
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

  _pull(query: Query): Promise<Transform[]> {
    const requests = getQueryRequests(this, query);

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

  fetch(url: string, settings: FetchSettings = {}): Promise<any> {
    settings.headers = settings.headers || this.defaultFetchHeaders;

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

  handleFetchResponse(response: any): Promise<any> {
    if (response.status === 201) {
      if (this.responseHasContent(response)) {
        return response.json();
      } else {
        throw new InvalidServerResponse(`Server responses with a ${response.status} status should return content with a Content-Type that includes 'application/vnd.api+json'.`);
      }
    } else if (response.status >= 200 && response.status < 300) {
      if (this.responseHasContent(response)) {
        return response.json();
      }
    } else {
      if (this.responseHasContent(response)) {
        return response.json()
          .then(data => this.handleFetchResponseError(response, data));
      } else {
        this.handleFetchResponseError(response);
      }
    }
    return Orbit.Promise.resolve();
  }

  handleFetchResponseError(response: any, data?: any): void {
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

  handleFetchError(e: any): void {
    throw new NetworkError(e);
  }

  responseHasContent(response: any): boolean {
    let contentType = response.headers.get('Content-Type');
    return contentType && contentType.indexOf('application/vnd.api+json') > -1;
  }

  resourceNamespace(type?: string): string {
    return this.namespace;
  }

  resourceHost(type?: string): string {
    return this.host;
  }

  resourcePath(type: string, id?: string): string {
    let path = [this.serializer.resourceType(type)];
    if (id) {
      let resourceId = this.serializer.resourceId(type, id);
      if (resourceId) {
        path.push(resourceId);
      }
    }
    return path.join('/');
  }

  resourceURL(type: string, id?: string): string {
    let host = this.resourceHost(type);
    let namespace = this.resourceNamespace(type);
    let url: string[] = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.resourcePath(type, id));

    if (!host) { url.unshift(''); }

    return url.join('/');
  }

  resourceRelationshipURL(type: string, id: string, relationship: string): string {
    return this.resourceURL(type, id) +
           '/relationships/' + this.serializer.resourceRelationship(type, relationship);
  }

  relatedResourceURL(type: string, id: string, relationship: string): string {
    return this.resourceURL(type, id) +
           '/' + this.serializer.resourceRelationship(type, relationship);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  protected _processRequests(requests, processors): Promise<Transform[]> {
    let transforms: Transform[] = [];
    let result: Promise<void> = Orbit.Promise.resolve();

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
