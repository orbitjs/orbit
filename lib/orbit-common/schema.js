import { Class, clone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import Evented from 'orbit/evented';
import IdMap from './id-map';

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
 @param {Function} [options.pluralize] Function used to pluralize names
 @param {Function} [options.singularize] Function used to singularize names
 @param {Object}   [options.models] schemas for individual models supported by this schema
 @constructor
 */
var Schema = Class.extend({
  init: function(options) {
    options = options || {};
    this.idField = options.idField !== undefined ? options.idField : '__id';
    this.remoteIdField = options.remoteIdField !== undefined ? options.remoteIdField : 'id';
    this.models = options.models !== undefined ? options.models : {};
    if (options.generateId) {
      this.generateId = options.generateId;
    }
    if (options.pluralize) {
      this.pluralize = options.pluralize;
    }
    if (options.singularize) {
      this.singularize = options.singularize;
    }
    if (this.idField !== this.remoteIdField) {
      this._idMap = new IdMap(this.idField, this.remoteIdField);
    }
    Evented.extend(this);
  },

  registerModel: function(type, definition) {
    this.models[type] = definition;
    this.emit('modelRegistered', type);
  },

  normalize: function(type, data) {
    if (data.__normalized) return data;

    var record = data; // TODO? clone(data);

    // set flag
    record.__normalized = true;

    // init id
    if (this._idMap) {
      var id = record[this.idField];
      var remoteId = record[this.remoteIdField];

      if (id === undefined) {
        if (remoteId) {
          id = this._idMap.remoteToLocalId(type, remoteId);
        }
        id = id || this.generateId();

        record[this.idField] = id;
      }

      this._idMap.register(type, id, remoteId);

    } else {
      record[this.idField] = record[this.idField] || this.generateId();
    }

    // init backward links
    record.__rev = record.__rev || {};

    // init forward links
    record.__rel = record.__rel || {};

    // init meta info
    record.__meta = record.__meta || {};

    this.initDefaults(type, record);

    return record;
  },

  initDefaults: function(type, record) {
    if (!record.__normalized) {
      throw new OperationNotAllowed('Schema.initDefaults requires a normalized record');
    }

    var modelSchema = this.models[type],
        attributes = modelSchema.attributes,
        links = modelSchema.links;

    // init default attribute values
    if (attributes) {
      for (var attribute in attributes) {
        if (record[attribute] === undefined) {
          if (attributes[attribute].defaultValue !== undefined) {
            if (typeof attributes[attribute].defaultValue === 'function') {
              record[attribute] = attributes[attribute].defaultValue.call(record);
            } else {
              record[attribute] = attributes[attribute].defaultValue;
            }
          } else {
            record[attribute] = null;
          }
        }
      }
    }

    // init default link values or move attribute value to links
    if (links) {
      for (var link in links) {
        if (record.__rel[link] === undefined) {
          if (record[link]) {
            if (links[link].type === 'hasMany') {
              var idHash = {};
              /* jshint loopfunc:true */
              (record[link] || []).forEach(function addKeyVal(subrecord) {
                idHash[subrecord.clientid] = subrecord.clientid;
              });
              record.__rel[link] = idHash;
            } else {
              record.__rel[link] = record[link].clientid;
            }
          } else {
            if (links[link].type === 'hasMany') {
              record.__rel[link] = {};
            } else {
              record.__rel[link] = null;
            }
          }
        }
        delete record[link];
      }
    }

  },

  generateId: function() {
    if (this._newId === undefined) this._newId = 0;
    return new Date().getTime() + '.' + (this._newId++).toString();
  },

  remoteToLocalId: function(type, remoteId) {
    if (this._idMap) {
      return this._idMap.remoteToLocalId(type, remoteId);
    } else {
      return remoteId;
    }
  },

  localToRemoteId: function(type, id) {
    if (this._idMap) {
      return this._idMap.localToRemoteId(type, id);
    } else {
      return id;
    }
  },

  registerIds: function(type, record) {
    if (this._idMap) {
      this._idMap.register(type, record[this.idField], record[this.remoteIdField]);
    }
  },

  registerAllIds: function(data) {
    if (this._idMap && data) {
      this._idMap.registerAll(data);
    }
  },

  pluralize: function(word) {
    return word + 's';
  },

  singularize: function(word) {
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
      return word;
    }
  }
});

export default Schema;