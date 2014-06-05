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
var OperationNotAllowed = function(description) {
  this.description = description;
};

OperationNotAllowed.prototype = {
  constructor: OperationNotAllowed
};

/**
 Exception thrown when a record can not be found.

 @class RecordNotFoundException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
var RecordNotFoundException = function(type, record) {
  this.type = type;
  this.record = record;
};

RecordNotFoundException.prototype = {
  constructor: RecordNotFoundException
};

/**
 Exception thrown when a record already exists.

 @class RecordAlreadyExistsException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
var RecordAlreadyExistsException = function(type, record) {
  this.type = type;
  this.record = record;
};

RecordAlreadyExistsException.prototype = {
  constructor: RecordAlreadyExistsException
};

export { OperationNotAllowed, RecordNotFoundException, RecordAlreadyExistsException };