import { Coordinator } from '../../src/coordinator';
import { RequestStrategy } from '../../src/strategies/request-strategy';
import {
  Source,
  Transform,
  pushable,
  updatable,
  buildTransform,
  FullResponse,
  ResponseHints,
  Operation
} from '@orbit/data';
import {
  RecordData,
  RecordOperation,
  RecordResponse,
  RecordTransformBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('RequestStrategy', function (hooks) {
  const t = new RecordTransformBuilder();
  const tA = buildTransform<RecordOperation>(
    [t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })],
    undefined,
    'a'
  );
  const tB = buildTransform<RecordOperation>(
    [t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })],
    undefined,
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
      action: 'update'
    });

    assert.ok(strategy);
    assert.strictEqual(
      strategy.blocking,
      false,
      'blocking is false by default'
    );
    assert.equal(
      strategy.name,
      's1:update -> s2:update',
      'name is based on source names by default'
    );
  });

  test('assigns source and target when activated', async function (assert) {
    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'update',
      action: 'update'
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
      action: 'update'
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
      on: 'beforeUpdate',
      action: 'update'
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.strictEqual(
        transform,
        tA,
        'argument to s1._update is expected Transform'
      );
      return { data: undefined };
    };

    s2._update = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.deepEqual(
        transform,
        {
          ...tA,
          options: {
            fullResponse: true
          }
        },
        'argument to s2._update is the same transform with `fullResponse: true` option'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return { transforms: [] };
    };

    await coordinator.activate();
    await s1.update(tA);
  });

  test('with `passHints: true` and `blocking: true`, will pass `hints` that result from applying the target action', async function (assert) {
    assert.expect(5);

    const record = { type: 'planet', id: 'a' };
    const details = { meta: { foo: 'bar' }, data: [record] };

    strategy = new RequestStrategy({
      source: 's1',
      target: 's2',
      on: 'beforeUpdate',
      action: 'update',
      blocking: true,
      passHints: true
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (
      transform: Transform<RecordOperation>,
      hints: ResponseHints<RecordData, RecordResponse>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.strictEqual(
        transform,
        tA,
        'argument to s1._update is expected Transform'
      );
      assert.deepEqual(
        hints,
        { data: [record], details },
        'result is passed as a hint'
      );
      return { data: [] };
    };

    s2._update = async function (
      transform: Transform<RecordOperation>,
      hints: ResponseHints<RecordData, RecordResponse>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.deepEqual(hints, {}, 'no hints are passed to `s2._update`');
      assert.deepEqual(
        transform,
        {
          ...tA,
          options: {
            fullResponse: true
          }
        },
        'argument to s2._update is the same transform with `fullResponse: true` option'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return { data: [record], details };
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
      filter(transform: any): boolean {
        assert.ok(this instanceof RequestStrategy, 'context is the strategy');
        return transform.id === tB.id;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      return {};
    };

    s2._push = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.deepEqual(
        transform,
        {
          ...tB,
          options: {
            fullResponse: true
          }
        },
        'argument to _push is the same transform with `fullResponse: true` option'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return { data: [] };
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
      blocking(transform): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          'it is bound to the strategy'
        );
        assert.strictEqual(
          transform,
          tA,
          'argument to `blocking` is the expected transform'
        );
        return false;
      }
    });

    coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [strategy]
    });

    s1._update = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.strictEqual(
        transform,
        tA,
        'argument to _update is expected Transform'
      );
      return {};
    };

    s2._push = async function (
      transform: Transform<RecordOperation>
    ): Promise<FullResponse<RecordData, RecordResponse, RecordOperation>> {
      assert.deepEqual(
        transform,
        {
          ...tA,
          options: {
            fullResponse: true
          }
        },
        'argument to `_push` is the expected transform with `fullResponse: true` option'
      );
      assert.strictEqual(this, s2, 'context is that of the target');
      return { data: [] };
    };

    await coordinator.activate();
    await s1.update(tA);
  });

  test('for events that are invoked with more than one arg, pass all args to any custom handler functions', async function (assert) {
    assert.expect(9);

    strategy = new RequestStrategy({
      source: 's1',
      on: 'updateFail',
      async action(transform, e): Promise<void> {
        assert.ok(
          this instanceof RequestStrategy,
          '`action` is bound to the strategy'
        );
        assert.strictEqual(
          transform,
          tA,
          'argument to `action` is the expected transform'
        );
        assert.equal((e as Error).message, ':(', 'error is passed to `action`');
      },
      blocking(transform, e): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          '`blocking` is bound to the strategy'
        );
        assert.strictEqual(
          transform,
          tA,
          'argument to `blocking` is the expected transform'
        );
        assert.equal(
          (e as Error).message,
          ':(',
          'error is passed to `blocking`'
        );
        return false;
      },
      filter(transform, e): boolean {
        assert.ok(
          this instanceof RequestStrategy,
          '`filter` is bound to the strategy'
        );
        assert.strictEqual(
          transform,
          tA,
          'argument to `filter` is the expected transform'
        );
        assert.equal((e as Error).message, ':(', 'error is passed to `filter`');
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
});
