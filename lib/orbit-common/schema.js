import { Class, clone, extend } from 'orbit/lib/objects';
import { uuid } from 'orbit/lib/uuid';
import { OperationNotAllowed } from './lib/exceptions';
import Evented from 'orbit/evented';

/**
 `Schema` defines the models allowed in a source, including their keys,
 attributes and relationships. A single schema may be shared across multiple
 sources.

 Schemas are defined with an initial set of options, passed in as a constructor
 argument:

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

 Models should be keyed by their singular name, and should be defined as an
 object that contains `attributes` and/or `links`.

 Models can be registered after a schema's been initialized with
 `registerModel`.

 ## Fields

 There are three broad categories of fields available for models: keys,
 attributes, and links.

 Within each category, fields may be declared along with options appropriate
 for the category. Common field options include:

 * `type` - a classification, often category-specific, that defines a field's
   purpose and/or contents.

 * `defaultValue` - a value or function that returns a value, to be set on
   record initialization when a field's value is `undefined`.

 Default fields for models can be specified in a `modelDefaults` object. A
 single primary key field, `id`, is defined by default (see below).

 ### Keys

 Keys uniquely identify a record of a particular model type.

 Keys may only be of type `"string"`, which is also the default and therefore
 unnecessary to declare.

 Every model must define a single "primary key", which will be used throughout
 Orbit to identify records of that type uniquely. This should be indicated with
 the field option `primaryKey: true`.

 By default, `modelDefaults` define a primary key `id` to be used for all
 models:

 ```
  {
    keys: {
      'id': {primaryKey: true, defaultValue: uuid}
    }
  }
 ```

 The default primary key has a v4 UUID generator assigned as its `defaultValue`.
 Because of this, these keys can be used within Orbit and on remote servers with
 an extremely low probability of a conflict.

 When working with remote servers that do not support UUID primary keys, it's
 necessary to correlate Orbit IDs with IDs that are generated remotely. In order
 to support this scenario, one or more "secondary keys" may also be defined for
 a model.

 Let's say that you want to track Orbit's primary key locally as a UUID named
 `__id` and also define a remote key named `id`. You could define `modelDefaults`
 in your schema as follows:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        '__id': {primaryKey: true, defaultValue: uuid},
        'id': {}
      }
    }
  });
 ```

 The `id` field above is considered a secondary key because `primaryKey` is
 `false` by default.

 When any secondary keys are defined, the schema will maintain a mapping of
 secondary to primary key values that can be shared by all sources. This
 centralized mapping assumes that key values will never change once set, which
 is a realistic assumption for distributed systems.

 ### Attributes

 Any properties that define a model's data, with the exception of links to other
 models, should be defined as "attributes".

 Attributes may be defined by their `type`, such as `"string"` or `"date"`,
 which can be used to define their purpose and contents. An attribute's type may
 also be used to determine how it should be normalized and serialized.

 ### Links

 Links are properties that define relationships between models. Two types of
 links are currently allowed:

 * `hasOne` - for to-one relationships
 * `hasMany` - for to-many relationships

 Links must define the related `model` and may optionally define their
 `inverse`, which should correspond to the name of a link on the related model.
 Inverse links should be defined when links must be kept synchronized, so that
 adding or removing a link on the primary model results in a corresponding
 change on the inverse model.

 Here's an example of a schema definition that includes links with inverses:

 ```
  var schema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });
 ```

 To-many links may be defined with a special attribute, `actsAsSet`, to indicate
 that they act as a set that should be changed together. Sources should respect
 this attribute when processing changes.

 ```
  var schema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet',
                  actsAsSet: true}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });
 ```

 ## Model Defaults

 The `modelDefaults` object defines a default model schema for ALL models in the
 schema. This is useful for defining the default ID attribute and any other
 attributes or links that are present across models in the schema.

 As discussed above, `modelDefaults` defines a single primary key by default.
 `modelDefaults` can be overridden to include any number of attributes and links.
 For instance:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        __id: {primaryKey: true, defaultValue: uuid}
      },
      attributes: {
        createdAt: {type: 'date', defaultValue: currentTime}
      }
    }
  });
 ```

 The default fields can be overridden in or removed from any particular model
 definition. To remove any key, attribute or link definition inherited from
 `modelDefaults` simply define the field with a falsey value (`undefined`,
 `null`, or `false`).

 For example, the following schema removes `createdAt` from the `planet` model:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        __id: {primaryKey: true, defaultValue: uuid}
      },
      attributes: {
        createdAt: {type: 'date', defaultValue: currentTime}
      }
    },
    models: {
      planet: {
        attributes: {
          name: {type: 'string'},
          createdAt: undefined
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
        keys: {
          'id': {primaryKey: true, defaultValue: uuid}
        }
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
      for (var model in options.models) {
        if (options.models.hasOwnProperty(model)) {
          this.registerModel(model, options.models[model]);
        }
      }
    }
  },

  registerModel: function(model, definition) {
    var modelSchema = this._mergeModelSchemas({}, this.modelDefaults, definition);

    // process key definitions
    for (var name in modelSchema.keys) {
      var key = modelSchema.keys[name];

      key.name = name;

      if (key.primaryKey) {
        if (modelSchema.primaryKey) {
          throw new OperationNotAllowed('Schema can only define one primaryKey per model');
        }
        modelSchema.primaryKey = key;

      } else {
        key.primaryKey = false;

        key.secondaryToPrimaryKeyMap = {};
        key.primaryToSecondaryKeyMap = {};

        modelSchema.secondaryKeys = modelSchema.secondaryKeys || {};
        modelSchema.secondaryKeys[name] = key;
      }

      key.type = key.type || 'string';
      if (key.type !== 'string') {
        throw new OperationNotAllowed('Model keys must be of type `"string"`');
      }
    }

    // ensure every model has a valid primary key
    if (!modelSchema.primaryKey || typeof modelSchema.primaryKey.defaultValue !== 'function') {
      throw new OperationNotAllowed('Model schema ID defaultValue must be a function');
    }

    this.models[model] = modelSchema;

    this.emit('modelRegistered', model);
  },

  normalize: function(model, data) {
    if (data.__normalized) return data;

    var record = data; // TODO? clone(data);

    // set flag
    record.__normalized = true;

    // init backward links
    record.__rev = record.__rev || {};

    // init forward links
    record.__rel = record.__rel || {};

    // init meta info
    record.__meta = record.__meta || {};

    this.initDefaults(model, record);

    return record;
  },

  initDefaults: function(model, record) {
    if (!record.__normalized) {
      throw new OperationNotAllowed('Schema.initDefaults requires a normalized record');
    }

    var modelSchema = this.models[model],
        keys = modelSchema.keys,
        attributes = modelSchema.attributes,
        links = modelSchema.links;

    // init primary key - potentially setting the primary key from secondary keys if necessary
    this._initPrimaryKey(modelSchema, record);

    // init default key values
    for (var key in keys) {
      if (record[key] === undefined) {
        record[key] = this._defaultValue(record, keys[key].defaultValue, null);
      }
    }

    // init default attribute values
    if (attributes) {
      for (var attribute in attributes) {
        if (record[attribute] === undefined) {
          record[attribute] = this._defaultValue(record, attributes[attribute].defaultValue, null);
        }
      }
    }

    // init default link values
    if (links) {
      for (var link in links) {
        if (record.__rel[link] === undefined) {
          record.__rel[link] = this._defaultValue(record,
                                                  links[link].defaultValue,
                                                  links[link].type === 'hasMany' ? {} : null);
        }
      }
    }

    this._mapKeys(modelSchema, record);
  },

  primaryToSecondaryKey: function(model, secondaryKeyName, primaryKeyValue, autoGenerate) {
    var modelSchema = this.models[model];
    var secondaryKey = modelSchema.keys[secondaryKeyName];

    var value = secondaryKey.primaryToSecondaryKeyMap[primaryKeyValue];

    // auto-generate secondary key if necessary, requested, and possible
    if (value === undefined && autoGenerate && secondaryKey.defaultValue) {
      value = secondaryKey.defaultValue();
      this._registerKeyMapping(secondaryKey, primaryKeyValue, value);
    }

    return value;
  },

  secondaryToPrimaryKey: function(model, secondaryKeyName, secondaryKeyValue, autoGenerate) {
    var modelSchema = this.models[model];
    var secondaryKey = modelSchema.keys[secondaryKeyName];

    var value = secondaryKey.secondaryToPrimaryKeyMap[secondaryKeyValue];

    // auto-generate primary key if necessary, requested, and possible
    if (value === undefined && autoGenerate && modelSchema.primaryKey.defaultValue) {
      value = modelSchema.primaryKey.defaultValue();
      this._registerKeyMapping(secondaryKey, value, secondaryKeyValue);
    }

    return value;
  },

  // TODO - test
  registerAllKeys: function(data) {
    if (data) {
      Object.keys(data).forEach(function(type) {
        var modelSchema = this.models[type];

        if (modelSchema && modelSchema.secondaryKeys) {
          var records = data[type];

          records.forEach(function(record) {
            var id = record[modelSchema.primaryKey.name],
                altId;

            Object.keys(modelSchema.secondaryKeys).forEach(function(secondaryKey) {
              altId = record[secondaryKey];
              if (altId !== undefined && altId !== null) {
                var secondaryKeyDef = modelSchema.secondaryKeys[secondaryKey];
                this._registerKeyMapping(secondaryKeyDef, id, altId);
              }
            }, this);
          }, this);
        }
      }, this);
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

  _defaultValue: function(record, value, defaultValue) {
    if (value === undefined) {
      return defaultValue;

    } else if (typeof value === 'function') {
      return value.call(record);

    } else {
      return value;
    }
  },

  _initPrimaryKey: function(modelSchema, record) {
    var pk = modelSchema.primaryKey.name;
    var id = record[pk];

    // init primary key from secondary keys
    if (!id && modelSchema.secondaryKeys) {
      var keyNames = Object.keys(modelSchema.secondaryKeys);
      for (var i=0, l = keyNames.length; i <l ; i++){
        var key = modelSchema.keys[keyNames[i]];
        var value = record[key.name];
        if (value) {
          id = key.secondaryToPrimaryKeyMap[value];
          if (id) {
            record[pk] = id;
            return;
          }
        }
      }
    }
  },

  _mapKeys: function(modelSchema, record) {
    var id = record[modelSchema.primaryKey.name];

    if (modelSchema.secondaryKeys) {
      Object.keys(modelSchema.secondaryKeys).forEach(function(name) {
        var value = record[name];
        if (value) {
          var key = modelSchema.secondaryKeys[name];
          this._registerKeyMapping(key, id, value);
        }
      }, this);
    }
  },

  _registerKeyMapping: function(secondaryKeyDef, primaryValue, secondaryValue) {
    secondaryKeyDef.primaryToSecondaryKeyMap[primaryValue] = secondaryValue;
    secondaryKeyDef.secondaryToPrimaryKeyMap[secondaryValue] = primaryValue;
  },

  _mergeModelSchemas: function(base) {
    var sources = Array.prototype.slice.call(arguments, 1);

    // ensure model schema has categories set
    base.keys = base.keys || {};
    base.attributes = base.attributes || {};
    base.links = base.links || {};

    sources.forEach(function(source) {
      source = clone(source);
      this._mergeModelFields(base.keys, source.keys);
      this._mergeModelFields(base.attributes, source.attributes);
      this._mergeModelFields(base.links, source.links);
    }, this);

    return base;
  },

  _mergeModelFields: function(base, source) {
    if (source) {
      Object.keys(source).forEach(function(field) {
        if (source.hasOwnProperty(field)) {
          var fieldDef = source[field];
          if (fieldDef) {
            base[field] = fieldDef;
          } else {
            // fields defined as falsey should be removed
            delete base[field];
          }
        }
      });
    }
  }
});

export default Schema;
