import Orbit from '@orbit/core';
import { deepGet, Dict } from '@orbit/utils';
import {
  buildQuery,
  buildTransform,
  DataOrFullResponse,
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
  RecordTransform
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
  RecordRelationshipIdentity
} from './record-accessor';
import { PatchResult, RecordCacheUpdateDetails } from './response';
import { SyncLiveQuery } from './live-query/sync-live-query';
import { RecordCache, RecordCacheSettings } from './record-cache';

const { assert, deprecate } = Orbit;

export interface SyncRecordCacheSettings extends RecordCacheSettings {
  processors?: SyncOperationProcessorClass[];
  queryOperators?: Dict<SyncQueryOperator>;
  transformOperators?: Dict<SyncTransformOperator>;
  inverseTransformOperators?: Dict<SyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
}

export abstract class SyncRecordCache
  extends RecordCache
  implements SyncRecordAccessor {
  protected _processors: SyncOperationProcessor[];
  protected _queryOperators: Dict<SyncQueryOperator>;
  protected _transformOperators: Dict<SyncTransformOperator>;
  protected _inverseTransformOperators: Dict<SyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;

  constructor(settings: SyncRecordCacheSettings) {
    super(settings);

    this._queryOperators = settings.queryOperators || SyncQueryOperators;
    this._transformOperators =
      settings.transformOperators || SyncTransformOperators;
    this._inverseTransformOperators =
      settings.inverseTransformOperators || SyncInverseTransformOperators;
    this._debounceLiveQueries = settings.debounceLiveQueries !== false;

    const processors: SyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [
          SyncSchemaValidationProcessor,
          SyncSchemaConsistencyProcessor,
          SyncCacheIntegrityProcessor
        ];
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
  abstract getRecordSync(recordIdentity: RecordIdentity): Record | undefined;
  abstract getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Record[];
  abstract getInverseRelationshipsSync(
    record: RecordIdentity
  ): RecordRelationshipIdentity[];

  // Abstract methods for setting records and relationships
  abstract setRecordSync(record: Record): void;
  abstract setRecordsSync(records: Record[]): void;
  abstract removeRecordSync(recordIdentity: RecordIdentity): Record | undefined;
  abstract removeRecordsSync(recordIdentities: RecordIdentity[]): Record[];
  abstract addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  abstract removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;

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
  query(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): DataOrFullResponse<RecordQueryResult, undefined, RecordOperation> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._queryBuilder
    );
    const requestOptions = this.getQueryOptions(query);

    const results: RecordQueryExpressionResult[] = [];
    for (let expression of query.expressions) {
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      results.push(queryOperator(this, query, expression));
    }

    const data = query.expressions.length === 1 ? results[0] : results;

    if (requestOptions?.fullResponse) {
      return { data };
    } else {
      return data;
    }
  }

  /**
   * Updates the cache.
   */
  update(
    transformOrOperations: RecordTransformOrOperations,
    options?: RequestOptions,
    id?: string
  ): DataOrFullResponse<
    RecordTransformResult,
    RecordCacheUpdateDetails,
    RecordOperation
  > {
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this._transformBuilder
    );
    const requestOptions = this.getTransformOptions(transform);

    const response = {
      data: []
    } as FullResponse<
      RecordOperationResult[],
      RecordCacheUpdateDetails,
      RecordOperation
    >;

    if (requestOptions?.fullResponse) {
      response.details = {
        appliedOperations: [],
        inverseOperations: []
      };
    }

    this._applyTransformOperations(
      transform,
      transform.operations,
      response,
      true
    );

    response.details?.inverseOperations.reverse();

    let data: RecordTransformResult;
    if (transform.operations.length === 1) {
      data = (response.data as RecordOperationResult[])[0];
    } else {
      data = response.data;
    }

    if (requestOptions?.fullResponse) {
      return {
        ...response,
        data
      };
    } else {
      return data;
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

    const { data, details } = this.update(operationOrOperations, {
      fullResponse: true
    }) as FullResponse<
      RecordTransformResult,
      RecordCacheUpdateDetails,
      RecordOperation
    >;

    return {
      inverse: details?.inverseOperations || [],
      data: Array.isArray(data) ? data : [data]
    };
  }

  liveQuery(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: RequestOptions,
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
      response.details?.appliedOperations?.push(operation);

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
