import Source from 'orbit-common/source';
import Schema from 'orbit-common/schema';
import OrbitSource from 'orbit/source';

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
  let source;

  hooks.beforeEach(function() {
    schema = new Schema(schemaDefinition);
    source = new Source({ schema });
  });

  test('it exists', function(assert) {
    assert.ok(source);
  });

  test('it extends Orbit.Source', function(assert) {
    assert.ok(source instanceof OrbitSource);
  });

  test('it should require a schema to be passed in', function(assert) {
    assert.throws(
      () => {
        source = new Source();
      },
      Error('Assertion failed: Source\'s `schema` must be specified in `options.schema` constructor argument')
    );
  });
});
