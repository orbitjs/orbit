/* eslint-disable valid-jsdoc */
import { evented, Evented, fulfillAll, Orbit } from '@orbit/core';
import { Dict } from '@orbit/utils';
import { ArrayValidationOptions } from '@orbit/validators';
import {
  AttributeNotDefined,
  KeyNotDefined,
  ModelNotDefined,
  RelationshipNotDefined
} from './record-exceptions';

const { uuid, deprecate } = Orbit;

export interface FieldValidationOptions {
  required?: boolean;
  [key: string]: unknown;
}

export interface AttributeDefinition {
  type?: string;
  serialization?: Dict<unknown>;
  deserialization?: Dict<unknown>;
  validation?: FieldValidationOptions & {
    notNull?: boolean;
  };
  meta?: Dict<unknown>;
}

export interface HasOneRelationshipDefinition {
  kind: 'hasOne';
  type?: string | string[];
  model?: string | string[];
  inverse?: string;
  dependent?: 'remove';
  validation?: FieldValidationOptions & {
    notNull?: boolean;
  };
  meta?: Dict<unknown>;
}

export interface HasManyRelationshipDefinition {
  kind: 'hasMany';
  type?: string | string[];
  model?: string | string[];
  inverse?: string;
  dependent?: 'remove';
  validation?: FieldValidationOptions & ArrayValidationOptions;
  meta?: Dict<unknown>;
}

export type RelationshipDefinition =
  | HasOneRelationshipDefinition
  | HasManyRelationshipDefinition;

export interface KeyDefinition {
  /**
   * @deprecated since v0.17 - not used by any standard serializers
   */
  primaryKey?: boolean;

  validation?: FieldValidationOptions & {
    notNull?: boolean;
  };

  meta?: Dict<unknown>;
}

export interface ModelDefinition {
  keys?: Dict<KeyDefinition>;
  attributes?: Dict<AttributeDefinition>;
  relationships?: Dict<RelationshipDefinition>;
}

/**
 * Settings used to initialze and/or upgrade schemas.
 */
export interface RecordSchemaSettings {
  /**
   * Schema version. Defaults to 1.
   */
  version?: number;

  /**
   * Function used to generate record IDs.
   */
  generateId?: (model?: string) => string;

  /**
   * Function used to pluralize names.
   *
   * @deprecated
   */
  pluralize?: (word: string) => string;

  /**
   * Function used to singularize names.
   *
   * @deprecated
   */
  singularize?: (word: string) => string;

  /**
   * Map of model definitions.
   */
  models?: Dict<ModelDefinition>;
}

export type RecordSchemaEvent = 'upgrade';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RecordSchema extends Evented<RecordSchemaEvent> {}

/**
 * A `Schema` defines the models allowed in a source, including their keys,
 * attributes, and relationships. A single schema may be shared across multiple
 * sources.
 */
@evented
export class RecordSchema {
  private _models!: Dict<ModelDefinition>;
  private _version!: number;

  constructor(settings: RecordSchemaSettings = {}) {
    if (settings.version === undefined) {
      settings.version = 1;
    }

    if (settings.models === undefined) {
      settings.models = {};
    }

    this._applySettings(settings);
  }

  /**
   * Version
   */
  get version(): number {
    return this._version;
  }

