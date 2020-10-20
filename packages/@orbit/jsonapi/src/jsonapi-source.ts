/* eslint-disable valid-jsdoc */
import { Assertion } from '@orbit/core';
import {
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
  TransformNotAllowed,
  QueryNotAllowed,
  RecordQueryResult,
  RecordTransformResult,
  Response,
  FullResponse
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
import { ResourceDocument } from './resources';

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
export class JSONAPISource
  extends Source
  implements
    Pullable<ResourceDocument | ResourceDocument[]>,
    Pushable<ResourceDocument | ResourceDocument[]>,
    Queryable<RecordQueryResult, ResourceDocument | ResourceDocument[]>,
    Updatable<RecordTransformResult, ResourceDocument | ResourceDocument[]> {
  maxRequestsPerTransform?: number;
  maxRequestsPerQuery?: number;
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull!: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<Transform[]>;

  // Pushable interface stubs
  push!: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<Transform[]>;

  // Queryable interface stubs
  query!: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    Response<RecordQueryResult, ResourceDocument | ResourceDocument[]>
  >;

  // Updatable interface stubs
  update!: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    Response<RecordTransformResult, ResourceDocument | ResourceDocument[]>
  >;

  constructor(settings: JSONAPISourceSettings = {}) {
    settings.name = settings.name || 'jsonapi';

    super(settings);

    let {
      name,
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
      keyMap
    } = settings;

    if (this.schema === undefined) {
      throw new Assertion(
        "JSONAPISource's `schema` must be specified in the  `settings` passed to its constructor"
      );
    }

    this.maxRequestsPerTransform = maxRequestsPerTransform;
    this.maxRequestsPerQuery = maxRequestsPerQuery;

    RequestProcessorClass = RequestProcessorClass || JSONAPIRequestProcessor;
    this.requestProcessor = new RequestProcessorClass({
      sourceName: name,
      serializerFor,
      serializerClassFor,
      serializerSettingsFor,
      SerializerClass,
      URLBuilderClass: URLBuilderClass || JSONAPIURLBuilder,
      allowedContentTypes,
      defaultFetchSettings,
      namespace,
      host,
      schema: this.schema,
      keyMap
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(
    transform: Transform
  ): Promise<FullResponse<Transform[], ResourceDocument | ResourceDocument[]>> {
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

    return { data: transforms };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(
    query: Query
  ): Promise<FullResponse<Transform[], ResourceDocument | ResourceDocument[]>> {
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

    return { data: transforms };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: Query
  ): Promise<
    FullResponse<RecordQueryResult, ResourceDocument | ResourceDocument[]>
  > {
    const transforms: Transform[] = [];
    const { requestProcessor } = this;
    const requests = this.getQueryRequests(query);
    const responses: RecordQueryResult[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let { transforms: additionalTransforms, primaryData } = await processor(
        requestProcessor,
        request
      );
      if (additionalTransforms.length) {
        Array.prototype.push.apply(transforms, additionalTransforms);
      }
      responses.push(primaryData);
    }

    await this.transformed(transforms);

    return { data: query.expressions.length === 1 ? responses[0] : responses };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(
    transform: Transform
  ): Promise<
    FullResponse<RecordTransformResult, ResourceDocument | ResourceDocument[]>
  > {
    let data;

    if (!this.transformLog.contains(transform.id)) {
      const transforms: Transform[] = [];
      const { requestProcessor } = this;
      const requests = this.getTransformRequests(transform);
      const responses: RecordTransformResult[] = [];

      for (let request of requests) {
        let processor = this.getTransformRequestProcessor(request);

        let { transforms: additionalTransforms, primaryData } = await processor(
          requestProcessor,
          request
        );
        if (additionalTransforms.length) {
          Array.prototype.push.apply(transforms, additionalTransforms);
        }
        responses.push(primaryData);
      }

      transforms.unshift(transform);
      await this.transformed(transforms);

      data = transform.operations.length === 1 ? responses[0] : responses;
    }

    return { data };
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
