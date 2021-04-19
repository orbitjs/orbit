import { Exception } from '@orbit/core';

/**
 * An error occured related to the schema.
 */
export class SchemaError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Schema: ${description}`);
    this.description = description;
  }
}

/**
 * A model is not defined in the schema.
 */
export class ModelNotDefined extends SchemaError {
  constructor(type: string) {
    super(`Model '${type}' not defined.`);
  }
}

/**
 * An attribute definition could not be found in the model definition.
 */
export class AttributeNotDefined extends SchemaError {
  constructor(type: string, attribute: string) {
    super(`Attribute '${attribute}' not defined for model '${type}'.`);
  }
}

/**
 * A key definition could not be found in the model definition.
 */
export class KeyNotDefined extends SchemaError {
  constructor(type: string, key: string) {
    super(`Key '${key}' not defined for model '${type}'.`);
  }
}

/**
 * A relationship definition could not be found in the model definition.
 */
export class RelationshipNotDefined extends SchemaError {
  constructor(type: string, relationship: string) {
    super(`Relationship '${relationship}' not defined for model '${type}'.`);
  }
}

/**
 * An error occurred related to a particular record.
 */
export abstract class RecordException extends Exception {
  public description: string;
  public type: string;
  public id: string;
  public field?: string;

  constructor(description: string, type: string, id: string, field?: string) {
    let message = `${description}: ${type}:${id}`;

    if (field) {
      message += '/' + field;
    }

    super(message);

    this.description = description;
    this.type = type;
    this.id = id;
    this.field = field;
  }
}

/**
 * A record could not be found.
 */
export class RecordNotFoundException extends RecordException {
  constructor(type: string, id: string) {
    super('Record not found', type, id);
  }
}

/**
 * Record attribute is an incorrect type.
 */
export class InvalidRecordAttributeType extends RecordException {
  constructor(
    type: string,
    id: string,
    attribute: string,
    expectedType: string
  ) {
    super(`Expected attribute type '${expectedType}'`, type, id, attribute);
  }
}

/**
 * Related record is an incorrect type for a relationship.
 */
export class InvalidRelatedRecordType extends RecordException {
  constructor(
    type: string,
    id: string,
    relationship: string,
    invalidType: string
  ) {
    super(
      `Record of type '${invalidType}' is not allowed in relationship`,
      type,
      id,
      relationship
    );
  }
}
