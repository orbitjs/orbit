import { buildTransform, TransformBuilder } from '../src/index';
import './test-helper';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('buildTransform', function() {
  test('can instantiate a transform from an empty array of operations', function(assert) {
    let transform = buildTransform([]);
    assert.ok(transform);
  });

  test('can instantiate a transform that will be assigned an `id`', function(assert) {
    let transform = buildTransform([]);
    assert.ok(transform.id, 'transform has an id');
  });

  test('can instantiate a transform with operations, options, and an id', function(assert) {
    let operations = [{ op: 'addRecord' }];
    let options = { sources: { jsonapi: { include: 'comments' } } };
    let id = 'abc123';

    let transform = buildTransform(operations, options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.strictEqual(
      transform.operations,
      operations,
      'operations was populated'
    );
    assert.strictEqual(transform.options, options, 'options was populated');
  });

  test('will return a transform passed into it', function(assert) {
    let transform = buildTransform([]);
    assert.strictEqual(buildTransform(transform), transform);
  });

  test('will create a transform using a TransformBuilder if a function is passed into it', function(assert) {
    let tb = new TransformBuilder();
    let planet = { type: 'planet', id: 'earth' };
    let operation = {
      op: 'addRecord',
      record: planet
    };

    let query = buildTransform(t => t.addRecord(planet), null, null, tb);
    assert.deepEqual(query.operations, [operation], 'operations was populated');
  });
});