  /**
   * Upgrades Schema to a new version with new settings.
   *
   * Emits the `upgrade` event to cue sources to upgrade their data.
   */
  async upgrade(settings: RecordSchemaSettings = {}): Promise<void> {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }
    this._applySettings(settings);
    await fulfillAll(this as Evented, 'upgrade', this._version);
  }

  /**
   * Registers a complete set of settings
   */
  protected _applySettings(settings: RecordSchemaSettings): void {
    // Version
    if (settings.version !== undefined) {
      this._version = settings.version;
    }

    // Allow overrides
    if (settings.generateId) {
      this.generateId = settings.generateId;
    }
    if (settings.pluralize) {
      deprecate(
        'Schema#pluralize has been deprecated. Use inflectors from in @orbit/serializers instead.'
      );
      this.pluralize = settings.pluralize;
    }
    if (settings.singularize) {
      deprecate(
        'Schema#singularize has been deprecated. Use inflectors from @orbit/serializers instead.'
      );
      this.singularize = settings.singularize;
    }

    // Register model schemas
    if (settings.models) {
      this._deprecateRelationshipModel(settings.models);
      this._models = settings.models;
    }
  }

  /**
   * Generate an id for a given model type.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateId(type?: string): string {
    return uuid();
  }

  /**
   * A naive pluralization method.
   *
   * Deprecated in favor of inflectors now in @orbit/serializers
   *
   * @deprecated since v0.17, remove in v0.18
   */
  pluralize(word: string): string {
    deprecate(
      'Schema#pluralize has been deprecated. Use inflectors from @orbit/serializers instead.'
    );
    return word + 's';
  }

  /**
   * A naive singularization method.
   *
   * Deprecated in favor of inflectors now in @orbit/serializers
   *
   * @deprecated since v0.17, remove in v0.18
   */
  singularize(word: string): string {
    deprecate(
      'Schema#singularize has been deprecated. Use inflectors from @orbit/serializers instead.'
    );
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
      console.warn(
        `Orbit's built-in naive singularization rules cannot singularize ${word}. Pass singularize & pluralize functions to Schema to customize.`
      );
      return word;
    }
  }

  get models(): Dict<ModelDefinition> {
    return this._models;
  }

  getModel(type: string): ModelDefinition {
    const model = this.models[type];
    if (model) {
      return model;
    } else {
      throw new ModelNotDefined(type);
    }
  }

  getAttribute(type: string, attribute: string): AttributeDefinition {
    const model = this.getModel(type);
    const attributeDef = model.attributes?.[attribute];
    if (attributeDef) {
      return attributeDef;
    } else {
      throw new AttributeNotDefined(type, attribute);
    }
  }

  getKey(type: string, key: string): KeyDefinition {
    const model = this.getModel(type);
    const keyDef = model.keys?.[key];
    if (keyDef) {
      return keyDef;
    } else {
      throw new KeyNotDefined(type, key);
    }
  }

  getRelationship(type: string, relationship: string): RelationshipDefinition {
    const model = this.getModel(type);
    const relationshipDef = model.relationships?.[relationship];
    if (relationshipDef) {
      return relationshipDef;
    } else {
      throw new RelationshipNotDefined(type, relationship);
    }
  }

  hasModel(type: string): boolean {
    return this.models[type] !== undefined;
  }

  hasAttribute(type: string, attribute: string): boolean {
    return this.models[type]?.attributes?.[attribute] !== undefined;
  }

  hasKey(type: string, key: string): boolean {
    return this.models[type]?.keys?.[key] !== undefined;
  }

  hasRelationship(type: string, relationship: string): boolean {
    return this.models[type]?.relationships?.[relationship] !== undefined;
  }

  eachAttribute(
    type: string,
    callbackFn: (name: string, attribute: AttributeDefinition) => void
  ): void {
    const model = this.getModel(type);
    const attributes = model.attributes || {};
    for (let name in attributes) {
      callbackFn(name, attributes[name]);
    }
  }

  eachKey(
    type: string,
    callbackFn: (name: string, key: KeyDefinition) => void
  ): void {
    const model = this.getModel(type);
    const keys = model.keys || {};
    for (let name in keys) {
      callbackFn(name, keys[name]);
    }
  }

  eachRelationship(
    type: string,
    callbackFn: (name: string, relationship: RelationshipDefinition) => void
  ): void {
    const model = this.getModel(type);
    const relationships = model.relationships || {};
    for (let name in relationships) {
      callbackFn(name, relationships[name]);
    }
  }

  _deprecateRelationshipModel(models: Dict<ModelDefinition>): void {
    for (let type in models) {
      if (models[type].relationships) {
        let relationships = models[type]
          .relationships as Dict<RelationshipDefinition>;
        for (let name in relationships) {
          let relationship = relationships[name];
          if (relationship.model) {
            deprecate(
              'RelationshipDefinition.model is deprecated, use `type` and `kind` instead.'
            );
          }
        }
      }
    }
  }
}
