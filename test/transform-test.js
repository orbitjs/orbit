import Transform from '../src/transform';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Transform', function() {
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
});
