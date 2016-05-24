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

export class TransformBuilderNotRegisteredException extends Exception {
  constructor(transformBuilder) {
    super(`TransformBuilder not registered: ${transformBuilder}`);
    this.transformBuilder = transformBuilder;
    this.name = 'Orbit.TransformBuilderNotRegisteredException';
  }
}

export class QueryBuilderNotRegisteredException extends Exception {
  constructor(queryBuilder) {
    super(`QueryBuilder not registered: ${queryBuilder}`);
    this.queryBuilder = queryBuilder;
    this.name = 'Orbit.QueryBuilderNotRegisteredException';
  }
}
