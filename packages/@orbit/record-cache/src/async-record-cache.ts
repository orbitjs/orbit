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
  RecordRelationshipIdentity
} from './record-accessor';
import { PatchResult, RecordCacheUpdateDetails } from './response';
import { AsyncLiveQuery } from './live-query/async-live-query';
import { RecordCache, RecordCacheSettings } from './record-cache';

const { assert, deprecate } = Orbit;

export interface AsyncRecordCacheSettings extends RecordCacheSettings {
  processors?: AsyncOperationProcessorClass[];
  queryOperators?: Dict<AsyncQueryOperator>;
  transformOperators?: Dict<AsyncTransformOperator>;
  inverseTransformOperators?: Dict<AsyncInverseTransformOperator>;
  debounceLiveQueries?: boolean;
}

export abstract class AsyncRecordCache
  extends RecordCache
  implements AsyncRecordAccessor {
  protected _processors: AsyncOperationProcessor[];
  protected _queryOperators: Dict<AsyncQueryOperator>;
  protected _transformOperators: Dict<AsyncTransformOperator>;
  protected _inverseTransformOperators: Dict<AsyncInverseTransformOperator>;
  protected _debounceLiveQueries: boolean;

  constructor(settings: AsyncRecordCacheSettings) {
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
    record: RecordIdentity
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
  async query(
    queryOrExpressions: RecordQueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): Promise<
    DataOrFullResponse<RecordQueryResult, undefined, RecordOperation>
  > {
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
      results.push(await queryOperator(this, query, expression));
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
  async update(
    transformOrOperations: RecordTransformOrOperations,
    options?: RequestOptions,
    id?: string
  ): Promise<
    DataOrFullResponse<
      RecordTransformResult,
      RecordCacheUpdateDetails,
      RecordOperation
    >
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

    await this._applyTransformOperations(
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

    const { data, details } = (await this.update(operationOrOperations, {
      fullResponse: true
    })) as FullResponse<
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
      response.details?.appliedOperations?.push(operation);

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
