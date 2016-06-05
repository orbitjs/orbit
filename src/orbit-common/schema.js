/* eslint-disable valid-jsdoc */
import { clone } from 'orbit/lib/objects';
import { uuid } from 'orbit/lib/uuid';
import { OperationNotAllowed, ModelNotRegisteredException, KeyNotRegisteredException, RelationshipNotRegisteredException } from './lib/exceptions';
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
        relationships: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        attributes: {
          name: {type: 'string'}
        },
        relationships: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });
 ```

 Models should be keyed by their singular name, and should be defined as an
 object that contains `attributes` and/or `relationships`.

 Models can be registered after a schema's been initialized with
 `registerModel`.

 It's also possible to define default settings for all models via a
 `modelDefaults` key, a sibling to `models` (examples below).

 ## Identity

 The following top-level members are used to uniquely identity records:

 * `type` - a string that uniquely identifies a model
 * `id` - a string that uniquely identifies a record of a given `type`

Note that `id` must be client-generated for any types of data that may exist
solely in Orbit, even briefly (i.e. until it's been accepted by the server).
Each `id` can be mapped to a server-generated "key", as described below.

By default, a v4 UUID generator is used to assign `id`, which ensures that IDs
can be used within Orbit and on remote servers with an extremely low probability
of a conflict. This generator can be overridden by defining the `defaultValue`
for `id` to another function.

It's possible to override the ID generator for all models as follows:

```
 var schema = new Schema({
   modelDefaults: {
     id: {defaultValue: customIdGenerator}
   }
 });
```

It's also possible to override the ID generator for only specific models as
follows:

```
 var schema = new Schema({
   models: {
     planet: {
       id: {defaultValue: customIdGenerator}
     }
   }
 });
