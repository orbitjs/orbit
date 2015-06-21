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

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {OC.Schema} schema
 @param options
 @constructor
*/
var Source = Class.extend({
  init: function(schema, options) {
    assert("Source's `schema` must be specified", schema);

    this.schema = schema;

    options = options || {};

    // Create an internal cache and expose some elements of its interface
    this._cache = new Cache(schema);
    expose(this, this._cache, 'length', 'reset', 'retrieve', 'retrieveLink');

    Transformable.extend(this);
    Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove',
                              'findLink', 'addLink', 'removeLink', 'updateLink',
                              'findLinked']);

    Source.created(this);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  /**
   Internal method that applies a single transform to this source.

   `_transform` must be implemented by a `Transformable` source.
   It is called by the public method `transform` in order to actually apply
   transforms.

   `_transform` should return a promise if the operation is asynchronous.

   @method _transform
   @param operation JSON PATCH operation as detailed in RFC 6902
   @private
   */
  _transform: required,

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: required,

  _findLink: required,

  _findLinked: function(type, id, link, options) {
    var modelId = this.getId(type, id);
    var linkType = this.schema.linkDefinition(type, link).model;
    var linkValue = this.retrieveLink(type, modelId, link);

    if (linkValue === undefined) throw new LinkNotFoundException(type, id, link);
    if (linkValue === null) return null;

    return this._find(linkType, linkValue, options);
  },

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
    var linkDef = this.schema.models[type].links[key];

    assert('hasMany links can only be replaced when flagged as `actsAsSet`',
           linkDef.type !== 'hasMany' || linkDef.actsAsSet);

    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    var op = this.schema.operationEncoder.replaceLinkOp(type, id, key, value);
    return this.transform(op);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Event handlers
  /////////////////////////////////////////////////////////////////////////////

  _cacheDidTransform: function(operation, inverse) {
    this.didTransform(operation, inverse);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Helpers
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
      var linkDef = this.schema.models[type].links[key];
      var relatedRecord;

      if (isArray(value)) {
        for (var i = 0, l = value.length; i < l; i++) {
          if (isObject(value[i])) {
            relatedRecord = this.normalize(linkDef.model, value[i]);
            value[i] = this.getId(linkDef.model, relatedRecord);
          }
        }

      } else {
        relatedRecord = this.normalize(linkDef.model, value);
        value = this.getId(linkDef.model, relatedRecord);
      }
    }
    return value;
  },

  normalize: function(type, data) {
    return this.schema.normalize(type, data);
  },

  initDefaults: function(type, record) {
    return this.schema.initDefaults(type, record);
  },

  getId: function(type, data) {
    if (isObject(data)) {
      return data[this.schema.models[type].primaryKey.name];
    } else {
      return data;
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

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
