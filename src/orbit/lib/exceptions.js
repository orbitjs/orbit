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
    this.error = new Error(this.toString());
    this.stack = this.error.stack;
    this.name = 'Orbit.Exception';
  }

  toString() {
    return this.name + ': ' + this.message;
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
    super(path.join('/'));
    this.path = path;
    this.name = 'Orbit.PathNotFoundException';
  }
}

export class TransformNotLoggedException extends Exception {
  constructor(transformId) {
    super(`Transform not logged: ${transformId}`);
    this.transformId = transformId;
    this.name = 'Orbit.TransformNotLoggedException';
  }
}

export class QueryBuilderNotRegisteredException extends Exception {
  constructor(queryBuilder) {
    super(`QueryBuilder not registered: ${queryBuilder}`);
    this.queryBuilder = queryBuilder;
    this.name = 'Orbit.QueryBuilderNotRegisteredException';
  }
}

export class OutOfRangeException extends Exception {
  constructor(value) {
    super(`Out of range: ${value}`);
    this.value = value;
    this.name = 'Orbit.OutOfRangeException';
  }
}

/**
 Exception thrown when an operation is not allowed.

 @class OperationNotAllowed
 @namespace OC
 @param {Object} description
 @constructor
 */
export class OperationNotAllowed extends Exception {
  constructor(message, operation) {
    super(message);
    this.operation = operation;
    this.name = 'OC.OperationNotAllowed';
  }
}

export class TransformNotAllowed extends Exception {
  constructor(message, transform) {
    super(message);
    this.transform = transform;
    this.name = 'OC.TransformNotAllowed';
  }
}

export class QueryNotAllowed extends Exception {
  constructor(message, query) {
    super(message);
    this.query = query;
    this.name = 'OC.QueryNotAllowed';
  }
}

export class QueryExpressionParseError extends Exception {
  constructor(message, expression) {
    super(message);
    this.expression = expression;
    this.name = 'OC.QueryExpressionParseError';
  }
}

export class UpdateNotAllowed extends Exception {
  constructor(message, transform) {
    super(message);
    this.query = transform;
    this.name = 'OC.UpdateNotAllowed';
  }
}

export class ModelNotRegisteredException extends Exception {
  constructor(model) {
    super(`model ${model} not registered`);
    this.model = model;
    this.name = 'OC.ModelNotRegisteredException';
  }
}

export class KeyNotRegisteredException extends Exception {
  constructor(model, key) {
    super(`key '${model}#${key}' not registered`);
    this.model = model;
    this.key = key;
    this.name = 'OC.KeyNotRegisteredException';
  }
}

export class RelationshipNotRegisteredException extends Exception {
  constructor(model, relationship) {
    super(`relationship '${model}#${relationship}' not registered`);
    this.model = model;
    this.relationship = relationship;
    this.name = 'OC.RelationshipNotRegisteredException';
  }
}

export class ClientError extends Exception {
  constructor(description) {
    super(description);
    this.name = 'OC.ClientError';
  }
}

export class ServerError extends Exception {
  constructor(description) {
    super(description);
    this.name = 'OC.ServerError';
  }
}

export class NetworkError extends Exception {
  constructor(description) {
    super(description);
    this.name = 'OC.NetworkError';
  }
}

class _RecordException extends Exception {
  constructor(description, type, id, relationship) {
    let message = `${description} - ${type}:${id}`;

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
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
export class RecordNotFoundException extends _RecordException {
  constructor(type, id) {
    super('Record not found', type, id);
    this.name = 'OC.RecordNotFoundException';
  }
}

/**
 Exception thrown when a relationship can not be found.

 @class RelationshipNotFoundException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
export class RelationshipNotFoundException extends _RecordException {
  constructor(type, id, relationship) {
    super('Relationship not found', type, id, relationship);
    this.name = 'OC.RelationshipNotFoundException';
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
    this.name = 'OC.RecordAlreadyExistsException';
  }
}
