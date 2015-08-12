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

test("can be created from with all attributes specified as options", function() {
  var operations = [];
  var options = {id: 'abc123'};

  var transform = new Transform(operations, options);

  strictEqual(transform.id, options.id, 'id was populated');
  equalOps(transform.operations, operations, 'operations was populated');
});
