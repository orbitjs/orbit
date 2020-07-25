import { Coordinator } from '../../src/coordinator';
import { RequestStrategy } from '../../src/strategies/request-strategy';
import {
  Source,
  Transform,
  TransformBuilder,
  pushable,
  updatable,
  buildTransform
} from '@orbit/data';

const { module, test } = QUnit;

module('RequestStrategy', function (hooks) {
  const t = new TransformBuilder();
  const tA = buildTransform(
    [t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })],
    null,
    'a'
  );
  const tB = buildTransform(
    [t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })],
    null,
    'b'
  );

  let strategy: RequestStrategy;
  let coordinator: Coordinator;
  let s1: any;
  let s2: any;

  hooks.beforeEach(function () {
    @pushable
    @updatable
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
  });

  test('can be instantiated', function (assert) {
    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push'
    });

    assert.ok(strategy);
    assert.strictEqual(
      strategy.blocking,
      false,
      'blocking is false by default'
    );
    assert.equal(
      strategy.name,
      's1:update -> s2:push',
      'name is based on source names by default'
    );
  });

  test('assigns source and target when activated', async function (assert) {
    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push'
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    await coordinator.activate();
    assert.strictEqual(strategy.source, s1, 'source is set');
    assert.strictEqual(strategy.target, s2, 'target is set');
  });

  test('installs listeners on activate and removes them on deactivate', async function (assert) {
    assert.expect(6);

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push'
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    assert.equal(
      s1.listeners('update').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s2.listeners('update').length,
      0,
      'no listeners installed yet'
    );

    await coordinator.activate();

    assert.equal(s1.listeners('update').length, 1, 'listeners installed');
    assert.equal(
      s2.listeners('update').length,
      0,
      'no listeners installed on target'
    );

    await coordinator.deactivate();

    assert.equal(s1.listeners('update').length, 0, 'listeners removed');
    assert.equal(
      s2.listeners('update').length,
      0,
      'still no listeners on target'
    );
  });

  test('observes source `on` event and invokes `action` on target', async function (assert) {
    assert.expect(3);

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push'
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (transform: Transform): Promise<any> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _update is expected Transform'
      );
    };

    s2._push = async function (transform: Transform): Promise<Transform[]> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _push is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return [];
    };

    await coordinator.activate();
    await s1.update(tA);
  });

  test('with `passHints: true` and `blocking: true`, will pass `hints` that result from applying the target action', async function (assert) {
    assert.expect(5);

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'beforeUpdate',
      action: 'push',
      blocking: true,
      passHints: true
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (
      transform: Transform,
      hints: any
    ): Promise<any> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _update is expected Transform'
      );
      assert.deepEqual(hints.data, [tA], 'result is passed as a hint');
    };

    s2._push = async function (
      transform: Transform,
      hints: any
    ): Promise<Transform[]> {
      assert.deepEqual(hints, {}, 'no hints are passed to `push`');
      assert.strictEqual(
        transform,
        tA,
        'argument to _push is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return [tA];
    };

    await coordinator.activate();
    await s1.update(tA);
  });

  test('can apply a `filter` function', async function (assert) {
    assert.expect(4);

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push',
      filter(transform: Transform): boolean {
        assert.strictEqual(this, strategy, 'context is the strategy');
        return transform === tB;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (): Promise<any> {};

    s2._push = async function (transform: Transform): Promise<Transform[]> {
      assert.strictEqual(
        transform,
        tB,
        'argument to _push is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return [];
    };

    await coordinator.activate();
    await s1.update(tA);
    await s1.update(tB);
  });

  test('if `blocking` is a function it gets invoked with the query', async function (assert) {
    assert.expect(5);

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'push',
      blocking(transform: Transform): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          'it is bound to the strategy'
        );
        assert.strictEqual(
          transform,
          tA,
          'argument to _update is expected Transform'
        );
        return false;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (transform: Transform): Promise<any> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _update is expected Transform'
      );
    };

    s2._push = async function (transform: Transform): Promise<Transform[]> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _push is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return [];
    };

    await coordinator.activate();
    await s1.update(tA);
  });

  test('for events that are invoked with more than one arg, pass all args to any custom handler functions', async function (assert) {
    assert.expect(9);

    strategy = new RequestStrategy({
      source: 's1',
      on: 'updateFail',
      async action(transform: Transform, e: Error): Promise<void> {
        assert.ok(
          this instanceof RequestStrategy,
          '`action` is bound to the strategy'
        );
        assert.strictEqual(transform, tA, 'transform is passed to `action`');
        assert.equal(e.message, ':(', 'error is passed to `action`');
      },
      blocking(transform: Transform, e: Error): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          '`blocking` is bound to the strategy'
        );
        assert.strictEqual(transform, tA, 'transform is passed to `blocking`');
        assert.equal(e.message, ':(', 'error is passed to `blocking`');
        return false;
      },
      filter(transform: Transform, e: Error): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          '`filter` is bound to the strategy'
        );
        assert.strictEqual(transform, tA, 'transform is passed to `filter`');
        assert.equal(e.message, ':(', 'error is passed to `filter`');
        return true;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    await coordinator.activate();

    s1.emit('updateFail', tA, new Error(':('));
  });

  // TODO - test blocking option
});
