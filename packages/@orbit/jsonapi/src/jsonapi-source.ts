import { Orbit, Assertion } from '@orbit/core';
import {
  RequestOptions,
  pullable,
  pushable,
  queryable,
  updatable,
  TransformNotAllowed,
  QueryNotAllowed,
  FullResponse,
  DefaultRequestOptions
} from '@orbit/data';
import {
  RecordSource,
  RecordSourceSettings,
  RecordPullable,
  RecordPushable,
  RecordQueryable,
  RecordUpdatable,
  RecordOperation,
  RecordTransform,
  RecordQuery,
  RecordQueryExpressionResult,
  RecordOperationResult,
  RecordQueryResult,
  RecordTransformResult,
  RecordSourceQueryOptions,
  RecordQueryBuilder,
  RecordTransformBuilder
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
  getQueryRequests,
  QueryRequestProcessorResponse
} from './lib/query-requests';
import {
  TransformRequestProcessor,
  TransformRequestProcessors,
  RecordTransformRequest,
  getTransformRequests,
  TransformRequestProcessorResponse
} from './lib/transform-requests';
import {
  SerializerClassForFn,
  SerializerSettingsForFn,
  SerializerForFn
} from '@orbit/serializers';
import { JSONAPIResponse } from './jsonapi-response';

const { deprecate } = Orbit;

interface JSONAPISharedRequestOptions {
  maxRequests?: number;
  parallelRequests?: boolean;
}
export interface JSONAPIQueryOptions
  extends RecordSourceQueryOptions,
    JSONAPISharedRequestOptions {}

export interface JSONAPITransformOptions
  extends RequestOptions,
    JSONAPISharedRequestOptions {}

export interface JSONAPISourceSettings<
  QO extends JSONAPIQueryOptions = JSONAPIQueryOptions,
  TO extends JSONAPITransformOptions = JSONAPITransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends RecordSourceSettings<QO, TO, QB, TB> {
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

export interface JSONAPISource<
  QO extends JSONAPIQueryOptions = JSONAPIQueryOptions,
  TO extends JSONAPITransformOptions = JSONAPITransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends RecordSource<QO, TO, QB, TB>,
    RecordPullable<JSONAPIResponse[]>,
    RecordPushable<JSONAPIResponse[]>,
    RecordQueryable<JSONAPIResponse[], QB, QO>,
    RecordUpdatable<JSONAPIResponse[], TB, TO> {}

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
export class JSONAPISource<
    QO extends JSONAPIQueryOptions = JSONAPIQueryOptions,
    TO extends JSONAPITransformOptions = JSONAPITransformOptions,
    QB = RecordQueryBuilder,
    TB = RecordTransformBuilder
  >
  extends RecordSource<QO, TO, QB, TB>
  implements
    RecordPullable<JSONAPIResponse[]>,
    RecordPushable<JSONAPIResponse[]>,
    RecordQueryable<JSONAPIResponse[], QB, QO>,
    RecordUpdatable<JSONAPIResponse[], TB, TO> {
  requestProcessor: JSONAPIRequestProcessor;

  constructor(settings: JSONAPISourceSettings<QO, TO, QB, TB>) {
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

    if (this._defaultQueryOptions === undefined) {
      this._defaultQueryOptions = {} as DefaultRequestOptions<QO>;
    }
    if (this._defaultTransformOptions === undefined) {
      this._defaultTransformOptions = {} as DefaultRequestOptions<TO>;
    }

    // Parallelize query requests by default (but not transform requests)
    if (this._defaultQueryOptions.parallelRequests === undefined) {
      this._defaultQueryOptions.parallelRequests = true;
    }

    if (maxRequestsPerTransform !== undefined) {
      deprecate(
        "The 'maxRequestsPerTransform' setting for 'JSONAPSource' has been deprecated in favor of 'defaultTransformOptions.maxRequests'."
      );
      this._defaultTransformOptions.maxRequests = maxRequestsPerTransform;
    }
    if (maxRequestsPerQuery !== undefined) {
      deprecate(
        "The 'maxRequestsPerQuery' setting for 'JSONAPSource' has been deprecated in favor of 'defaultQueryOptions.maxRequests'."
      );
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
    if (this._defaultTransformOptions === undefined) {
      this._defaultTransformOptions = {} as DefaultRequestOptions<TO>;
    }
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
    if (this._defaultQueryOptions === undefined) {
      this._defaultQueryOptions = {} as DefaultRequestOptions<QO>;
    }
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

    const responses = await this.processTransformRequests(transform);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];

    for (let response of responses) {
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
    const responses = await this.processQueryRequests(query);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];

    for (let response of responses) {
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
    const responses = await this.processQueryRequests(query);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];
    const data: RecordQueryExpressionResult[] = [];

    for (let response of responses) {
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
      data.push(response.data);
    }

    return {
      data: Array.isArray(query.expressions) ? data : data[0],
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

    const responses = await this.processTransformRequests(transform);
    const details: JSONAPIResponse[] = [];
    const transforms: RecordTransform[] = [];
    const data: RecordOperationResult[] = [];

    for (let response of responses) {
      if (response.transforms) {
        Array.prototype.push.apply(transforms, response.transforms);
      }
      if (response.details) {
        details.push(response.details);
      }
      data.push(response.data);
    }

    return {
      data: Array.isArray(transform.operations) ? data : data[0],
      details,
      transforms: [transform, ...transforms]
    };
  }

  protected getQueryRequestProcessor(
    request: RecordQueryRequest
  ): QueryRequestProcessor {
    return QueryRequestProcessors[request.op];
  }

  protected getTransformRequestProcessor(
    request: RecordTransformRequest
  ): TransformRequestProcessor {
    return TransformRequestProcessors[request.op];
  }

  protected async processQueryRequests(
    query: RecordQuery
  ): Promise<QueryRequestProcessorResponse[]> {
    const options = this.getQueryOptions(query);
    const requests = getQueryRequests(this.requestProcessor, query);
    if (
      options?.maxRequests !== undefined &&
      requests.length > options.maxRequests
    ) {
      throw new QueryNotAllowed(
        `This query requires ${requests.length} requests, which exceeds the specified limit of ${options.maxRequests} requests per query.`,
        query
      );
    }

    if (options?.parallelRequests) {
      return Promise.all(
        requests.map((request) => {
          const processor = this.getQueryRequestProcessor(request);
          return processor(this.requestProcessor, request);
        })
      );
    } else {
      const responses = [];
      for (let request of requests) {
        const processor = this.getQueryRequestProcessor(request);
        responses.push(await processor(this.requestProcessor, request));
      }
      return responses;
    }
  }

  protected async processTransformRequests(
    transform: RecordTransform
  ): Promise<TransformRequestProcessorResponse[]> {
    const options = this.getTransformOptions(transform);
    const requests = getTransformRequests(this.requestProcessor, transform);
    if (
      options?.maxRequests !== undefined &&
      requests.length > options.maxRequests
    ) {
      throw new TransformNotAllowed(
        `This transform requires ${requests.length} requests, which exceeds the specified limit of ${options.maxRequests} requests per transform.`,
        transform
      );
    }

    if (options?.parallelRequests) {
      return Promise.all(
        requests.map((request) => {
          const processor = this.getTransformRequestProcessor(request);
          return processor(this.requestProcessor, request);
        })
      );
    } else {
      const responses = [];
      for (let request of requests) {
        const processor = this.getTransformRequestProcessor(request);
        responses.push(await processor(this.requestProcessor, request));
      }
      return responses;
    }
  }
}
