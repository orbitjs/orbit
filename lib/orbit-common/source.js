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
import { eq } from 'orbit/lib/eq';
import { diffs } from 'orbit/lib/diffs';
import { coalesceOperations, normalizeOperations } from 'orbit/lib/operations';

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
    Requestable.extend(this, ['find', 'query', 'add', 'update', 'patch', 'remove',
                              'findLink', 'addLink', 'removeLink', 'updateLink',
                              'findLinked']);

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

    if (this.retrieve) {
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

  _findLink: required,

  _findLinked: required,

  _add: function(type, data) {
    data = data || {};

    var record = this.normalize(type, data);

    var id = this.getId(type, record),
        path = [type, id],
        _this = this;

    return this.transform(this.schema.operationEncoder.addRecordOp(type, id, record)).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    var record = this.normalize(type, data);
    var id = this.getId(type, record);

    return this.transform(this.schema.operationEncoder.replaceRecordOp(type, id, record));
  },

  _patch: function(type, id, attribute, value) {
    id = this._normalizeId(type, id);
    // todo - confirm this simplification is valid (i.e. don't attempt to deserialize attribute path)
    return this.transform(this.schema.operationEncoder.replaceAttributeOp(type, id, attribute, value));
  },

  _remove: function(type, id) {
    id = this._normalizeId(type, id);
    return this.transform(this.schema.operationEncoder.removeRecordOp(type, id));
  },

  _addLink: function(type, id, key, value) {
    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    return this.transform(this.schema.operationEncoder.addLinkOp(type, id, key, value));
  },

  _removeLink: function(type, id, key, value) {
    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    return this.transform(this.schema.operationEncoder.removeLinkOp(type, id, key, value));
  },

  _updateLink: function(type, id, key, value) {
    var linkDef = this.schema.modelDefinition(type).links[key];

    assert('hasMany links can only be replaced when flagged as `actsAsSet`',
           linkDef.type !== 'hasMany' || linkDef.actsAsSet);

    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    var op = this.schema.operationEncoder.replaceLinkOp(type, id, key, value);
    return this.transform(op);
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
   Retrieves a link's value.

   Returns a null value for empty links.
   For hasOne links will return a string id value of the link.
   For hasMany links will return an array of id values.

   @param {String} [type] Model type
   @param {String} [id]   Model ID
   @param {String} [link] Link key
   @returns {Array|String|null} Value of the link
   */
  retrieveLink: function(type, id, link) {
    assert('`Source#retrieveLink` requires a cache.', this._cache);

    var val = this.retrieve([type, id, '__rel', link]);
    if (isObject(val)) {
      val = Object.keys(val);
    }
    return val;
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

  normalize: function(type, data) {
    return this.schema.normalize(type, data);
  },

  initDefaults: function(type, record) {
    return this.schema.initDefaults(type, record);
  },

  getId: function(type, data) {
    if (isObject(data)) {
      var modelDefinition = this.schema.modelDefinition(type);

      if (data[modelDefinition.primaryKey.name]) {
        return data[modelDefinition.primaryKey.name];

      } else {
        var secondaryKeys = modelDefinition.secondaryKeys;

        for (var key in secondaryKeys) {
          var value = data[key];
          if (value) return secondaryKeys[key].secondaryToPrimaryKeyMap[value];
        }
      }
    } else {
      return data;
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _normalizeId: function(type, id) {
    if (isObject(id)) {
      var record = this.normalize(type, id);
      id = this.getId(type, record);
    }
    return id;
  },

  _normalizeLink: function(type, key, value) {
    if (isObject(value)) {
      var linkDef = this.schema.modelDefinition(type).links[key];
      var relatedRecord;

      if (isArray(value)) {
        value = value.map(function(each) {
          if (isObject(each)) {
            relatedRecord = this.normalize(linkDef.model, each);
            return this.getId(linkDef.model, relatedRecord);
          } else {
            return each;
          }
        }, this);

      } else {
        relatedRecord = this.normalize(linkDef.model, value);
        value = this.getId(linkDef.model, relatedRecord);
      }
    }
    return value;
  },

  _isLinkEmpty: function(linkType, linkValue) {
    return (linkType === 'hasMany' && linkValue && linkValue.length === 0 ||
            linkType === 'hasOne' && isNone(linkValue));
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
