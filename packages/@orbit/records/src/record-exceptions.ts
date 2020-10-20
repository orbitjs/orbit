import { Exception } from '@orbit/core';

/**
 * An error occured related to the schema.
 */
export class SchemaError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Schema error: ${description}`);
    this.description = description;
  }
}

/**
 * A model could not be found in the schema.
 */
export class ModelNotFound extends SchemaError {
  constructor(type: string) {
    super(`Model definition for ${type} not found`);
  }
}

/**
 * A relationship definition could not be found in the model definition
 */
export class RelationshipNotFound extends SchemaError {
  constructor(relationshipType: string, recordType: string) {
    super(
      `Relationship definition for ${relationshipType} not found for model definition ${recordType}`
    );
  }
}

/**
 * A related record of the incorrect type was attempted to be added to a relationship of a model definition
 */
export class IncorrectRelatedRecordType extends SchemaError {
  constructor(
    relatedRecordType: string,
    relationship: string,
    recordType: string
  ) {
    super(
      `Relationship definition ${relationship} for model definition ${recordType} does not accept record of type ${relatedRecordType}`
    );
  }
}

/**
 * An error occurred related to a particular record.
 */
export abstract class RecordException extends Exception {
  public description: string;
  public type: string;
  public id: string;
  public relationship?: string;

  constructor(
    description: string,
    type: string,
    id: string,
    relationship?: string
  ) {
    let message = `${description}: ${type}:${id}`;

    if (relationship) {
      message += '/' + relationship;
    }

    super(message);

    this.description = description;
    this.type = type;
    this.id = id;
    this.relationship = relationship;
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
