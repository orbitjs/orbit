import Coordinator, {
  LogTruncationStrategy
} from '../../src/index';
import Orbit, {
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

  test('installs listeners on activate and removes them on deactivate', function(assert) {
    assert.expect(9);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    assert.equal(s1.listeners('transform').length, 0, 'no listeners installed yet');
    assert.equal(s2.listeners('transform').length, 0, 'no listeners installed yet');
    assert.equal(s3.listeners('transform').length, 0, 'no listeners installed yet');

    return coordinator.activate()
      .then(() => {
        assert.equal(s1.listeners('transform').length, 1, 'listeners installed');
        assert.equal(s2.listeners('transform').length, 1, 'listeners installed');
        assert.equal(s3.listeners('transform').length, 1, 'listeners installed');

        return coordinator.deactivate();
      })
      .then(() => {
        assert.equal(s1.listeners('transform').length, 0, 'listeners removed');
        assert.equal(s2.listeners('transform').length, 0, 'listeners removed');
        assert.equal(s3.listeners('transform').length, 0, 'listeners removed');
      });
  });

  test('observes source transforms and truncates any common history', function(assert) {
    assert.expect(3);

    logTruncationStrategy = new LogTruncationStrategy();

    coordinator = new Coordinator({
      sources: [s1, s2, s3],
      strategies: [logTruncationStrategy]
    });

    return coordinator.activate()
      .then(() => { console.log('coordinator activated'); return Orbit.Promise.resolve(); })
      .then(() => s1._transformed([tA]))
      .then(() => s2._transformed([tA]))
      .then(() => s3._transformed([tA]))
      .then(() => {
        assert.ok(!s1.transformLog.contains('a'), 's1 has removed a');
        assert.ok(!s2.transformLog.contains('a'), 's2 has removed a');
        assert.ok(!s3.transformLog.contains('a'), 's3 has removed a');
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
