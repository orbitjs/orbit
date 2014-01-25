/**
 * Exception thrown when a record can not be found.
 *
 * @class RecordNotFoundException
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
 * Exception thrown when a record already exists.
 *
 * @class RecordAlreadyExistsException
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