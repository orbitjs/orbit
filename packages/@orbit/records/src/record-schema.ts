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

const { uuid } = Orbit;

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

    // Register model schemas
    if (settings.models) {
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
}
