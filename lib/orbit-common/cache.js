import Document from 'orbit/document';
import Operation from 'orbit/operation';
import { Class, clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import { eq } from 'orbit/lib/eq';
import { deprecate } from 'orbit/lib/deprecate';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import Transform from 'orbit/transform';

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
   Transforms the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   @method transform
   @param {Array} [operations] Array of operations to apply
   @returns {Transform}
   */
  transform: function(operations) {
    var normalizedOps = this._normalizeOperations(operations);
    var transform = new Transform(normalizedOps);

    this._applyOperations(transform, transform.operations);

    return transform;
  },

  _normalizeOperations: function(operations) {
    return operations.map(function(operation) {
      return this._normalizeOperation(operation);
    }, this);
  },

  _normalizeOperation: function(operation) {
    if (operation instanceof Operation) {
      return operation;
    } else {
      return new Operation(operation);
    }
  },

  _applyOperations: function(transform, operations) {
    operations.forEach(function(operation) {
      this._applyOperation(transform, operation);
    }, this);
  },

  _applyOperation: function(transform, operation) {
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
      _this._applyOperations(transform, relatedOps);
      relatedOps = [];
    }

    function applyOp(op) {
      transform.inverseOperations = transform.inverseOperations.concat(_this._doc.transform(op, true));
      transform.completedOperations.push(op);
    }

    // special case the addition of a `type` collection
    if (op === 'add' && path.length === 1) {
      applyOp(operation);
      return;
    }

    if (op === 'add' || op === 'replace') {
      if (!this.exists(path.slice(0, path.length - 1))) {
        return;
      }
    }

    if (eq(currentValue, value)) return;

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
