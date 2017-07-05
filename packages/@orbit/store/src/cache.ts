/* eslint-disable valid-jsdoc */
import { isArray, Dict } from '@orbit/utils';
import {
  evented, Evented
} from '@orbit/core';
import {
  Record,
  RecordIdentity,
  KeyMap,
  Operation,
  RecordOperation,
  Query,
  QueryOrExpression,
  QueryExpression,
  QueryBuilder,
  Schema,
  TransformBuilder,
  TransformBuilderFunc
} from '@orbit/data';
import { OperationProcessor, OperationProcessorClass } from './cache/operation-processors/operation-processor';
import CacheIntegrityProcessor from './cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from './cache/operation-processors/schema-consistency-processor';
import { QueryOperators } from './cache/query-operators';
import PatchTransforms, { PatchTransformFunc } from './cache/patch-transforms';
import InverseTransforms, { InverseTransformFunc } from './cache/inverse-transforms';
import ImmutableMap from './immutable-map';
import RelationshipAccessor from './cache/relationship-accessor';
import InverseRelationshipAccessor from './cache/inverse-relationship-accessor';

export interface CacheSettings {
  schema?: Schema;
  keyMap?: KeyMap;
  processors?: OperationProcessorClass[];
  base?: Cache;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
}

/**
 * A `Cache` is an in-memory data store that can be accessed synchronously.
 *
 * Caches use operation processors to maintain internal consistency.
 *
 * Because data is stored in immutable maps, caches can be forked efficiently.
 *
 * @export
 * @class Cache
 * @implements {Evented}
 */
@evented
export default class Cache implements Evented {
  private _keyMap: KeyMap;
  private _schema: Schema;
  private _queryBuilder: QueryBuilder;
  private _transformBuilder: TransformBuilder;
  private _processors: OperationProcessor[];
  private _records: Dict<ImmutableMap<string, Record>>;
  private _relationships: RelationshipAccessor;
  private _inverseRelationships: InverseRelationshipAccessor;

  // Evented interface stubs
  on: (event: string, callback: Function, binding?: object) => void;
  off: (event: string, callback: Function, binding?: object) => void;
  one: (event: string, callback: Function, binding?: object) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(settings: CacheSettings = {}) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;

    this._queryBuilder = settings.queryBuilder || new QueryBuilder();
    this._transformBuilder = settings.transformBuilder || new TransformBuilder();

    const processors: OperationProcessorClass[] = settings.processors ? settings.processors : [SchemaConsistencyProcessor, CacheIntegrityProcessor];
    this._processors = processors.map(Processor => new Processor(this));

    this.reset(settings.base);
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  get schema(): Schema {
    return this._schema;
  }

  get queryBuilder(): QueryBuilder {
    return this._queryBuilder;
  }

  get transformBuilder(): TransformBuilder {
    return this._transformBuilder;
  }

  records(type: string): ImmutableMap<string, Record> {
    return this._records[type];
  }

  get relationships(): RelationshipAccessor {
    return this._relationships;
  }

  get inverseRelationships(): InverseRelationshipAccessor {
    return this._inverseRelationships;
  }

  /**
   Allows a client to run queries against the cache.

   @example
   ``` javascript
   // using a query builder callback
   cache.query(qb.record('planet', 'idabc123')).then(results => {});
   ```

   @example
   ``` javascript
   // using an expression
   cache.query(oqe('record', 'planet', 'idabc123')).then(results => {});
   ```

   @method query
   @param {Expression} query
   @return {Object} result of query (type depends on query)
   */
  query(queryOrExpression: QueryOrExpression, options?: object, id?: string): any {
    const query = Query.from(queryOrExpression, options, id, this._queryBuilder);
    return this._query(query.expression);
  }

  /**
   * Resets the cache's state to be either empty or to match the state of
   * another cache.
   *
   * @example
   * ``` javascript
   * cache.reset(); // empties cache
   * cache.reset(cache2); // clones the state of cache2
   * ```
   *
   * @param {Cache} [base]
   * @memberof Cache
   */
  reset(base?: Cache) {
    this._records = {};

    Object.keys(this._schema.models).forEach(type => {
      let baseRecords = base && base.records(type);

      this._records[type] = new ImmutableMap<string, Record>(baseRecords);
    });

    this._relationships = new RelationshipAccessor(this, base && base.relationships);
    this._inverseRelationships = new InverseRelationshipAccessor(this, base && base.inverseRelationships);

    // TODO
    // this.keyMap.pushDocument(data);

    this._processors.forEach(processor => processor.reset(base));

    this.emit('reset');
  }

  /**
   * Patches the document with an operation.
   *
   * @param {(Operation | Operation[] | TransformBuilderFunc)} operationOrOperations
   * @returns {Operation[]}
   * @memberof Cache
   */
  patch(operationOrOperations: RecordOperation | RecordOperation[] | TransformBuilderFunc): RecordOperation[] {
    if (typeof operationOrOperations === 'function') {
      operationOrOperations = <RecordOperation | RecordOperation[]>operationOrOperations(this._transformBuilder);
    }

    const inverse: RecordOperation[] = [];

    if (isArray(operationOrOperations)) {
      this._applyOperations(<RecordOperation[]>operationOrOperations, inverse);
    } else {
      this._applyOperation(<RecordOperation>operationOrOperations, inverse);
    }

    return inverse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _applyOperations(ops: RecordOperation[], inverse: RecordOperation[]) {
    ops.forEach(op => this._applyOperation(op, inverse));
  }

  protected _applyOperation(operation: RecordOperation, inverse: RecordOperation[]) {
    const inverseTransform: InverseTransformFunc = InverseTransforms[ operation.op ];
    const inverseOp: RecordOperation = inverseTransform(this, operation);

    if (inverseOp) {
      inverse.unshift(inverseOp);

      // Query and perform related `before` operations
      this._processors
          .map(processor => processor.before(operation))
          .forEach(ops => this._applyOperations(ops, inverse));

      // Query related `after` operations before performing
      // the requested operation. These will be applied on success.
      let preparedOps = this._processors.map(processor => processor.after(operation));

      // Perform the requested operation
      let patchTransform: PatchTransformFunc = PatchTransforms[ operation.op ];
      patchTransform(this, operation);

      // Query and perform related `immediate` operations
      this._processors
          .forEach(processor => processor.immediate(operation));

      // Emit event
      this.emit('patch', operation);

      // Perform prepared operations after performing the requested operation
      preparedOps.forEach(ops => this._applyOperations(ops, inverse));

      // Query and perform related `finally` operations
      this._processors
          .map(processor => processor.finally(operation))
          .forEach(ops => this._applyOperations(ops, inverse));
    }
  }

  protected _query(expression: QueryExpression): any {
    const operator = QueryOperators[expression.op];
    if (!operator) {
      throw new Error('Unable to find operator: ' + expression.op);
    }
    return operator(this, expression);
  }
}
