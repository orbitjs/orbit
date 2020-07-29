/* eslint-disable valid-jsdoc */
import Orbit, {
  KeyMap,
  Schema,
  Source,
  SourceSettings,
  Query,
  QueryOrExpressions,
  RequestOptions,
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
  TransformNotAllowed,
  QueryNotAllowed
} from '@orbit/data';
import {
  JSONAPIRequestProcessor,
  JSONAPIRequestProcessorSettings,
  FetchSettings
} from './jsonapi-request-processor';
import {
  JSONAPISerializer,
  JSONAPISerializerSettings
} from './jsonapi-serializer';
import {
  JSONAPIURLBuilder,
  JSONAPIURLBuilderSettings
} from './jsonapi-url-builder';
import {
  QueryRequestProcessor,
  QueryRequestProcessors,
  QueryRequest,
  getQueryRequests
} from './lib/query-requests';
import {
  TransformRequestProcessor,
  TransformRequestProcessors,
  TransformRecordRequest,
  getTransformRequests
} from './lib/transform-requests';
import {
  SerializerClassForFn,
  SerializerSettingsForFn,
  SerializerForFn
} from '@orbit/serializers';

const { assert } = Orbit;

export interface JSONAPISourceSettings extends SourceSettings {
  maxRequestsPerTransform?: number;
  maxRequestsPerQuery?: number;
  name?: string;
  namespace?: string;
  host?: string;
  defaultFetchSettings?: FetchSettings;
  allowedContentTypes?: string[];
  serializerFor?: SerializerForFn;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
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
export class JSONAPISource extends Source
  implements Pullable, Pushable, Queryable, Updatable {
  maxRequestsPerTransform?: number;
  maxRequestsPerQuery?: number;
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<Transform[]>;

  // Queryable interface stubs
  query: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<any>;

  // Updatable interface stubs
  update: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<any>;

  constructor(settings: JSONAPISourceSettings = {}) {
    assert(
      "JSONAPISource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    settings.name = settings.name || 'jsonapi';

    super(settings);

    let {
      maxRequestsPerTransform,
      maxRequestsPerQuery,
      namespace,
      host,
      defaultFetchSettings,
      allowedContentTypes,
      serializerFor,
      serializerClassFor,
      serializerSettingsFor,
      SerializerClass,
      RequestProcessorClass,
      URLBuilderClass,
      schema,
      keyMap
    } = settings;

    this.maxRequestsPerTransform = maxRequestsPerTransform;
    this.maxRequestsPerQuery = maxRequestsPerQuery;

    RequestProcessorClass = RequestProcessorClass || JSONAPIRequestProcessor;
    this.requestProcessor = new RequestProcessorClass({
      sourceName: this.name,
      serializerFor,
      serializerClassFor,
      serializerSettingsFor,
      SerializerClass,
      URLBuilderClass: URLBuilderClass || JSONAPIURLBuilder,
      allowedContentTypes,
      defaultFetchSettings,
      namespace,
      host,
      schema,
      keyMap
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
    const transforms: Transform[] = [];
    const { requestProcessor } = this;
    const requests = this.getQueryRequests(query);

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let { transforms: additionalTransforms } = await processor(
        requestProcessor,
        request
      );
      if (additionalTransforms.length) {
        Array.prototype.push.apply(transforms, additionalTransforms);
      }
    }

    await this.transformed(transforms);
    return transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: Query
  ): Promise<Record | Record[] | (Record | Record[])[]> {
    const transforms: Transform[] = [];
    const { requestProcessor } = this;
    const requests = this.getQueryRequests(query);
    const records: (Record | Record[] | null)[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let { transforms: additionalTransforms, primaryData } = await processor(
        requestProcessor,
        request
      );
      if (additionalTransforms.length) {
        Array.prototype.push.apply(transforms, additionalTransforms);
      }
      records.push(primaryData);
    }

    await this.transformed(transforms);

    return query.expressions.length === 1 ? records[0] : records;
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

  protected getQueryRequests(query: Query): QueryRequest[] {
    const queryRequests = getQueryRequests(this.requestProcessor, query);
    if (
      this.maxRequestsPerQuery &&
      queryRequests.length > this.maxRequestsPerQuery
    ) {
      throw new QueryNotAllowed(
        `This query requires ${queryRequests.length} requests, which exceeds the specified limit of ${this.maxRequestsPerQuery} requests per query.`,
        query
      );
    }
    return queryRequests;
  }

  protected getQueryRequestProcessor(
    request: QueryRequest
  ): QueryRequestProcessor {
    return QueryRequestProcessors[request.op];
  }

  protected getTransformRequests(
    transform: Transform
  ): TransformRecordRequest[] {
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

  protected getTransformRequestProcessor(
    request: TransformRecordRequest
  ): TransformRequestProcessor {
    return TransformRequestProcessors[request.op];
  }
}
