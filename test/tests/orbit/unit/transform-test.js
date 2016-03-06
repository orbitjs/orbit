import Orbit from 'orbit/main';
import Transform from 'orbit/transform';

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transform', {
});

test('it exists', function() {
  var transform = new Transform();
  ok(transform);
});

test('#isEmpty returns true if no operations have been added', function() {
  expect(2);

  var emptyTransform = new Transform();
  equal(emptyTransform.isEmpty(), true);

  var fullTransform = new Transform([
    { op: 'addRecord', record: { type: 'planet', id: '2' } }
  ]);
  equal(fullTransform.isEmpty(), false);
});

test('it is assigned an `id`', function() {
  var transform = new Transform();
  ok(transform.id, 'transform has an id');
});

test('can be created from with all attributes specified as options', function() {
  var operations = [];
  var options = { id: 'abc123' };

  var transform = new Transform(operations, options);

  strictEqual(transform.id, options.id, 'id was populated');
  deepEqual(transform.operations, operations, 'operations was populated');
});
