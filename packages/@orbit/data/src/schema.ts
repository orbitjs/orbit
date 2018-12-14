/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { ModelNotFound } from './exception';
import { Dict } from '@orbit/utils';
import { evented, Evented } from '@orbit/core';
import { Record, RecordInitializer } from './record';

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
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => any[];

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
   * inflector tailored to the vocabularly of your application.
   */
  pluralize(word: string): string {
    return word + 's';
  }

  /**
   * A naive singularization method.
   *
   * Override with a more robust general purpose inflector or provide an
   * inflector tailored to the vocabularly of your application.
   */
  singularize(word: string): string {
    if (word.lastIndexOf('s') === word.length - 1) {
      return word.substr(0, word.length - 1);
    } else {
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

  hasAttribute(type: string, attribute: string): boolean {
    let model = this.getModel(type);
    if (model.attributes && model.attributes[attribute]) {
      return true;
    } else {
      return false;
    }
  }

  hasRelationship(type: string, relationship: string): boolean {
    let model = this.getModel(type);
    if (model.relationships && model.relationships[relationship]) {
      return true;
    } else {
      return false;
    }
  }
}
