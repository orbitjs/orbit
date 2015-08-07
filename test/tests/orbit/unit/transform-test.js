import Orbit from 'orbit/main';
import Transform from 'orbit/transform';
import Operation from 'orbit/operation';
import { equalOps } from 'tests/test-helper';

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Transform", {
});

test("it exists", function() {
  var transform = new Transform();
  ok(transform);
});

test("it normalizes its operations", function() {
  expect(3);

  var transform = new Transform([
    {op: 'add', path: 'planet/1', value: {id: '1'}}
  ]);

  transform.push([
    {op: 'add', path: 'planet/2', value: {id: '2'}}
  ]);

  equal(transform.operations.length, 2);
  ok(transform.operations[0] instanceof Operation);
  ok(transform.operations[1] instanceof Operation);
});

test("#isEmpty returns true if no operations have been added", function() {
  expect(2);

  var transform = new Transform();

  equal(transform.isEmpty(), true);

  transform.push([
    {op: 'add', path: 'planet/2', value: {id: '2'}}
  ]);

  equal(transform.isEmpty(), false);
});

test("it is assigned an `id`", function() {
  var transform = new Transform();
  ok(transform.id, 'transform has an id');
});

test("can track ancestors in a log", function() {
  expect(3);

  var grandfather = new Transform();
  var father = new Transform([], {parent: grandfather});
  var son = new Transform([], {parent: father});

  deepEqual(grandfather.log, [], "grandfather's log is correct");
  deepEqual(father.log, [grandfather.id], "father's log is correct");
  deepEqual(son.log, [grandfather.id, father.id], "son's log is correct");
});

test("can spawn descendents amd determine ancestry", function() {
  expect(17);

  var grandfather = new Transform();
  var father = grandfather.spawn();
  var uncle = grandfather.spawn();
  var son = father.spawn();
  var nephew = uncle.spawn();

  var stranger = new Transform();
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

test("can be created from with all attributes specified as options", function() {
  var operations = [];
  var options = {id: 'abc123', log: ['abc1','abc2','abc3']};

  var transform = new Transform(operations, options);

  strictEqual(transform.id, options.id, 'id was populated');
  equalOps(transform.operations, operations, 'operations was populated');
  strictEqual(transform.log, options.log, 'log was populated');
});
