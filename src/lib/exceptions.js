/* eslint-disable valid-jsdoc */

/**
 Base Exception

 @class Exception
 @namespace Orbit
 @constructor
 */
export class Exception {
  constructor(message) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }
}

/**
 Exception thrown when a path in a document can not be found.

 @class PathNotFoundException
 @namespace Orbit
 @param {String} path
 @constructor
 */
export class PathNotFoundException extends Exception {
  constructor(path) {
    super(`Path not found: ${path.join('/')}`);
    this.path = path;
  }
}

export class TransformNotLoggedException extends Exception {
  constructor(transformId) {
    super(`Transform not logged: ${transformId}`);
    this.transformId = transformId;
  }
}

export class QueryBuilderNotRegisteredException extends Exception {
  constructor(queryBuilder) {
    super(`QueryBuilder not registered: ${queryBuilder}`);
    this.queryBuilder = queryBuilder;
  }
}

export class OutOfRangeException extends Exception {
  constructor(value) {
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
  constructor(operation) {
    super(`Operation not allowed: ${operation}`);
    this.operation = operation;
  }
}

export class TransformNotAllowed extends Exception {
  constructor(transform) {
    super(`Transform not allowed: ${transform}`);
    this.transform = transform;
  }
}

export class QueryNotAllowed extends Exception {
  constructor(query) {
    super(`Query not allowed: ${query}`);
    this.query = query;
  }
}

export class QueryExpressionParseError extends Exception {
  constructor(expression) {
    super(`Query expression parse error: ${expression}`);
    this.expression = expression;
  }
}

export class UpdateNotAllowed extends Exception {
  constructor(transform) {
    super(`Update not allowed: ${transform}`);
    this.transform = transform;
  }
}

export class ModelNotRegisteredException extends Exception {
  constructor(model) {
    super(`Model not registered: ${model}`);
    this.model = model;
  }
}

export class KeyNotRegisteredException extends Exception {
  constructor(model, key) {
    super(`Key not registered: '${model}#${key}'`);
    this.model = model;
    this.key = key;
  }
}

export class RelationshipNotRegisteredException extends Exception {
  constructor(model, relationship) {
    super(`Relationship not registered: '${model}#${relationship}'`);
    this.model = model;
    this.relationship = relationship;
  }
}

export class ClientError extends Exception {
  constructor(description) {
    super(`Client error: ${description}`);
  }
}

export class ServerError extends Exception {
  constructor(description) {
    super(`Server error: ${description}`);
  }
}

export class NetworkError extends Exception {
  constructor(description) {
    super(`Network error: ${description}`);
  }
}

class _RecordException extends Exception {
  constructor(description, type, id, relationship) {
    let message = `${description}: ${type}:${id}`;

    if (relationship) {
      message += '/' + relationship;
    }

    super(message);

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
export class RecordNotFoundException extends _RecordException {
  constructor(type, id) {
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
export class RelationshipNotFoundException extends _RecordException {
  constructor(type, id, relationship) {
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
export class RecordAlreadyExistsException extends _RecordException {
  constructor(type, id) {
    super('Record already exists', type, id);
  }
}