```

 ## Fields

 Fields represent application data that is unique to each model.

 There are three broad categories of fields available for models: keys,
 attributes, and relationships.

 Within each category, fields may be declared along with options appropriate
 for the category. Common field options include:

 * `type` - a classification, often category-specific, that defines a field's
   purpose and/or contents.

 * `defaultValue` - a value or function that returns a value, to be set on
   record initialization when a field's value is `undefined`.

 Default fields for models can be specified in a `modelDefaults` object. A
 single primary key field, `id`, is defined by default (see below).

 ### Keys

 When working with remote servers that do not support client-generated IDs, it's
 necessary to correlate local client-generated IDs with remote server-generated
 IDs, or "keys". Like `id`, keys uniquely identify a record of a particular
 model type.

 Keys may only be of type `"string"`, which is also the default and therefore
 unnecessary to declare.

 Let's say that all models have a remote key named `remoteId`. This could be
 defined in your schema's `modelDefaults` as follows:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        'remoteId': {}
      }
    }
  });
 ```

 > Note: It's not necessary to define any field options for keys.

 > Note: A key such as `remoteId` might be serialized as simply `id` when
 communicating with a server. However, it's important to distinguish it from
 the client-generated `id` used for each resource.

 When any keys are defined, the schema will maintain a mapping of
 id-to-key values that can be shared by all sources. This
 centralized mapping assumes that key values will never change once set, which
 is a realistic assumption for distributed systems.

 ### Attributes

 Any properties that define a model's data, with the exception of relationships
 to other models, should be defined as "attributes".

 Attributes may be defined by their `type`, such as `"string"` or `"date"`,
 which can be used to define their purpose and contents. An attribute's type may
 also be used to determine how it should be normalized and serialized.

 ### Relationships

 Two types of relationships between models are allowed:

 * `hasOne` - for to-one relationships
 * `hasMany` - for to-many relationships

 Relationships must define the related `model` and may optionally define their
 `inverse`, which should correspond to the name of a relationship on the related
 model. Inverse relationships should be defined when relationships must be kept
 synchronized, so that adding or removing a relationship on the primary model
 results in a corresponding change on the inverse model.

 Here's an example of a schema definition that includes relationships with inverses:

 ```
  var schema = new Schema({
    models: {
      planet: {
        relationships: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
        }
      },
      moon: {
        relationships: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });
 ```

 To-many relationships may be defined with a special attribute, `actsAsSet`, to indicate
 that they act as a set that should be changed together. Sources should respect
 this attribute when processing changes.

 ```
  var schema = new Schema({
    models: {
      planet: {
        relationships: {
          moons: {type: 'hasMany', model: 'moon', inverse: 'planet',
                  actsAsSet: true}
        }
      },
      moon: {
        relationships: {
          planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
        }
      }
    }
  });
 ```

 ## Model Defaults

 The `modelDefaults` object defines a default model schema for ALL models in the
 schema. This is useful for defining the default ID attribute and any other
 attributes or relationships that are present across models in the schema.

 As discussed above, `modelDefaults` defines a single primary key by default.
 `modelDefaults` can be overridden to include any number of attributes and relationships.
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
 definition. To remove any key, attribute or relationship definition inherited from
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
export default class Schema {
  constructor(_options) {
    let options = _options || {};

    // model defaults
    if (options.modelDefaults) {
      this.modelDefaults = options.modelDefaults;
    } else {
      this.modelDefaults = {
        id: { defaultValue: uuid }
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
      for (var modelName in options.models) {
        if (options.models.hasOwnProperty(modelName)) {
          this.registerModel(modelName, options.models[modelName]);
        }
      }
    }
  }

  /**
   Registers a model's schema definition.

   Emits the `modelRegistered` event upon completion.

   @param {String} [name]       name of the model
   @param {Object} [definition] model schema definition
   */
  registerModel(name, definition) {
    var modelSchema = this._mergeModelSchemas({}, this.modelDefaults, definition);

    this.models[name] = modelSchema;
    this.emit('modelRegistered', name);
  }

  /**
   Normalizes a record according to its type and corresponding schema
   definition.

   A record's primary key, relationships, and meta data will all be initialized.

   A record can only be normalized once. A flag is set on the record
   (`__normalized`) to prevent "re-normalization".

   @param  {Object} [record] record data
   @return {Object} normalized version of `data`
   */
  normalize(record) {
    if (record.__normalized) { return record; }

    record.__normalized = true;

    this.initDefaults(record);

    return record;
  }

  /**
   A hook that can be used to define a model that's not yet defined.

   This allows for schemas to lazily define models, rather than requiring
   full definitions upfront.

   @method modelNotDefined
   @param {String} [model] name of model
   */
  // TODO modelNotDefined: null,

  /**
   Look up a model definition.

   If none can be found, `modelNotDefined` will be triggered, which provides
   an opportunity for lazily defining models.

   If still no model has been defined, a `ModelNotRegisteredException` is
   raised.

   @method modelDefinition
   @param {String} [model] name of model
   @return {Object} model definition
   */
  modelDefinition(name) {
    if (this.containsModel(name)) {
      return this.models[name];
    } else {
      throw new ModelNotRegisteredException(name);
    }
  }

  initDefaults(record) {
    if (!record.__normalized) {
      throw new OperationNotAllowed('Schema.initDefaults requires a normalized record');
    }

    function defaultValue(record, value) {
      if (typeof value === 'function') {
        return value.call(record);
      } else {
        return value;
      }
    }

    var modelSchema = this.modelDefinition(record.type);

    // init default id value
    if (record.id === undefined) {
      record.id = defaultValue(record, modelSchema.id.defaultValue);
    }

    // init default key values
    if (modelSchema.keys && Object.keys(modelSchema.keys).length > 0) {
      if (record.keys === undefined) { record.keys = {}; }

      for (var key in modelSchema.keys) {
        if (record.keys[key] === undefined) {
          record.keys[key] = defaultValue(record, modelSchema.keys[key].defaultValue);
        }
      }
    }

    // init default attribute values
    if (modelSchema.attributes) {
      if (record.attributes === undefined) { record.attributes = {}; }

      for (var attribute in modelSchema.attributes) {
        if (record.attributes[attribute] === undefined) {
          record.attributes[attribute] = defaultValue(record, modelSchema.attributes[attribute].defaultValue);
        }
      }
    }

    // init default relationship values
    if (modelSchema.relationships) {
      if (record.relationships === undefined) { record.relationships = {}; }

      for (var relationship in modelSchema.relationships) {
        if (record.relationships[relationship] === undefined) {
          const relationshipDefinition = modelSchema.relationships[relationship];
          const defaultForType = relationshipDefinition.type === 'hasMany' ? {} : null;

          record.relationships[relationship] = {
            data: defaultValue(record, relationshipDefinition.defaultValue) || defaultForType
          };
        }
      }
    }
  }

  defaultId(type) {
    let value = this.modelDefinition(type).id.defaultValue;

    if (typeof value === 'function') {
      return value();
    } else {
      return value;
    }
  }

  /**
   A naive pluralization method.

   Override with a more robust general purpose inflector or provide an
   inflector tailored to the vocabularly of your application.

   @param  {String} word
   @return {String} plural form of `word`
   */
  pluralize(word) {
    return word + 's';
  }

  /**
   A naive singularization method.

   Override with a more robust general purpose inflector or provide an
   inflector tailored to the vocabularly of your application.

   @param  {String} word
   @return {String} singular form of `word`
   */
  singularize(word) {
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
      return word;
    }
  }

  keyDefinition(modelName, key) {
    var modelDef = this.modelDefinition(modelName);

    var keyDef = modelDef.keys[key];
    if (!keyDef) { throw new KeyNotRegisteredException(modelName, key); }

    return keyDef;
  }

  relationshipDefinition(modelName, relationship) {
    var modelDef = this.modelDefinition(modelName);

    var relDef = modelDef.relationships[relationship];
    if (!relDef) { throw new RelationshipNotRegisteredException(modelName, relationship); }

    return relDef;
  }

  containsModel(name) {
    if (!!this.models[name]) {
      return true;
    }
    if (this.modelNotDefined) {
      this.modelNotDefined(name);
      return !!this.models[name];
    }
    return false;
  }

  _mergeModelSchemas(base) {
    var sources = Array.prototype.slice.call(arguments, 1);

    // ensure model schema has categories set
    base.id = base.id || {};
    base.keys = base.keys || {};
    base.attributes = base.attributes || {};
    base.relationships = base.relationships || {};

    sources.forEach(source => {
      source = clone(source);
      this._mergeModelFields(base.id, source.id);
      this._mergeModelFields(base.keys, source.keys);
      this._mergeModelFields(base.attributes, source.attributes);
      this._mergeModelFields(base.relationships, source.relationships);
    });

    return base;
  }

  _mergeModelFields(base, source) {
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
}
