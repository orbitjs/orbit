import Coordinator, {
  LogTruncationStrategy
} from '../../src/index';
import Orbit, {
  Source,
  Transform,
  TransformBuilder,
  buildTransform
} from '@orbit/data';
import '../test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('LogTruncationStrategy', function(hooks) {
  const t = new TransformBuilder();
  const tA = buildTransform([t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = buildTransform([t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = buildTransform([t.addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');
  const tD = buildTransform([t.addRecord({ type: 'planet', id: 'd', attributes: { name: 'd' } })], null, 'd');

  let logTruncationStrategy, coordinator, s1, s2, s3;

  hooks.beforeEach(function() {
    class MySource extends Source {}

    s1 = new MySource({ name: 's1' });
    s2 = new MySource({ name: 's2' });
    s3 = new MySource({ name: 's3' });
  });

  test('can be instantiated', function(assert) {
    logTruncationStrategy = new LogTruncationStrategy();

    assert.ok(logTruncationStrategy);
  });

  test('installs listeners on activate and removes them on deactivate', function(assert) {
    assert.expect(18);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    assert.equal(s1.requestQueue.listeners('complete').length, 0, 'no listeners installed yet');
    assert.equal(s2.requestQueue.listeners('complete').length, 0, 'no listeners installed yet');
    assert.equal(s3.requestQueue.listeners('complete').length, 0, 'no listeners installed yet');
    assert.equal(s1.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');
    assert.equal(s2.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');
    assert.equal(s3.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');

    return coordinator.activate()
      .then(() => {
        assert.equal(s1.requestQueue.listeners('complete').length, 1, 'listeners installed');
        assert.equal(s2.requestQueue.listeners('complete').length, 1, 'listeners installed');
        assert.equal(s3.requestQueue.listeners('complete').length, 1, 'listeners installed');
        assert.equal(s1.syncQueue.listeners('complete').length, 1, 'listeners installed');
        assert.equal(s2.syncQueue.listeners('complete').length, 1, 'listeners installed');
        assert.equal(s3.syncQueue.listeners('complete').length, 1, 'listeners installed');

        return coordinator.deactivate();
      })
      .then(() => {
        assert.equal(s1.requestQueue.listeners('complete').length, 0, 'listeners removed');
        assert.equal(s2.requestQueue.listeners('complete').length, 0, 'listeners removed');
        assert.equal(s3.requestQueue.listeners('complete').length, 0, 'listeners removed');
        assert.equal(s1.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');
        assert.equal(s2.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');
        assert.equal(s3.syncQueue.listeners('complete').length, 0, 'no listeners installed yet');
      });
  });

  test('observes source transforms and truncates any common history up to the most recent match', function(assert) {
    // let done = assert.async();
    assert.expect(3);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    return coordinator.activate()
      .then(() => s1._transformed([tA, tB]))
      .then(() => s2._transformed([tA, tB]))
      .then(() => s3._transformed([tA, tB]))
      .then(() => s1.syncQueue.clear())
      .then(() => s2.syncQueue.clear())
      .then(() => s3.syncQueue.clear())
      .then(() => {
        assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
        assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
        assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');
      });
  });

  test('observes source transforms and truncates their history to after the most recent common entry', function(assert) {
    assert.expect(10);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    return coordinator.activate()
      .then(() => all([
        s1._transformed([tA, tB, tC, tD]),
        s2._transformed([tA, tB, tC]),
        s3._transformed([tA, tB, tC])
      ]))
      .then(() => s1.syncQueue.clear())
      .then(() => s2.syncQueue.clear())
      .then(() => s3.syncQueue.clear())
      .then(() => {
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
});
