import { Class, clone, extend } from 'orbit/lib/objects';
import { uuid } from 'orbit/lib/uuid';
import { OperationNotAllowed } from './lib/exceptions';
import Evented from 'orbit/evented';

/**
 `Schema`

 Defines the models, attributes and relationships allowed in a source.

 Models should be keyed by their singular name, and should be defined as an
 object that optionally contains `attributes` and/or `links`.

 Each model may define a special ID attribute by specifying an attribute
 of type of 'id'.  This will override the schemas `modelDefaults' for that
 model only.

 The `modelDefaults` schema option defines default model schema for ALL models in
 the schema. This is useful for defining the default ID attribute and any other
 attributes or links that are present across models in the schema. All models
 in the schema will include the following model definition unless the
 `modelDefaults` initializer option is given:
  { attributes: { '__id': { type: 'id', remote: 'id', generator: uuid } } }

 The above definition will use V4 UUID's for uniquely identifying records across
 all Orbit sources using the local ID '__id' and the remote ID 'id'.

 If your server accepts client generated IDs you will want to specify the
 ID attribute as follows (either in the `modelDefaults`` option or per model):
  { attributes: { id: { type: 'id', remote: 'id', generator: uuid } } }

 Since both the local and remote IDs are the same, Orbit will use the locally
 generated ID on the remote and will not need to use an ID map.

 To specify that there is no remote ID (eg embedded models), specify `null``
 for the remote option:
  { attributes: { '__id': { type: 'id', remote: null, generator: uuid } } }

 To remove any attribute or link definition inherited from `modelDefaults` simply
 define the attribute or link with a value of `null`, `undefined` or `false` and
 it will be omitted from the model definition.
 For example, assuming `modelDefaults`:
  {
    attributes: {
      '__id': { type: 'id', remote: 'id', generator: uuid } },
      createdAt: { type: 'string' }
    }
  }
 You could remove the createdAt on a model definition as follows:
  {
    models: {
      planet: {
         attributes: {
           createdAt: undefined,
          ...
         }
      }
    }
  }


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
 @param {Object}   [options.modelDefaults] defaults for model schemas
 @param {Function} [options.pluralize] Function used to pluralize names
 @param {Function} [options.singularize] Function used to singularize names
 @param {Object}   [options.models] schemas for individual models supported by this schema
 @constructor
 */
