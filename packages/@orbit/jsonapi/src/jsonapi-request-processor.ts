import Orbit, {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  ClientError,
  FilterSpecifier,
  KeyMap,
  NetworkError,
  Operation,
  PageSpecifier,
  Query,
  QueryExpressionParseError,
  Record,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  Schema,
  ServerError,
  SortSpecifier,
  Transform,
  TransformNotAllowed,
} from '@orbit/data';
import { InvalidServerResponse } from './lib/exceptions';
import { appendQueryParams } from './lib/query-params';
import { clone, deepGet, deepMerge, toArray } from '@orbit/utils';
import { RecordDocument } from './record-document';
import {
  TransformRecordRequest,
  getTransformRequests
} from  './lib/transform-requests';
import {
  Filter,
  RequestOptions,
  buildFetchSettings
} from './lib/request-settings';
const { assert, deprecate } = Orbit;

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

import { JSONAPISerializer, JSONAPISerializerSettings } from './jsonapi-serializer';

export interface JSONAPIRequestProcessorSettings {
  sourceName: string;
  SerializerClass?: (new (settings: JSONAPISerializerSettings) => JSONAPISerializer);
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  maxRequestsPerTransform?: number;
  schema: Schema;
  keyMap: KeyMap;
}

export default class JSONAPIRequestProcessor {
  sourceName: string;
  SerializerClass?: (new (settings: JSONAPISerializerSettings) => JSONAPISerializer);
  serializer: JSONAPISerializer;
  allowedContentTypes: string[];
  defaultFetchSettings: FetchSettings;
  maxRequestsPerTransform: number;
  host: string;
  namespace: string;
  schema: Schema;
  keyMap: KeyMap;

  constructor(settings: JSONAPIRequestProcessorSettings) {
    this.sourceName = settings.sourceName;
    this.allowedContentTypes = settings.allowedContentTypes || ['application/vnd.api+json', 'application/json'];
    this.maxRequestsPerTransform = settings.maxRequestsPerTransform;
    this.host = settings.host;
    this.namespace = settings.namespace;
    this.schema = settings.schema;
    this.keyMap = settings.keyMap;
    let SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer = new SerializerClass({
      schema: settings.schema,
      keyMap: settings.keyMap
    });
    this.initDefaultFetchSettings(settings);
  }

  fetch(url: string, customSettings?: FetchSettings): Promise<any> {
    let settings = this.initFetchSettings(customSettings);
    let fullUrl = this.appendQueryParams(url, settings);

    let fetchFn = (Orbit as any).fetch || Orbit.globals.fetch;

    // console.log('fetch', fullUrl, settings, 'polyfill', fetchFn.polyfill);

    if (settings.timeout) {
      let timeout = settings.timeout;
      delete settings.timeout;

      return new Promise((resolve, reject) => {
        let timedOut: boolean;

        let timer = Orbit.globals.setTimeout(() => {
          timedOut = true;
          reject(new NetworkError(`No fetch response within ${timeout}ms.`));
        }, timeout);

        fetchFn(fullUrl, settings)
          .catch((e: Error) => {
            Orbit.globals.clearTimeout(timer);

            if (!timedOut) {
              return this.handleFetchError(e);
            }
          })
          .then((response: any) => {
            Orbit.globals.clearTimeout(timer);

            if (!timedOut) {
              return this.handleFetchResponse(response);
            }
          })
          .then(resolve, reject);
      });
    } else {
      return fetchFn(fullUrl, settings)
        .catch((e: Error) => this.handleFetchError(e))
        .then((response: any) => this.handleFetchResponse(response));
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
      delete (settings.headers as any)['Content-Type'];
    }

    return settings;
  }

  responseHasContent(response: Response): boolean {
    if (response.status === 204) {
      return false;
    }

    let contentType = response.headers.get('Content-Type');
    if (contentType) {
      for (let allowedContentType of this.allowedContentTypes) {
        if (contentType.indexOf(allowedContentType) > -1) {
          return true;
        }
      }
    }
    return false;
  }

  getTransformRequests(transform: Transform): TransformRecordRequest[] {
    const transformRequests = getTransformRequests(this, transform);
    if (this.maxRequestsPerTransform && transformRequests.length > this.maxRequestsPerTransform) {
      throw new TransformNotAllowed(
        `This transform requires ${transformRequests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerTransform} requests per transform.`,
        transform);
    }
    return transformRequests;
  }

  resourceNamespace(type?: string): string {
    return this.namespace;
  }

