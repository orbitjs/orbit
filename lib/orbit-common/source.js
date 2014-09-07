import Orbit from 'orbit/main';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import { assert } from 'orbit/lib/assert';
import { required } from 'orbit/lib/stubs';
import { Class, expose, isNone } from 'orbit/lib/objects';
import Cache from './cache';

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
    expose(this, this._cache, 'length', 'reset', 'retrieve');
    // TODO - clean up listener
    this._cache.on('didTransform', this._cacheDidTransform, this);

    Transformable.extend(this);
    Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove',
                              'findLink', 'addLink', 'removeLink',
                              'findLinked']);
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
    if (id !== null && typeof id === 'object') {
      var record = this.normalize(type, id);
      id = this.getId(type, record);
    }

    var path = [type, id].concat(Document.prototype.deserializePath(property));

    return this.transform({op: 'replace', path: path, value: value});
  },

  _remove: function(type, id) {
    if (id !== null && typeof id === 'object') {
      var record = this.normalize(type, id);
      id = this.getId(type, record);
    }

    var path = [type, id];

    return this.transform({op: 'remove', path: path});
  },

  _addLink: function(type, id, key, value) {
    // Normalize ids
    if (id !== null && typeof id === 'object') {
      var record = this.normalize(type, id);
      id = this.getId(type, record);
    }
    if (value !== null && typeof value === 'object') {
      var linkDef = this.schema.models[type].links[key];
      var relatedRecord = this.normalize(linkDef.model, value);
      value = this.getId(linkDef.model, relatedRecord);
    }

    return this.transform(this._addLinkOp(type, id, key, value));
  },

  _removeLink: function(type, id, key, value) {
    // Normalize ids
    if (id !== null && typeof id === 'object') {
      var record = this.normalize(type, id);
      id = this.getId(type, record);
    }
    if (value !== null && typeof value === 'object') {
      var linkDef = this.schema.models[type].links[key];
      var relatedRecord = this.normalize(linkDef.model, value);
      value = this.getId(linkDef.model, relatedRecord);
    }

    return this.transform(this._removeLinkOp(type, id, key, value));
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

  normalize: function(type, data) {
    return this.schema.normalize(type, data);
  },

  initDefaults: function(type, record) {
    return this.schema.initDefaults(type, record);
  },

  getId: function(type, data) {
    if (data !== null && typeof data === 'object') {
      return data[this.schema.models[type].primaryKey.name];
    } else {
      return data;
    }
  },

  retrieveLink: function(type, id, link) {
    var val = this.retrieve([type, id, '__rel', link]);
    if (val !== null && typeof val === 'object') {
      val = Object.keys(val);
    }
    return val;
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

    return {
      op: 'add',
      path: path,
      value: value
    };
  },

  _removeLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];

    if (linkDef.type === 'hasMany') {
      path.push(value);
    }

    return {
      op: 'remove',
      path: path
    };
  }
});

export default Source;
