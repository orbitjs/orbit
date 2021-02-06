/* eslint-disable valid-jsdoc */
import Orbit, { Assertion } from '@orbit/core';
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
  RecordQuery,
  RecordQueryExpressionResult,
  RecordOperationResult,
  RecordQueryResult,
  RecordTransformResult,
  RecordSourceQueryOptions
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
import { JSONAPIResponse } from './jsonapi-response';

const { deprecate } = Orbit;

export interface JSONAPIQueryOptions extends RecordSourceQueryOptions {
  maxRequests?: number;
}

export interface JSONAPITransformOptions extends RequestOptions {
  maxRequests?: number;
}

export interface JSONAPISourceSettings
  extends RecordSourceSettings<JSONAPIQueryOptions, JSONAPITransformOptions> {
  /**
   * Deprecated in favor of `defaultTransformOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
  maxRequestsPerTransform?: number;

  /**
   * Deprecated in favor of `defaultQueryOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
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
  extends RecordSource<JSONAPIQueryOptions, JSONAPITransformOptions>
  implements
    RecordPullable<JSONAPIResponse[]>,
    RecordPushable<JSONAPIResponse[]>,
    RecordQueryable<JSONAPIResponse[]>,
    RecordUpdatable<JSONAPIResponse[]> {
  requestProcessor: JSONAPIRequestProcessor;

  // Pullable interface stubs
  pull!: <RO extends RecordSourceQueryOptions>(
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<undefined, JSONAPIResponse[], RecordOperation, RO>
  >;

  // Pushable interface stubs
  push!: <RO extends RequestOptions>(
    transformOrOperations: TransformOrOperations<
      RecordOperation,
      RecordTransformBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<undefined, JSONAPIResponse[], RecordOperation, RO>
  >;

  // Queryable interface stubs
  query!: <RO extends RecordSourceQueryOptions>(
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    DataOrFullResponse<
      RecordQueryResult,
      JSONAPIResponse[],
      RecordOperation,
      RO
    >
  >;

  // Updatable interface stubs
  update!: <RO extends RequestOptions>(
    transformOrOperations: TransformOrOperations<
      RecordOperation,
      RecordTransformBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    DataOrFullResponse<
      RecordTransformResult,
      JSONAPIResponse[],
      RecordOperation,
      RO
    >
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

    if (maxRequestsPerTransform !== undefined) {
      deprecate(
        "The 'maxRequestsPerTransform' setting for 'JSONAPSource' has been deprecated in favor of 'defaultTransformOptions.maxRequests'."
      );
      this._defaultTransformOptions = this._defaultTransformOptions ?? {};
      this._defaultTransformOptions.maxRequests = maxRequestsPerTransform;
    }
    if (maxRequestsPerQuery !== undefined) {
      deprecate(
        "The 'maxRequestsPerQuery' setting for 'JSONAPSource' has been deprecated in favor of 'defaultQueryOptions.maxRequests'."
      );
      this._defaultQueryOptions = this._defaultQueryOptions ?? {};
      this._defaultQueryOptions.maxRequests = maxRequestsPerQuery;
    }

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

  /**
   * Deprecated in favor of `defaultTransformOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
  get maxRequestsPerTransform(): number | undefined {
    deprecate(
      "The 'maxRequestsPerTransform' property for 'JSONAPSource' has been deprecated in favor of 'defaultTransformOptions.maxRequests'."
    );
    return this._defaultTransformOptions?.maxRequests;
  }

  /**
   * Deprecated in favor of `defaultTransformOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
  set maxRequestsPerTransform(val: number | undefined) {
    deprecate(
      "The 'maxRequestsPerTransform' property for 'JSONAPSource' has been deprecated in favor of 'defaultTransformOptions.maxRequests'."
    );
    this._defaultTransformOptions = this._defaultTransformOptions ?? {};
    this._defaultTransformOptions.maxRequests = val;
  }

  /**
   * Deprecated in favor of `defaultQueryOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
  get maxRequestsPerQuery(): number | undefined {
    deprecate(
      "The 'maxRequestsPerQuery' property for 'JSONAPSource' has been deprecated in favor of 'defaultQueryOptions.maxRequests'."
    );
    return this._defaultQueryOptions?.maxRequests;
  }

  /**
   * Deprecated in favor of `defaultQueryOptions.maxRequests`
   *
   * @deprecated since v0.17, remove in v0.18
   */
  set maxRequestsPerQuery(val: number | undefined) {
    deprecate(
      "The 'maxRequestsPerQuery' property for 'JSONAPSource' has been deprecated in favor of 'defaultQueryOptions.maxRequests'."
    );
    this._defaultQueryOptions = this._defaultQueryOptions ?? {};
    this._defaultQueryOptions.maxRequests = val;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(
    transform: RecordTransform
  ): Promise<FullResponse<undefined, JSONAPIResponse[], RecordOperation>> {
    if (this.transformLog.contains(transform.id)) {
      return {};
    }

    const requests = this.getTransformRequests(transform);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];

    for (let request of requests) {
      let processor = this.getTransformRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
    }

    return {
      transforms: [transform, ...transforms],
      details
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(
    query: RecordQuery
  ): Promise<FullResponse<undefined, JSONAPIResponse[], RecordOperation>> {
    const requests = this.getQueryRequests(query);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
    }

    return {
      transforms,
      details
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: RecordQuery
  ): Promise<
    FullResponse<RecordQueryResult, JSONAPIResponse[], RecordOperation>
  > {
    const requests = this.getQueryRequests(query);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];
    const data: RecordQueryExpressionResult[] = [];

    for (let request of requests) {
      let processor = this.getQueryRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
      data.push(response.data);
    }

    return {
      data: requests.length > 1 ? data : data[0],
      details,
      transforms
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(
    transform: RecordTransform
  ): Promise<
    FullResponse<RecordTransformResult, JSONAPIResponse[], RecordOperation>
  > {
    if (this.transformLog.contains(transform.id)) {
      return {};
    }

    const requests = this.getTransformRequests(transform);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];
    const data: RecordOperationResult[] = [];

    for (let request of requests) {
      let processor = this.getTransformRequestProcessor(request);

      let response = await processor(this.requestProcessor, request);
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
      data.push(response.data);
    }

    return {
      data: requests.length > 1 ? data : data[0],
      details,
      transforms: [transform, ...transforms]
    };
  }

  protected getQueryRequests(query: RecordQuery): RecordQueryRequest[] {
    const options = this.getQueryOptions(query);
    const queryRequests = getQueryRequests(this.requestProcessor, query);
    if (
      options?.maxRequests !== undefined &&
      queryRequests.length > options.maxRequests
    ) {
      throw new QueryNotAllowed(
        `This query requires ${queryRequests.length} requests, which exceeds the specified limit of ${options.maxRequests} requests per query.`,
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
    const options = this.getTransformOptions(transform);
    const transformRequests = getTransformRequests(
      this.requestProcessor,
      transform
    );
    if (
      options?.maxRequests !== undefined &&
      transformRequests.length > options.maxRequests
    ) {
      throw new TransformNotAllowed(
        `This transform requires ${transformRequests.length} requests, which exceeds the specified limit of ${options.maxRequests} requests per transform.`,
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
