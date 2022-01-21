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
  RecordTransformResult,
  SyncRecordQueryable,
  SyncRecordUpdatable
} from '@orbit/records';
import { deepGet, Dict, toArray } from '@orbit/utils';
import { SyncLiveQuery } from './live-query/sync-live-query';
import { SyncCacheIntegrityProcessor } from './operation-processors/sync-cache-integrity-processor';
import { SyncSchemaConsistencyProcessor } from './operation-processors/sync-schema-consistency-processor';
import { SyncSchemaValidationProcessor } from './operation-processors/sync-schema-validation-processor';
import {
  SyncInverseTransformOperator,
  SyncInverseTransformOperators
} from './operators/sync-inverse-transform-operators';
import {
  SyncQueryOperator,
  SyncQueryOperators
} from './operators/sync-query-operators';
import {
  SyncTransformOperator,
  SyncTransformOperators
} from './operators/sync-transform-operators';
import {
  RecordChangeset,
  RecordRelationshipIdentity,
  SyncRecordAccessor
} from './record-accessor';
import {
  RecordCache,
  RecordCacheQueryOptions,
  RecordCacheSettings,
  RecordCacheTransformOptions
} from './record-cache';
import { RecordTransformBuffer } from './record-transform-buffer';
import { PatchResult, RecordCacheUpdateDetails } from './response';
import {
  SyncOperationProcessor,
  SyncOperationProcessorClass
} from './sync-operation-processor';

const { assert, deprecate } = Orbit;

export interface SyncRecordCacheSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends RecordCacheSettings<QO, TO, QB, TB> {
  processors?: SyncOperationProcessorClass[];
  queryOperators?: Dict<SyncQueryOperator>;
  transformOperators?: Dict<SyncTransformOperator>;
  inverseTransformOperators?: Dict<SyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
  transformBuffer?: RecordTransformBuffer;
}

