import Coordinator, {
  EventLoggingStrategy
} from '../../src/index';
import {
  Source,
  Transform,
  TransformBuilder,
  buildTransform
} from '@orbit/data';
import '../test-helper';

declare const RSVP: any;
const { all } = RSVP;
const { module, test } = QUnit;

module('EventLoggingStrategy', function(hooks) {
  const t = new TransformBuilder();
  const tA = buildTransform([t.addRecord({ type: 'planet', id: 'a', attributes: { name: 'a' } })], null, 'a');
  const tB = buildTransform([t.addRecord({ type: 'planet', id: 'b', attributes: { name: 'b' } })], null, 'b');
  const tC = buildTransform([t.addRecord({ type: 'planet', id: 'c', attributes: { name: 'c' } })], null, 'c');

  let eventLoggingStrategy;

  test('can be instantiated', function(assert) {
    eventLoggingStrategy = new EventLoggingStrategy();

    assert.ok(eventLoggingStrategy);
  });

  test('can be added to a coordinator', function(assert) {
    let coordinator = new Coordinator();

    eventLoggingStrategy = new EventLoggingStrategy();

    coordinator.addStrategy(eventLoggingStrategy);

    assert.strictEqual(coordinator.getStrategy('event-logging'), eventLoggingStrategy);
  });

  test('for basic sources, installs `transform` listeners on activatation and removes them on deactivation', function(assert) {
    assert.expect(6);

    class MySource extends Source {}

    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });

    eventLoggingStrategy = new EventLoggingStrategy();

    let coordinator = new Coordinator({ sources: [ s1, s2 ], strategies: [ eventLoggingStrategy ]});

    assert.equal(s1.listeners('transform').length, 0);
    assert.equal(s2.listeners('transform').length, 0);

    return coordinator.activate()
      .then(() => {
        assert.equal(s1.listeners('transform').length, 1);
        assert.equal(s2.listeners('transform').length, 1);

        return coordinator.deactivate();
      })
      .then(() => {
        assert.equal(s1.listeners('transform').length, 0);
        assert.equal(s2.listeners('transform').length, 0);
      });
  });

  // TODO:
  // * test `interfaces` option
  // * test adding sources that support different interfaces to ensure they're inspected properly
});
