import Orbit from '@orbit/core';
import { deepGet, Dict } from '@orbit/utils';
import {
  buildQuery,
  buildTransform,
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  OperationTerm,
  RequestOptions
} from '@orbit/data';
import {
  Record,
  RecordOperation,
  RecordIdentity,
  RecordOperationTerm,
  RecordQueryResult,
  RecordQueryExpressionResult,
  RecordQueryOrExpressions,
  RecordTransformOrOperations,
  RecordTransformBuilderFunc,
  RecordTransformResult,
  RecordOperationResult,
  RecordTransform,
  RecordQuery
} from '@orbit/records';
import {
  AsyncOperationProcessor,
  AsyncOperationProcessorClass
} from './async-operation-processor';
import { AsyncCacheIntegrityProcessor } from './operation-processors/async-cache-integrity-processor';
import { AsyncSchemaConsistencyProcessor } from './operation-processors/async-schema-consistency-processor';
import { AsyncSchemaValidationProcessor } from './operation-processors/async-schema-validation-processor';
import {
  AsyncTransformOperators,
  AsyncTransformOperator
} from './operators/async-transform-operators';
import {
  AsyncQueryOperators,
  AsyncQueryOperator
} from './operators/async-query-operators';
import {
  AsyncInverseTransformOperators,
  AsyncInverseTransformOperator
} from './operators/async-inverse-transform-operators';
import {
  AsyncRecordAccessor,
  RecordChangeset,
  RecordRelationshipIdentity
} from './record-accessor';
import { PatchResult, RecordCacheUpdateDetails } from './response';
import { AsyncLiveQuery } from './live-query/async-live-query';
import {
  RecordCache,
  RecordCacheQueryOptions,
  RecordCacheTransformOptions,
  RecordCacheSettings
} from './record-cache';

const { assert, deprecate } = Orbit;

export interface AsyncRecordCacheSettings<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RecordCacheTransformOptions
> extends RecordCacheSettings<QueryOptions, TransformOptions> {
  processors?: AsyncOperationProcessorClass[];
  queryOperators?: Dict<AsyncQueryOperator>;
  transformOperators?: Dict<AsyncTransformOperator>;
  inverseTransformOperators?: Dict<AsyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
}

