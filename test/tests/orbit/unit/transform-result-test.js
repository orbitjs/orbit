import Orbit from 'orbit/main';
import TransformResult from 'orbit/transform-result';
import Operation from 'orbit/operation';
import { equalOps } from 'tests/test-helper';

///////////////////////////////////////////////////////////////////////////////

module("Orbit - TransformResult", {
});

test("it exists", function() {
  var result = new TransformResult();
  ok(result);
});

test("it can be initialized with operations and inverseOperations", function() {
  expect(2);

  var addOp = new Operation({op: 'add', path: 'planet/1', value: {id: '1'}});
  var removeOp = new Operation({op: 'remove', path: 'planet/1'});

  var result = new TransformResult([addOp], [removeOp]);

  equalOps(result.operations, [addOp], 'operations match');
  equalOps(result.inverseOperations, [removeOp], 'inverse operations match');
});

test("#push can add operations and inverseOperations", function() {
  expect(2);

  var addOp = new Operation({op: 'add', path: 'planet/1', value: {id: '1'}});
  var removeOp = new Operation({op: 'remove', path: 'planet/1'});

  var result = new TransformResult();

  result.push([addOp], [removeOp]);

  equalOps(result.operations, [addOp], 'operations match');
  equalOps(result.inverseOperations, [removeOp], 'inverse operations match');
});

test("#concat can add the contents of another result", function() {
  expect(2);

  var addOp = new Operation({op: 'add', path: 'planet/1', value: {id: '1'}});
  var removeOp = new Operation({op: 'remove', path: 'planet/1'});

  var result1 = new TransformResult([addOp], [removeOp]);
  var result2 = new TransformResult();

  result2.concat(result1);

  equalOps(result2.operations, [addOp], 'operations match');
  equalOps(result2.inverseOperations, [removeOp], 'inverse operations match');
});

test("#isEmpty returns true if no operations have been added", function() {
  expect(2);

  var result = new TransformResult();

  equal(result.isEmpty(), true);

  result.push([
    {op: 'add', path: 'planet/2', value: {id: '2'}}
  ]);

  equal(result.isEmpty(), false);
});
