import Orbit from 'orbit/main';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import { assert } from 'orbit/lib/assert';
import { required } from 'orbit/lib/stubs';
import { Class, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import Cache from './cache';
import Operation from 'orbit/operation';

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
    // TODO - clean up listener
    this._cache.on('didTransform', this._cacheDidTransform, this);

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

  _findLinked: function(type, id, link, relId) {
    var _this = this;
    var linkDef = _this.schema.models[type].links[link];
    var relType = linkDef.model;

    id = this.getId(type, id);

    if (relId === undefined) {
      relId = this.retrieveLink(type, id, link);
    }

    if (this._isLinkEmpty(linkDef.type, relId)) {
      return new Orbit.Promise(function(resolve) {
        resolve(relId);
      });

    } else if (relId) {
      return this.find(relType, relId);

    } else {
      return this.findLink(type, id, link).then(function(relId) {
        if (_this._isLinkEmpty(linkDef.type, relId)) {
          return relId;
        } else {
          return _this.find(relType, relId);
        }
      });
    }
  },

  _add: function(type, data) {
    data = data || {};

    var record = this.normalize(type, data);

    var id = this.getId(type, record),
        path = [type, id],
        _this = this;

    return this.transform({op: 'add', path: path, value: record}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    var record = this.normalize(type, data);
    var id = this.getId(type, record);
    var path = [type, id];

    return this.transform({op: 'replace', path: path, value: record});
  },

  _patch: function(type, id, property, value) {
    id = this._normalizeId(type, id);
    var path = [type, id].concat(Document.prototype.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value});
  },

  _remove: function(type, id) {
    id = this._normalizeId(type, id);
    var path = [type, id];

    return this.transform({op: 'remove', path: path});
  },

  _addLink: function(type, id, key, value) {
    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    return this.transform(this._addLinkOp(type, id, key, value));
  },

  _removeLink: function(type, id, key, value) {
    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    return this.transform(this._removeLinkOp(type, id, key, value));
  },

  _updateLink: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];

    assert('hasMany links can only be replaced when flagged as `actsAsSet`',
           linkDef.type !== 'hasMany' || linkDef.actsAsSet);

    id = this._normalizeId(type, id);
    value = this._normalizeLink(type, key, value);

    var op = this._updateLinkOp(type, id, key, value);
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
  },

  _addLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];

    if (linkDef.type === 'hasMany') {
      path.push(value);
      value = true;
    }

    return new Operation({
      op: 'add',
      path: path,
      value: value
    });
  },

  _removeLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];

    if (linkDef.type === 'hasMany') {
      path.push(value);
    }

    return new Operation({
      op: 'remove',
      path: path
    });
  },

  _updateLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];

    if (linkDef.type === 'hasMany' &&
        isArray(value)) {
      var obj = {};
      for (var i = 0, l = value.length; i < l; i++) {
        obj[value[i]] = true;
      }
      value = obj;
    }

    return new Operation({
      op: 'replace',
      path: path,
      value: value
    });
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
