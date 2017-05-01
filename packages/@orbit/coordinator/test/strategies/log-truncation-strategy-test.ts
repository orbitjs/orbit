import Coordinator, {
  LogTruncationStrategy
} from '../../src/index';
import {
  Source,
  Transform,
  addRecord
} from '@orbit/data';
import '../test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('LogTruncationStrategy', function(hooks) {
  const tA = new Transform([addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = new Transform([addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = new Transform([addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');

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

  test('reviews sources and truncates their history to after the most recent common entry', function(assert) {
    assert.expect(14);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    return all([
        s1._transformed([tA, tB]),
        s2._transformed([tA, tB]),
        s3._transformed([tA, tB, tC])
      ])
      .then(() => {
        assert.ok(s1.transformLog.contains('a'), 's1 contains a');
        assert.ok(s2.transformLog.contains('a'), 's2 contains a');
        assert.ok(s3.transformLog.contains('a'), 's3 contains a');

        assert.ok(s1.transformLog.contains('b'), 's1 contains b');
        assert.ok(s2.transformLog.contains('b'), 's2 contains b');
        assert.ok(s3.transformLog.contains('b'), 's3 contains b');

        assert.ok(s3.transformLog.contains('b'), 's3 contains c');

        return coordinator.activate();
      })
      .then(() => {
        assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
        assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
        assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');

        assert.ok(!s1.transformLog.contains('b'), 's1 has removed b');
        assert.ok(!s2.transformLog.contains('b'), 's2 has removed b');
        assert.ok(!s3.transformLog.contains('b'), 's3 has removed b');

        assert.ok(s3.transformLog.contains('c'), 's3 contains c');
      });
  });

  test('observes source transforms and truncates their history to after the most recent common entry', function(assert) {
    assert.expect(7);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    return coordinator.activate()
      .then(() => all([
        s1._transformed([tA, tB]),
        s2._transformed([tA, tB]),
        s3._transformed([tA, tB, tC])
      ]))
      .then(() => {
        assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
        assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
        assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');

        assert.ok(!s1.transformLog.contains('b'), 's1 has removed b');
        assert.ok(!s2.transformLog.contains('b'), 's2 has removed b');
        assert.ok(!s3.transformLog.contains('b'), 's3 has removed b');

        assert.ok(s3.transformLog.contains('c'), 's3 contains c');
      });
  });
});
