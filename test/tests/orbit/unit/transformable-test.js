import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Transformable from 'orbit/transformable';
import Transform from 'orbit/transform';

let source;

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

test('it should be applied to a Source', function(assert) {
  assert.throws(function() {
    let pojo = {};
    Transformable.extend(pojo);
  },
  Error('Assertion failed: Transformable interface can only be applied to a Source'),
  'assertion raised');
});

test('it defines `transform`', function(assert) {
  assert.equal(typeof source.transform, 'function', 'transform function exists');
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
