/**
 `Schema`

 Defines the models, attributes and relationships allowed in a source.

 A `Schema` also defines an ID field (`__id` by default) that is used across all
 Orbit sources to uniquely identify records.

 Unique IDs are specified with `generateId`. The default implementation of this
 method generates locally unique IDs ('TIMESTAMP.COUNTER'). If your server
 accepts UUIDs, you may wish to generate IDs client-side by setting `idField` to
 match your remote ID field and replace `generateID` with a UUID generator.

 Models should be keyed by their singular name, and should be defined as an
 object that optionally contains `attributes` and/or `links`.

 TODO - further specs needed for models

 @example

 ``` javascript
 var schema = new Schema({
   models: {
     planet: {
       attributes: {
         name: {type: 'string'},
         classification: {type: 'string'}
       },
       links: {
         moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
       }
     },
     moon: {
       attributes: {
         name: {type: 'string'}
       },
       links: {
         planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
       }
     }
   }
 });
 ```

 @class Schema
 @namespace OC
 @param {Object}   [options]
 @param {String}   [options.idField='__id'] Name of field that uniquely identifies records throughout Orbit
 @param {Function} [options.generateId] ID generator (the default generator ensures locally unique IDs but not UUIDs)
 @param {Object}   [options.models] schemas for individual models supported by this schema
 @constructor
 */
var Schema = function() {
  this.init.apply(this, arguments);
};

Schema.prototype = {
  constructor: Schema,

  init: function(options) {
    options = options || {};
    this.idField = options.idField !== undefined ? options.idField : '__id';
    this.models = options.models !== undefined ? options.models : {};
    if (options.generateId) {
      this.generateId = options.generateId;
    }
  },

  initRecord: function(type, data) {
    if (data[this.idField] !== undefined) return;

    var modelSchema = this.models[type],
        attributes = modelSchema.attributes,
        links = modelSchema.links;

    // init id
    data[this.idField] = this.generateId();

    // init default values
    if (attributes) {
      for (var attribute in attributes) {
        if (data[attribute] === undefined) {
          if (attributes[attribute].defaultValue) {
            if (typeof attributes[attribute].defaultValue === 'function') {
              data[attribute] = attributes[attribute].defaultValue.call(data);
            } else {
              data[attribute] = attributes[attribute].defaultValue;
            }
          } else {
            data[attribute] = null;
          }
        }
      }
    }

    // init links
    if (links) {
      data.links = {};
      for (var link in links) {
        if (data.links[link] === undefined) {
          if (links[link].type === 'hasMany') {
            data.links[link] = {};
          } else {
            data.links[link] = null;
          }
        }
      }
    }
  },

  generateId: function() {
    if (this._newId === undefined) this._newId = 0;
    return new Date().getTime() + '.' + (this._newId++).toString();
  }
};

export default Schema;