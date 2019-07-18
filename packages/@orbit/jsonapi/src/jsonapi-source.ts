/* eslint-disable valid-jsdoc */
import Orbit, {
  KeyMap,
  Schema,
  Source,
  SourceSettings,
  Query,
  QueryOrExpression,
  Pullable,
  pullable,
  Pushable,
  pushable,
  Transform,
  TransformOrOperations,
  Queryable,
  queryable,
  Updatable,
  updatable,
  Record,
  TransformNotAllowed
} from '@orbit/data';
import JSONAPIRequestProcessor, {
  JSONAPIRequestProcessorSettings,
  FetchSettings
} from './jsonapi-request-processor';
import {
  JSONAPISerializer,
  JSONAPISerializerSettings
} from './jsonapi-serializer';
import JSONAPIURLBuilder, {
  JSONAPIURLBuilderSettings
} from './jsonapi-url-builder';
import { QueryOperator, QueryOperators } from './lib/query-operators';
import {
  TransformRequestProcessor,
  TransformRequestProcessors,
  TransformRecordRequest,
  getTransformRequests
} from './lib/transform-requests';

const { assert, deprecate } = Orbit;

export interface JSONAPISourceSettings extends SourceSettings {
  maxRequestsPerTransform?: number;
  name?: string;
  namespace?: string;
  host?: string;
  defaultFetchHeaders?: object;
  defaultFetchTimeout?: number;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  SerializerClass?: new (
    settings: JSONAPISerializerSettings
  ) => JSONAPISerializer;
  RequestProcessorClass?: new (
    settings: JSONAPIRequestProcessorSettings
  ) => JSONAPIRequestProcessor;
  URLBuilderClass?: new (
    settings: JSONAPIURLBuilderSettings
  ) => JSONAPIURLBuilder;
  schema?: Schema;
  keyMap?: KeyMap;
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
@updatable
export default class JSONAPISource extends Source
  implements Pullable, Pushable, Queryable, Updatable {
  namespace: string;
  host: string;
  maxRequestsPerTransform?: number;
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull: (
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (
    transformOrOperations: TransformOrOperations,
    options?: object,
    id?: string
  ) => Promise<Transform[]>;

  // Queryable interface stubs
  query: (
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ) => Promise<any>;

  // Updatable interface stubs
  update: (
    transformOrOperations: TransformOrOperations,
    options?: object,
    id?: string
  ) => Promise<any>;

  constructor(settings: JSONAPISourceSettings = {}) {
    assert(
      "JSONAPISource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    settings.name = settings.name || 'jsonapi';

    super(settings);

    this.namespace = settings.namespace;
    this.host = settings.host;
    this.maxRequestsPerTransform = settings.maxRequestsPerTransform;

    const RequestProcessorClass =
      settings.RequestProcessorClass || JSONAPIRequestProcessor;
    this.requestProcessor = new RequestProcessorClass({
      sourceName: this.name,
      SerializerClass: settings.SerializerClass || JSONAPISerializer,
      URLBuilderClass: settings.URLBuilderClass || JSONAPIURLBuilder,
      allowedContentTypes: settings.allowedContentTypes,
      defaultFetchSettings: settings.defaultFetchSettings,
      namespace: settings.namespace,
      host: settings.host,
      schema: settings.schema,
      keyMap: settings.keyMap
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(transform: Transform): Promise<Transform[]> {
    const transforms: Transform[] = [];

    if (!this.transformLog.contains(transform.id)) {
      const { requestProcessor } = this;
      const requests = this.getTransformRequests(transform);

      for (let request of requests) {
        let processor = this.getTransformRequestProcessor(request);

        let { transforms: additionalTransforms } = await processor(
          requestProcessor,
          request
        );
        if (additionalTransforms.length) {
          Array.prototype.push.apply(transforms, additionalTransforms);
        }
      }

      transforms.unshift(transform);
      await this.transformed(transforms);
    }

    return transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<Transform[]> {
    const { requestProcessor } = this;
    const operator: QueryOperator = this.getQueryOperator(query);
    const response = await operator(requestProcessor, query);
    await this.transformed(response.transforms);
    return response.transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(query: Query): Promise<Record | Record[]> {
    const { requestProcessor } = this;
    const operator: QueryOperator = this.getQueryOperator(query);
    const response = await operator(requestProcessor, query);
    await this.transformed(response.transforms);
    return response.primaryData;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(transform: Transform): Promise<any> {
    if (!this.transformLog.contains(transform.id)) {
      const transforms: Transform[] = [];
      const { requestProcessor } = this;
      const requests = this.getTransformRequests(transform);
      const records: Record[] = [];

      for (let request of requests) {
        let processor = this.getTransformRequestProcessor(request);

        let { transforms: additionalTransforms, primaryData } = await processor(
          requestProcessor,
          request
        );
        if (additionalTransforms.length) {
          Array.prototype.push.apply(transforms, additionalTransforms);
        }
        records.push(primaryData);
      }

      transforms.unshift(transform);
      await this.transformed(transforms);

      return transform.operations.length === 1 ? records[0] : records;
    }
  }

  private getQueryOperator(query: Query): QueryOperator {
    const operator: QueryOperator = QueryOperators[query.expression.op];
    if (!operator) {
      throw new Error(
        'JSONAPIRequestProcessor does not support the `${query.expression.op}` operator for queries.'
      );
    }
    return operator;
  }

  private getTransformRequests(transform: Transform): TransformRecordRequest[] {
    const transformRequests = getTransformRequests(
      this.requestProcessor,
      transform
    );
    if (
      this.maxRequestsPerTransform &&
      transformRequests.length > this.maxRequestsPerTransform
    ) {
      throw new TransformNotAllowed(
        `This transform requires ${transformRequests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerTransform} requests per transform.`,
        transform
      );
    }
    return transformRequests;
  }

  private getTransformRequestProcessor(
    request: TransformRecordRequest
  ): TransformRequestProcessor {
    return TransformRequestProcessors[request.op];
  }
  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  /* DEPRECATED METHODS & PROPERTIES
   *
   * Note: In addition to deprecations below, the following methods
   * have moved to JSONAPIRequestProcessor:
   *
   *        appendQueryParams
   *        initFetchSettings
   *        initDefaultFetchSettings
   *        handleFetchResponse
   *        handleFetchResponseError
   *        handleFetchError
   *        resourceURL
   *        resourcePath
   *        resourceRelationshipURL
   *        responseHasContent
   *        relatedResourceURL
   *        resourceNamespace
   *        resourceHost
   */

  fetch(url: string, customSettings?: FetchSettings): Promise<any> {
    deprecate('JSONAPISource: fetch has moved to the requestProcessor', true);
    return this.requestProcessor.fetch(url, customSettings);
  }

  initFetchSettings(customSettings: FetchSettings = {}): FetchSettings {
    deprecate(
      'JSONAPISource: initFetchSettings has moved to the requestProcessor',
      true
    );
    return this.requestProcessor.initFetchSettings(customSettings);
  }

  get defaultFetchSettings(): FetchSettings {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings` on requestProcessor instead of source`'
    );
    return this.requestProcessor.defaultFetchSettings;
  }

  set defaultFetchSettings(settings: FetchSettings) {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings` on requestProcessor instead of source'
    );
    this.requestProcessor.defaultFetchSettings = settings;
  }

  get defaultFetchHeaders(): object {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`'
    );
    return this.requestProcessor.defaultFetchSettings.headers;
  }

  set defaultFetchHeaders(headers: object) {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings.headers` instead of `defaultFetchHeaders`'
    );
    this.requestProcessor.defaultFetchSettings.headers = headers;
  }

  get defaultFetchTimeout() {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`'
    );
    return this.requestProcessor.defaultFetchSettings.timeout;
  }

  set defaultFetchTimeout(timeout: number) {
    deprecate(
      'JSONAPISource: Access `defaultFetchSettings.timeout` instead of `defaultFetchTimeout`'
    );
    this.requestProcessor.defaultFetchSettings.timeout = timeout;
  }

  get allowedContentTypes(): string[] {
    deprecate(
      'JSONAPISource: Access `requestProcessor.allowedContentTypes` instead of `allowedContentTypes`'
    );
    return this.requestProcessor.allowedContentTypes;
  }

  set allowedContentTypes(val: string[]) {
    deprecate(
      'JSONAPISource: Access `requestProcessor.allowedContentTypes` instead of `allowedContentTypes`'
    );
    this.requestProcessor.allowedContentTypes = val;
  }
}
