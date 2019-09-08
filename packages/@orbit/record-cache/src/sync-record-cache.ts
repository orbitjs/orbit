import Orbit, { evented, Evented, Listener } from '@orbit/core';
import { deepGet, Dict } from '@orbit/utils';
import {
  KeyMap,
  Record,
  RecordOperation,
  Schema,
  QueryBuilder,
  QueryOrExpressions,
  QueryExpression,
  buildQuery,
  TransformBuilder,
  TransformBuilderFunc,
  RecordIdentity
} from '@orbit/data';
import {
  SyncOperationProcessor,
  SyncOperationProcessorClass
} from './sync-operation-processor';
import SyncCacheIntegrityProcessor from './operation-processors/sync-cache-integrity-processor';
import SyncSchemaConsistencyProcessor from './operation-processors/sync-schema-consistency-processor';
import SyncSchemaValidationProcessor from './operation-processors/sync-schema-validation-processor';
import {
  SyncPatchOperators,
  SyncPatchOperator
} from './operators/sync-patch-operators';
import {
  SyncQueryOperators,
  SyncQueryOperator
} from './operators/sync-query-operators';
import {
  SyncInversePatchOperators,
  SyncInversePatchOperator
} from './operators/sync-inverse-patch-operators';
import {
  SyncRecordAccessor,
  RecordRelationshipIdentity
} from './record-accessor';
import { PatchResult } from './patch-result';
import { QueryResult, QueryResultData } from './query-result';

const { assert } = Orbit;

export interface SyncRecordCacheSettings {
  schema: Schema;
  keyMap?: KeyMap;
  processors?: SyncOperationProcessorClass[];
  transformBuilder?: TransformBuilder;
  queryBuilder?: QueryBuilder;
  queryOperators?: Dict<SyncQueryOperator>;
  patchOperators?: Dict<SyncPatchOperator>;
  inversePatchOperators?: Dict<SyncInversePatchOperator>;
}

@evented
export abstract class SyncRecordCache implements Evented, SyncRecordAccessor {
  protected _keyMap?: KeyMap;
  protected _schema: Schema;
  protected _transformBuilder: TransformBuilder;
  protected _queryBuilder: QueryBuilder;
  protected _processors: SyncOperationProcessor[];
  protected _queryOperators: Dict<SyncQueryOperator>;
  protected _patchOperators: Dict<SyncPatchOperator>;
  protected _inversePatchOperators: Dict<SyncInversePatchOperator>;

  // Evented interface stubs
  on: (event: string, listener: Listener) => void;
  off: (event: string, listener?: Listener) => void;
  one: (event: string, listener: Listener) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => Listener[];

  constructor(settings: SyncRecordCacheSettings) {
    assert(
      "SyncRecordCache's `schema` must be specified in `settings.schema` constructor argument",
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
    this._queryOperators = settings.queryOperators || SyncQueryOperators;
    this._patchOperators = settings.patchOperators || SyncPatchOperators;
    this._inversePatchOperators =
      settings.inversePatchOperators || SyncInversePatchOperators;

    const processors: SyncOperationProcessorClass[] = settings.processors
      ? settings.processors
      : [
          SyncSchemaValidationProcessor,
          SyncSchemaConsistencyProcessor,
          SyncCacheIntegrityProcessor
        ];
    this._processors = processors.map(Processor => {
      let processor = new Processor(this);
      assert(
        'Each processor must extend SyncOperationProcessor',
        processor instanceof SyncOperationProcessor
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

  get processors(): SyncOperationProcessor[] {
    return this._processors;
  }

  getQueryOperator(op: string): SyncQueryOperator {
    return this._queryOperators[op];
  }

  getPatchOperator(op: string): SyncPatchOperator {
    return this._patchOperators[op];
  }

  getInversePatchOperator(op: string): SyncInversePatchOperator {
    return this._inversePatchOperators[op];
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
  abstract removeRecordSync(recordIdentity: RecordIdentity): Record;
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
    queryOrExpressions: QueryOrExpressions,
    options?: object,
    id?: string
  ): QueryResult {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._queryBuilder
    );
    const results = this._query(query.expressions);

    if (query.expressions.length === 1) {
      return results[0];
    }
    return results;
  }

  /**
   * Patches the cache with an operation or operations.
   */
  patch(
    operationOrOperations:
      | RecordOperation
      | RecordOperation[]
      | TransformBuilderFunc
  ): PatchResult {
    if (typeof operationOrOperations === 'function') {
      operationOrOperations = operationOrOperations(this._transformBuilder) as
        | RecordOperation
        | RecordOperation[];
    }

    const result: PatchResult = {
      inverse: [],
      data: []
    };

    if (Array.isArray(operationOrOperations)) {
      this._applyPatchOperations(
        operationOrOperations as RecordOperation[],
        result,
        true
      );
    } else {
      this._applyPatchOperation(
        operationOrOperations as RecordOperation,
        result,
        true
      );
    }

    result.inverse.reverse();

    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _query(expressions: QueryExpression[]): QueryResultData[] {
    const results: QueryResultData[] = [];
    for (let expression of expressions) {
      const queryOperator = this.getQueryOperator(expression.op);
      if (!queryOperator) {
        throw new Error(`Unable to find query operator: ${expression.op}`);
      }
      results.push(queryOperator(this, expression));
    }
    return results;
  }

  protected _applyPatchOperations(
    ops: RecordOperation[],
    result: PatchResult,
    primary: boolean = false
  ) {
    ops.forEach(op => this._applyPatchOperation(op, result, primary));
  }

  protected _applyPatchOperation(
    operation: RecordOperation,
    result: PatchResult,
    primary: boolean = false
  ) {
    if ((operation.op as string) === 'replaceRecord') {
      Orbit.deprecate(
        'The `replaceRecord` operation has been deprecated - use `updateRecord` instead.'
      );
      operation = {
        op: 'updateRecord',
        record: operation.record
      };
    }

    this._processors.forEach(processor => processor.validate(operation));

    const inversePatchOperator = this.getInversePatchOperator(operation.op);
    const inverseOp: RecordOperation | undefined = inversePatchOperator(
      this,
      operation
    );

    if (inverseOp) {
      result.inverse.push(inverseOp);

      // Query and perform related `before` operations
      this._processors
        .map(processor => processor.before(operation))
        .forEach(ops => this._applyPatchOperations(ops, result));

      // Query related `after` operations before performing
      // the requested operation. These will be applied on success.
      let preparedOps = this._processors.map(processor =>
        processor.after(operation)
      );

      // Perform the requested operation
      let patchOperator = this.getPatchOperator(operation.op);
      let data = patchOperator(this, operation);
      if (primary) {
        result.data.push(data);
      }

      // Query and perform related `immediate` operations
      this._processors.forEach(processor => processor.immediate(operation));

      // Emit event
      this.emit('patch', operation, data);

      // Perform prepared operations after performing the requested operation
      preparedOps.forEach(ops => this._applyPatchOperations(ops, result));

      // Query and perform related `finally` operations
      this._processors
        .map(processor => processor.finally(operation))
        .forEach(ops => this._applyPatchOperations(ops, result));
    } else if (primary) {
      result.data.push(null);
    }
  }
}
