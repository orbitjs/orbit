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

test("it is assigned an `id`", function() {
  var operation = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  ok(operation.id, 'operation has an id');
});

test("can track ancestors in a log", function() {
  expect(7);

  var grandparent = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  var parent = new Operation({op: 'replace', path: '/planet/1', value: 'venus', parent: grandparent});
  var child = new Operation({op: 'replace', path: '/planet/1', value: 'mercury', parent: parent});

  deepEqual(grandparent.log, [], "grandparent's log is correct");
  deepEqual(parent.log, [grandparent.id], "parent's log is correct");
  deepEqual(child.log, [grandparent.id, parent.id], "child's log is correct");

  equal(grandparent.spawnedFrom(parent), false, "grandparent didn't come from parent");
  equal(parent.spawnedFrom(grandparent), true, "parent came from grandparent");
  equal(child.spawnedFrom(grandparent), true, "child came from grandparent");
  equal(child.spawnedFrom(parent), true, "child came from parent");
});

test("can spawn descendents", function() {
  expect(7);

  var grandparent = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  var parent = grandparent.spawn({op: 'replace', path: '/planet/1', value: 'venus', parent: grandparent});
  var child = parent.spawn({op: 'replace', path: '/planet/1', value: 'mercury', parent: parent});

  deepEqual(grandparent.log, [], "grandparent's log is correct");
  deepEqual(parent.log, [grandparent.id], "parent's log is correct");
  deepEqual(child.log, [grandparent.id, parent.id], "child's log is correct");

  equal(grandparent.spawnedFrom(parent), false, "grandparent didn't come from parent");
  equal(parent.spawnedFrom(grandparent), true, "parent came from grandparent");
  equal(child.spawnedFrom(grandparent), true, "child came from grandparent");
  equal(child.spawnedFrom(parent), true, "child came from parent");
});

test("can be serialized", function() {
  var operation = new Operation({op: 'add', path: ['planet', '1'], value: 'earth'});
  deepEqual(operation.serialize(), {op: 'add', path: 'planet/1', value: 'earth'}, 'serialization is correct');
});

test("can be created from with all attributes specified as options", function() {
  var operationDetails = {id: 'abc123', op: 'add', path: ['planet','1'], value: 'earth', log: ['abc1','abc2','abc3']};

  var operation = new Operation(operationDetails);

  equal(operation.id, operationDetails.id, 'id was populated');
  equal(operation.op, operationDetails.op, 'op was populated');
  equal(operation.path, operationDetails.path, 'path was populated');
  equal(operation.value, operationDetails.value, 'value was populated');
  equal(operation.log, operationDetails.log, 'log was populated');

});