  resourceHost(type?: string): string {
    return this.host;
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

  resourceRelationshipURL(type: string, id: string, relationship: string): string {
    return this.resourceURL(type, id) +
           '/relationships/' + this.serializer.resourceRelationship(type, relationship);
  }

  relatedResourceURL(type: string, id: string, relationship: string): string {
    return this.resourceURL(type, id) +
           '/' + this.serializer.resourceRelationship(type, relationship);
  }

  operationsFromDeserializedDocument(deserialized: RecordDocument): Operation[] {
    const records: Record[] = [];
    Array.prototype.push.apply(records, toArray(deserialized.data));

    if (deserialized.included) {
      Array.prototype.push.apply(records, deserialized.included);
    }

    return records.map(record => {
      return {
        op: 'updateRecord',
        record
      };
    });
  }

  buildFilterParam(filterSpecifiers: FilterSpecifier[]): Filter[] {
    const filters: Filter[] = [];

    filterSpecifiers.forEach(filterSpecifier => {
      if (filterSpecifier.kind === 'attribute' && filterSpecifier.op === 'equal') {
        const attributeFilter = filterSpecifier as AttributeFilterSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `null`
        const resourceAttribute = this.serializer.resourceAttribute(null, attributeFilter.attribute);
        filters.push({ [resourceAttribute]: attributeFilter.value });
      } else if (filterSpecifier.kind === 'relatedRecord') {
        const relatedRecordFilter = filterSpecifier as RelatedRecordFilterSpecifier;
        if (Array.isArray(relatedRecordFilter.record)) {
          filters.push({ [relatedRecordFilter.relation]: relatedRecordFilter.record.map(e => e.id).join(',') });
        } else {
          filters.push({ [relatedRecordFilter.relation]: relatedRecordFilter.record.id });
        }
      } else if (filterSpecifier.kind === 'relatedRecords') {
        if (filterSpecifier.op !== 'equal') {
          throw new Error(`Operation "${filterSpecifier.op}" is not supported in JSONAPI for relatedRecords filtering`);
        }
        const relatedRecordsFilter = filterSpecifier as RelatedRecordsFilterSpecifier;
        filters.push({ [relatedRecordsFilter.relation]: relatedRecordsFilter.records.map(e => e.id).join(',') });
      } else {
        throw new QueryExpressionParseError(`Filter operation ${filterSpecifier.op} not recognized for JSONAPISource.`, filterSpecifier);
      }
    });

    return filters;
  }

  buildSortParam(sortSpecifiers: SortSpecifier[]): string {
    return sortSpecifiers.map(sortSpecifier => {
      if (sortSpecifier.kind === 'attribute') {
        const attributeSort = sortSpecifier as AttributeSortSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `null`
        const resourceAttribute = this.serializer.resourceAttribute(null, attributeSort.attribute);
        return (sortSpecifier.order === 'descending' ? '-' : '') + resourceAttribute;
      }
      throw new QueryExpressionParseError(`Sort specifier ${sortSpecifier.kind} not recognized for JSONAPISource.`, sortSpecifier);
    }).join(',');
  }

  buildPageParam(pageSpecifier: PageSpecifier): object {
    let pageParam = clone(pageSpecifier);
    delete pageParam.kind;
    return pageParam;
  }

  buildFetchSettings(options: RequestOptions = {}, customSettings?: FetchSettings): FetchSettings {
    return buildFetchSettings(options, customSettings);
  }

  customRequestOptions(queryOrTransform: Query | Transform): RequestOptions {
    return deepGet(queryOrTransform, ['options', 'sources', this.sourceName]);
  }

  protected appendQueryParams(url: string, settings: FetchSettings): string {
    let fullUrl = url;
    if (settings.params) {
      fullUrl = appendQueryParams(fullUrl, settings.params);
      delete settings.params;
    }
    return fullUrl;
  }

  protected initDefaultFetchSettings(settings: JSONAPIRequestProcessorSettings): void {
    this.defaultFetchSettings = {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      timeout: 5000
    };

    if (settings.defaultFetchHeaders || settings.defaultFetchTimeout) {
      deprecate('Pass `defaultFetchSettings` with `headers` instead of `defaultFetchHeaders` to initialize requestProcessor', settings.defaultFetchHeaders === undefined);
      deprecate('Pass `defaultFetchSettings` with `timeout` instead of `defaultFetchTimeout` to initialize requestProcessor', settings.defaultFetchTimeout === undefined);

      deepMerge(this.defaultFetchSettings, {
        headers: settings.defaultFetchHeaders,
        timeout: settings.defaultFetchTimeout
      });
    }

    if (settings.defaultFetchSettings) {
      deepMerge(this.defaultFetchSettings, settings.defaultFetchSettings);
    }
  }

  protected async handleFetchResponse(response: Response): Promise<any> {
    if (response.status === 201) {
      if (this.responseHasContent(response)) {
        return response.json();
      } else {
        throw new InvalidServerResponse(`Server responses with a ${response.status} status should return content with one of the following content types: ${this.allowedContentTypes.join(', ')}.`);
      }
    } else if (response.status >= 200 && response.status < 300) {
      if (this.responseHasContent(response)) {
        return response.json();
      }
    } else {
      if (this.responseHasContent(response)) {
        return response.json()
          .then((data: any) => this.handleFetchResponseError(response, data));
      } else {
        return this.handleFetchResponseError(response);
      }
    }
  }

  protected async handleFetchResponseError(response: Response, data?: any): Promise<any> {
    let error: any;
    if (response.status >= 400 && response.status < 500) {
      error = new ClientError(response.statusText);
    } else {
      error = new ServerError(response.statusText);
    }
    error.response = response;
    error.data = data;
    throw error;
  }

  protected async handleFetchError(e: any): Promise<any> {
    throw new NetworkError(e);
  }
}
