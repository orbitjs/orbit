/* eslint-disable valid-jsdoc */
import { Assertion } from '@orbit/core';
import {
  QueryOrExpressions,
  RequestOptions,
  pullable,
  pushable,
  TransformOrOperations,
  queryable,
  updatable,
  TransformNotAllowed,
  QueryNotAllowed,
  FullResponse,
  TransformsOrFullResponse,
  DataOrFullResponse
} from '@orbit/data';
import {
  RecordSource,
  RecordQueryResult,
  RecordTransformResult,
  RecordSourceSettings,
  RecordQueryExpression,
  RecordQueryBuilder,
  RecordPullable,
  RecordPushable,
  RecordQueryable,
  RecordUpdatable,
  RecordOperation,
  RecordTransformBuilder,
  RecordTransform,
  RecordQuery
} from '@orbit/records';
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
  RecordQueryRequest,
  getQueryRequests
} from './lib/query-requests';
import {
  TransformRequestProcessor,
  TransformRequestProcessors,
  RecordTransformRequest,
  getTransformRequests
} from './lib/transform-requests';
import {
  SerializerClassForFn,
  SerializerSettingsForFn,
  SerializerForFn
} from '@orbit/serializers';
import { RecordDocument } from './record-document';

export interface JSONAPISourceSettings extends RecordSourceSettings {
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
  extends RecordSource
  implements
    RecordPullable<RecordDocument>,
    RecordPushable<RecordDocument>,
    RecordQueryable<RecordDocument>,
    RecordUpdatable<RecordDocument> {
  maxRequestsPerTransform?: number;
  maxRequestsPerQuery?: number;
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull!: (
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<undefined, RecordDocument, RecordOperation>
  >;

  // Pushable interface stubs
  push!: (
    transformOrOperations: TransformOrOperations<
      RecordOperation,
      RecordTransformBuilder
    >,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<undefined, RecordDocument, RecordOperation>
  >;

  // Queryable interface stubs
  query!: (
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    DataOrFullResponse<RecordQueryResult, RecordDocument, RecordOperation>
  >;

  // Updatable interface stubs
  update!: (
    transformOrOperations: TransformOrOperations<
      RecordOperation,
      RecordTransformBuilder
    >,
    options?: RequestOptions,
    id?: string
  ) => Promise<
    DataOrFullResponse<RecordTransformResult, RecordDocument, RecordOperation>
  >;

  constructor(settings: JSONAPISourceSettings) {
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
    transform: RecordTransform
  ): Promise<FullResponse<undefined, RecordDocument, RecordOperation>> {
    const fullResponse: FullResponse<
      undefined,
      RecordDocument,
      RecordOperation
    > = {};

    if (!this.transformLog.contains(transform.id)) {
      const requests = this.getTransformRequests(transform);
      const documents: RecordDocument[] = [];
      const transforms: RecordTransform[] = [];

      for (let request of requests) {
        let processor = this.getTransformRequestProcessor(request);

        let response = await processor(this.requestProcessor, request);
        if (response.transforms) {
          Array.prototype.push.apply(transforms, response.transforms);
        }
        documents.push(response.details as RecordDocument);
      }

      fullResponse.transforms = [transform, ...transforms];

      if (requests.length === 1) {
        fullResponse.details = documents[0];
      } else if (documents.length > 1) {
        fullResponse.details = documents;
      }
    }

    return fullResponse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(
    query: RecordQuery
  ): Promise<FullResponse<undefined, RecordDocument, RecordOperation>> {
    const fullResponse: FullResponse<
      undefined,
      RecordDocument,
      RecordOperation
    > = {};
    const requests = this.getQueryRequests(query);
    const documents: RecordDocument[] = [];
    const transforms: RecordTransform[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      documents.push(response.details as RecordDocument);
    }

    fullResponse.transforms = transforms;

    if (requests.length === 1) {
      fullResponse.details = documents[0];
    } else if (requests.length > 1) {
      fullResponse.details = documents;
    }

    return fullResponse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: RecordQuery
  ): Promise<FullResponse<RecordQueryResult, RecordDocument, RecordOperation>> {
    const fullResponse: FullResponse<
      RecordQueryResult,
      RecordDocument,
      RecordOperation
    > = {};
    const requests = this.getQueryRequests(query);
    const documents: RecordDocument[] = [];
    const transforms: RecordTransform[] = [];
    const data: RecordQueryResult[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      documents.push(response.details as RecordDocument);
      data.push(response.data as RecordQueryResult);
    }

    fullResponse.transforms = transforms;

    if (requests.length === 1) {
      fullResponse.details = documents[0];
      fullResponse.data = data[0];
    } else if (requests.length > 1) {
      fullResponse.details = documents;
      fullResponse.data = data;
    }

    return fullResponse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(
    transform: RecordTransform
  ): Promise<
    FullResponse<RecordTransformResult, RecordDocument, RecordOperation>
  > {
    const fullResponse: FullResponse<
      RecordTransformResult,
      RecordDocument,
      RecordOperation
    > = {};

    if (!this.transformLog.contains(transform.id)) {
      const requests = this.getTransformRequests(transform);
      const documents: RecordDocument[] = [];
      const transforms: RecordTransform[] = [];
      const data: RecordTransformResult[] = [];

      for (let request of requests) {
        let processor = this.getTransformRequestProcessor(request);

        let response = await processor(this.requestProcessor, request);
        if (response.transforms) {
          Array.prototype.push.apply(transforms, response.transforms);
        }
        documents.push(response.details as RecordDocument);
        data.push(response.data as RecordTransformResult);
      }

      fullResponse.transforms = [transform, ...transforms];

      if (requests.length === 1) {
        fullResponse.details = documents[0];
        fullResponse.data = data[0];
      } else if (requests.length > 1) {
        fullResponse.details = documents;
        fullResponse.data = data;
      }
    }

    return fullResponse;
  }

  protected getQueryRequests(query: RecordQuery): RecordQueryRequest[] {
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
    request: RecordQueryRequest
  ): QueryRequestProcessor {
    return QueryRequestProcessors[request.op];
  }

  protected getTransformRequests(
    transform: RecordTransform
  ): RecordTransformRequest[] {
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
    request: RecordTransformRequest
  ): TransformRequestProcessor {
    return TransformRequestProcessors[request.op];
  }
}
