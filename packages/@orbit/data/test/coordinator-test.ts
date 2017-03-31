import { Source } from '../src/source';
import Coordinator from '../src/coordinator';
import Transform from '../src/transform';
import './test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('Coordinator', function(hooks) {
  const tA = new Transform([{ op: 'addRecord', value: {} }], null, 'a');
  const tB = new Transform([{ op: 'addRecord', value: {} }], null, 'b');
  const tC = new Transform([{ op: 'addRecord', value: {} }], null, 'c');

  let coordinator, s1, s2, s3;

  hooks.beforeEach(function() {
    s1 = new Source({ name: 's1' });
    s2 = new Source({ name: 's2' });
    s3 = new Source({ name: 's3' });
  });

  test('can be instantiated', function(assert) {
    coordinator = new Coordinator([s1, s2, s3]);

    assert.ok(coordinator);
  });

  test('reviews sources and truncates their history to after the most recent common entry', function(assert) {
    assert.expect(14);

    coordinator = new Coordinator([s1, s2, s3], false);

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

        return coordinator.review();
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

  QUnit.skip('observes source transforms and truncates their history to after the most recent common entry', function(assert) {
    assert.expect(7);

    coordinator = new Coordinator([s1, s2, s3]);

    return coordinator.activated
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
