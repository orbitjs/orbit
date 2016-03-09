import Orbit from 'orbit/main';
import Transform from 'orbit/transform';
import { TransformBuilderNotRegisteredException } from 'orbit/lib/exceptions';

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transform', {
});

test('it exists', function(assert) {
  let transform = new Transform();
  assert.ok(transform);
});

test('#isEmpty returns true if no operations have been added', function(assert) {
  assert.expect(2);

  let emptyTransform = new Transform();
  assert.equal(emptyTransform.isEmpty(), true);

  let fullTransform = new Transform([
    { op: 'addRecord', record: { type: 'planet', id: '2' } }
  ]);
  assert.equal(fullTransform.isEmpty(), false);
});

test('it is assigned an `id`', function(assert) {
  let transform = new Transform();
  assert.ok(transform.id, 'transform has an id');
});

test('can be created from with all attributes specified as options', function(assert) {
  let operations = [];
  let options = { id: 'abc123' };

  let transform = new Transform(operations, options);

  assert.strictEqual(transform.id, options.id, 'id was populated');
  assert.deepEqual(transform.operations, operations, 'operations was populated');
});

test('.from will return a transform passed into it', function(assert) {
  let transform = new Transform();
  assert.strictEqual(Transform.from(transform), transform);
});

test('.from will create a transform from operations passed into it', function(assert) {
  let transform = Transform.from([{ op: 'addRecord' }, { op: 'removeRecord' }]);
  assert.ok(transform instanceof Transform);
});

test('.from should pass any transform functions to transformBuilder, if one is passed', function(assert) {
  assert.expect(5);

  const planet = { type: 'planet', id: '1' };
  const moon = { type: 'moon', id: '1' };

  const transformBuilder = {
    build(b) {
      let operations = [];

      let context = {
        addRecord(record) {
          assert.ok(record, 'transformBuilder.addRecord called');
          operations.push({ op: 'addRecord', record: record });
        }
      };

      assert.ok(b, 'transformBuilder called');

      b(context);

      return new Transform(operations);
    }
  };

  let transform = Transform.from(
    (b) => {
      b.addRecord(planet);
      b.addRecord(moon);
    },
    transformBuilder
  );

  assert.ok(transform instanceof Transform, 'built a Transform');
  assert.equal(transform.operations.length, 2, 'transform includes two operations');
});

test('.from should throw an exception if a function is passed but a transformBuilder is not', function(assert) {
  assert.throws(
    () => {
      Transform.from((b) => {});
    },
    TransformBuilderNotRegisteredException
  );
});
