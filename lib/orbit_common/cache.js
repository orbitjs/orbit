import Document from 'orbit/document';
import Evented from 'orbit/evented';
import { expose, isArray } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';

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
 @constructor
 */
var Cache = function() {
  this.init.apply(this, arguments);
};

Cache.prototype = {
  constructor: Cache,

  init: function(schema) {
    this._doc = new Document(null, {arrayBasedPaths: true});

    Evented.extend(this);

    // Expose methods from the Document interface
    expose(this, this._doc, 'reset');

    this.schema = schema;
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._doc.add([model], {});
      }
    }
  },

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length: function(path) {
    var data = this.retrieve(path);
    if (data === null) {
      return null;
    } else if (isArray(data)) {
      return data.length;
    } else {
      return Object.keys(data).length;
    }
  },

  /**
   Return data at a particular path.

   Returns `null` if the path does not exist in the document.

   @method retrieve
   @param path
   @returns {Object}
   */
  retrieve: function(path) {
    try {
      return this._doc.retrieve(path);
    } catch(e) {
      return null;
    }
  },

  /**
   Transforms the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   Throws `PathNotFoundException` if the path does not exist in the document.

   @method transform
   @param {Object} operation
   @param {String} operation.op Must be "add", "remove", or "replace"
   @param {Array or String} operation.path Path to target location
   @param {Object} operation.value Value to set. Required for "add" and "replace"
   */
  transform: function(operation) {
    var op = operation.op,
        path = operation.path;

    path = this._doc.deserializePath(path);

    if (op !== 'add' && op !== 'remove' && op !== 'replace') {
      throw new OperationNotAllowed('Cache#transform requires an "add", "remove" or "replace" operation.');
    }

    if (path.length < 2) {
      throw new OperationNotAllowed('Cache#transform requires an operation with a path >= 2 segments.');
    }

    if (op === 'remove' || op === 'replace') {
      this._removeRefs(path);
    }

    this._transform(operation, true);

    if (op === 'add' || op === 'replace') {
      this._addRefs(path, operation.value);
    }
  },

  _transform: function(operation, trackable) {
//    console.log('_transform', operation, trackable);
    if (trackable) {
      var inverse = this._doc.transform(operation, true);
      this.emit('didTransform', operation, inverse);

    } else {
      this._doc.transform(operation, false);
    }
  },

  _addRefs: function(path, value) {
//    console.log('_addRefs', path, value);
    if (value) {
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is added, add inverse links for every link
        if (value.links) {
          Object.keys(value.links).forEach(function (link) {
            linkSchema = _this.schema.models[type].links[link];
            linkValue = value.links[link];

            if (linkSchema.type === 'hasMany') {
              Object.keys(linkValue).forEach(function(v) {
                _this._addRef(linkSchema, type, id, link, v);
              });

            } else {
              _this._addRef(linkSchema, type, id, link, linkValue);
            }
          });
        }

      } else if (path.length > 3) {
        var link = path[3];

        linkSchema = _this.schema.models[type].links[link];

        if (path.length === 5) {
          linkValue = path[4];
        } else {
          linkValue = value;
        }

        this._addRef(linkSchema, type, id, link, linkValue);
      }
    }
  },

  _addRef: function(linkSchema, type, id, link, value) {
    console.log('_addRef', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, 'links', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = '/' + linkPath.join('/');

      var refsPath = [linkSchema.model, value, 'refs'];
      var refs = this.retrieve(refsPath);
      if (!refs) {
        refs = {};
        refs[linkPath] = true;
        this._transformRef('add', refsPath, refs);

      } else {
        refsPath.push(linkPath);
        refs = this.retrieve(refsPath);
        if (!refs) {
          this._transformRef('add', refsPath, true);
        }
      }
    }
  },

  _removeRefs: function(path) {
//    console.log('_removeRefs', path);

    var value = this.retrieve(path);
    if (value) {
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is removed, remove inverse links for every link
        if (value.links) {
          Object.keys(value.links).forEach(function (link) {
            linkSchema = _this.schema.models[type].links[link];
            linkValue = value.links[link];

            if (linkSchema.type === 'hasMany') {
              Object.keys(linkValue).forEach(function(v) {
                _this._removeRef(linkSchema, type, id, link, v);
              });

            } else {
              _this._removeRef(linkSchema, type, id, link, linkValue);
            }
          });
        }

      } else if (path.length > 3) {
        var link = path[3];

        linkSchema = _this.schema.models[type].links[link];

        if (path.length === 5) {
          linkValue = path[4];
        } else {
          linkValue = value;
        }

        this._removeRef(linkSchema, type, id, link, linkValue);
      }
    }
  },

  _removeRef: function(linkSchema, type, id, link, value) {
    console.log('_removeRef', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, 'links', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = '/' + linkPath.join('/');

      var refsPath = [linkSchema.model, value, 'refs', linkPath];
      this._transformRef('remove', refsPath);
    }
  },

  _transformRef: function(op, path, value) {
    var operation = {
      op: op,
      path: path
    };
    if (value) {
      operation.value = value;
    }
    try {
      this._transform(operation, false);
    } catch(e) {
      console.log('Cache._transformRef() exception', e, 'for operation', operation);
    }
  }
};

export default Cache;