import Document from 'orbit/document';
import Operation from 'orbit/operation';
import { Class, clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import { eq } from 'orbit/lib/eq';
import { normalizeOperations } from 'orbit/lib/operations';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import TransformResult from 'orbit/transform-result';
import { diffs } from 'orbit/lib/diffs';

/**
 `Cache` provides a thin wrapper over an internally maintained instance of a
 `Document`.

 `Cache` prepares records to be cached according to a specified schema. The
 schema also determines the paths at which records will be stored.

 Once cached, data can be accessed at a particular path with `retrieve`. The
 size of data at a path can be accessed with `length`.

 @class Cache
 @namespace OC
 @param {OC.Schema} schema
 @param {Object} [options]
 @param {Array}  [options.processors=[SchemaConsistencyProcessor, CacheIntegrityProcessor]] Operation processors to notify for every call to `transform`
 @constructor
 */
export default Class.extend({
  init: function(schema, options) {
    this._doc = new Document(null, {arrayBasedPaths: true});

    this.schema = schema;
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._registerModel(model);
      }
    }

    options = options || {};
    var processors = options.processors ? options.processors : [ SchemaConsistencyProcessor, CacheIntegrityProcessor ];
    this._initProcessors(processors);

    // TODO - clean up listener
    this.schema.on('modelRegistered', this._registerModel, this);
  },

  _initProcessors: function(processors) {
    this._processors = processors.map(this._initProcessor, this);
  },

  _initProcessor: function(Processor) {
    return new Processor(this);
  },

  _registerModel: function(model) {
    var modelRootPath = [model];
    if (!this.retrieve(modelRootPath)) {
      this._doc.add(modelRootPath, {});
    }
  },

  reset: function(data) {
    this._doc.reset(data);
    this.schema.registerAllKeys(data);

    this._processors.forEach(function(processor) {
      processor.reset(data);
    });
  },

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length: function(path) {
    var data = this.retrieve(path);
    if (data === null || data === undefined) {
      return data;
    } else if (isArray(data)) {
      return data.length;
    } else {
      return Object.keys(data).length;
    }
  },

  /**
   Return data at a particular path.

   Returns `undefined` if the path does not exist in the document.

   @method retrieve
   @param path
   @returns {Object}
   */
  retrieve: function(path) {
    return this._doc.retrieve(path, true);
  },

  /**
   * Retrieves a link value.  Returns a null value for empty links.
   * For hasOne links will return a string id value of the link.
   * For hasMany links will return an array of id values.
   *
   * @param  {String} type Model Type.
   * @param  {String} id   Model ID.
   * @param  {String} link Link Key.
   * @return {Array|String|null}      The value of the link
   */
  retrieveLink: function(type, id, link) {
    var val = this.retrieve([type, id, '__rel', link]);
    if (val !== null && typeof val === 'object') {
      val = Object.keys(val);
    }
    return val;
  },


  /**
   Returns whether a path exists in the document.

   @method exists
   @param path
   @returns {Boolean}
   */
  exists: function(path) {
    return !!this._doc.retrieve(path, true);
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
  hasDeleted: function(path) {
    return !this.exists(path);
  },

  /**
   Transforms the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   @method transform
   @param {Array} [ops] Array of operations
   @returns {TransformResult} The result of applying the operations.
   */
  transform: function(ops) {
    var result = new TransformResult();
    ops = this._prepareOperations(ops);
    this._applyOperations(normalizeOperations(ops), result);
    return result;
  },

  _prepareOperations: function(ops) {
    var result = [];

    ops.forEach(function(operation) {
      var currentValue = this.retrieve(operation.path);

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

  _applyOperations: function(ops, result) {
    ops.forEach(function(op) {
      this._applyOperation(op, result);
    }, this);
  },

  _applyOperation: function(operation, result) {
    var _this = this;
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;
    var currentValue = this.retrieve(path);
    var relatedOps = [];

    function concatRelatedOps(ops) {
      relatedOps = relatedOps.concat(ops);
    }

    function applyRelatedOps() {
      _this._applyOperations(relatedOps, result);
      relatedOps = [];
    }

    function applyOp(op) {
      result.push(op, _this._doc.transform(op, true));
    }

    // console.log('Cache#transform', op, path.join('/'), value);

    // special case the addition of a `type` collection
    if (op === 'add' && path.length === 1) {
      applyOp(operation);
      return;
    }

    if (op === 'add' || op === 'replace') {
      if (!this.exists(path.slice(0, path.length - 1))) {
        return;

      // } else if (op === 'replace' && !this.exists(path)) {
      //   op = 'add';
      //   operation.op = 'add';
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
  }
});
