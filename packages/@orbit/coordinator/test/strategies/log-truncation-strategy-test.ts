import { Coordinator } from '../../src/coordinator';
import { LogTruncationStrategy } from '../../src/strategies/log-truncation-strategy';
import { Source, buildTransform } from '@orbit/data';
import { RecordTransformBuilder } from '../support/record-data';

const { module, test } = QUnit;

module('LogTruncationStrategy', function (hooks) {
  const t = new RecordTransformBuilder();
  const tA = buildTransform(
    [t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })],
    undefined,
    'a'
  );
  const tB = buildTransform(
    [t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })],
    undefined,
    'b'
  );
  const tC = buildTransform(
    [t.addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })],
    undefined,
    'c'
  );
  const tD = buildTransform(
    [t.addRecord({ type: 'planet', id: 'd', attributes: { name: 'd' } })],
    undefined,
    'd'
  );

  let logTruncationStrategy: LogTruncationStrategy;
  let coordinator: Coordinator;
  let s1: any;
  let s2: any;
  let s3: any;

  hooks.beforeEach(function () {
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
    s3 = new MySource({ name: 's3' });
  });

  test('can be instantiated', function (assert) {
    logTruncationStrategy = new LogTruncationStrategy();

    assert.ok(logTruncationStrategy);
  });

  test('installs listeners on activate and removes them on deactivate', async function (assert) {
    assert.expect(18);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    assert.equal(
      s1.requestQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s2.requestQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s3.requestQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s1.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s2.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s3.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );

    await coordinator.activate();

    assert.equal(
      s1.requestQueue.listeners('complete').length,
      1,
      'listeners installed'
    );
    assert.equal(
      s2.requestQueue.listeners('complete').length,
      1,
      'listeners installed'
    );
    assert.equal(
      s3.requestQueue.listeners('complete').length,
      1,
      'listeners installed'
    );
    assert.equal(
      s1.syncQueue.listeners('complete').length,
      1,
      'listeners installed'
    );
    assert.equal(
      s2.syncQueue.listeners('complete').length,
      1,
      'listeners installed'
    );
    assert.equal(
      s3.syncQueue.listeners('complete').length,
      1,
      'listeners installed'
    );

    await coordinator.deactivate();

    assert.equal(
      s1.requestQueue.listeners('complete').length,
      0,
      'listeners removed'
    );
    assert.equal(
      s2.requestQueue.listeners('complete').length,
      0,
      'listeners removed'
    );
    assert.equal(
      s3.requestQueue.listeners('complete').length,
      0,
      'listeners removed'
    );
    assert.equal(
      s1.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s2.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
    assert.equal(
      s3.syncQueue.listeners('complete').length,
      0,
      'no listeners installed yet'
    );
  });

  test('observes source transforms and truncates any common history up to the most recent match', async function (assert) {
    assert.expect(3);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    await coordinator.activate();
    await s1.transformed([tA, tB]);
    await s2.transformed([tA, tB]);
    await s3.transformed([tA, tB]);
    await s1.syncQueue.clear();
    await s2.syncQueue.clear();
    await s3.syncQueue.clear();
    assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
    assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
    assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');
  });

  test('observes source transforms and truncates their history to after the most recent common entry', async function (assert) {
    assert.expect(10);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    await coordinator.activate();
    await s1.transformed([tA, tB, tC, tD]);
    await s2.transformed([tA, tB, tC]);
    await s3.transformed([tA, tB, tC]);

    await s1.syncQueue.clear();
    await s2.syncQueue.clear();
    await s3.syncQueue.clear();

    assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
    assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
    assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');

    assert.ok(!s1.transformLog.contains('b'), 's1 has removed b');
    assert.ok(!s2.transformLog.contains('b'), 's2 has removed b');
    assert.ok(!s3.transformLog.contains('b'), 's3 has removed b');

    assert.ok(s1.transformLog.contains('c'), 's1 contains c');
    assert.ok(s2.transformLog.contains('c'), 's2 contains c');
    assert.ok(s3.transformLog.contains('c'), 's3 contains c');

    assert.ok(s1.transformLog.contains('d'), 's3 contains d');
  });
});