var Schema = Class.extend({
  init: function(options) {
    options = options || {};
    // model defaults
    if (options.modelDefaults) {
      this.modelDefaults = options.modelDefaults;
    } else {
      this.modelDefaults = {
        attributes: { '__id': {type: 'id', remote: 'id', generator: uuid} }
      };
    }
    // inflection
    if (options.pluralize) {
      this.pluralize = options.pluralize;
    }
    if (options.singularize) {
      this.singularize = options.singularize;
    }

    Evented.extend(this);

    // register provided model schema
    this.models = {};
    if (options.models) {
      for (var type in options.models) {
        if (options.models.hasOwnProperty(type)) {
          this.registerModel(type, options.models[type]);
        }
      }
    }
  },

  registerModel: function(type, definition) {
    var modelSchema = this._mergeModelSchemas({}, this.modelDefaults, definition);

    // process id definition
    if (modelSchema.attributes) {
      for (var attr in modelSchema.attributes) {
        var attrDef = modelSchema.attributes[attr];
        if (attrDef['type'] === 'id') {
          // decide if an id mapping is required
          modelSchema.idField = attr;
          modelSchema.idDef = attrDef;
          if (attrDef.remote && attrDef.remote !== attr) {
            modelSchema.remoteToLocalId = {};
            modelSchema.localToRemoteId = {};
          }
          break;
        }
      }
    }

    // ensure every model has an ID definition
    if (! modelSchema.idDef || typeof modelSchema.idDef.generator !== 'function') {
      throw new OperationNotAllowed('Model schema ID generator must be a function');
    }

    this.models[type] = modelSchema;
    this.emit('modelRegistered', type);
  },

  normalize: function(type, data) {
    if (data.__normalized) return data;

    var record = data, // TODO? clone(data);
        modelSchema = this.models[type],
        id = record[modelSchema.idField];

    // set flag
    record.__normalized = true;

    // init ID

    // does model have an ID map?
    if (modelSchema.localToRemoteId) {
      var remoteId = record[modelSchema.idDef.remote];

      // local ID not defined?
      if (id === undefined) {
        // do we already know the remote id?
        if (remoteId) {
          // perhaps we have a local ID already
          id = modelSchema.remoteToLocalId[remoteId];
        }
        // generate an ID if still unknown
        id = id || modelSchema.idDef.generator.call();

        // store in model
        record[modelSchema.idField] = id;

      } else if (remoteId === undefined) {
        // perhaps we already know the remote id
        remoteId = modelSchema.localToRemoteId[id];
      }

      // update the models ID map
      if (remoteId !== undefined) {
        modelSchema.remoteToLocalId[remoteId] = id;
        modelSchema.localToRemoteId[id] = remoteId;
      }
    } else if (id === undefined) {
      // generate an ID
      record[modelSchema.idField] = modelSchema.idDef.generate.call();
      console.log('record.id:' + record[modelSchema.idField]);
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

    // init default link values
    if (links) {
      for (var link in links) {
        if (record.__rel[link] === undefined) {
          if (links[link].type === 'hasMany') {
            record.__rel[link] = {};
          } else {
            record.__rel[link] = null;
          }
        }
      }
    }
  },

  remoteToLocalId: function(type, remoteId) {
    var modelSchema = this.models[type];

    if (! modelSchema) {
      return undefined;
    } else if (modelSchema.remoteToLocalId) {
      return modelSchema.remoteToLocalId[remoteId];
    } else {
      return remoteId;
    }
  },

  localToRemoteId: function(type, id) {
    var modelSchema = this.models[type];

    if (! modelSchema) {
      return undefined;
    } else if (modelSchema.localToRemoteId) {
      return modelSchema.localToRemoteId[id];
    } else {
      return id;
    }
  },

  // TODO remove if not used elsewhere
  registerIds: function(type, record) {
    var modelSchema = this.models[type];

    if (modelSchema && modelSchema.localToRemoteId) {
      var attrDef = modelSchema.attributes[modelSchema.idField],
          localId = record[modelSchema.idField],
          remoteId = record[attrDef.remote];
      modelSchema.remoteToLocalId[remoteId] = localId;
      modelSchema.localToRemoteId[localId] = remoteId;
    }
  },

  registerAllIds: function(data) {
    if (data) {
      var models = this.models;

      Object.keys(data).forEach(function(type) {
        var modelSchema = models[type];

        if (modelSchema && modelSchema.remoteToLocalId) {
          var typeData = data[type];

          Object.keys(typeData).forEach(function(id) {
            var remoteId = typeData[id][modelSchema.idDef.remote];
            if (remoteId) {
              modelSchema.remoteToLocalId[remoteId] = id;
              modelSchema.localToRemoteId[id] = remoteId;
            }
          });
        }
      });
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
  },

  _mergeModelSchemas: function(base) {
    var sources = Array.prototype.slice.call(arguments, 1);

    // ensure model schema has attributes and links keys
    base.attributes = base.attributes || {};
    base.links = base.links || {};

    sources.forEach(function(source) {
      var attrs = source.attributes,
          links = source.links;

      // merge source into base, preserving what is present
      for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          var attrDef = attrs[attr];
          if (attrDef) {
            base.attributes[attr] = attrDef;
          } else {
            // remove
            delete base.attributes[attr];
          }
        }
      }
      for (var link in links) {
        if (links.hasOwnProperty(link)) {
          var linkDef = links[link];
          if (linkDef) {
            base.links[link] = linkDef;
          } else {
            // remove
            delete base.links[link];
          }
        }
      }
    });

    return base;
  }
});

export default Schema;