export abstract class SyncRecordCache<
    QO extends RequestOptions = RecordCacheQueryOptions,
    TO extends RequestOptions = RecordCacheTransformOptions,
    QB = RecordQueryBuilder,
    TB = RecordTransformBuilder,
    QueryResponseDetails = unknown,
    TransformResponseDetails extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
  >
  extends RecordCache<QO, TO, QB, TB>
  implements
    SyncRecordAccessor,
    SyncRecordQueryable<QueryResponseDetails, QB, QO>,
    SyncRecordUpdatable<TransformResponseDetails, TB, TO> {
  protected _processors: SyncOperationProcessor[];
  protected _queryOperators: Dict<SyncQueryOperator>;
  protected _transformOperators: Dict<SyncTransformOperator>;
  protected _inverseTransformOperators: Dict<SyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;
  protected _transformBuffer?: RecordTransformBuffer;

  constructor(settings: SyncRecordCacheSettings<QO, TO, QB, TB>) {
    super(settings);

    this._queryOperators = settings.queryOperators ?? SyncQueryOperators;
    this._transformOperators =
      settings.transformOperators ?? SyncTransformOperators;
    this._inverseTransformOperators =
      settings.inverseTransformOperators ?? SyncInverseTransformOperators;
    this._debounceLiveQueries = settings.debounceLiveQueries !== false;
    this._transformBuffer = settings.transformBuffer;

    const processors: SyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [SyncSchemaConsistencyProcessor, SyncCacheIntegrityProcessor];

    if (settings.autoValidate !== false && settings.processors === undefined) {
      processors.push(SyncSchemaValidationProcessor);
    }

    this._processors = processors.map((Processor) => {
      let processor = new Processor(this);
      assert(
        'Each processor must extend SyncOperationProcessor',
        processor instanceof SyncOperationProcessor
      );
      return processor;
    });
  }

  get processors(): SyncOperationProcessor[] {
    return this._processors;
  }

  getQueryOperator(op: string): SyncQueryOperator {
    return this._queryOperators[op];
  }

  getTransformOperator(op: string): SyncTransformOperator {
    return this._transformOperators[op];
  }

  getInverseTransformOperator(op: string): SyncInverseTransformOperator {
    return this._inverseTransformOperators[op];
  }

  // Abstract methods for getting records and relationships
  abstract getRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined;
  abstract getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[];
  abstract getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[];

  // Abstract methods for setting records and relationships
  abstract setRecordSync(record: InitializedRecord): void;
  abstract setRecordsSync(records: InitializedRecord[]): void;
  abstract removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined;
  abstract removeRecordsSync(
    recordIdentities: RecordIdentity[]
  ): InitializedRecord[];
  abstract addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  abstract removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;

  applyRecordChangesetSync(changeset: RecordChangeset): void {
    const {
      setRecords,
      removeRecords,
      addInverseRelationships,
      removeInverseRelationships
    } = changeset;

    if (setRecords && setRecords.length > 0) {
      this.setRecordsSync(setRecords);
    }
    if (removeRecords && removeRecords.length > 0) {
      this.removeRecordsSync(removeRecords);
    }
    if (addInverseRelationships && addInverseRelationships.length > 0) {
      this.addInverseRelationshipsSync(addInverseRelationships);
    }
    if (removeInverseRelationships && removeInverseRelationships.length > 0) {
      this.removeInverseRelationshipsSync(removeInverseRelationships);
    }
  }

  getRelatedRecordSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity | null | undefined {
    const record = this.getRecordSync(identity);
    if (record) {
      return deepGet(record, ['relationships', relationship, 'data']);
    }
    return undefined;
  }

  getRelatedRecordsSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity[] | undefined {
    const record = this.getRecordSync(identity);
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
  ): RequestData;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options: FullRequestOptions<QO>,
    id?: string
  ): FullResponse<RequestData, QueryResponseDetails, RecordOperation>;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options?: QO,
    id?: string
  ):
    | RequestData
    | FullResponse<RequestData, QueryResponseDetails, RecordOperation> {
    const query = buildQuery<RecordQueryExpression, QB>(
      queryOrExpressions,
      options,
      id,
      this._queryBuilder
    );

    const response = this._query<RequestData>(query, options);

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
  ): RequestData;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: TransformOrOperations<RecordOperation, TB>,
    options: FullRequestOptions<TO>,
    id?: string
  ): FullResponse<RequestData, TransformResponseDetails, RecordOperation>;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: TransformOrOperations<RecordOperation, TB>,
    options?: TO,
    id?: string
  ):
    | RequestData
    | FullResponse<RequestData, TransformResponseDetails, RecordOperation> {
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this._transformBuilder
    );

    const response = this._update<RequestData>(transform, options);

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
  patch(
    operationOrOperations:
      | RecordOperation
      | RecordOperation[]
      | RecordOperationTerm
      | RecordOperationTerm[]
      | RecordTransformBuilderFunc
  ): PatchResult {
    deprecate(
      'SyncRecordCache#patch has been deprecated. Use SyncRecordCache#update instead.'
    );

    // TODO - Why is this `this` cast necessary for TS to understand the correct
    // method overload?
    const { data, details } = (this as any).update(operationOrOperations, {
      fullResponse: true
    });

    return {
      inverse: details?.inverseOperations || [],
      data: Array.isArray(data) ? data : [data]
    };
  }

  liveQuery(
    queryOrExpressions: QueryOrExpressions<RecordQueryExpression, QB>,
    options?: DefaultRequestOptions<QO>,
    id?: string
  ): SyncLiveQuery<QO, TO, QB, TB> {
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

    return new SyncLiveQuery<QO, TO, QB, TB>({
      debounce,
      cache: this,
      query
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _query<RequestData extends RecordQueryResult = RecordQueryResult>(
    query: RecordQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: QO
  ): FullResponse<RequestData, QueryResponseDetails, RecordOperation> {
    let data;

    if (Array.isArray(query.expressions)) {
      data = [];
      for (let expression of query.expressions) {
        const queryOperator = this.getQueryOperator(expression.op);
        if (!queryOperator) {
          throw new Error(`Unable to find query operator: ${expression.op}`);
        }
        data.push(
          queryOperator(
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
      data = queryOperator(
        this,
        expression,
        this.getQueryOptions(query, expression)
      );
    }

    return { data: data as RequestData };
  }

  protected _update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transform: RecordTransform,
    options?: TO
  ): FullResponse<RequestData, TransformResponseDetails, RecordOperation> {
    if (this.getTransformOptions(transform)?.useBuffer) {
      const buffer = this._initTransformBuffer(transform);

      buffer.startTrackingChanges();

      const response = buffer.update(transform, {
        fullResponse: true
      });

      const changes = buffer.stopTrackingChanges();

      this.applyRecordChangesetSync(changes);

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
        this._applyTransformOperations(
          transform,
          transform.operations,
          response,
          true
        );
        data = response.data;
      } else {
        this._applyTransformOperation(
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

  protected _initTransformBuffer(
    transform: RecordTransform
  ): RecordTransformBuffer {
    const buffer = this._getTransformBuffer();

    const records = recordsReferencedByOperations(
      toArray(transform.operations)
    );
    const inverseRelationships = this.getInverseRelationshipsSync(records);
    const relatedRecords = inverseRelationships.map((ir) => ir.record);
    Array.prototype.push.apply(records, relatedRecords);

    buffer.resetState();
    buffer.setRecordsSync(this.getRecordsSync(records));
    buffer.addInverseRelationshipsSync(inverseRelationships);

    return buffer;
  }

  protected _applyTransformOperations(
    transform: RecordTransform,
    ops: RecordOperation[] | RecordOperationTerm[],
    response: FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >,
    primary = false
  ): void {
    for (const op of ops) {
      this._applyTransformOperation(transform, op, response, primary);
    }
  }

  protected _applyTransformOperation(
    transform: RecordTransform,
    operation: RecordOperation | RecordOperationTerm,
    response: FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >,
    primary = false
  ): void {
    if (operation instanceof OperationTerm) {
      operation = operation.toOperation() as RecordOperation;
    }
    for (let processor of this._processors) {
      processor.validate(operation);
    }

    const inverseTransformOperator = this.getInverseTransformOperator(
      operation.op
    );
    const inverseOp: RecordOperation | undefined = inverseTransformOperator(
      this,
      operation,
      this.getTransformOptions(transform, operation)
    );
    if (inverseOp) {
      response.details?.inverseOperations?.push(inverseOp);

      // Query and perform related `before` operations
      for (let processor of this._processors) {
        this._applyTransformOperations(
          transform,
          processor.before(operation),
          response
        );
      }

      // Query related `after` operations before performing
      // the requested operation. These will be applied on success.
      let preparedOps = [];
      for (let processor of this._processors) {
        preparedOps.push(processor.after(operation));
      }

      // Perform the requested operation
      let transformOperator = this.getTransformOperator(operation.op);
      let data = transformOperator(
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
        processor.immediate(operation);
      }

      // Emit event
      this.emit('patch', operation, data);

      // Perform prepared operations after performing the requested operation
      for (let ops of preparedOps) {
        this._applyTransformOperations(transform, ops, response);
      }

      // Query and perform related `finally` operations
      for (let processor of this._processors) {
        this._applyTransformOperations(
          transform,
          processor.finally(operation),
          response
        );
      }
    } else if (primary) {
      response.data?.push(undefined);
    }
  }
}
