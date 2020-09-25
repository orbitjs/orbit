import { Notifier } from '../src/notifier';

const { module, test } = QUnit;

module('Notifier', function (hooks) {
  let notifier: Notifier;

  hooks.beforeEach(function () {
    notifier = new Notifier();
  });

  test('it exists', function (assert) {
    assert.ok(notifier);
  });

  test('it maintains a list of listeners', function (assert) {
    let listener1 = function () {};
    let listener2 = function () {};

    assert.equal(notifier.listeners.length, 0);

    notifier.addListener(listener1);
    notifier.addListener(listener2);
    assert.equal(notifier.listeners.length, 2);

    notifier.removeListener(listener1);
    assert.equal(notifier.listeners.length, 1);

    notifier.removeListener(listener2);
    assert.equal(notifier.listeners.length, 0);
  });

  test('it notifies listeners when emitting a simple message', function (assert) {
    assert.expect(2);

    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
    };
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
    };

    notifier.addListener(listener1);
    notifier.addListener(listener2);

    notifier.emit('hello');
  });

  test('it notifies listeners when publishing any number of arguments', function (assert) {
    assert.expect(4);

    let listener1 = function () {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };
    let listener2 = function () {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };

    notifier.addListener(listener1);
    notifier.addListener(listener2);

    notifier.emit('hello', 'world');
  });
});
