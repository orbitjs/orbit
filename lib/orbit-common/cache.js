import Document from 'orbit/document';
import Evented from 'orbit/evented';
import { clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import CacheIntegrityProcessor from './cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from './cache/operation-processors/schema-consistency-processor';
import Transform from 'orbit/transform';
import TransformLog from 'orbit/transform/log';
import Query from 'orbit/query';
import QueryEvaluator from 'orbit/query/evaluator';
import QueryOperators from './cache/query-operators';
import QueryBuilder from './query/builder';
import TransformBuilder from './transform/builder';
import PatchTransforms from './cache/patch-transforms';
import InverseTransforms from './cache/inverse-transforms';
import LiveQueryOperators from './cache/live-query-operators';
import { toIdentifier } from './lib/identifiers';
import { fromOrbitEvent2 } from './observable/adapters';
import CacheObservable from 'orbit-common/cache/observables/cache-observable';

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
  constructor(schema, _options) {
    Evented.extend(this);

    const options = _options || {};

    this.schema = schema;
    this._doc = new Document();

    this.transformLog = new TransformLog();
    this._transformInverses = {};
    this.transformBuilder = new TransformBuilder();

    this.queryEvaluator = new QueryEvaluator(this, QueryOperators);
    this.queryBuilder = new QueryBuilder();

    const processors = options.processors ? options.processors : [SchemaConsistencyProcessor, CacheIntegrityProcessor];
    this._processors = processors.map(Processor => new Processor(this));
    this.liveQueryEvaluator = new QueryEvaluator(this, LiveQueryOperators);

    const events = fromOrbitEvent2(this, 'patch');
    this.patches = CacheObservable.fromObservable(events, this);
  }

  query(_query, context) {
    const query = Query.from(_query, this.queryBuilder);
    return this.queryEvaluator.evaluate(query.expression, context);
  }

  liveQuery(_query, context) {
    const query = Query.from(_query, this.queryBuilder);
    return this
      .liveQueryEvaluator.evaluate(query.expression, context)
      .filter(operation => ['addRecord', 'removeRecord'].indexOf(operation.op) !== -1);
  }

  reset(data) {
    this._doc.reset(data);
    this.transformLog.clear();
    this._transformInverses = {};

    this.schema.registerAllKeys(data);

    this._processors.forEach(processor => processor.reset(data));
  }

  /**
   Return data at a particular path.

   @method get
   @param path
   @returns {Object}
   */
  get(path) {
    return this._doc.get(path, true);
  }

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length(path) {
    var data = this.get(path);
    if (isArray(data)) {
      return data.length;
    } else if (isObject(data)) {
      return Object.keys(data).length;
    } else {
      return 0;
    }
  }

  /**
   Returns whether a path exists in the document.

   @method has
   @param path
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
   @param path
   @returns {Boolean}
   */
  hasDeleted(path) {
    return !this.has(path);
  }

  /**
   Patches the document with a Transform, which may include any number of
   operations.

   @method transform
   @param {Transform} The transform to apply.
   */
  transform(_transform) {
    let transform = Transform.from(_transform, this.transformBuilder);

    // let ops = this.prepareOperations(transform.operations);
    let ops = transform.operations;
    let inverse = [];

    this._applyOperations(ops, inverse);

    this.transformLog.append(transform.id);

    this._transformInverses[transform.id] = inverse;

    this.emit('transform', transform);

    return transform;
  }

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

  _applyOperations(ops, inverse) {
    ops.forEach(op => this._applyOperation(op, inverse));
  }

  _applyOperation(operation, inverse) {
    const inverseTransform = InverseTransforms[ operation.op ];
    const inverseOp = inverseTransform(this._doc, operation);

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
      }
    } else if (patchOp.op === 'add' || patchOp.op === 'replace') {
      let currentVal = this.get(patchOp.path);
      if (eq(currentVal, patchOp.value)) {
        return;
      } else {
        this._fillSparsePath(patchOp.path);
      }
    }

    this._doc.patch(patchOp);

    this.emit('patch', op);
  }

  _rollbackTransform(transformId) {
    const inverseOperations = this._transformInverses[transformId];
    inverseOperations.reverse().forEach(op => this._transformDoc(op));
  }

  _fillSparsePath(path) {
    let p;
    let data;

    for (var i = 0, l = path.length; i < l; i++) {
      p = path.slice(0, i + 1);
      if (!this.has(p)) {
        data = (i === 1) ? { type: path[0], id: path[1] } : {};
        this._doc.add(p, data);
      }
    }
  }
}
