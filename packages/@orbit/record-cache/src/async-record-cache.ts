import { Assertion, Orbit } from '@orbit/core';
import {
  buildQuery,
  buildTransform,
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  OperationTerm,
  QueryOrExpressions,
  RequestOptions,
  TransformOrOperations
} from '@orbit/data';
import {
  AsyncRecordQueryable,
  AsyncRecordUpdatable,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RecordOperationResult,
  RecordOperationTerm,
  RecordQuery,
  RecordQueryBuilder,
  RecordQueryExpression,
  RecordQueryResult,
  recordsReferencedByOperations,
  RecordTransform,
  RecordTransformBuilder,
  RecordTransformBuilderFunc,
  RecordTransformResult
} from '@orbit/records';
import { deepGet, Dict, toArray } from '@orbit/utils';
import {
  AsyncOperationProcessor,
  AsyncOperationProcessorClass
} from './async-operation-processor';
import { AsyncLiveQuery } from './live-query/async-live-query';
import { AsyncCacheIntegrityProcessor } from './operation-processors/async-cache-integrity-processor';
import { AsyncSchemaConsistencyProcessor } from './operation-processors/async-schema-consistency-processor';
import { AsyncSchemaValidationProcessor } from './operation-processors/async-schema-validation-processor';
import {
  AsyncInverseTransformOperator,
  AsyncInverseTransformOperators
} from './operators/async-inverse-transform-operators';
import {
  AsyncQueryOperator,
  AsyncQueryOperators
} from './operators/async-query-operators';
import {
  AsyncTransformOperator,
  AsyncTransformOperators
} from './operators/async-transform-operators';
import {
  AsyncRecordAccessor,
  RecordChangeset,
  RecordRelationshipIdentity
} from './record-accessor';
import {
  RecordCache,
  RecordCacheQueryOptions,
  RecordCacheSettings,
  RecordCacheTransformOptions
} from './record-cache';
import { RecordTransformBuffer } from './record-transform-buffer';
import { PatchResult, RecordCacheUpdateDetails } from './response';

const { assert, deprecate } = Orbit;

export interface AsyncRecordCacheSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends RecordCacheSettings<QO, TO, QB, TB> {
  processors?: AsyncOperationProcessorClass[];
  queryOperators?: Dict<AsyncQueryOperator>;
  transformOperators?: Dict<AsyncTransformOperator>;
  inverseTransformOperators?: Dict<AsyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
  transformBuffer?: RecordTransformBuffer;
}

