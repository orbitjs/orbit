/**
 * @module orbit-common
 */

/**
 * @class RecordNotFoundException
 * @namespace OC
 * @description

 Exception thrown when a record can not be found.

 * @param {String} type
 * @param record
 * @constructor
 */
var RecordNotFoundException = function(type, record) {
  this.type = type;
  this.record = record;
};

RecordNotFoundException.prototype = {
  constructor: RecordNotFoundException
};

/**
 * @class RecordAlreadyExistsException
 * @namespace OC
 * @description

 Exception thrown when a record already exists.

 * @param {String} type
 * @param record
 * @constructor
 */
var RecordAlreadyExistsException = function(type, record) {
  this.type = type;
  this.record = record;
};

RecordAlreadyExistsException.prototype = {
  constructor: RecordAlreadyExistsException
};

export { RecordNotFoundException, RecordAlreadyExistsException };