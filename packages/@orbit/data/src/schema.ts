/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { ModelNotFound } from './exception';
import { Dict } from '@orbit/utils';
import { evented, Evented, Listener } from '@orbit/core';
import { Record, RecordInitializer } from './record';

export interface AttributeDefinition {
  type?: string;
  serializationOptions?: Dict<any>;
  deserializationOptions?: Dict<any>;
}

export interface RelationshipDefinition {
  type: 'hasMany' | 'hasOne';
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
 *
 * @export
 * @interface SchemaSettings
 */
export interface SchemaSettings {
  /**
   * Schema version. Defaults to 1.
   *
   * @type {number}@memberof SchemaSettings
   */
  version?: number;

  /**
   * Function used to generate record IDs.
   *
   * @memberof SchemaSettings
   */
  generateId?: (model?: string) => string;

  /**
   * Function used to pluralize names.
   *
   * @memberof SchemaSettings
   */
  pluralize?: (word: string) => string;

  /**
   * Function used to singularize names.
   *
   * @memberof SchemaSettings
   */
  singularize?: (word: string) => string;

  /**
   * Map of model definitions.
   *
   * @type {Dict<ModelDefinition>}
   * @memberof SchemaSettings
   */
  models?: Dict<ModelDefinition>;
}

/**
 * A `Schema` defines the models allowed in a source, including their keys,
 * attributes, and relationships. A single schema may be shared across multiple
 * sources.
 *
 * @export
 * @class Schema
 * @implements {Evented}
 */
@evented
export default class Schema implements Evented, RecordInitializer {
  private _models: Dict<ModelDefinition>;

  private _version: number;

  // Evented interface stubs
  on: (event: string, listener: Listener) => void;
  off: (event: string, listener?: Listener) => void;
  one: (event: string, listener: Listener) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => Listener[];

  constructor(settings: SchemaSettings = {}) {
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
  upgrade(settings: SchemaSettings = {}): void {
    if (settings.version === undefined) {
      settings.version = this._version + 1;
    }
    this._applySettings(settings);
    this.emit('upgrade', this._version);
  }

  /**
   * Registers a complete set of settings
   */
  protected _applySettings(settings: SchemaSettings): void {
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

    // Register model schemas
    if (settings.models) {
      this._models = settings.models;
    }
  }

  /**
   * Generate an id for a given model type.
   */
  generateId(type?: string): string {
    return Orbit.uuid();
  }

  /**
   * A naive pluralization method.
   *
   * Override with a more robust general purpose inflector or provide an
   * inflector tailored to the vocabulary of your application.
   */
  pluralize(word: string): string {
    return word + 's';
  }

  /**
   * A naive singularization method.
   *
   * Override with a more robust general purpose inflector or provide an
   * inflector tailored to the vocabulary of your application.
   */
  singularize(word: string): string {
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
      console.warn(
        `Orbit's built-in naive singularization rules cannot singularize ${word}. Pass singularize & pluralize functions to Schema to customize.`
      );
      return word;
    }
  }

  initializeRecord(record: Record): void {
    if (record.id === undefined) {
      record.id = this.generateId(record.type);
    }
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

  getAttribute(type: string, attribute: string): AttributeDefinition {
    const model = this.getModel(type);
    return model.attributes && model.attributes[attribute];
  }

  getRelationship(type: string, relationship: string): RelationshipDefinition {
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
}
