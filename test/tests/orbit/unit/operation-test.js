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

test("it can be created with no attributes", function() {
  var operation = new Operation();
  ok(operation.id, 'operation has an id');
});

test("can track ancestors in a log", function() {
  expect(3);

  var grandfather = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  var father = new Operation({op: 'replace', path: '/planet/1', value: 'venus', parent: grandfather});
  var son = new Operation({op: 'replace', path: '/planet/1', value: 'mercury', parent: father});

  deepEqual(grandfather.log, [], "grandfather's log is correct");
  deepEqual(father.log, [grandfather.id], "father's log is correct");
  deepEqual(son.log, [grandfather.id, father.id], "son's log is correct");
});

test("can spawn descendents amd determine ancestry", function() {
  expect(17);

  var grandfather = new Operation({op: 'add', path: '/planet/1', value: 'earth'});
  var father = grandfather.spawn({op: 'replace', path: '/planet/1', value: 'venus'});
  var uncle = grandfather.spawn({op: 'replace', path: '/planet/1', value: 'mars'});
  var son = father.spawn({op: 'replace', path: '/planet/1', value: 'mercury'});
  var nephew = uncle.spawn({op: 'replace', path: '/planet/1', value: 'saturn'});

  var stranger = new Operation();
  var strangersSon = stranger.spawn({});

  equal(grandfather.descendedFrom(father), false, "grandfather didn't come from father");
  equal(father.descendedFrom(grandfather), true, "father came from grandfather");
  equal(son.descendedFrom(grandfather), true, "son came from grandfather");
  equal(son.descendedFrom(father), true, "son came from father");
  equal(son.descendedFrom(uncle), false, "son not descended from uncle");
  equal(nephew.descendedFrom(uncle), true, "nephew descended from uncle");

  equal(strangersSon.descendedFrom(stranger), true, "stranger's son descended from stranger");

  equal(grandfather.relatedTo(father), true, "grandfather related to father");
  equal(father.relatedTo(grandfather), true, "father related to grandfather");
  equal(son.relatedTo(grandfather), true, "son related to grandfather");
  equal(son.relatedTo(father), true, "son related to father");
  equal(son.relatedTo(uncle), true, "son related to uncle");
  equal(nephew.relatedTo(uncle), true, "nephew related to uncle");

  equal(strangersSon.relatedTo(stranger), true, "stranger's son related to stranger");
  equal(son.relatedTo(stranger), false, "son not related to stranger");

  equal(grandfather.relatedTo(grandfather), true, "grandfather related to himself");
  equal(son.relatedTo(son), true, "son related to himself");
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

