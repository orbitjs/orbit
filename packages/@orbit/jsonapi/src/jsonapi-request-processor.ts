import Orbit from '@orbit/core';
import {
  ClientError,
  KeyMap,
  NetworkError,
  Operation,
  Query,
  Record,
  Schema,
  ServerError,
  Transform,
  getRequestOptions,
  QueryExpression
} from '@orbit/data';
import { Dict } from '@orbit/utils';
import { InvalidServerResponse } from './lib/exceptions';
import { TransformRecordRequest } from './lib/transform-requests';
import { QueryRequest } from './lib/query-requests';
import { deepMerge, toArray } from '@orbit/utils';
import { RecordDocument, ResourceDocument } from './resources';
import {
  JSONAPIRequestOptions,
  buildFetchSettings
} from './lib/jsonapi-request-options';
import {
  JSONAPIURLBuilder,
  JSONAPIURLBuilderSettings
} from './jsonapi-url-builder';
import {
  JSONAPISerializer,
  JSONAPISerializerSettings
} from './jsonapi-serializer';
import {
  SerializerForFn,
  SerializerClassForFn,
  SerializerSettingsForFn
} from '@orbit/serializers';
import { buildJSONAPISerializerFor } from './serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from './serializers/jsonapi-serializers';

const { assert, deprecate } = Orbit;

export interface FetchSettings {
  headers?: Dict<any>;
  method?: string;
  json?: Dict<any>;
  body?: string;
  params?: Dict<any>;
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
  serializerFor?: SerializerForFn;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
  SerializerClass?: new (
    settings: JSONAPISerializerSettings
  ) => JSONAPISerializer;
  URLBuilderClass?: new (
    settings: JSONAPIURLBuilderSettings
  ) => JSONAPIURLBuilder;
  namespace?: string;
  host?: string;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  schema: Schema;
  keyMap?: KeyMap;
}

export class JSONAPIRequestProcessor {
  sourceName: string;
  urlBuilder: JSONAPIURLBuilder;
  allowedContentTypes: string[];
  defaultFetchSettings!: FetchSettings;
  schema: Schema;
  keyMap?: KeyMap;
  protected _serializer?: JSONAPISerializer;
  protected _serializerFor: SerializerForFn;

  constructor(settings: JSONAPIRequestProcessorSettings) {
    let {
      sourceName,
      allowedContentTypes,
      schema,
      keyMap,
      SerializerClass,
      serializerFor,
      serializerClassFor,
      serializerSettingsFor
    } = settings;

    this.sourceName = sourceName;
    this.allowedContentTypes = allowedContentTypes || [
      'application/vnd.api+json',
      'application/json'
    ];
    this.schema = schema;
    this.keyMap = keyMap;
    if (SerializerClass) {
      deprecate(
        "The 'SerializerClass' setting for 'JSONAPIRequestProcessor' has been deprecated. Pass 'serializerFor', 'serializerClassFor', and/or 'serializerSettingsFor' instead."
      );
      this._serializer = new SerializerClass({
        schema,
        keyMap
      });
    }
    this._serializerFor = buildJSONAPISerializerFor({
      schema,
      keyMap,
      serializerFor,
      serializerClassFor,
      serializerSettingsFor
    });
    const URLBuilderClass = settings.URLBuilderClass || JSONAPIURLBuilder;
    const urlBuilderOptions: JSONAPIURLBuilderSettings = {
      host: settings.host,
      namespace: settings.namespace,
      keyMap: settings.keyMap,
      serializer: this._serializer,
      serializerFor: this._serializerFor
    };
    this.urlBuilder = new URLBuilderClass(urlBuilderOptions);
    this.initDefaultFetchSettings(settings);
  }

  get serializer(): JSONAPISerializer {
    deprecate(
      "'JSONAPIRequestProcessor#serializer' has been deprecated. Use 'serializerFor' instead."
    );
    if (this._serializer) {
      return this._serializer;
    } else {
      return this._serializerFor(
        JSONAPISerializers.ResourceDocument
      ) as JSONAPISerializer;
    }
  }

  get serializerFor(): SerializerForFn {
    return this._serializerFor;
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

    if (settings.timeout !== undefined && settings.timeout > 0) {
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
    let settings: FetchSettings = deepMerge(
      {},
      this.defaultFetchSettings,
      customSettings
    );

    if (settings.json) {
      assert(
        "`json` and `body` can't both be set for fetch requests.",
        !settings.body
      );
      settings.body = JSON.stringify(settings.json);
      delete settings.json;
    }

    if (settings.headers && !settings.body) {
      delete (settings.headers as any)['Content-Type'];
    }

    return settings;
  }

  operationsFromDeserializedDocument(
    deserialized: RecordDocument
  ): Operation[] {
    const records: Record[] = [];
    Array.prototype.push.apply(records, toArray(deserialized.data));

    if (deserialized.included) {
      Array.prototype.push.apply(records, deserialized.included);
    }

    return records.map((record) => {
      return {
        op: 'updateRecord',
        record
      };
    });
  }

  buildFetchSettings(
    options: JSONAPIRequestOptions = {},
    customSettings?: FetchSettings
  ): FetchSettings {
    return buildFetchSettings(options, customSettings);
  }

  customRequestOptions(
    queryOrTransform: Query | Transform,
    queryExpressionOrOperation: QueryExpression | Operation
  ): JSONAPIRequestOptions | undefined {
    let options: JSONAPIRequestOptions | undefined;

    if (queryOrTransform.options) {
      options = getRequestOptions(queryOrTransform.options, this.sourceName);
    }

    if (queryExpressionOrOperation.options) {
      options = {
        ...options,
        ...getRequestOptions(
          queryExpressionOrOperation.options,
          this.sourceName
        )
      };
    }

    if (options) {
      return options;
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  preprocessResponseDocument(
    document: ResourceDocument,
    queryRequestOrTransformRecordRequest: QueryRequest | TransformRecordRequest
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

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

  protected initDefaultFetchSettings(
    settings: JSONAPIRequestProcessorSettings
  ): void {
    this.defaultFetchSettings = {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      timeout: 5000
    };

    if (settings.defaultFetchSettings) {
      deepMerge(this.defaultFetchSettings, settings.defaultFetchSettings);
    }
  }

  protected async handleFetchResponse(response: Response): Promise<any> {
    if (response.status === 201) {
      if (this.responseHasContent(response)) {
        return response.json();
      } else {
        throw new InvalidServerResponse(
          `Server responses with a ${
            response.status
          } status should return content with one of the following content types: ${this.allowedContentTypes.join(
            ', '
          )}.`
        );
      }
    } else if (response.status >= 200 && response.status < 300) {
      if (this.responseHasContent(response)) {
        return response.json();
      }
    } else if (response.status === 304) {
      return;
    } else {
      if (this.responseHasContent(response)) {
        return response
          .json()
          .then((data: any) => this.handleFetchResponseError(response, data));
      } else {
        return this.handleFetchResponseError(response);
      }
    }
  }

  protected async handleFetchResponseError(
    response: Response,
    data?: unknown
  ): Promise<Error> {
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

  protected async handleFetchError(e: Error | string): Promise<Error> {
    if (typeof e === 'string') {
      throw new NetworkError(e);
    } else {
      throw e;
    }
  }
}
