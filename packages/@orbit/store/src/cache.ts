/* eslint-disable valid-jsdoc */
import { isArray, Dict } from '@orbit/utils';
import {
  evented, Evented
} from '@orbit/core';
import {
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

export interface CacheSettings {
  schema?: Schema;
  keyMap?: KeyMap;
  processors?: OperationProcessorClass[];
  base?: Cache;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
}

/**
 `Cache` provides a thin wrapper over an internally maintained instance of a
 `Document`.

 `Cache` prepares records to be cached according to a specified schema. The
 schema also determines the paths at which records will be stored.

 Once cached, data can be accessed at a particular path with `get`. The
 size of data at a path can be accessed with `length`.

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
  private _records: Dict<ImmutableMap>;

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

  records(type: string): ImmutableMap {
    return this._records[type];
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

      this._records[type] = new ImmutableMap(baseRecords);
    });

    // TODO
    // this.keyMap.pushDocument(data);

    this._processors.forEach(processor => processor.reset());

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
      // the requested operation
      let relatedOps = this._processors.map(processor => processor.after(operation));

      // Perform the requested operation
      let patchTransform: PatchTransformFunc = PatchTransforms[ operation.op ];
      if (patchTransform(this, operation)) {
        // console.debug('Cache#patch', operation);
        this.emit('patch', operation);
      };

      // Perform related `after` operations after performing
      // the requested operation
      relatedOps.forEach(ops => this._applyOperations(ops, inverse));

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