export abstract class AsyncRecordCache<
    QO extends RequestOptions = RecordCacheQueryOptions,
    TO extends RequestOptions = RecordCacheTransformOptions,
    QB = RecordQueryBuilder,
    TB = RecordTransformBuilder,
    QueryResponseDetails = unknown,
    TransformResponseDetails extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
  >
  extends RecordCache<QO, TO, QB, TB>
  implements
    AsyncRecordAccessor,
    AsyncRecordQueryable<QueryResponseDetails, QB, QO>,
    AsyncRecordUpdatable<TransformResponseDetails, TB, TO> {
  protected _processors: AsyncOperationProcessor[];
  protected _queryOperators: Dict<AsyncQueryOperator>;
  protected _transformOperators: Dict<AsyncTransformOperator>;
  protected _inverseTransformOperators: Dict<AsyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;
  protected _transformBuffer?: RecordTransformBuffer;

  constructor(settings: AsyncRecordCacheSettings<QO, TO, QB, TB>) {
    super(settings);

    this._queryOperators = settings.queryOperators ?? AsyncQueryOperators;
    this._transformOperators =
      settings.transformOperators ?? AsyncTransformOperators;
    this._inverseTransformOperators =
      settings.inverseTransformOperators ?? AsyncInverseTransformOperators;
    this._debounceLiveQueries = settings.debounceLiveQueries !== false;
    this._transformBuffer = settings.transformBuffer;

    const processors: AsyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [AsyncSchemaConsistencyProcessor, AsyncCacheIntegrityProcessor];

    if (settings.autoValidate !== false && settings.processors === undefined) {
      processors.push(AsyncSchemaValidationProcessor);
    }

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
  ): Promise<InitializedRecord | undefined>;
  abstract getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<InitializedRecord[]>;
  abstract getInverseRelationshipsAsync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]>;

  // Abstract methods for setting records and relationships
  abstract setRecordAsync(record: InitializedRecord): Promise<void>;
  abstract setRecordsAsync(records: InitializedRecord[]): Promise<void>;
  abstract removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<InitializedRecord | undefined>;
  abstract removeRecordsAsync(
    recordIdentities: RecordIdentity[]
  ): Promise<InitializedRecord[]>;
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
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options?: DefaultRequestOptions<QO>,
    id?: string
  ): Promise<RequestData>;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options: FullRequestOptions<QO>,
    id?: string
  ): Promise<FullResponse<RequestData, QueryResponseDetails, RecordOperation>>;
  async query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options?: QO,
    id?: string
  ): Promise<
    | RequestData
    | FullResponse<RequestData, QueryResponseDetails, RecordOperation>
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
    transformOrOperations: TransformOrOperations<RecordOperation, TB>,
    options?: DefaultRequestOptions<TO>,
    id?: string
  ): Promise<RequestData>;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: TransformOrOperations<RecordOperation, TB>,
    options: FullRequestOptions<TO>,
    id?: string
  ): Promise<
    FullResponse<RequestData, TransformResponseDetails, RecordOperation>
  >;
  async update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transformOrOperations: TransformOrOperations<RecordOperation, TB>,
    options?: TO,
    id?: string
  ): Promise<
    | RequestData
    | FullResponse<RequestData, TransformResponseDetails, RecordOperation>
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
    const { data, details } = await (this as any).update(
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
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options?: DefaultRequestOptions<QO>,
    id?: string
  ): AsyncLiveQuery<QO, TO, QB, TB> {
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

    return new AsyncLiveQuery<QO, TO, QB, TB>({
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
    options?: QO
  ): Promise<FullResponse<RequestData, QueryResponseDetails, RecordOperation>> {
    let data;

    if (Array.isArray(query.expressions)) {
      data = [];
      for (let expression of query.expressions) {
        const queryOperator = this.getQueryOperator(expression.op);
        if (!queryOperator) {
          throw new Error(`Unable to find query operator: ${expression.op}`);
        }
        data.push(
          await queryOperator(
            this,
            expression,
            this.getQueryOptions(query, expression)
          )
        );
      }
    } else {
      const expression = query.expressions as RecordQueryExpression;
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      data = await queryOperator(
        this,
        expression,
        this.getQueryOptions(query, expression)
      );
    }

    return { data: data as RequestData };
  }

  protected async _update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transform: RecordTransform,
    options?: TO
  ): Promise<
    FullResponse<RequestData, TransformResponseDetails, RecordOperation>
  > {
    if (this.getTransformOptions(transform)?.useBuffer) {
      const buffer = await this._initTransformBuffer(transform);

      buffer.startTrackingChanges();

      const response = buffer.update(transform, {
        fullResponse: true
      });

      const changes = buffer.stopTrackingChanges();

      await this.applyRecordChangesetAsync(changes);

      const {
        appliedOperations,
        appliedOperationResults
      } = response.details as TransformResponseDetails;

      for (let i = 0, len = appliedOperations.length; i < len; i++) {
        this.emit('patch', appliedOperations[i], appliedOperationResults[i]);
      }

      return response as FullResponse<
        RequestData,
        TransformResponseDetails,
        RecordOperation
      >;
    } else {
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
          appliedOperationResults: [],
          inverseOperations: []
        };
      }

      let data: RecordTransformResult;

      if (Array.isArray(transform.operations)) {
        await this._applyTransformOperations(
          transform,
          transform.operations,
          response,
          true
        );
        data = response.data;
      } else {
        await this._applyTransformOperation(
          transform,
          transform.operations,
          response,
          true
        );
        if (Array.isArray(response.data)) {
          data = response.data[0];
        }
      }

      if (options?.fullResponse) {
        response.details?.inverseOperations.reverse();
      }

      return {
        ...response,
        data
      } as FullResponse<RequestData, TransformResponseDetails, RecordOperation>;
    }
  }

  protected _getTransformBuffer(): RecordTransformBuffer {
    if (this._transformBuffer === undefined) {
      throw new Assertion(
        'transformBuffer must be provided to cache via constructor settings'
      );
    }
    return this._transformBuffer;
  }

  protected async _initTransformBuffer(
    transform: RecordTransform
  ): Promise<RecordTransformBuffer> {
    const buffer = this._getTransformBuffer();

    const records = recordsReferencedByOperations(
      toArray(transform.operations)
    );
    const inverseRelationships = await this.getInverseRelationshipsAsync(
      records
    );
    const relatedRecords = inverseRelationships.map((ir) => ir.record);
    Array.prototype.push.apply(records, relatedRecords);

    buffer.resetState();
    buffer.setRecordsSync(await this.getRecordsAsync(records));
    buffer.addInverseRelationshipsSync(inverseRelationships);

    return buffer;
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
      | undefined = await inverseTransformOperator(
      this,
      operation,
      this.getTransformOptions(transform, operation)
    );
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
      let data = await transformOperator(
        this,
        operation,
        this.getTransformOptions(transform, operation)
      );
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
