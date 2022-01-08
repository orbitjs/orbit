import { Exception } from '@orbit/core';
import {
  formatValidationDescription,
  ValidationIssue
} from '@orbit/validators';

/**
 * An error occured related to the schema.
 */
export class SchemaError extends Exception {
  constructor(description: string) {
    super(`Schema: ${description}`);
  }
}

/**
 * A validation failed.
 */
export class ValidationError extends Exception {
  public issues?: ValidationIssue[];

  constructor(description: string, issues?: ValidationIssue[]) {
    super(formatValidationDescription(description, issues));
    this.issues = issues;
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
  public type: string;
  public id: string;
  public field?: string;

  constructor(description: string, type: string, id: string, field?: string) {
    let specifier = `${type}:${id}`;

    if (field) {
      specifier = `${specifier}/${field}`;
    }

    super(`${description}: ${specifier}`);

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
