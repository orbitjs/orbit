import Document from 'orbit/document';
import Operation from 'orbit/operation';
import Evented from 'orbit/evented';
import { Class, clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import { eq } from 'orbit/lib/eq';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import Transform from 'orbit/transform';
import TransformLog from 'orbit/transform-log';
import { diffs } from 'orbit/lib/diffs';
import QueryProcessor from 'orbit/query-processor';
import { normalizeOperations } from 'orbit/lib/operations';
import { coalesceOperations } from 'orbit-common/lib/operations';
import {
  QueryEvaluator
} from './oql/evaluator';
import {
  andOperator,
  orOperator,
  equalOperator,
  getOperator,
  filterOperator
} from './oql/operators';

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
 @param {Boolean} [options.sparse=true] A sparse cache is an incomplete representation of data for a schema. Non-sparse (i.e. "full") caches will pre-fill data for all models in a schema.
 @param {Cache}   [options.fallback] A fallback cache to be used to `get` any data that's undefined in this cache.
 @constructor
 */
export default Class.extend(QueryProcessor, {
  _transformLog: null,

  _transformInverses: null,

  init(schema, options) {
    this._super();

    Evented.extend(this);

    this.schema = schema;

    this._doc = new Document();

    this._resetLog();

    options = options || {};

    if (options.fallback) {
      this.fallback = options.fallback;
    }

    var processors = options.processors ? options.processors : [ SchemaConsistencyProcessor, CacheIntegrityProcessor ];
    this._initProcessors(processors);

    this.sparse = options.sparse === undefined ? true : options.sparse;

    // Non-sparse caches should pre-fill data for all models in a schema.
    if (!this.sparse) {
      // Pre-register all models.
      for (var model in schema.models) {
        if (schema.models.hasOwnProperty(model)) {
          this._registerModel(model);
        }
      }

      // Automatically fill data for models as they're registered.
      // TODO - clean up listener
      this.schema.on('modelRegistered', this._registerModel, this);
    }

    this.queryEvaluator = new QueryEvaluator(this);
    this.queryEvaluator.register([
      andOperator,
      orOperator,
      equalOperator,
      getOperator,
      filterOperator
    ]);

    this.registerQueryProcessor('oql', (query) => {
      return this.queryEvaluator.evaluate(query);
    });
  },

  query(exp) {
    return this.processQuery(exp);
  },

  reset(data) {
    this._doc.reset(data);

    this._resetLog();

    this.schema.registerAllKeys(data);

    this._processors.forEach(function(processor) {
      processor.reset(data);
    });
  },

  /**
   Return data at a particular path.

   If the path does not exist in the document, will get data from the `fallback`
   cache if one has been registered. Otherwise, `undefined` will be returned.

   @method get
   @param path
   @returns {Object}
   */
  get(path) {
    var result = this._doc.get(path, true);

    if (result === undefined && this.fallback) {
      result = this.fallback.get(path);

      // TODO - consider cloning data from fallback cache.
      //
      // if (result !== undefined) {
      //   var fallback = this.fallback;
      //   this.fallback = null;
      //
      //   this.transform([{
      //     op: 'add',
      //     path: path,
      //     value: clone(result)
      //   }]);
      //
      //   this.fallback = fallback;
      // }
    }

    return result;
  },

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
  },

  /**
   Returns whether a path exists in the document.

   @method has
   @param path
   @returns {Boolean}
   */
  has(path) {
    return this.get(path) !== undefined;
  },

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
  },

  prepareOperations(ops) {
    let result = [];
    ops = coalesceOperations(ops);

    ops.forEach(function(operation) {
      var currentValue = this.get(operation.path);

      if (isNone(currentValue)) {

        if (operation.op === 'remove' ||
            (operation.op === 'replace' && isNone(operation.value))) {

          // Removing a null value, or replacing it with another null value, is unnecessary
          if (this.hasDeleted(operation.path)) return;
        }

      } else if (operation.op === 'add' || operation.op === 'replace') {
        if (eq(currentValue, operation.value)) {
          // Replacing a value with its equivalent is unnecessary
          return;

        } else {
          var diffOps = diffs(currentValue, operation.value, { basePath: operation.path });
          Array.prototype.push.apply(result, normalizeOperations(diffOps));
          return;
        }
      }

      result.push(operation);
    }, this);

    return result;
  },

  /**
   Patches the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   @method transform
   @param {Transform} The transform to apply.
   */
  transform(transform) {
    if (!(transform instanceof Transform)) {
      transform = new Transform(transform);
    }

    let ops = this.prepareOperations(transform.operations);
    let inverse = [];

    this._applyOperations(ops, inverse);

    this._transformLog.append(transform.id);
    this._transformInverses[transform.id] = inverse;

    this.emit('transform', transform);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _initProcessors(processors) {
    this._processors = processors.map(this._initProcessor, this);
  },

  _initProcessor(Processor) {
    return new Processor(this);
  },

  _resetLog() {
    this._transformLog = new TransformLog();
    this._transformInverses = {};
  },

  _fillSparsePath(path) {
    var p;
    for (var i = 0, l = path.length; i < l; i++) {
      p = path.slice(0, i + 1);
      if (!this.has(p)) {
        this._doc.add(p, {});
      }
    }
  },

  _registerModel(model) {
    this._fillSparsePath([model]);
  },

  _applyOperations(ops, inverse) {
    ops.forEach(function(op) {
      this._applyOperation(op, inverse);
    }, this);
  },

  _applyOperation(operation, inverse) {
    var _this = this;
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;
    var currentValue = this.get(path);
    var relatedOps = [];

    function concatRelatedOps(ops) {
      relatedOps = relatedOps.concat(ops);
    }

    function applyRelatedOps() {
      _this._applyOperations(relatedOps, inverse);
      relatedOps = [];
    }

    function applyOp(op) {
      let patchInverse = _this._patch(op);
      Array.prototype.push.apply(inverse, patchInverse);
    }

    // console.log('Cache#transform', op, path.join('/'), value);

    // special case the addition of a `type` collection
    if (op === 'add' && path.length === 1) {
      applyOp(operation);
      return;
    }

    if (op === 'add' || op === 'replace') {
      if (path.length > 1) {
        var parentPath = path.slice(0, path.length - 1);
        if (!this.has(parentPath)) {
          if (this.sparse && !isNone(value)) {
            this._fillSparsePath(parentPath);
          } else {
            return;
          }
        }
      }
    }

    // console.log('Cache#transform', op, path.join('/'), value);

    if (eq(currentValue, value)) return;

    // Query and perform related `before` operations
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.before(operation));
    });
    applyRelatedOps();

    // Query related `after` operations before performing
    // the requested operation
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.after(operation));
    });

    // Perform the requested operation
    applyOp(operation);

    // Perform related `after` operations after performing
    // the requested operation
    applyRelatedOps();

    // Query and perform related `finally` operations
    this._processors.forEach(function(processor) {
      concatRelatedOps(processor.finally(operation));
    });
    applyRelatedOps();
  },

  _patch(op) {
    let inverse = this._doc.patch(op, true);

    this.emit('patch', op);

    return inverse;
  }
});
