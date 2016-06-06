/* globals Immutable */
/* eslint-disable valid-jsdoc */

import Evented from 'orbit/evented';
import { isArray, isObject } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import CacheIntegrityProcessor from './cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from './cache/operation-processors/schema-consistency-processor';
import Transform from 'orbit/transform';
import TransformLog from 'orbit/transform/log';
import Query from 'orbit/query';
import QueryEvaluator from 'orbit/query/evaluator';
import QueryOperators from './cache/query-operators';
import PatchTransforms from './cache/patch-transforms';
import InverseTransforms from './cache/inverse-transforms';
import LiveQueryOperators from './cache/live-query-operators';
import { Observable } from 'rxjs/Observable';
import CacheObservable from 'orbit-common/cache/observables/cache-observable';
import 'orbit-common/rxjs/add/observable/from-orbit-event';

/**
 `Cache` provides a thin wrapper over an internally maintained instance of a
 `Document`.

 `Cache` prepares records to be cached according to a specified schema. The
 schema also determines the paths at which records will be stored.

 Once cached, data can be accessed at a particular path with `get`. The
 size of data at a path can be accessed with `length`.

 @class Cache
 @namespace OC
 @param {OC.Schema} schema
 @param {Object}  [options]
 @param {Array}   [options.processors=[SchemaConsistencyProcessor, CacheIntegrityProcessor]] Operation processors to notify for every call to `transform`.
 @constructor
 */
