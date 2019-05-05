import Orbit, {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  ClientError,
  FilterSpecifier,
  NetworkError,
  Operation,
  PageSpecifier,
  Query,
  QueryExpressionParseError,
  Record,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  ServerError,
  SortSpecifier,
  Transform,
  TransformNotAllowed,
} from '@orbit/data';
import JSONAPISource from './jsonapi-source';
import { InvalidServerResponse } from './lib/exceptions';
import { appendQueryParams } from './lib/query-params';
import { clone, deepMerge, toArray } from '@orbit/utils';
import { QueryOperator, QueryOperators } from "./lib/query-operators";
import { RecordDocument } from './record-document';
import { TransformRequestProcessors, TransformRecordRequest, getTransformRequests } from  './lib/transform-requests';
import {
  Filter,
  RequestOptions,
  buildFetchSettings,
  customRequestOptions
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

export interface JSONAPIRequestProcessorSettings {
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  maxRequestsPerTransform?: number;
}

export default class JSONAPIRequestProcessor {
  source: JSONAPISource;
  allowedContentTypes: string[];
  defaultFetchSettings: FetchSettings;
  maxRequestsPerTransform: number;

  constructor(source: JSONAPISource, settings: JSONAPIRequestProcessorSettings = {}) {
    this.source = source;
    this.allowedContentTypes = settings.allowedContentTypes || ['application/vnd.api+json', 'application/json'];
    this.maxRequestsPerTransform = settings.maxRequestsPerTransform;
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
    const transformRequests = getTransformRequests(this.source, transform);
    if (this.maxRequestsPerTransform && transformRequests.length > this.maxRequestsPerTransform) {
      throw new TransformNotAllowed(
        `This transform requires ${transformRequests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerTransform} requests per transform.`,
        transform);
    }
    return transformRequests;
  }

  getQueryOperator(query: Query): QueryOperator {
    const operator: QueryOperator = QueryOperators[query.expression.op];
    if (!operator) {
      throw new Error('JSONAPIRequestProcessor does not support the `${query.expression.op}` operator for queries.');
    }
    return operator;
  }

  getTransformRequestProcessor(request:TransformRecordRequest):TransformRequestProcessor {
    return TransformRequestProcessors[request.op];
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
        const resourceAttribute = this.source.serializer.resourceAttribute(null, attributeFilter.attribute);
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
        const resourceAttribute = this.source.serializer.resourceAttribute(null, attributeSort.attribute);
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
    return customRequestOptions(this.source, queryOrTransform);
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
      deprecate('Pass `defaultFetchSettings` with `headers` instead of `defaultFetchHeaders` to initialize source', settings.defaultFetchHeaders === undefined);
      deprecate('Pass `defaultFetchSettings` with `timeout` instead of `defaultFetchTimeout` to initialize source', settings.defaultFetchTimeout === undefined);

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
