import Coordinator, {
  ConnectionStrategy
} from '../../src/index';
import {
  Source,
  Transform,
  TransformBuilder,
  pushable,
  updatable,
  buildTransform
} from '@orbit/data';

const { module, test } = QUnit;

module('ConnectionStrategy', function(hooks) {
  const t = new TransformBuilder();
  const tA = buildTransform([t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = buildTransform([t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = buildTransform([t.addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');
  const tD = buildTransform([t.addRecord({ type: 'planet', id: 'd', attributes: { name: 'd' } })], null, 'd');

  let strategy, coordinator, s1, s2;

  hooks.beforeEach(function() {
    @pushable
    @updatable
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
  });

  test('can be instantiated', function(assert) {
    strategy = new ConnectionStrategy({ source: 's1', target: 's2', on: 'update', action: 'push' });

    assert.ok(strategy);
    assert.strictEqual(strategy.blocking, false, 'blocking is false by default');
    assert.equal(strategy.name, 's1:update -> s2:push', 'name is based on source names by default');
  });

  test('assigns source and target when activated', async function(assert) {
    strategy = new ConnectionStrategy({ source: 's1', target: 's2', on: 'update', action: 'push'});

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    await coordinator.activate();
    assert.strictEqual(strategy.source, s1, 'source is set');
    assert.strictEqual(strategy.target, s2, 'target is set');
  });

  test('installs listeners on activate and removes them on deactivate', async function(assert) {
    assert.expect(6);

    strategy = new ConnectionStrategy({ source: 's1', target: 's2', on: 'update', action: 'push'});

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    assert.equal(s1.listeners('update').length, 0, 'no listeners installed yet');
    assert.equal(s2.listeners('update').length, 0, 'no listeners installed yet');

    await coordinator.activate();

    assert.equal(s1.listeners('update').length, 1, 'listeners installed');
    assert.equal(s2.listeners('update').length, 0, 'no listeners installed on target');

    await coordinator.deactivate();

    assert.equal(s1.listeners('update').length, 0, 'listeners removed');
    assert.equal(s2.listeners('update').length, 0, 'still no listeners on target');
  });

  test('observes source `on` event and invokes `action` on target', async function(assert) {
    assert.expect(3);

    strategy = new ConnectionStrategy({ source: 's1', target: 's2', on: 'update', action: 'push'});

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function(transform) {
      assert.strictEqual(transform, tA, 'argument to _update is expected Transform');
    };

    s2._push = async function(transform) {
      assert.strictEqual(transform, tA, 'argument to _push is expected Transform');
      assert.strictEqual(this, s2, 'context is that of the target');
      return [];
    };

    await coordinator.activate()
    await s1.update(tA);
  });

  test('can apply a `filter` function', async function(assert) {
    assert.expect(4);

    strategy = new ConnectionStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push',
      filter(transform: Transform) {
        assert.strictEqual(this, strategy, 'context is the strategy');
        return (transform === tB);
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function(transform) {
    };

    s2._push = async function(transform) {
      assert.strictEqual(transform, tB, 'argument to _push is expected Transform');
      assert.strictEqual(this, s2, 'context is that of the target');
      return [];
    };

    await coordinator.activate();
    await s1.update(tA);
    await s1.update(tB);
  });

  // TODO - test blocking option
});
