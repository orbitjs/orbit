import Document from 'orbit/document';
import Evented from 'orbit/evented';
import { Class, expose, isArray } from 'orbit/lib/objects';
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
 @param {Object}  [options]
 @param {Boolean} [options.trackChanges=true] Should the `didTransform` event be triggered after calls to `transform`?
 @param {Boolean} [options.trackRevLinks=true] Should `__rev` be maintained for each record, indicating which other records reference them?
 @param {Boolean} [options.trackRevLinkChanges=false] Should the `didTransform` event be triggered after `__rev` is updated?
 @constructor
 */
var Cache = Class.extend({
  init: function(schema, options) {
    options = options || {};
    this.trackChanges = options.trackChanges !== undefined ? options.trackChanges : true;
    this.trackRevLinks = options.trackRevLinks !== undefined ? options.trackRevLinks : true;
    this.trackRevLinkChanges = options.trackRevLinkChanges !== undefined ? options.trackRevLinkChanges : false;

    this._doc = new Document(null, {arrayBasedPaths: true});

    Evented.extend(this);

    this.schema = schema;
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._registerModel(model);
      }
    }

    // TODO - clean up listener
    this.schema.on('modelRegistered', this._registerModel, this);
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

    if (this.trackRevLinks && (op === 'remove' || op === 'replace')) {
      this._removeRevLinks(path);
    }

    this._transform(operation, this.trackChanges);

    if (this.trackRevLinks && (op === 'add' || op === 'replace')) {
      this._addRevLinks(path, operation.value);
    }
  },

  _transform: function(operation, track) {
//    console.log('_transform', operation, track);
    if (track) {
      var inverse = this._doc.transform(operation, true);
      this.emit('didTransform', operation, inverse);

    } else {
      this._doc.transform(operation, false);
    }
  },

  _addRevLinks: function(path, value) {
//    console.log('_addRevLinks', path, value);
    if (value) {
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is added, add inverse links for every link
        if (value.__rel) {
          Object.keys(value.__rel).forEach(function(link) {
            linkSchema = _this.schema.models[type].links[link];
            linkValue = value.__rel[link];

            if (linkSchema.type === 'hasMany') {
              Object.keys(linkValue).forEach(function(v) {
                _this._addRevLink(linkSchema, type, id, link, v);
              });

            } else {
              _this._addRevLink(linkSchema, type, id, link, linkValue);
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

        this._addRevLink(linkSchema, type, id, link, linkValue);
      }
    }
  },

  _addRevLink: function(linkSchema, type, id, link, value) {
//    console.log('_addRevLink', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, '__rel', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = '/' + linkPath.join('/');

      var refsPath = [linkSchema.model, value, '__rev'];
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

  _removeRevLinks: function(path) {
//    console.log('_removeRevLinks', path);

    var value = this.retrieve(path);
    if (value) {
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is removed, remove any links that reference it
        if (value.__rev) {
//          console.log('removeRefs from deleted record', type, id, value.__rev);

          var operation;
          Object.keys(value.__rev).forEach(function(path) {
            path = _this._doc.deserializePath(path);

            operation = {
              op: 'remove',
              path: path
            };

            try {
              _this._transform(operation, _this.trackChanges);
            } catch(e) {
              console.log('Cache._transform() exception:', e, 'operation:', operation);
            }
          });
        }

        // when a whole record is removed, remove references corresponding to each link
        if (value.__rel) {
          Object.keys(value.__rel).forEach(function(link) {
            linkSchema = _this.schema.models[type].links[link];
            linkValue = value.__rel[link];

            if (linkSchema.type === 'hasMany') {
              Object.keys(linkValue).forEach(function(v) {
                _this._removeRevLink(linkSchema, type, id, link, v);
              });

            } else {
              _this._removeRevLink(linkSchema, type, id, link, linkValue);
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

        this._removeRevLink(linkSchema, type, id, link, linkValue);
      }
    }
  },

  _removeRevLink: function(linkSchema, type, id, link, value) {
//    console.log('_removeRevLink', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, '__rel', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = '/' + linkPath.join('/');

      var revLinkPath = [linkSchema.model, value, '__rev', linkPath];
      this._transformRef('remove', revLinkPath);
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
      this._transform(operation, this.trackRevLinkChanges);
    } catch(e) {
      // TODO - verbose logging of transform exceptions
      // console.log('Cache._transformRef() exception', e, 'for operation', operation);
    }
  }
});

export default Cache;
