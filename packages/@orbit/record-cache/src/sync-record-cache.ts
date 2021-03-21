import { Orbit } from '@orbit/core';
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
  InitializedRecord,
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
  RecordQuery,
  recordsReferencedByOperations
} from '@orbit/records';
import {
  SyncOperationProcessor,
  SyncOperationProcessorClass
} from './sync-operation-processor';
import { SyncCacheIntegrityProcessor } from './operation-processors/sync-cache-integrity-processor';
import { SyncSchemaConsistencyProcessor } from './operation-processors/sync-schema-consistency-processor';
import { SyncSchemaValidationProcessor } from './operation-processors/sync-schema-validation-processor';
import {
  SyncTransformOperators,
  SyncTransformOperator
} from './operators/sync-transform-operators';
import {
  SyncQueryOperators,
  SyncQueryOperator
} from './operators/sync-query-operators';
import {
  SyncInverseTransformOperators,
  SyncInverseTransformOperator
} from './operators/sync-inverse-transform-operators';
import {
  SyncRecordAccessor,
  RecordRelationshipIdentity,
  RecordChangeset
} from './record-accessor';
import { PatchResult, RecordCacheUpdateDetails } from './response';
import { SyncLiveQuery } from './live-query/sync-live-query';
import {
  RecordCache,
  RecordCacheQueryOptions,
  RecordCacheTransformOptions,
  RecordCacheSettings
} from './record-cache';
import {
  RecordTransformBuffer,
  RecordTransformBufferClass
} from './record-transform-buffer';

const { assert, deprecate } = Orbit;

export interface SyncRecordCacheSettings<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RecordCacheTransformOptions
> extends RecordCacheSettings<QueryOptions, TransformOptions> {
  processors?: SyncOperationProcessorClass[];
  queryOperators?: Dict<SyncQueryOperator>;
  transformOperators?: Dict<SyncTransformOperator>;
  inverseTransformOperators?: Dict<SyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
  transformBufferClass?: RecordTransformBufferClass;
  transformBufferSettings?: SyncRecordCacheSettings<
    QueryOptions,
    TransformOptions
  >;
}

export abstract class SyncRecordCache<
    QueryOptions extends RequestOptions = RecordCacheQueryOptions,
    TransformOptions extends RequestOptions = RecordCacheTransformOptions
  >
  extends RecordCache<QueryOptions, TransformOptions>
  implements SyncRecordAccessor {
  protected _processors: SyncOperationProcessor[];
  protected _queryOperators: Dict<SyncQueryOperator>;
  protected _transformOperators: Dict<SyncTransformOperator>;
  protected _inverseTransformOperators: Dict<SyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;
  protected _transformBuffer?: RecordTransformBuffer;
  protected _transformBufferClass?: RecordTransformBufferClass;
  protected _transformBufferSettings?: SyncRecordCacheSettings<
    QueryOptions,
    TransformOptions
  >;

  constructor(
    settings: SyncRecordCacheSettings<QueryOptions, TransformOptions>
  ) {
    super(settings);

    this._queryOperators = settings.queryOperators || SyncQueryOperators;
    this._transformOperators =
      settings.transformOperators || SyncTransformOperators;
    this._inverseTransformOperators =
      settings.inverseTransformOperators || SyncInverseTransformOperators;
    this._debounceLiveQueries = settings.debounceLiveQueries !== false;

    const processors: SyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [SyncSchemaConsistencyProcessor, SyncCacheIntegrityProcessor];

    if (Orbit.debug && settings.processors === undefined) {
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
    queryOrExpressions: RecordQueryOrExpressions,
    options?: DefaultRequestOptions<QueryOptions>,
    id?: string
  ): RequestData;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: RecordQueryOrExpressions,
    options: FullRequestOptions<QueryOptions>,
    id?: string
  ): FullResponse<RequestData, undefined, RecordOperation>;
  query<RequestData extends RecordQueryResult = RecordQueryResult>(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: QueryOptions,
    id?: string
  ): RequestData | FullResponse<RequestData, undefined, RecordOperation> {
    const query = buildQuery(
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
    transformOrOperations: RecordTransformOrOperations,
    options?: DefaultRequestOptions<TransformOptions>,
    id?: string
  ): RequestData;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: RecordTransformOrOperations,
    options: FullRequestOptions<TransformOptions>,
    id?: string
  ): FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation>;
  update<RequestData extends RecordTransformResult = RecordTransformResult>(
    transformOrOperations: RecordTransformOrOperations,
    options?: TransformOptions,
    id?: string
  ):
    | RequestData
    | FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation> {
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
    const { data, details } = (this as SyncRecordCache).update(
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
  ): SyncLiveQuery {
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

    return new SyncLiveQuery({
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
    options?: QueryOptions
  ): FullResponse<RequestData, undefined, RecordOperation> {
    const results: RecordQueryExpressionResult[] = [];

    for (let expression of query.expressions) {
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      results.push(queryOperator(this, query, expression));
    }

    const data = query.expressions.length === 1 ? results[0] : results;

    return { data: data as RequestData };
  }

  protected _update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transform: RecordTransform,
    options?: TransformOptions
  ): FullResponse<RequestData, RecordCacheUpdateDetails, RecordOperation> {
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
      } = response.details as RecordCacheUpdateDetails;

      for (let i = 0, len = appliedOperations.length; i < len; i++) {
        this.emit('patch', appliedOperations[i], appliedOperationResults[i]);
      }

      return response as FullResponse<
        RequestData,
        RecordCacheUpdateDetails,
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

      this._applyTransformOperations(
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
  }

  protected _getTransformBuffer(): RecordTransformBuffer {
    if (this._transformBuffer === undefined) {
      let transformBufferClass =
        this._transformBufferClass ?? RecordTransformBuffer;
      let settings = this._transformBufferSettings ?? { schema: this.schema };
      settings.schema = settings.schema ?? this.schema;
      settings.keyMap = settings.keyMap ?? this.keyMap;
      this._transformBuffer = new transformBufferClass(settings);
    } else {
      this._transformBuffer.reset();
    }
    return this._transformBuffer;
  }

  protected _initTransformBuffer(
    transform: RecordTransform
  ): RecordTransformBuffer {
    const buffer = this._getTransformBuffer();

    const records = recordsReferencedByOperations(transform.operations);
    const inverseRelationships = this.getInverseRelationshipsSync(records);
    const relatedRecords = inverseRelationships.map((ir) => ir.record);
    Array.prototype.push.apply(records, relatedRecords);

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
      transform,
      operation
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
      let data = transformOperator(this, transform, operation);
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
