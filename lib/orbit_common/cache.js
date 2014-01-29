import Document from 'orbit/document';
import { expose } from 'orbit/lib/objects';

/**
 `Cache` provides a thin wrapper over an internally maintained instance of a
 `Document`.

 `Cache` prepares records to be cached according to a specified schema. The
 schema also determines the paths at which records will be stored.

 Once cached, data can be accessed at a particular path with `retrieve`. The
 size of data at a path can be accessed with `length`.

 @class Cache
 @namespace OC
 @param {Object} schema
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

  // TODO - move to schema
  initRecord: function(type, data) {
    if (data[this.schema.idField] !== undefined) return;

    var modelSchema = this.schema.models[type],
        attributes = modelSchema.attributes,
        links = modelSchema.links;

    // init id
    data[this.schema.idField] = this.generateId();

    // init default values
    if (attributes) {
      for (var attribute in attributes) {
        if (data[attribute] === undefined && attributes[attribute].defaultValue) {
          if (typeof attributes[attribute].defaultValue === 'function') {
            data[attribute] = attributes[attribute].defaultValue.call(data);
          } else {
            data[attribute] = attributes[attribute].defaultValue;
          }
        }
      }
    }

    // init links
    if (links) {
      data.links = {};
      for (var link in links) {
        if (data.links[link] === undefined && links[link].type === 'hasMany') {
          data.links[link] = {};
        }
      }
    }
  },

  // TODO - move to schema
  generateId: function() {
    if (this._newId) {
      this._newId++;
    } else {
      this._newId = 1;
    }
    return new Date().getTime() + '.' + this._newId;
  },

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length: function(path) {
    return Object.keys(this.retrieve(path)).length;
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