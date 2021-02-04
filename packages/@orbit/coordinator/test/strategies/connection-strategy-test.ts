import { Coordinator } from '../../src/coordinator';
import { ConnectionStrategy } from '../../src/strategies/connection-strategy';
import {
  Source,
  Transform,
  updatable,
  buildTransform,
  FullResponse
} from '@orbit/data';
import {
  RecordTransformBuilder,
  RecordData,
  RecordResponse,
  RecordOperation
} from '../support/record-data';

const { module, test } = QUnit;

module('ConnectionStrategy', function (hooks) {
  const t = new RecordTransformBuilder();
  const tA = buildTransform(
    [t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })],
    undefined,
    'a'
  ) as Transform<RecordOperation>;
  const tB = buildTransform(
    [t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })],
    undefined,
    'b'
  ) as Transform<RecordOperation>;

  let strategy: ConnectionStrategy;
  let coordinator: Coordinator;
  let s1: any;
  let s2: any;

  hooks.beforeEach(function () {
    @updatable
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
  });

  test('can be instantiated', function (assert) {
    strategy = new ConnectionStrategy({
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
    strategy = new ConnectionStrategy({
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

    strategy = new ConnectionStrategy({
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

    strategy = new ConnectionStrategy({
      source: 's1',
      target: 's2',
      on: 'foo',
      action: 'foo'
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s2.foo = async function (
      transform: Transform<RecordOperation>,
      hints: any
    ): Promise<void> {
      assert.deepEqual(
        transform,
        tA,
        '1st argument to s2.foo is expected Transform'
      );
      assert.deepEqual(
        hints,
        { data: { foo: 'bar' } },
        '2nd argument to s2.foo is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
    };

    await coordinator.activate();
    await s1.emit('foo', tA, { data: { foo: 'bar' } });
  });

  test('can apply a `filter` function', async function (assert) {
    assert.expect(5);

    strategy = new ConnectionStrategy({
      source: 's1',
      target: 's2',
      on: 'foo',
      action: 'foo',
      filter(transform): boolean {
        assert.ok(
          this instanceof ConnectionStrategy,
          'context is the strategy'
        );
        return transform === tB;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s2.foo = async function (
      transform: Transform<RecordOperation>,
      hints: any
    ): Promise<void> {
      assert.deepEqual(
        transform,
        tB,
        '1st argument to s2.foo is expected Transform'
      );
      assert.deepEqual(
        hints,
        { data: { foo: 'b' } },
        '2nd argument to s2.foo is expected Transform'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
    };

    await coordinator.activate();
    await s1.emit('foo', tA, { data: { foo: 'a' } });
    await s1.emit('foo', tB, { data: { foo: 'b' } });
  });

  // TODO - test blocking option
});
