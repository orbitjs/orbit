import { Coordinator } from '../../src/coordinator';
import { EventLoggingStrategy } from '../../src/strategies/event-logging-strategy';
import { Source } from '@orbit/data';

const { module, test } = QUnit;

module('EventLoggingStrategy', function (hooks) {
  let eventLoggingStrategy: EventLoggingStrategy;

  test('can be instantiated', function (assert) {
    eventLoggingStrategy = new EventLoggingStrategy();

    assert.ok(eventLoggingStrategy);
  });

  test('can be added to a coordinator', function (assert) {
    let coordinator = new Coordinator();

    eventLoggingStrategy = new EventLoggingStrategy();

    coordinator.addStrategy(eventLoggingStrategy);

    assert.strictEqual(
      coordinator.getStrategy('event-logging'),
      eventLoggingStrategy
    );
  });

  test('for basic sources, installs `transform` listeners on activatation and removes them on deactivation', async function (assert) {
    assert.expect(6);

    class MySource extends Source {}

    let s1 = new MySource({ name: 's1' });
    let s2 = new MySource({ name: 's2' });

    eventLoggingStrategy = new EventLoggingStrategy();

    let coordinator = new Coordinator({
      sources: [s1, s2],
      strategies: [eventLoggingStrategy]
    });

    assert.equal(s1.listeners('transform').length, 0);
    assert.equal(s2.listeners('transform').length, 0);

    await coordinator.activate();

    assert.equal(s1.listeners('transform').length, 1);
    assert.equal(s2.listeners('transform').length, 1);

    await coordinator.deactivate();

    assert.equal(s1.listeners('transform').length, 0);
    assert.equal(s2.listeners('transform').length, 0);
  });

  // TODO:
  // * test `interfaces` option
  // * test adding sources that support different interfaces to ensure they're inspected properly
});
