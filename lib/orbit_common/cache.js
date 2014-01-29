import Document from 'orbit/document';
import { expose, isArray } from 'orbit/lib/objects';

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
    expose(this, this._doc, 'reset', 'transform');

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
  }
};

export default Cache;