export abstract class AsyncRecordCache<
    QueryOptions extends RequestOptions = RecordCacheQueryOptions,
    TransformOptions extends RequestOptions = RecordCacheTransformOptions
  >
  extends RecordCache<QueryOptions, TransformOptions>
  implements AsyncRecordAccessor {
  protected _processors: AsyncOperationProcessor[];
  protected _queryOperators: Dict<AsyncQueryOperator>;
  protected _transformOperators: Dict<AsyncTransformOperator>;
  protected _inverseTransformOperators: Dict<AsyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;

  constructor(
    settings: AsyncRecordCacheSettings<QueryOptions, TransformOptions>
  ) {
    super(settings);

    this._queryOperators = settings.queryOperators || AsyncQueryOperators;
    this._transformOperators =
      settings.transformOperators || AsyncTransformOperators;
    this._inverseTransformOperators =
      settings.inverseTransformOperators || AsyncInverseTransformOperators;
    this._debounceLiveQueries = settings.debounceLiveQueries !== false;

    const processors: AsyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [
          AsyncSchemaValidationProcessor,
          AsyncSchemaConsistencyProcessor,
          AsyncCacheIntegrityProcessor
        ];
    this._processors = processors.map((Processor) => {
      let processor = new Processor(this);
      assert(
        'Each processor must extend AsyncOperationProcessor',
        processor instanceof AsyncOperationProcessor
      );
      return processor;
    });
  }

  get processors(): AsyncOperationProcessor[] {
    return this._processors;
  }

  getQueryOperator(op: string): AsyncQueryOperator {
    return this._queryOperators[op];
  }

  getTransformOperator(op: string): AsyncTransformOperator {
    return this._transformOperators[op];
  }

  getInverseTransformOperator(op: string): AsyncInverseTransformOperator {
    return this._inverseTransformOperators[op];
  }

  // Abstract methods for getting records and relationships
  abstract getRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<Record | undefined>;
  abstract getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<Record[]>;
  abstract getInverseRelationshipsAsync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]>;

  // Abstract methods for setting records and relationships
  abstract setRecordAsync(record: Record): Promise<void>;
  abstract setRecordsAsync(records: Record[]): Promise<void>;
  abstract removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<Record | undefined>;
  abstract removeRecordsAsync(
    recordIdentities: RecordIdentity[]
  ): Promise<Record[]>;
  abstract addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  abstract removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;

  async applyRecordChangesetAsync(changeset: RecordChangeset): Promise<void> {
    const {
      setRecords,
      removeRecords,
      addInverseRelationships,
      removeInverseRelationships
    } = changeset;

    const promises = [];

    if (setRecords && setRecords.length > 0) {
      promises.push(await this.setRecordsAsync(setRecords));
    }
    if (removeRecords && removeRecords.length > 0) {
      promises.push(await this.removeRecordsAsync(removeRecords));
    }
    if (addInverseRelationships && addInverseRelationships.length > 0) {
      promises.push(
        await this.addInverseRelationshipsAsync(addInverseRelationships)
      );
    }
    if (removeInverseRelationships && removeInverseRelationships.length > 0) {
      promises.push(
        await this.removeInverseRelationshipsAsync(removeInverseRelationships)
      );
    }

    await Promise.all(promises);
  }

  async getRelatedRecordAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity | null | undefined> {
    const record = await this.getRecordAsync(identity);
    if (record) {
      return deepGet(record, ['relationships', relationship, 'data']);
    }
    return undefined;
  }

  async getRelatedRecordsAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity[] | undefined> {
    const record = await this.getRecordAsync(identity);
    if (record) {
      return deepGet(record, ['relationships', relationship, 'data']);
    }
    return undefined;
  }

  /**
   * Queries the cache.
   */
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: DefaultRequestOptions<QueryOptions>,
    id?: string
  ): Promise<RequestData>;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: RecordQueryOrExpressions,
    options: FullRequestOptions<QueryOptions>,
    id?: string
  ): Promise<FullResponse<RequestData, undefined, RecordOperation>>;
  async query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: QueryOptions,
    id?: string
  ): Promise<
    RequestData | FullResponse<RequestData, undefined, RecordOperation>
  > {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._queryBuilder
    );

    const response = await this._query<RequestData>(query, options);

    if (options?.fullResponse) {
      return response;
    } else {
      return response.data as RequestData;
    }
  }

  /**
   * Updates the cache.
   */
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: RecordTransformOrOperations,
    options?: DefaultRequestOptions<TransformOptions>,
    id?: string
  ): Promise<RequestData>;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: RecordTransformOrOperations,
    options: FullRequestOptions<TransformOptions>,
    id?: string
  ): Promise<
    FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation>
  >;
  async update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transformOrOperations: RecordTransformOrOperations,
    options?: TransformOptions,
    id?: string
  ): Promise<
    | RequestData
    | FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation>
  > {
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this._transformBuilder
    );

    const response = await this._update<RequestData>(transform, options);

    if (options?.fullResponse) {
      return response;
    } else {
      return response.data as RequestData;
    }
  }

  /**
   * Patches the cache with an operation or operations.
   *
   * @deprecated since v0.17
   */
  async patch(
    operationOrOperations:
      | RecordOperation
      | RecordOperation[]
      | RecordOperationTerm
      | RecordOperationTerm[]
      | RecordTransformBuilderFunc
  ): Promise<PatchResult> {
    deprecate(
      'AsyncRecordCache#patch has been deprecated. Use AsyncRecordCache#update instead.'
    );

    // TODO - Why is this `this` cast necessary for TS to understand the correct
    // method overload?
    const { data, details } = await (this as AsyncRecordCache).update(
      operationOrOperations,
      {
        fullResponse: true
      }
    );

    return {
      inverse: details?.inverseOperations || [],
      data: Array.isArray(data) ? data : [data]
    };
  }

  liveQuery(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: DefaultRequestOptions<QueryOptions>,
    id?: string
  ): AsyncLiveQuery {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.queryBuilder
    );

    let debounce = options && (options as any).debounce;
    if (typeof debounce !== 'boolean') {
      debounce = this._debounceLiveQueries;
    }

    return new AsyncLiveQuery({
      debounce,
      cache: this,
      query
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected async _query<
    RequestData extends RecordQueryResult = RecordQueryResult
  >(
    query: RecordQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: QueryOptions
  ): Promise<FullResponse<RequestData, undefined, RecordOperation>> {
    const results: RecordQueryExpressionResult[] = [];

    for (let expression of query.expressions) {
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      results.push(await queryOperator(this, query, expression));
    }

    const data = query.expressions.length === 1 ? results[0] : results;

    return { data: data as RequestData };
  }

  protected async _update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transform: RecordTransform,
    options?: TransformOptions
  ): Promise<
    FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation>
  > {
    const response = {
      data: []
    } as FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >;

    if (options?.fullResponse) {
      response.details = {
        appliedOperations: [],
        inverseOperations: []
      };
    }

    await this._applyTransformOperations(
      transform,
      transform.operations,
      response,
      true
    );

    let data: RecordTransformResult;
    if (transform.operations.length === 1 && Array.isArray(response.data)) {
      data = response.data[0];
    } else {
      data = response.data;
    }

    if (options?.fullResponse) {
      response.details?.inverseOperations.reverse();
    }

    return {
      ...response,
      data
    } as FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation>;
  }

  protected async _applyTransformOperations(
    transform: RecordTransform,
    ops: RecordOperation[] | RecordOperationTerm[],
    response: FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >,
    primary = false
  ): Promise<void> {
    for (let op of ops) {
      await this._applyTransformOperation(transform, op, response, primary);
    }
  }

  protected async _applyTransformOperation(
    transform: RecordTransform,
    operation: RecordOperation | RecordOperationTerm,
    response: FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >,
    primary = false
  ): Promise<void> {
    if (operation instanceof OperationTerm) {
      operation = operation.toOperation() as RecordOperation;
    }

    for (let processor of this._processors) {
      await processor.validate(operation);
    }

    const inverseTransformOperator = this.getInverseTransformOperator(
      operation.op
    );
    const inverseOp:
      | RecordOperation
      | undefined = await inverseTransformOperator(this, transform, operation);
    if (inverseOp) {
      response.details?.inverseOperations?.push(inverseOp);

      // Query and perform related `before` operations
      for (let processor of this._processors) {
        await this._applyTransformOperations(
          transform,
          await processor.before(operation),
          response
        );
      }

      // Query related `after` operations before performing
      // the requested operation. These will be applied on success.
      let preparedOps = [];
      for (let processor of this._processors) {
        preparedOps.push(await processor.after(operation));
      }

      // Perform the requested operation
      let transformOperator = this.getTransformOperator(operation.op);
      let data = await transformOperator(this, transform, operation);
      if (primary) {
        response.data?.push(data);
      }
      if (response.details) {
        response.details.appliedOperationResults.push(data);
        response.details.appliedOperations.push(operation);
      }

      // Query and perform related `immediate` operations
      for (let processor of this._processors) {
        await processor.immediate(operation);
      }

      // Emit event
      this.emit('patch', operation, data);

      // Perform prepared operations after performing the requested operation
      for (let ops of preparedOps) {
        await this._applyTransformOperations(transform, ops, response);
      }

      // Query and perform related `finally` operations
      for (let processor of this._processors) {
        await this._applyTransformOperations(
          transform,
          await processor.finally(operation),
          response
        );
      }
    } else if (primary) {
      response.data?.push(undefined);
    }
  }
}