export default class Cache {
  constructor(schema, options = {}) {
    Evented.extend(this);

    this.schema = schema;

    if (options.base) {
      this._doc = options.base._doc;
    } else {
      this._doc = Immutable.fromJS({});
    }

    this.transformLog = new TransformLog();
    this._transformInverses = {};

    this.queryEvaluator = new QueryEvaluator(this, QueryOperators);

    const processors = options.processors ? options.processors : [SchemaConsistencyProcessor, CacheIntegrityProcessor];
    this._processors = processors.map(Processor => new Processor(this));
    this.liveQueryEvaluator = new QueryEvaluator(this, LiveQueryOperators);

    const events = Observable.fromOrbitEvent(this, 'patch');
    this.patches = CacheObservable.fromObservable(events, this);
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
  query(_query, context) {
    const query = Query.from(_query);
    return this.queryEvaluator.evaluate(query.expression, context);
  }

  /**
   Allows a client to keep the results of a query kept up to date with the latest results in the cache.

   @example
   ``` javascript
   // using a query builder callback
   cache.liveQuery(qb.record('planet', 'idabc123')).then(operationsObservable => {});
   ```

   @example
   ``` javascript
   // using an expression
   cache.liveQuery(oqe('record', 'planet', 'idabc123')).then(operationsObservable => {});
   ```

   @method liveQuery
   @param {Object} query
   @return {<Observable>} Observable stream of operations for the results to a query
   */
  liveQuery(_query, context) {
    const query = Query.from(_query);
    const results = this._initialLiveQueryResults(query, context);
    const liveResults = this.liveQueryEvaluator.evaluate(query.expression, context)
                            .matching({ op: ['addRecord', 'removeRecord'] });

    return liveResults.startWith(...results);
  }

  /**
   Resets the cache to a particular state

   @example
   ``` javascript
   cache.reset({
     planet: {
       pluto: { id: 'pluto', attributes: { name: 'Pluto' } }
     }
   });
   ```

   @method reset
   @param {Object} data
  */
  reset(data = {}) {
    this._doc = Immutable.fromJS(data);
    this.transformLog.clear();
    this._transformInverses = {};

    this.schema.registerAllKeys(data);

    this._processors.forEach(processor => processor.reset(data));
  }

  /**
   Return immutable data at a particular path.

   @method get
   @param {string|Array<string>} path
   @returns {Object}
   */
  getRaw(_path) {
    let path;

    if (typeof _path === 'string') {
      path = _path.split('/');
    } else if (isArray(_path)) {
      path = _path;
    } else {
      path = [];
    }

    return this._doc.getIn(path);
  }

  /**
   Return plain JS data at a particular path.

   @method get
   @param path
   @returns {Object}
   */
  get(path) {
    let val = this.getRaw(path);
    if (val && val.toJS) {
      val = val.toJS();
    }
    return val;
  }

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length(path) {
    const data = this.getRaw(path);

    if (isObject(data) && typeof data.size === 'number') {
      return data.size;
    } else {
      return 0;
    }
  }

  /**
   Returns whether a path exists in the document.

   @method has
   @param {string} path
   @returns {Boolean}
   */
  has(path) {
    return this.get(path) !== undefined;
  }

  /**
   Returns whether a path has been removed from the document.

   By default, this simply returns true if the path doesn't exist.
   However, it may be overridden by an operations processor to provide more
   advanced deletion tracking.

   @method hasDeleted
   @param {string} path
   @returns {Boolean}
   */
  hasDeleted(path) {
    return !this.has(path);
  }

  /**
   Patches the document with a Transform, which may include any number of
   operations.

   @method transform
   @param {Object} transform The transform to apply.
   */
  transform(_transform) {
    let transform = Transform.from(_transform);

    // let ops = this.prepareOperations(transform.operations);
    let ops = transform.operations;
    let inverse = [];

    this._applyOperations(ops, inverse);

    this.transformLog.append(transform.id);

    this._transformInverses[transform.id] = inverse;

    this.emit('transform', transform);

    return transform;
  }

  /**
   Rolls back the cache to a particular transformId

   @method rollback
   @param {string} transformId
  */
  rollback(transformId) {
    this.transformLog
      .after(transformId)
      .reverse()
      .forEach((id) => this._rollbackTransform(id));

    this.transformLog.rollback(transformId);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _initialLiveQueryResults(_query, context) {
    const result = this.query(_query, context);

    if (!result) { return []; }

    if (result.type && result.id) {
      return [{ op: 'addRecord', record: result }];
    }

    if (result) {
      const records = Object.keys(result).map(recordId => result[recordId]);
      return records.map(record => ({ op: 'addRecord', record }));
    }
  }

  _applyOperations(ops, inverse) {
    ops.forEach(op => this._applyOperation(op, inverse));
  }

  _applyOperation(operation, inverse) {
    const inverseTransform = InverseTransforms[ operation.op ];
    const inverseOp = inverseTransform(this, operation);

    if (inverseOp) {
      inverse.push(inverseOp);

      // Query and perform related `before` operations
      this._processors
          .map(processor => processor.before(operation))
          .forEach(ops => this._applyOperations(ops, inverse));

      // Query related `after` operations before performing
      // the requested operation
      let relatedOps = this._processors.map(processor => processor.after(operation));

      // Perform the requested operation
      this._transformDoc(operation);

      // Perform related `after` operations after performing
      // the requested operation
      relatedOps.forEach(ops => this._applyOperations(ops, inverse));

      // Query and perform related `finally` operations
      this._processors
          .map(processor => processor.finally(operation))
          .forEach(ops => this._applyOperations(ops, inverse));
    }
  }

  _transformDoc(op) {
    const patchTransform = PatchTransforms[ op.op ];
    const patchOp = patchTransform(op);

    // console.log('_transformDoc', patchOp.op, patchOp.path, patchOp.value);

    if (patchOp.op === 'remove') {
      if (this.hasDeleted(patchOp.path)) {
        return;
      } else {
        this._doc = this._doc.deleteIn(patchOp.path);
      }
    } else if (patchOp.op === 'add' || patchOp.op === 'replace') {
      let currentVal = this.get(patchOp.path);
      if (eq(currentVal, patchOp.value)) {
        return;
      } else {
        let value = patchOp.value;

        if (isObject(value)) {
          this._doc = this._doc.mergeIn(patchOp.path, patchOp.value);
        } else if (value === undefined) {
          this._doc = this._doc.deleteIn(patchOp.path);
        } else {
          this._doc = this._doc.setIn(patchOp.path, patchOp.value);
        }
      }
    }

    this.emit('patch', op);
  }

  _rollbackTransform(transformId) {
    const inverseOperations = this._transformInverses[transformId];
    inverseOperations.reverse().forEach(op => this._transformDoc(op));
  }
}
