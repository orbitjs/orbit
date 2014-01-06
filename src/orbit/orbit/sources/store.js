import Orbit from 'orbit/core';
import Cache from 'orbit/cache';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var Store = function() {
  this.init.apply(this, arguments);
};

Store.prototype = {
  constructor: Store,

  init: function(options) {
    options = options || {};

    this.idField = Orbit.idField;

    // Create an internal cache and expose some elements of its interface
    this._cache = new Cache(options.schema);
    Orbit.expose(this, this._cache, 'isDeleted', 'length', 'reset', 'retrieve');

    Transformable.extend(this);
    Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove', 'link', 'unlink']);
  },

  initRecord: Orbit.K,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: Orbit.K,

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: Orbit.K,

  _add: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this.retrieve(path);
    });
  },

  _update: function(type, data) {
    this.initRecord(type, data);

    var id = data[this.idField],
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
      id = record[this.idField];
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
      id = record[this.idField];
    }

    return this.transform({op: 'remove', path: [type, id]});
  },

  _link: function(type, id, property, value) {
    var linkOp = function(linkDef, type, id, property, value) {
      var path = [type, id, 'links', property];
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

    var linkDef = this._cache.schema.models[type].links[property],
        ops,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      var record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }
    if (typeof value === 'object') {
      var relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.idField];
    }

    // Add link to primary resource
    ops = [linkOp(linkDef, type, id, property, value)];

    // Add inverse link if necessary
    if (linkDef.inverse) {
      var inverseLinkDef = this._cache.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(linkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  },

  _unlink: function(type, id, property, value) {
    var unlinkOp = function(linkDef, type, id, property, value) {
      var path = [type, id, 'links', property];
      if (linkDef.type === 'hasMany') path.push(value);
      return {
        op: 'remove',
        path: path
      };
    };

    var linkDef = this._cache.schema.models[type].links[property],
        ops,
        record,
        relatedRecord,
        _this = this;

    // Normalize ids
    if (typeof id === 'object') {
      record = id;
      this.initRecord(type, record);
      id = record[this.idField];
    }
    if (typeof value === 'object') {
      relatedRecord = value;
      this.initRecord(linkDef.model, relatedRecord);
      value = relatedRecord[this.idField];
    }

    // Remove link from primary resource
    ops = [unlinkOp(linkDef, type, id, property, value)];

    // Remove inverse link if necessary
    if (linkDef.inverse) {
      if (value === undefined) {
        if (record === undefined) {
          record = this.retrieve(type, id);
        }
        value = record.links[property];
      }

      var inverseLinkDef = this._cache.schema.models[linkDef.model].links[linkDef.inverse];
      ops.push(unlinkOp(inverseLinkDef, linkDef.model, value, linkDef.inverse, id));
    }

    return this.transform(ops).then(function() {
      return _this.retrieve([type, id]);
    });
  }
};

export default Store;