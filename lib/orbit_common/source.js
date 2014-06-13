import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';
import { assert } from 'orbit/lib/assert';
import { required } from 'orbit/lib/stubs';
import { expose } from 'orbit/lib/objects';
import Cache from './cache';

/**
 `Source` is an abstract base class to be extended by other sources.

 @class Source
 @namespace OC
 @param {OC.Schema} schema
 @param options
 @constructor
*/
var Source = function() {
  this.init.apply(this, arguments);
};

Source.prototype = {
  constructor: Source,

  init: function(schema, options) {
    assert("Source's `schema` must be specified", schema);
    assert("Source's `schema.idField` must be specified", schema.idField);

    this.schema = schema;

    options = options || {};

    // Create an internal cache and expose some elements of its interface
    this._cache = new Cache(schema);
    expose(this, this._cache, 'length', 'reset', 'retrieve');
    this._cache.on('didTransform', this._cacheDidTransform, this);

    Transformable.extend(this);
    Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove', 'findLink', 'addLink', 'removeLink']);
  },

  initRecord: required,

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

  _add: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.schema.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.schema.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _patch: function(type, id, property, value) {
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.schema.idField];
    }

    return this.transform({
      op: 'replace',
      path: [type, id].concat(Document.prototype.deserializePath(property)),
      value: value
    });
  },

  _remove: function(type, id) {
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.schema.idField];
    }

    return this.transform({op: 'remove', path: [type, id]});
  },

  _addLink: function(type, id, key, value) {
    var linkOp = function(linkDef, type, id, key, value) {
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
    };

    var linkDef = this.schema.models[type].links[key],
        ops,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.schema.idField];
    }
    if (typeof value === 'object') {
      var relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.schema.idField];
    }

    // Add link to primary resource
    ops = [linkOp(linkDef, type, id, key, value)];

    // Add inverse link if necessary
    if (linkDef.inverse) {
      var inverseLinkDef = this.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(linkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  _removeLink: function(type, id, key, value) {
    var unlinkOp = function(linkDef, type, id, key, value) {
      var path = [type, id, '__rel', key];
      if (linkDef.type === 'hasMany') path.push(value);
      return {
        op: 'remove',
        path: path
      };
    };

    var linkDef = this.schema.models[type].links[key],
        ops,
        record,
        relatedRecord,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      record = id;
      this.initRecord(type, record);
      id = record[this.schema.idField];
    }
    if (typeof value === 'object') {
      relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.schema.idField];
    }

    // Remove link from primary resource
    ops = [unlinkOp(linkDef, type, id, key, value)];

    // Remove inverse link if necessary
    if (linkDef.inverse) {
      if (value === undefined) {
        if (record === undefined) {
          record = this.retrieve(type, id);
        }
        value = record.__rel[key];
      }

      var inverseLinkDef = this.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(unlinkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Event handlers
  /////////////////////////////////////////////////////////////////////////////

  _cacheDidTransform: function(operation, inverse) {
    this.didTransform(operation, inverse);
  }
};

export default Source;