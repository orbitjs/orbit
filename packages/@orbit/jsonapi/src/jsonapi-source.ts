/* eslint-disable valid-jsdoc */
import Orbit, {
  Source, SourceSettings,
  Query, QueryOrExpression,
  Pullable, pullable,
  Pushable, pushable,
  Transform,
  TransformOrOperations,
  TransformNotAllowed,
  ClientError,
  ServerError,
  NetworkError,
  Queryable, queryable,
  Record
} from '@orbit/data';
import { assert, merge, deepMerge, deprecate } from '@orbit/utils';
import JSONAPISerializer, { DeserializedDocument, JSONAPISerializerSettings } from './jsonapi-serializer';
import { appendQueryParams } from './lib/query-params';
import { PullOperator, PullOperators } from './lib/pull-operators';
import { getTransformRequests, TransformRequestProcessors } from './lib/transform-requests';
import { InvalidServerResponse } from './lib/exceptions';
import { QueryOperator, QueryOperators } from "./lib/query-operators";

export interface FetchSettings {
  headers?: object;
  method?: string;
  json?: object;
  body?: string;
  params?: any;
  timeout?: number;
  credentials?: string;
  cache?: string;
  redirect?: string;
  referrer?: string;
  referrerPolicy?: string;
  integrity?: string;
}

export interface JSONAPISourceSettings extends SourceSettings {
  maxRequestsPerTransform?: number;
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  SerializerClass?: (new (settings: JSONAPISerializerSettings) => JSONAPISerializer);
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
@queryable
export default class JSONAPISource extends Source implements Pullable, Pushable, Queryable {
  maxRequestsPerTransform: number;
  namespace: string;
  host: string;
  defaultFetchSettings: FetchSettings;
  serializer: JSONAPISerializer;

  // Pullable interface stubs
  pull: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<Transform[]>;

  // Queryable interface stubs
  query: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<any>;

  constructor(settings: JSONAPISourceSettings = {}) {
    assert('JSONAPISource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);

    settings.name = settings.name || 'jsonapi';

    super(settings);

    this.namespace = settings.namespace;
    this.host = settings.host;

    this.initDefaultFetchSettings(settings);

    this.maxRequestsPerTransform = settings.maxRequestsPerTransform;

    const SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer = new SerializerClass({ schema: settings.schema, keyMap: settings.keyMap });
  }

  get defaultFetchHeaders(): object {
    deprecate('JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`');
    return this.defaultFetchSettings.headers;
  }

  set defaultFetchHeaders(headers: object) {
    deprecate('JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`');
    this.defaultFetchSettings.headers = headers;
  }

  get defaultFetchTimeout() {
    deprecate('JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`');
    return this.defaultFetchSettings.timeout;
  }

  set defaultFetchTimeout(timeout: number) {
    deprecate('JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`');
    this.defaultFetchSettings.timeout = timeout;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform: Transform): Promise<Transform[]> {
    const requests = getTransformRequests(this, transform);

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
    const operator: PullOperator = PullOperators[query.expression.op];
    if (!operator) {
      throw new Error('JSONAPISource does not support the `${query.expression.op}` operator for queries.');
    }
    return operator(this, query);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query: Query): Promise<Record|Record[]> {
    const operator: QueryOperator = QueryOperators[query.expression.op];
    if (!operator) {
      throw new Error('JSONAPISource does not support the `${query.expression.op}` operator for queries.');
    }
    return operator(this, query).then(response => {
      return this._transformed(response.transforms)
        .then(()=> response.primaryData);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  fetch(url: string, customSettings?: FetchSettings): Promise<any> {
    let settings = this.initFetchSettings(customSettings);

    let fullUrl = url;
    if (settings.params) {
      fullUrl = appendQueryParams(fullUrl, settings.params);
      delete settings.params;
    }

    // console.log('fetch', fullUrl, mergedSettings, 'polyfill', fetch.polyfill);
    let fetchFn = Orbit.fetch || fetch;
    if (settings.timeout) {
      let timeout = settings.timeout;
      delete settings.timeout;

      return new Orbit.Promise((resolve, reject) => {
        let timedOut;

        let timer = Orbit.globals.setTimeout(() => {
          timedOut = true;
          reject(new NetworkError(`No fetch response within ${timeout}ms.`));
        }, timeout);

        fetchFn(fullUrl, settings)
          .catch(e => {
            Orbit.globals.clearTimeout(timer);

            if (!timedOut) {
              return this.handleFetchError(e);
            }
          })
          .then(response => {
            Orbit.globals.clearTimeout(timer);

            if (!timedOut) {
              return this.handleFetchResponse(response);
            }
          })
          .then(resolve, reject);
      });
    } else {
      return fetchFn(fullUrl, settings)
        .catch(e => this.handleFetchError(e))
        .then(response => this.handleFetchResponse(response));
    }
  }

  initFetchSettings(customSettings: FetchSettings = {}): FetchSettings {
    let settings: FetchSettings = deepMerge({}, this.defaultFetchSettings, customSettings);

    if (settings.json) {
      assert('`json` and `body` can\'t both be set for fetch requests.', !settings.body);
      settings.body = JSON.stringify(settings.json);
      delete settings.json;
    }

    if (settings.headers && !settings.body) {
      delete settings.headers['Content-Type'];
    }

    return settings;
  }

  protected handleFetchResponse(response: any): Promise<any> {
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
        return this.handleFetchResponseError(response);
      }
    }
    return Orbit.Promise.resolve();
  }

  protected handleFetchResponseError(response: any, data?: any): Promise<any> {
    let error;
    if (response.status >= 400 && response.status < 500) {
      error = new ClientError(response.statusText);
    } else {
      error = new ServerError(response.statusText);
    }
    error.response = response;
    error.data = data;
    return Orbit.Promise.reject(error);
  }

  protected handleFetchError(e: any): Promise<any> {
    let error = new NetworkError(e);
    return Orbit.Promise.reject(error);
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

  private initDefaultFetchSettings(settings: JSONAPISourceSettings): void {
    this.defaultFetchSettings = {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      timeout: 5000
    };

    if (settings.defaultFetchHeaders || settings.defaultFetchTimeout) {
      deprecate('JSONAPISource: Pass `defaultFetchSettings` with `headers` instead of `defaultFetchHeaders` to initialize source', settings.defaultFetchHeaders === undefined);
      deprecate('JSONAPISource: Pass `defaultFetchSettings` with `timeout` instead of `defaultFetchTimeout` to initialize source', settings.defaultFetchTimeout === undefined);

      deepMerge(this.defaultFetchSettings, {
        headers: settings.defaultFetchHeaders,
        timeout: settings.defaultFetchTimeout
      });
    }

    if (settings.defaultFetchSettings) {
      deepMerge(this.defaultFetchSettings, settings.defaultFetchSettings);
    }
  }

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
