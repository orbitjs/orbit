import Orbit from 'orbit/main';
import Operation from 'orbit/operation';
import { Promise } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Operation", {
  setup: function() {
    Orbit.Promise = Promise;
  },

  teardown: function() {
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  var operation = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  ok(operation);
});

test("can be serialized", function() {
  var operation = new Operation({op: 'add', path: ['planet', '1'], value: 'earth'});
  deepEqual(operation.serialize(), {op: 'add', path: 'planet/1', value: 'earth'}, 'serialization is correct');
});

test("can be created from with all attributes specified as options", function() {
  var operationDetails = {op: 'add', path: ['planet','1'], value: 'earth'};

  var operation = new Operation(operationDetails);

  equal(operation.id, operationDetails.id, 'id was populated');
  equal(operation.op, operationDetails.op, 'op was populated');
  equal(operation.path, operationDetails.path, 'path was populated');
  equal(operation.value, operationDetails.value, 'value was populated');
});

