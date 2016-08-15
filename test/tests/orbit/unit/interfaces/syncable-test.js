import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Syncable from 'orbit/interfaces/syncable';
import Transform from 'orbit/transform';

let source;

module('Orbit - Syncable', {
  setup() {
    source = new Source();
    Syncable.extend(source);
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
    Syncable.extend(pojo);
  },
  Error('Assertion failed: Syncable interface can only be applied to a Source'),
  'assertion raised');
});

test('it defines `sync`', function(assert) {
  assert.equal(typeof source.sync, 'function', 'sync function exists');
});

test('#transform accepts a Transform and calls internal method `_sync`', function(assert) {
  assert.expect(2);

  const addPlanet = Transform.from({ op: 'add', path: 'planet/1', value: 'data' });

  source._sync = function(transform) {
    assert.strictEqual(transform, addPlanet, 'argument to _sync is a Transform');
    return Orbit.Promise.resolve();
  };

  return source.sync(addPlanet)
    .then(() => {
      assert.ok(true, 'transformed promise resolved');
    });
});
