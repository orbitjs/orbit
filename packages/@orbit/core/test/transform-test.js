import Transform from '../src/transform';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Transform', function() {
  test('it exists', function(assert) {
    let transform = new Transform();
    assert.ok(transform);
  });

  test('it is assigned an `id`', function(assert) {
    let transform = new Transform();
    assert.ok(transform.id, 'transform has an id');
  });

  test('can be created from with operations, options, and an id', function(assert) {
    let operations = [{ op: 'addRecord' }];
    let options = { sources: { jsonapi: { include: 'comments' } }}
    let id = 'abc123';

    let transform = new Transform(operations, options, id);

    assert.strictEqual(transform.id, id, 'id was populated');
    assert.deepEqual(transform.operations, operations, 'operations was populated');
    assert.deepEqual(transform.options, options, 'options was populated');
  });

  test('.from will return a transform passed into it', function(assert) {
    let transform = new Transform();
    assert.strictEqual(Transform.from(transform), transform);
  });

  test('.from will create a transform from operations passed into it', function(assert) {
    let transform = Transform.from([{ op: 'addRecord' }, { op: 'removeRecord' }]);
    assert.ok(transform instanceof Transform);
  });
});
