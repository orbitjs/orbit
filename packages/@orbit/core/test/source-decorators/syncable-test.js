import Orbit from '../../src';
import { Source } from '../../src/source';
import syncable, { isSyncable } from '../../src/source-decorators/syncable';
import Transform from '../../src/transform';

const { module, test } = QUnit;

module('@syncable', function(hooks) {
  let source;

  hooks.beforeEach(function() {
    @syncable
    class MySource extends Source {
      constructor() { super(); }
    }

    source = new MySource({ name: 'src1' });
  });

  hooks.afterEach(function() {
    source = null;
  });

  test('isSyncable - tests for the application of the @syncable decorator', function(assert) {
    assert.ok(isSyncable(source));
  });

  test('it should be applied to a Source', function(assert) {
    assert.throws(function() {
      @syncable
      class Vanilla {}
    },
    Error('Assertion failed: Syncable interface can only be applied to a Source'),
    'assertion raised');
  });

  test('#sync accepts a Transform and calls internal method `_sync`', function(assert) {
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
});
