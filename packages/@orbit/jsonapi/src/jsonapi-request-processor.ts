import Orbit, {
  ClientError,
  KeyMap,
  NetworkError,
  Operation,
  Query,
  Record,
  Schema,
  ServerError,
  Transform,
} from '@orbit/data';
import { InvalidServerResponse } from './lib/exceptions';
import { TransformRecordRequest } from './lib/transform-requests';
import { deepGet, deepMerge, toArray } from '@orbit/utils';
import { RecordDocument } from './record-document';
import { ResourceDocument } from './resource-document';
import {
  RequestOptions,
  buildFetchSettings
} from './lib/request-settings';
import JSONAPIURLBuilder, { JSONAPIURLBuilderSettings } from './jsonapi-url-builder';
import { JSONAPISerializer, JSONAPISerializerSettings } from './jsonapi-serializer';
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
  sourceName: string;
  SerializerClass?: (new (settings: JSONAPISerializerSettings) => JSONAPISerializer);
  URLBuilderClass?: (new (settings: JSONAPIURLBuilderSettings) => JSONAPIURLBuilder);
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  schema: Schema;
  keyMap: KeyMap;
}

export default class JSONAPIRequestProcessor {
  sourceName: string;
  serializer: JSONAPISerializer;
  urlBuilder: JSONAPIURLBuilder;
  allowedContentTypes: string[];
  defaultFetchSettings: FetchSettings;
  schema: Schema;
  keyMap: KeyMap;

  constructor(settings: JSONAPIRequestProcessorSettings) {
    this.sourceName = settings.sourceName;
    this.allowedContentTypes = settings.allowedContentTypes || ['application/vnd.api+json', 'application/json'];
    this.schema = settings.schema;
    this.keyMap = settings.keyMap;
    let SerializerClass = settings.SerializerClass || JSONAPISerializer;
    this.serializer = new SerializerClass({
      schema: settings.schema,
      keyMap: settings.keyMap
    });
    let URLBuilderClass = settings.URLBuilderClass || JSONAPIURLBuilder;
    this.urlBuilder = new URLBuilderClass({
      host: settings.host,
      namespace: settings.namespace,
      serializer: this.serializer,
      keyMap: settings.keyMap
    });
    this.initDefaultFetchSettings(settings);
  }

  fetch(url: string, customSettings?: FetchSettings): Promise<any> {
    let settings = this.initFetchSettings(customSettings);

    let fullUrl = url;
    if (settings.params) {
      fullUrl = this.urlBuilder.appendQueryParams(fullUrl, settings.params);
      delete settings.params;
    }

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

  buildFetchSettings(options: RequestOptions = {}, customSettings?: FetchSettings): FetchSettings {
    return buildFetchSettings(options, customSettings);
  }

  customRequestOptions(queryOrTransform: Query | Transform): RequestOptions {
    return deepGet(queryOrTransform, ['options', 'sources', this.sourceName]);
  }

  preprocessResponseDocument(document: ResourceDocument, queryOrTransformRecordRequest:Query|TransformRecordRequest) {}

  protected responseHasContent(response: Response): boolean {
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
