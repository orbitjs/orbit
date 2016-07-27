import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Pickable from 'orbit/interfaces/pickable';
import Transform from 'orbit/transform';

let source;

module('Orbit - Pickable', {
  setup() {
    source = new Source();
    Pickable.extend(source);
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
    Pickable.extend(pojo);
  },
  Error('Assertion failed: Pickable interface can only be applied to a Source'),
  'assertion raised');
});

test('it defines `pick`', function(assert) {
  assert.equal(typeof source.pick, 'function', 'pick function exists');
});

test('#transform accepts a Transform and calls internal method `_pick`', function(assert) {
  assert.expect(2);

  const addPlanet = Transform.from({ op: 'add', path: 'planet/1', value: 'data' });

  source._pick = function(transform) {
    assert.strictEqual(transform, addPlanet, 'argument to _pick is a Transform');
    return Orbit.Promise.resolve();
  };

  return source.pick(addPlanet)
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});
