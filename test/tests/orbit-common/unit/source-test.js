import Source from 'orbit-common/source';
import Schema from 'orbit-common/schema';

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

  test('it should require a schema to be passed in', function(assert) {
    assert.throws(
      () => new Source(),
      'Assertion failed: Source\'s `schema` must be specified in `options.schema` constructor argument'
    );
  });

  test('it is Transformable', function(assert) {
    assert.ok(source._transformable, 'Transformable mixin has been applied');
  });
});
