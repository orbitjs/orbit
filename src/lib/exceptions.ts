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

/**
 Exception thrown when a path in a document can not be found.

 @class PathNotFoundException
 @param {String} path
 @constructor
 */
export class PathNotFoundException extends Exception {
  public path: string[];

  constructor(path: string[]) {
    super(`Path not found: ${path.join('/')}`);
    this.path = path;
  }
}

export class TransformNotLoggedException extends Exception {
  public transformId: string;

  constructor(transformId: string) {
    super(`Transform not logged: ${transformId}`);
    this.transformId = transformId;
  }
}

export class QueryBuilderNotRegisteredException extends Exception {
  public queryBuilder: string;

  constructor(queryBuilder: string) {
    super(`QueryBuilder not registered: ${queryBuilder}`);
    this.queryBuilder = queryBuilder;
  }
}

export class OutOfRangeException extends Exception {
  public value: number;

  constructor(value: number) {
    super(`Out of range: ${value}`);
    this.value = value;
  }
}

/**
 Exception thrown when an operation is not allowed.

 @class OperationNotAllowed
 @param {Object} description
 @constructor
 */
export class OperationNotAllowed extends Exception {
  public operation: string;

  constructor(operation: string) {
    super(`Operation not allowed: ${operation}`);
    this.operation = operation;
  }
}

export class ModelNotRegisteredException extends Exception {
  public model: string;

  constructor(model: string) {
    super(`Model not registered: ${model}`);
    this.model = model;
  }
}

export class KeyNotRegisteredException extends Exception {
  public model: string;
  public key: string;
  
  constructor(model, key) {
    super(`Key not registered: '${model}#${key}'`);
    this.model = model;
    this.key = key;
  }
}

export class RelationshipNotRegisteredException extends Exception {
  public model: string;
  public relationship: string;

  constructor(model: string, relationship: string) {
    super(`Relationship not registered: '${model}#${relationship}'`);
    this.model = model;
    this.relationship = relationship;
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

abstract class RecordException extends Exception {
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
