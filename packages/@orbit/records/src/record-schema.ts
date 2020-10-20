/* eslint-disable valid-jsdoc */
import { Orbit } from '@orbit/core';
import { ModelNotFound } from './record-exceptions';
import { Dict } from '@orbit/utils';
import { evented, Evented, Listener } from '@orbit/core';
import { Record, RecordInitializer, UninitializedRecord } from './record';

const { uuid, deprecate } = Orbit;

export interface AttributeDefinition {
  type?: string;
  serializationOptions?: Dict<any>;
  deserializationOptions?: Dict<any>;
}

export interface RelationshipDefinition {
  kind?: 'hasMany' | 'hasOne';
  type?: string | string[];
  model?: string | string[];
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

/**
 * A `Schema` defines the models allowed in a source, including their keys,
 * attributes, and relationships. A single schema may be shared across multiple
 * sources.
 */
@evented
export class RecordSchema implements Evented, RecordInitializer {
  private _models!: Dict<ModelDefinition>;
  private _version!: number;

  // Evented interface stubs
  on!: (event: string, listener: Listener) => () => void;
  off!: (event: string, listener?: Listener) => void;
  one!: (event: string, listener: Listener) => () => void;
  emit!: (event: string, ...args: any[]) => void;
  listeners!: (event: string) => Listener[];

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
  upgrade(settings: RecordSchemaSettings = {}): void {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }
    this._applySettings(settings);
    this.emit('upgrade', this._version);
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
   * @deprecated since v0.17
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
   * @deprecated since v0.17
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

  initializeRecord(record: UninitializedRecord): Record {
    if (record.id === undefined) {
      record.id = this.generateId(record.type);
    }
    return record as Record;
  }

  get models(): Dict<ModelDefinition> {
    return this._models;
  }

  getModel(type: string): ModelDefinition {
    let model = this.models[type];
    if (model) {
      return model;
    } else {
      throw new ModelNotFound(type);
    }
  }

  getAttribute(
    type: string,
    attribute: string
  ): AttributeDefinition | undefined {
    const model = this.getModel(type);
    return model.attributes && model.attributes[attribute];
  }

  getRelationship(
    type: string,
    relationship: string
  ): RelationshipDefinition | undefined {
    const model = this.getModel(type);
    return model.relationships && model.relationships[relationship];
  }

  hasAttribute(type: string, attribute: string): boolean {
    return !!this.getAttribute(type, attribute);
  }

  hasRelationship(type: string, relationship: string): boolean {
    return !!this.getRelationship(type, relationship);
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
        let relationships = models[type].relationships as Dict<
          RelationshipDefinition
        >;
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
