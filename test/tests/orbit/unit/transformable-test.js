import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';

let source;

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Transformable', {
  setup() {
    source = new Source();
    Transformable.extend(source);
  },

  teardown() {
    source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it defines `transformed`', function(assert) {
  assert.equal(typeof source.transformed, 'function', 'transformed exists');
});

test('it should require the definition of _transform', function(assert) {
  assert.throws(source._transform, 'presence of _transform should be verified');
});

test('#transform should convert non-Transforms into Transforms', function(assert) {
  assert.expect(2);

  source._transform = function(transform) {
    assert.ok(transform instanceof Transform, 'argument to _transform is a Transform');
    return Orbit.Promise.resolve([transform]);
  };

  return source.transform({ op: 'add', path: 'planet/1', value: 'data' })
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});
