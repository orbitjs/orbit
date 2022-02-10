import { Orbit } from '@orbit/core';
import { requestOptionsForSource } from '@orbit/data';
import {
  RecordKeyMap,
  InitializedRecord,
  RecordSchema,
  RecordQueryExpression,
  RecordTransform,
  RecordQuery
} from '@orbit/records';
import { Dict } from '@orbit/utils';
import {
  NetworkError,
  InvalidServerResponse,
  ClientError,
  ServerError
} from './lib/exceptions';
import { RecordTransformRequest } from './lib/transform-requests';
import { RecordQueryRequest } from './lib/query-requests';
import { deepMerge, toArray } from '@orbit/utils';
import { ResourceDocument } from './resource-document';
import { RecordDocument } from './record-document';
import { JSONAPIRequestOptions } from './lib/jsonapi-request-options';
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
import { RecordOperation } from '@orbit/records';
import { JSONAPIResponse } from './jsonapi-response';

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
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
}

export class JSONAPIRequestProcessor {
  sourceName: string;
  urlBuilder: JSONAPIURLBuilder;
  allowedContentTypes: string[];
  defaultFetchSettings!: FetchSettings;
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
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

  /**
   * @deprecated since v0.17, use `serializerFor` instead
   */
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

  fetch(url: string, customSettings?: FetchSettings): Promise<JSONAPIResponse> {
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
      delete settings.headers['Content-Type'];
    }

    return settings;
  }

  operationsFromDeserializedDocument(
    deserialized: RecordDocument
  ): RecordOperation[] {
    const records: InitializedRecord[] = [];
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
    request: RecordQueryRequest | RecordTransformRequest
  ): FetchSettings {
    const settings = {
      params: {},
      ...request.options?.settings
    };

    if (request.options) {
      const { filter, sort, page, include, fields } = request.options;

      if (filter) {
        settings.params.filter = this.urlBuilder.buildFilterParam(
          filter,
          request
        );
      }

      if (sort) {
        settings.params.sort = this.urlBuilder.buildSortParam(sort, request);
      }

      if (page) {
        settings.params.page = this.urlBuilder.buildPageParam(page, request);
      }

      if (include) {
        settings.params.include = this.urlBuilder.buildIncludeParam(
          include,
          request
        );
      }

      if (fields) {
        settings.params.fields = this.urlBuilder.buildFieldsParam(
          fields,
          request
        );
      }
    }

    return settings;
  }

  mergeRequestOptions(
    options:
      | JSONAPIRequestOptions
      | undefined
      | (JSONAPIRequestOptions | undefined)[]
  ): JSONAPIRequestOptions | undefined {
    return requestOptionsForSource<JSONAPIRequestOptions>(
      options,
      this.sourceName
    );
  }

  /**
   * @deprecated since v0.17, use `mergeRequestOptions` instead
   */
  customRequestOptions(
    queryOrTransform: RecordQuery | RecordTransform,
    queryExpressionOrOperation: RecordQueryExpression | RecordOperation
  ): JSONAPIRequestOptions | undefined {
    deprecate(
      "'JSONAPIRequestProcessor#customRequestOptions' has been deprecated. Use 'mergeRequestOptions' instead."
    );
    return this.mergeRequestOptions([
      queryOrTransform.options,
      queryExpressionOrOperation.options
    ]);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  preprocessResponseDocument(
    document: ResourceDocument | undefined,
    request: RecordQueryRequest | RecordTransformRequest
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected responseHasContent(
    response: Response,
    ignoreUnrecognizedContent?: boolean
  ): boolean {
    let contentType = response.headers.get('Content-Type');
    if (contentType) {
      for (let allowedContentType of this.allowedContentTypes) {
        if (contentType.indexOf(allowedContentType) > -1) {
          return true;
        }
      }
      if (!ignoreUnrecognizedContent) {
        throw new InvalidServerResponse(
          `The server responded with the content type '${contentType}', which is not allowed. Allowed content types include: '${this.allowedContentTypes.join(
            "', '"
          )}'.`
        );
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

  protected async handleFetchResponse(
    response: Response
  ): Promise<JSONAPIResponse> {
    const responseDetail: JSONAPIResponse = {
      response
    };
    if (response.status >= 200 && response.status < 300) {
      if (response.status !== 204 && this.responseHasContent(response)) {
        responseDetail.document = await response.json();
      }
    } else if (response.status !== 304 && response.status !== 404) {
      if (this.responseHasContent(response, true)) {
        const document = await response.json();
        await this.handleFetchResponseError(response, document);
      } else {
        await this.handleFetchResponseError(response);
      }
    }
    return responseDetail;
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
