import Source from 'orbit-common/source';
import Schema from 'orbit-common/schema';
import Transform from 'orbit/transform';

const schemaDefinition = {
  models: {
    star: {
      attributes: {
        name: { type: 'string' }
      }
    }
  }
};

let schema;

module('OC - Source', function(hooks) {
  const transformA = Transform.from({ op: 'addRecord', value: {} });
  const transformB = Transform.from({ op: 'addRecord', value: {} });
  const transformC = Transform.from({ op: 'addRecord', value: {} });

  let source;

  hooks.beforeEach(function() {
    schema = new Schema(schemaDefinition);
    source = new Source({ schema });
  });

  test('it exists', function(assert) {
    assert.ok(source);
  });

  test('it should require a schema to be passed in', function(assert) {
    assert.throws(
      () => new Source(),
      'Assertion failed: Source\'s `schema` must be specified in `options.schema` constructor argument'
    );
  });

  test('it is Transformable', function(assert) {
    assert.ok(source._transformable, 'Transformable mixin has been applied');
  });

  test('it can truncate its transform history', function(assert) {
    return source.transformed([transformA, transformB, transformC])
      .then(() => {
        assert.deepEqual(
          source.transformLog.entries(),
          [transformA, transformB, transformC].map(t => t.id),
          'transform log is correct');

        source.truncateHistory(transformB.id);

        assert.deepEqual(
          source.transformLog.entries(),
          [transformB, transformC].map(t => t.id),
          'transform log has been truncated');
      });
  });

  test('it can clear its transform history', function(assert) {
    return source.transformed([transformA, transformB, transformC])
      .then(() => {
        assert.deepEqual(
          source.transformLog.entries(),
          [transformA, transformB, transformC].map(t => t.id),
          'transform log is correct');

        source.clearHistory();

        assert.deepEqual(
          source.transformLog.entries(),
          [],
          'transform log has been cleared');
      });
  });
});
