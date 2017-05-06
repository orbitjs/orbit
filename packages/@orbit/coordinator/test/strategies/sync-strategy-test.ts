import Coordinator, {
  SyncStrategy
} from '../../src/index';
import Orbit, {
  Source,
  Transform,
  addRecord,
  syncable, isSyncable
} from '@orbit/data';
import '../test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('SyncStrategy', function(hooks) {
  const tA = new Transform([addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = new Transform([addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = new Transform([addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');
  const tD = new Transform([addRecord({ type: 'planet', id: 'd', attributes: { name: 'd' } })], null, 'd');

  let strategy, coordinator, s1, s2;

  hooks.beforeEach(function() {
    @syncable
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
  });

  test('can be instantiated', function(assert) {
    strategy = new SyncStrategy({ source: 's1', target: 's2'});

    assert.ok(strategy);
    assert.strictEqual(strategy.blocking, false, 'blocking is false by default');
    assert.equal(strategy.name, 'sync-s1-s2', 'name is based on source names by default');
  });

  test('assigns source and target when activated', function(assert) {
    strategy = new SyncStrategy({ source: 's1', target: 's2'});

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    return coordinator.activate()
      .then(() => {
        assert.strictEqual(strategy.source, s1, 'source is set');
        assert.strictEqual(strategy.target, s2, 'target is set');
      });
  });

  test('installs listeners on activate and removes them on deactivate', function(assert) {
    assert.expect(6);

    strategy = new SyncStrategy({ source: 's1', target: 's2' });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    assert.equal(s1.listeners('transform').length, 0, 'no listeners installed yet');
    assert.equal(s2.listeners('transform').length, 0, 'no listeners installed yet');

    return coordinator.activate()
      .then(() => {
        assert.equal(s1.listeners('transform').length, 1, 'listeners installed');
        assert.equal(s2.listeners('transform').length, 0, 'no listeners installed on target');

        return coordinator.deactivate();
      })
      .then(() => {
        assert.equal(s1.listeners('transform').length, 0, 'listeners removed');
        assert.equal(s2.listeners('transform').length, 0, 'still no listeners on target');
      });
  });

  test('observes source `transform` event and invokes `sync` on target', function(assert) {
    const done = assert.async();
    assert.expect(2);

    strategy = new SyncStrategy({ source: 's1', target: 's2' });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s2._sync = function(transform) {
      assert.strictEqual(transform, tA, 'argument to _sync is expected Transform');
      assert.strictEqual(this, s2, 'context is that of the target');
      done();
    };

    coordinator.activate()
      .then(() => s1._transformed([tA]));
  });

  test('can apply a `filter` function', function(assert) {
    const done = assert.async();
    assert.expect(4);

    strategy = new SyncStrategy({
      source: 's1',
      target: 's2',
      filter(transform: Transform) {
        assert.strictEqual(this, strategy, 'context is the strategy');
        return (transform === tB);
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s2._sync = function(transform) {
      assert.strictEqual(transform, tB, 'argument to _sync is expected Transform');
      assert.strictEqual(this, s2, 'context is that of the target');
      done();
    };

    coordinator.activate()
      .then(() => s1._transformed([tA, tB]));
  });

  // TODO - test blocking option
});
