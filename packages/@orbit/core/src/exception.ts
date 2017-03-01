/**
 Base Exception

 @class Exception
 @constructor
 */
export class Exception {
  public message: string;
  public error: Error;
  public stack: string;

  constructor(message: string) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }
}

export class TransformNotLoggedException extends Exception {
  public transformId: string;

  constructor(transformId: string) {
    super(`Transform not logged: ${transformId}`);
    this.transformId = transformId;
  }
}

export class OutOfRangeException extends Exception {
  public value: number;

  constructor(value: number) {
    super(`Out of range: ${value}`);
    this.value = value;
  }
}

export class ClientError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Client error: ${description}`);
    this.description = description;
  }
}

export class ServerError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Server error: ${description}`);
    this.description = description;
  }
}

export class NetworkError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Network error: ${description}`);
    this.description = description;
  }
}

export class QueryExpressionParseError extends Exception {
  public description: string;
  public expression: any;

  constructor(description: string, expression: any) {
    super(`Query expression parse error: ${description}`);
    this.description = description;
    this.expression = expression;
  }
}

export abstract class RecordException extends Exception {
  public description: string;
  public type: string;
  public id: string;
  public relationship: string;

  constructor(description: string, type: string, id: string, relationship?: string) {
    let message: string = `${description}: ${type}:${id}`;

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
 Exception thrown when a record can not be found.

 @class RecordNotFoundException
 @param {String} type
 @param {String} id
 @constructor
 */
export class RecordNotFoundException extends RecordException {
  constructor(type: string, id: string) {
    super('Record not found', type, id);
  }
}

/**
 Exception thrown when a relationship can not be found.

 @class RelationshipNotFoundException
 @namespace OC
 @param {String} type
 @param {String} id
 @constructor
 */
export class RelationshipNotFoundException extends RecordException {
  constructor(type: string, id: string, relationship: string) {
    super('Relationship not found', type, id, relationship);
  }
}

/**
 Exception thrown when a record already exists.

 @class RecordAlreadyExistsException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
export class RecordAlreadyExistsException extends RecordException {
  constructor(type: string, id: string) {
    super('Record already exists', type, id);
  }
}
