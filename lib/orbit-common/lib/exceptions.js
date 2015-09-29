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
var OperationNotAllowed = Exception.extend({
  name: 'OC.OperationNotAllowed',
  init: function(message, operation) {
    this.operation = operation;
    this._super(message);
  }
});

var ModelNotRegisteredException = Exception.extend({
  name: 'OC.ModelNotRegisteredException',
  init: function(model) {
    this.model = model;
    this._super('model "' + model + '" not found');
  },
});

var KeyNotRegisteredException = Exception.extend({
  name: 'OC.KeyNotRegisteredException',
  init: function(model, key) {
    this.model = model;
    this.key = key;
    this._super('key "' + model + "#" + key + '" not registered');
  },
});

var RelationshipNotRegisteredException = Exception.extend({
  name: 'OC.RelationshipNotRegisteredException',
  init: function(model, relationship) {
    this.model = model;
    this.relationship = relationship;
    this._super('relationship "' + model + "#" + relationship + '" not registered');
  },
});

var _RecordException = Exception.extend({
  init: function(type, record, key) {
    this.type = type;
    this.record = record;
    var message = type + '/' + record;

    if (key) {
      this.key = key;
      message += '/' + key;
    }
    this._super(message);
  },
});

/**
 Exception thrown when a record can not be found.

 @class RecordNotFoundException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
var RecordNotFoundException = _RecordException.extend({
  name: 'OC.RecordNotFoundException',
});

/**
 Exception thrown when a relationship can not be found.

 @class RelationshipNotFoundException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
var RelationshipNotFoundException = _RecordException.extend({
  name: 'OC.RelationshipNotFoundException',
});

/**
 Exception thrown when a record already exists.

 @class RecordAlreadyExistsException
 @namespace OC
 @param {String} type
 @param {Object} record
 @constructor
 */
var RecordAlreadyExistsException = _RecordException.extend({
  name: 'OC.RecordAlreadyExistsException',
});

export { OperationNotAllowed, RecordNotFoundException, RelationshipNotFoundException, RecordAlreadyExistsException, ModelNotRegisteredException, KeyNotRegisteredException, RelationshipNotRegisteredException };
