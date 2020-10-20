import { Orbit, evented, Evented, Listener } from '@orbit/core';
import { deepGet, Dict } from '@orbit/utils';
import {
  KeyMap,
  Record,
  RecordOperation,
  Schema,
  QueryBuilder,
  QueryOrExpressions,
  QueryExpression,
  RequestOptions,
  buildQuery,
  TransformBuilder,
  TransformBuilderFunc,
  RecordIdentity,
  OperationTerm,
  RecordQueryResult,
  RecordQueryExpressionResult
} from '@orbit/data';
import {
  AsyncOperationProcessor,
  AsyncOperationProcessorClass
} from './async-operation-processor';
import { AsyncCacheIntegrityProcessor } from './operation-processors/async-cache-integrity-processor';
import { AsyncSchemaConsistencyProcessor } from './operation-processors/async-schema-consistency-processor';
import { AsyncSchemaValidationProcessor } from './operation-processors/async-schema-validation-processor';
import {
  AsyncPatchOperators,
  AsyncPatchOperator
} from './operators/async-patch-operators';
import {
  AsyncQueryOperators,
  AsyncQueryOperator
} from './operators/async-query-operators';
import {
  AsyncInversePatchOperators,
  AsyncInversePatchOperator
} from './operators/async-inverse-patch-operators';
import {
  AsyncRecordAccessor,
  RecordRelationshipIdentity
} from './record-accessor';
import { PatchResult } from './patch-result';
import { AsyncLiveQuery } from './live-query/async-live-query';

const { assert } = Orbit;

export interface AsyncRecordCacheSettings {
  schema: Schema;
  keyMap?: KeyMap;
  processors?: AsyncOperationProcessorClass[];
  transformBuilder?: TransformBuilder;
  queryBuilder?: QueryBuilder;
  queryOperators?: Dict<AsyncQueryOperator>;
  patchOperators?: Dict<AsyncPatchOperator>;
  inversePatchOperators?: Dict<AsyncInversePatchOperator>;
  debounceLiveQueries?: boolean;
}

@evented
export abstract class AsyncRecordCache implements Evented, AsyncRecordAccessor {
  protected _keyMap?: KeyMap;
  protected _schema: Schema;
  protected _transformBuilder: TransformBuilder;
  protected _queryBuilder: QueryBuilder;
  protected _processors: AsyncOperationProcessor[];
  protected _queryOperators: Dict<AsyncQueryOperator>;
  protected _patchOperators: Dict<AsyncPatchOperator>;
  protected _inversePatchOperators: Dict<AsyncInversePatchOperator>;
  protected _debounceLiveQueries: boolean;

  // Evented interface stubs
  on!: (event: string, listener: Listener) => () => void;
  off!: (event: string, listener?: Listener) => void;
  one!: (event: string, listener: Listener) => () => void;
  emit!: (event: string, ...args: any[]) => void;
  listeners!: (event: string) => Listener[];

  constructor(settings: AsyncRecordCacheSettings) {
    assert(
      "AsyncRecordCache's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    this._queryBuilder = settings.queryBuilder || new QueryBuilder();
    this._transformBuilder =
      settings.transformBuilder ||
      new TransformBuilder({
        recordInitializer: this._schema
      });
    this._queryOperators = settings.queryOperators || AsyncQueryOperators;
    this._patchOperators = settings.patchOperators || AsyncPatchOperators;
    this._inversePatchOperators =
      settings.inversePatchOperators || AsyncInversePatchOperators;
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

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap | undefined {
    return this._keyMap;
  }

  get queryBuilder(): QueryBuilder {
    return this._queryBuilder;
  }

  get transformBuilder(): TransformBuilder {
    return this._transformBuilder;
  }

  get processors(): AsyncOperationProcessor[] {
    return this._processors;
  }

  getQueryOperator(op: string): AsyncQueryOperator {
    return this._queryOperators[op];
  }

  getPatchOperator(op: string): AsyncPatchOperator {
    return this._patchOperators[op];
  }

  getInversePatchOperator(op: string): AsyncInversePatchOperator {
    return this._inversePatchOperators[op];
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
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): Promise<RecordQueryResult> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._queryBuilder
    );
    const results = await this._query(query.expressions);

    if (query.expressions.length === 1) {
      return results[0];
    }
    return results;
  }

  /**
   * Patches the cache with an operation or operations.
   */
  async patch(
    operationOrOperations:
      | RecordOperation
      | RecordOperation[]
      | OperationTerm
      | OperationTerm[]
      | TransformBuilderFunc
  ): Promise<PatchResult> {
    if (typeof operationOrOperations === 'function') {
      operationOrOperations = operationOrOperations(this._transformBuilder) as
        | OperationTerm
        | OperationTerm[];
    }

    const result: PatchResult = {
      inverse: [],
      data: []
    };

    if (Array.isArray(operationOrOperations)) {
      await this._applyPatchOperations(
        operationOrOperations as RecordOperation[],
        result,
        true
      );
    } else {
      await this._applyPatchOperation(
        operationOrOperations as RecordOperation,
        result,
        true
      );
    }

    result.inverse.reverse();

    return result;
  }

  liveQuery(
    queryOrExpressions: QueryOrExpressions,
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

  protected async _query(
    expressions: QueryExpression[]
  ): Promise<RecordQueryExpressionResult[]> {
    const results: RecordQueryExpressionResult[] = [];
    for (let expression of expressions) {
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      results.push(await queryOperator(this, expression));
    }
    return results;
  }

  protected async _applyPatchOperations(
    ops: RecordOperation[] | OperationTerm[],
    result: PatchResult,
    primary = false
  ): Promise<void> {
    for (let op of ops) {
      await this._applyPatchOperation(op, result, primary);
    }
  }

  protected async _applyPatchOperation(
    operation: RecordOperation | OperationTerm,
    result: PatchResult,
    primary = false
  ): Promise<void> {
    if (operation instanceof OperationTerm) {
      operation = operation.toOperation() as RecordOperation;
    }

    for (let processor of this._processors) {
      await processor.validate(operation);
    }

    const inversePatchOperator = this.getInversePatchOperator(operation.op);
    const inverseOp: RecordOperation | undefined = await inversePatchOperator(
      this,
      operation
    );
    if (inverseOp) {
      result.inverse.push(inverseOp);

      // Query and perform related `before` operations
      for (let processor of this._processors) {
        await this._applyPatchOperations(
          await processor.before(operation),
          result
        );
      }

      // Query related `after` operations before performing
      // the requested operation. These will be applied on success.
      let preparedOps = [];
      for (let processor of this._processors) {
        preparedOps.push(await processor.after(operation));
      }

      // Perform the requested operation
      let patchOperator = this.getPatchOperator(operation.op);
      let data = await patchOperator(this, operation);
      if (primary) {
        result.data.push(data);
      }

      // Query and perform related `immediate` operations
      for (let processor of this._processors) {
        await processor.immediate(operation);
      }

      // Emit event
      this.emit('patch', operation, data);

      // Perform prepared operations after performing the requested operation
      for (let ops of preparedOps) {
        await this._applyPatchOperations(ops, result);
      }

      // Query and perform related `finally` operations
      for (let processor of this._processors) {
        await this._applyPatchOperations(
          await processor.finally(operation),
          result
        );
      }
    } else if (primary) {
      result.data.push(undefined);
    }
  }
}
