import Orbit from 'orbit/core';
import Document from 'orbit/document';

var Cache = function() {
  this.init.apply(this, arguments);
};

Cache.prototype = {
  constructor: Cache,

  init: function(schema) {
    this._doc = new Document(null, {arrayBasedPaths: true});

    // Expose methods from the Document interface
    Orbit.expose(this, this._doc, 'reset');

    this.schema = schema;
    this._doc.add(['deleted'], {});
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._doc.add([model], {});
        this._doc.add(['deleted', model], {});
      }
    }
  },

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

  generateId: function() {
    return Orbit.generateId();
  },

  isDeleted: function(path) {
    return this.retrieve(['deleted'].concat(path));
  },

  length: function(path) {
    return Object.keys(this.retrieve(path)).length;
  },

  retrieve: function(path) {
    try {
      return this._doc.retrieve(path);
    } catch(e) {
      return null;
    }
  },

  transform: function(operation, invert) {
    var inverse = this._doc.transform(operation, invert);

    // Track deleted records
    if (operation.op === 'remove' && operation.path.length === 2) {
      this._doc.transform({op: 'add',
                           path: ['deleted'].concat(operation.path),
                           value: true});
    }

    return inverse;
  }
};

export default Cache;