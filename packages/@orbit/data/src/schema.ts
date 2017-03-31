/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { assert, clone, Dict } from '@orbit/utils';
import { evented, Evented } from '@orbit/core';
import { Record } from './record';

export interface AttributeDefinition {
  type?: string;
}

export interface RelationshipDefinition {
  type: 'hasMany' | 'hasOne';
  model?: string;
  inverse?: string;
  dependent?: 'remove';
}

export interface KeyDefinition {
  primaryKey?: boolean;
}

export interface ModelDefinition {
  keys?: Dict<KeyDefinition>;
  attributes?: Dict<AttributeDefinition>;
  relationships?: Dict<RelationshipDefinition>;
}

export interface SchemaSettings {
  version?: number;
  generateId?: (modelName?: string) => string;
  pluralize?: (word: string) => string;
  singularize?: (word: string) => string;
  models?: Dict<ModelDefinition>;
  modelDefaults?: ModelDefinition;
}

/**
 `Schema` defines the models allowed in a source, including their keys,
 attributes and relationships. A single schema may be shared across multiple
 sources.

 Schemas are defined with an initial set of settings, passed in as a constructor
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
   generateId: customIdGenerator
 });
```

`generateId` takes the model `type` as an argument, which allows for per-model
customization.

 ## Fields

 Fields represent application data that is unique to each model.

 There are three broad categories of fields available for models: keys,
 attributes, and relationships.

 Within each category, fields may be declared along with options appropriate
 for the category. Common field options include:

 * `type` - a classification, often category-specific, that defines a field's
   purpose and/or contents.

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
 `modelDefaults` can be overridden to include any number of keys, attributes,
 and relationships.

 For instance:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        remoteId: {}
      },
      attributes: {
        createdAt: {type: 'date'}
      }
    }
  });
 ```

 The default fields can be overridden in or removed from any particular model
 definition. To remove any key, attribute or relationship definition inherited from
 `modelDefaults` simply define the field with a `null` value.

 For example, the following schema removes `createdAt` from the `planet` model:

 ```
  var schema = new Schema({
    modelDefaults: {
      keys: {
        remoteId: {}
      },
      attributes: {
        createdAt: {type: 'date'}
      }
    },
    models: {
      planet: {
        attributes: {
          name: {type: 'string'},
          createdAt: null
        }
      }
    }
  });
 ```

 @class Schema
 */
@evented
export default class Schema implements Evented {
  modelDefaults: ModelDefinition;
  models: Dict<ModelDefinition>;

  private _version: number;

  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  /**
   * Create a new Schema.
   *
   * @constructor
   * @param {Object}   [settings={}]            Optional. Configuration settings.
   * @param {Integer}  [settings.version]       Optional. Schema version. Defaults to 1.
   * @param {Object}   [settings.models]        Optional. Schemas for individual models supported by this schema.
   * @param {Object}   [settings.modelDefaults] Optional. Defaults for model schemas.
   * @param {Function} [settings.pluralize]     Optional. Function used to pluralize names.
   * @param {Function} [settings.singularize]   Optional. Function used to singularize names.
   */
  constructor(settings: SchemaSettings = {}) {
    if (settings.version === undefined) {
      settings.version = 1;
    }

    this._applySettings(settings);
  }

  /**
   * Version
   * @return {Integer} Version of schema.
   */
  get version(): number {
    return this._version;
  }

  /**
   * Upgrades Schema to a new version with new settings.
   *
   * Emits the `upgrade` event to cue sources to upgrade their data.
   *
   * @param {Object}   [settings={}]            Settings.
   * @param {Integer}  [settings.version]       Optional. Schema version. Defaults to the current version + 1.
   * @param {Object}   [settings.models]        Schemas for individual models supported by this schema.
   * @param {Object}   [settings.modelDefaults] Optional. Defaults for model schemas.
   * @param {Function} [settings.pluralize]     Optional. Function used to pluralize names.
   * @param {Function} [settings.singularize]   Optional. Function used to singularize names.
   */
  upgrade(settings: SchemaSettings = {}): void {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }
    this._applySettings(settings);
    this.emit('upgrade', this._version);
  }

  /**
   * Registers a complete set of settings
   *
   * @private
   * @param {Object} settings Settings passed into `constructor` or `upgrade`.
   */
  _applySettings(settings: SchemaSettings): void {
    // Version
    this._version = settings.version;

    // Allow overrides
    if (settings.generateId) {
      this.generateId = settings.generateId;
    }
    if (settings.pluralize) {
      this.pluralize = settings.pluralize;
    }
    if (settings.singularize) {
      this.singularize = settings.singularize;
    }

    // Set model schema defaults
    if (settings.modelDefaults) {
      this.modelDefaults = settings.modelDefaults;
    } else if (this.modelDefaults === undefined) {
      this.modelDefaults = {};
    }

    // Register model schemas
    if (settings.models) {
      this._registerModels(settings.models);
    }
  }

  /**
   * Registers the schema of all models.
   *
   * @private
   * @param {Object} models Hash of models, keyed by type
   */
  _registerModels(models: Dict<ModelDefinition>): void {
    this.models = {};
    if (models) {
      Object.keys(models).forEach(modelName => {
        this._registerModel(modelName, models[modelName]);
      });
    }
  }

  /**
   * Registers a model's schema definition.
   *
   * @private
   * @param {String} name       Name of the model
   * @param {Object} definition Model schema definition
   */
  _registerModel(name: string, definition: ModelDefinition) {
    this.models[name] = mergeModelDefinitions({}, this.modelDefaults, definition);
  }

  /**
   * Returns a model definition.
   *
   * If no model has been defined, a `ModelNotRegisteredException` is raised.
   *
   * @param {String} type Type of model
   * @return {Object} Model definition
   */
  modelDefinition(name: string): ModelDefinition {
    return this.models[name];
  }

  /**
   * Generate an id for a given model type.
   *
   * @param {String} modelName Model name
   * @return {String} Generated model ID
   */
  generateId(modelName?: string): string {
    return Orbit.uuid();
  }

  /**
   * A naive pluralization method.
   *
   * Override with a more robust general purpose inflector or provide an
   * inflector tailored to the vocabularly of your application.
   *
   * @param  {String} word
   * @return {String} plural form of `word`
   */
  pluralize(word: string): string {
    return word + 's';
  }

  /**
   * A naive singularization method.
   *
   * Override with a more robust general purpose inflector or provide an
   * inflector tailored to the vocabularly of your application.
   *
   * @param  {String} word
   * @return {String} singular form of `word`
   */
  singularize(word: string): string {
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
      return word;
    }
  }

  keyDefinition(modelName, key): KeyDefinition {
    return this.modelDefinition(modelName).keys[key];
  }

  relationshipDefinition(modelName, relationship): RelationshipDefinition {
    return this.modelDefinition(modelName).relationships[relationship];
  }
}

function mergeModelDefinitions(base: ModelDefinition, ...sources: ModelDefinition[]): ModelDefinition {
  // ensure model schema has categories set
  base.keys = base.keys || {};
  base.attributes = base.attributes || {};
  base.relationships = base.relationships || {};

  sources.forEach(source => {
    source = clone(source);
    mergeModelFields(base.keys, source.keys);
    mergeModelFields(base.attributes, source.attributes);
    mergeModelFields(base.relationships, source.relationships);
  });

  return base;
}

function mergeModelFields(base, source): void {
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
