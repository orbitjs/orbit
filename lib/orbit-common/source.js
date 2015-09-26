import Orbit from 'orbit/main';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import { assert } from 'orbit/lib/assert';
import { required } from 'orbit/lib/stubs';
import { Class, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import Cache from './cache';
import Operation from 'orbit/operation';
import { LinkNotFoundException } from './lib/exceptions';
import { toIdentifier } from './lib/identifiers';
import { eq } from 'orbit/lib/eq';
import { diffs } from 'orbit/lib/diffs';
import { normalizeOperations } from 'orbit/lib/operations';
import {
  coalesceOperations,
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @param {Boolean}   [options.useCache] Should source use a cache?
 @param {Object}    [options.cacheOptions] Options for cache, if used.
 @constructor
*/
var Source = Class.extend({
  init: function(options) {
    assert('Source constructor requires `options`', options);
    assert("Source's `schema` must be specified in `options.schema` constructor argument", options.schema);
    this.schema = options.schema;

    // Create an internal cache and expose some elements of its interface
    if (options.useCache) {
      this._cache = new Cache(this.schema, options.cacheOptions);
    }

    Transformable.extend(this);
    Requestable.extend(this, ['find', 'query', 'addRecord', 'replaceRecord', 'replaceAttribute', 'removeRecord',
                              'findRelationship', 'addToRelationship', 'removeFromRelationship', 'replaceRelationship',
                              'findRelated']);
    Source.created(this);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  /**
   Internal method that applies an array of transforms to this source.

   `_transform` must be implemented by a `Transformable` source.
   It is called by the public method `transform` in order to actually apply
   transforms.

   For synchronous transforms, `_transform` should return a TransformResult.

   For asynchronous transforms, `_transform` should return a promise that
   resolves to a TransformResult.

   @method _transform
   @param {Array} [operations] An array of Orbit.Operation objects
   @returns {Promise | TransformResult} An Orbit.TransformResult or Promise that resolves to a Orbit.TransformResult
   @private
   */
  _transform: required,

  /**
   Prepare an array of operations for `_transform`.

   This is an opportunity to coalesce operations, removing those that aren't
   needed for this source.

   @method prepareTransformOperations
   @param {Array} [operations] An array of Orbit.Operation objects
   @returns {Array} An array of Orbit.Operation objects
   @private
   */
  prepareTransformOperations: function(ops) {
    var result;
    var coalescedOps = coalesceOperations(ops);

    if (this._cache) {
      result = [];

      coalescedOps.forEach(function(operation) {
        var currentValue = this.retrieve(operation.path);

        if (isNone(currentValue)) {
          // Removing a null value, or replacing it with another null value, is unnecessary
          if ((operation.op === 'remove') ||
              (operation.op === 'replace' && isNone(operation.value))) {

            if (this.hasDeleted && this.hasDeleted(operation.path)) return;
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

    } else {
      result = coalescedOps;
    }

    return result;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: required,

  _query: required,

  _findRelationship: required,

  _findRelated: required,

  _addRecord: function(record) {
    var _this = this;
    var op;

    record = this.normalize(record);
    op = addRecordOperation(record);

    return this.transform(op).then(function() {
      return _this.retrieve([record.type, record.id]);
    });
  },

  _replaceRecord: function(record) {
    return this.transform(replaceRecordOperation(this.normalize(record)));
  },

  _replaceAttribute: function(record, attribute, value) {
    return this.transform(replaceAttributeOperation(record, attribute, value));
  },

  _removeRecord: function(record) {
    return this.transform(removeRecordOperation(record));
  },

  _addToRelationship: function(record, relationship, value) {
    return this.transform(addToRelationshipOperation(record, relationship, value));
  },

  _removeFromRelationship: function(record, relationship, value) {
    return this.transform(removeFromRelationshipOperation(record, relationship, value));
  },

  _replaceRelationship: function(record, relationship, value) {
    return this.transform(replaceRelationshipOperation(record, relationship, value));
  },

  /////////////////////////////////////////////////////////////////////////////
  // Helpers
  /////////////////////////////////////////////////////////////////////////////

  reset: function(data) {
    assert('`Source#reset` requires a cache.', this._cache);

    return this._cache.reset(data);
  },

  /**
   Return data at a particular path.

   Returns `undefined` if the path does not exist in the document.

   @method retrieve
   @param path
   @returns {Object}
   */
  retrieve: function(path) {
    assert('`Source#retrieve` requires a cache.', this._cache);

    return this._cache.retrieve(path);
  },

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length: function(path) {
    assert('`Source#length` requires a cache.', this._cache);

    var data = this.retrieve(path);
    if (isArray(data)) {
      return data.length;
    } else if (isObject(data)) {
      return Object.keys(data).length;
    } else {
      return 0;
    }
  },

  /**
   Returns whether a path exists in the source's cache.

   @method exists
   @param path
   @returns {Boolean}
   */
  exists: function(path) {
    assert('`Source#exists` requires a cache.', this._cache);

    return this.retrieve(path) !== undefined;
  },

  /**
   Returns whether a path has been removed from the source's cache.

   @method hasDeleted
   @param path
   @returns {Boolean}
   */
  hasDeleted: function(path) {
    assert('`Source#hasDeleted` requires a cache.', this._cache);

    return this._cache.hasDeleted(path);
  },

  normalize: function(data) {
    return this.schema.normalize(data);
  }
});

/**
 * A place to track the creation of any Source, is called in the Source init
 * method.  The source might not be fully configured / setup by the time you
 * receive it, but we provide this hook for potential debugging tools to monitor
 * all sources.
 *
 * @namespace OC
 * @param {OC.Source} source The newly forged Source.
 */
Source.created = function(/* source */) {};

export default Source;
