import Document from 'orbit/document';
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
   Return data at a particular path

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

  transform: function(operation, invert) {
    var op = operation.op,
        path = operation.path;

    path = this._doc.deserializePath(path);

    if (path.length < 2) {
      throw new OperationNotAllowed('Cache#transform requires an operation with a path >= 2 segments.');
    }

    if (op === 'remove' || op === 'replace') {
      this.removeRefs(path);
    }

    var inverse = this._doc.transform(operation, invert);

    if (op === 'add' || op === 'replace') {
      this.addRefs(path, operation.value);
    }

    return inverse;
  },

  addRefs: function(path, value) {
//    console.log('addRefs', path, value);
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
                _this.addRef(linkSchema, type, id, link, v);
              });

            } else {
              _this.addRef(linkSchema, type, id, link, linkValue);
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

        this.addRef(linkSchema, type, id, link, linkValue);
      }
    }
  },

  addRef: function(linkSchema, type, id, link, value) {
    console.log('addRef', linkSchema, type, id, link, value);

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
        this._doc.transform({
          op: 'add',
          path: refsPath,
          value: refs
        });
      } else {
        refsPath.push(linkPath);
        refs = this.retrieve(refsPath);
        if (!refs) {
          this._doc.transform({
            op: 'add',
            path: refsPath,
            value: true
          });
        }
      }
    }
  },

  removeRefs: function(path) {
//    console.log('removeRefs', path);

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
                _this.removeRef(linkSchema, type, id, link, v);
              });

            } else {
              _this.removeRef(linkSchema, type, id, link, linkValue);
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

        this.removeRef(linkSchema, type, id, link, linkValue);
      }
    }
  },

  removeRef: function(linkSchema, type, id, link, value) {
    console.log('removeRef', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, 'links', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = '/' + linkPath.join('/');

      var refsPath = [linkSchema.model, value, 'refs', linkPath];
      this._doc.transform({
        op: 'remove',
        path: refsPath
      });
    }
  }
};

export default Cache;