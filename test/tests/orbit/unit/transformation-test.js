import Orbit from 'orbit/main';
import Transformation from 'orbit/transformation';
import Operation from 'orbit/operation';
import { equalOps } from 'tests/test-helper';

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Transformation", {
});

test("it exists", function() {
  var transformation = new Transformation();
  ok(transformation);
});

test("it normalizes its operations", function() {
  expect(3);

  var transformation = new Transformation([
    {op: 'add', path: 'planet/1', value: {id: '1'}}
  ]);

  transformation.push([
    {op: 'add', path: 'planet/2', value: {id: '2'}}
  ]);

  equal(transformation.operations.length, 2);
  ok(transformation.operations[0] instanceof Operation);
  ok(transformation.operations[1] instanceof Operation);
});

test("#isEmpty returns true if no operations have been added", function() {
  expect(2);

  var transformation = new Transformation();

  equal(transformation.isEmpty(), true);

  transformation.push([
    {op: 'add', path: 'planet/2', value: {id: '2'}}
  ]);

  equal(transformation.isEmpty(), false);
});

test("it is assigned an `id`", function() {
  var transformation = new Transformation();
  ok(transformation.id, 'transformation has an id');
});

test("can track ancestors in a log", function() {
  expect(3);

  var grandfather = new Transformation();
  var father = new Transformation([], null, {parent: grandfather});
  var son = new Transformation([], null, {parent: father});

  deepEqual(grandfather.log, [], "grandfather's log is correct");
  deepEqual(father.log, [grandfather.id], "father's log is correct");
  deepEqual(son.log, [grandfather.id, father.id], "son's log is correct");
});

test("can spawn descendents amd determine ancestry", function() {
  expect(17);

  var grandfather = new Transformation();
  var father = grandfather.spawn();
  var uncle = grandfather.spawn();
  var son = father.spawn();
  var nephew = uncle.spawn();

  var stranger = new Transformation();
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

  var transformation = new Transformation(operations, null, options);

  strictEqual(transformation.id, options.id, 'id was populated');
  equalOps(transformation.operations, operations, 'operations was populated');
  strictEqual(transformation.log, options.log, 'log was populated');
});
