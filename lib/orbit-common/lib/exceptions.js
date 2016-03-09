import { Exception } from 'orbit/lib/exceptions';

/**
 @module orbit-common
 */

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

class _RecordException extends Exception {
  constructor(type, record, key) {
    let message = type + '/' + record;

    if (key) {
      message += '/' + key;
    }

    super(message);

    this.type = type;
    this.record = record;
    this.key = key;
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
 constructor(type, record) {
   super(type, record);
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
 constructor(type, record, key) {
   super(type, record, key);
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
 constructor(type, record) {
   super(type, record);
   this.name = 'OC.RecordAlreadyExistsException';
 }
}
