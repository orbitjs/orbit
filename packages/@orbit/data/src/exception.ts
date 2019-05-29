import { Exception } from '@orbit/core';

/**
 * An client-side error occurred while communicating with a remote server.
 */
export class ClientError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Client error: ${description}`);
    this.description = description;
  }
}

/**
 * A server-side error occurred while communicating with a remote server.
 */
export class ServerError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Server error: ${description}`);
    this.description = description;
  }
}

/**
 * A networking error occurred while attempting to communicate with a remote
 * server.
 */
export class NetworkError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Network error: ${description}`);
    this.description = description;
  }
}

/**
 * A query expression could not be parsed.
 */
export class QueryExpressionParseError extends Exception {
  public description: string;
  public expression: any;

  constructor(description: string, expression: any) {
    super(`Query expression parse error: ${description}`);
    this.description = description;
    this.expression = expression;
  }
}

/**
 * A query is invalid for a particular source.
 */
export class QueryNotAllowed extends Exception {
  public description: string;
  public query: any;

  constructor(description: string, query: any) {
    super(`Query not allowed: ${description}`);
    this.description = description;
    this.query = query;
  }
}

/**
 * A transform is invalid for a particular source.
 */
export class TransformNotAllowed extends Exception {
  public description: string;
  public transform: any;

  constructor(description: string, transform: any) {
    super(`Transform not allowed: ${description}`);
    this.description = description;
    this.transform = transform;
  }
}

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
  public relationship: string;

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
