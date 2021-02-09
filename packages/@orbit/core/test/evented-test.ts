import {
  evented,
  isEvented,
  fulfillInSeries,
  settleInSeries,
  Evented,
  fulfillAll
} from '../src/evented';
import { Listener } from '../src/notifier';
import { delay } from './support/timing';

const { module, test } = QUnit;

function successfulOperation() {
  return new Promise(function (resolve) {
    resolve(':)');
  });
}

function failedOperation() {
  return new Promise(function (resolve, reject) {
    reject(':(');
  });
}

module('Evented', function (hooks) {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Foo extends Evented {}

  @evented
  class Foo {}

  let obj: Foo;

  hooks.beforeEach(function () {
    obj = new Foo();
  });

  test('isEvented - tests for the application of the @evented decorator', function (assert) {
    assert.ok(isEvented(obj));
    assert.ok(true);
  });

  test('#emit - notifies listeners when emitting a simple message', function (assert) {
    assert.expect(2);

    let listener1 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;
    let listener2 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    obj.emit('greeting', 'hello');
  });

  test('#emit - notifies listeners registered with `one` only once each', function (assert) {
    assert.expect(2);

    let listener1 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;
    let listener2 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    obj.one('greeting', listener1);
    obj.one('greeting', listener2);

    obj.emit('greeting', 'hello');
    obj.emit('greeting', 'hello');
    obj.emit('greeting', 'hello');
  });

  test('#on return off function', function (assert) {
    assert.expect(1);

    let listener1 = function (): void {
      assert.ok(false, 'this listener should not be triggered');
    } as Listener;
    let listener2 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    const off = obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    off();

    obj.emit('greeting', 'hello');
  });

  test('#one return off function', function (assert) {
    assert.expect(1);

    let listener1 = function (): void {
      assert.ok(false, 'this listener should not be triggered');
    } as Listener;
    let listener2 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    const off = obj.one('greeting', listener1);
    obj.one('greeting', listener2);
    off();

    obj.emit('greeting', 'hello');
  });

  test('#off can unregister individual listeners from an event', function (assert) {
    assert.expect(1);

    let listener1 = function (): void {
      assert.ok(false, 'this listener should not be triggered');
    } as Listener;
    let listener2 = function (message: string): void {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    obj.off('greeting', listener1);

    obj.emit('greeting', 'hello');
  });

  test('#off - can unregister all listeners from an event', function (assert) {
    assert.expect(6);

    let listener1 = function () {};
    let listener2 = function () {};

    obj.on('greeting', listener1);
    obj.on('salutation', listener1);
    obj.on('salutation', listener2);

    assert.equal(obj.listeners('greeting').length, 1);
    assert.equal(obj.listeners('salutation').length, 2);

    obj.off('salutation');

    assert.equal(obj.listeners('greeting').length, 1);
    assert.equal(obj.listeners('salutation').length, 0);

    obj.off('greeting');

    assert.equal(obj.listeners('greeting').length, 0);
    assert.equal(obj.listeners('salutation').length, 0);
  });

  test('#emit - allows listeners to be registered for multiple events', function (assert) {
    assert.expect(3);

    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('salutation', listener1);
    obj.on('salutation', listener2);

    obj.emit('greeting', 'hello');
    obj.emit('salutation', 'hello');
  });

  test('#emit - notifies listeners when emitting events with any number of arguments', function (assert) {
    assert.expect(4);

    let listener1 = function () {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };
    let listener2 = function () {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    obj.emit('greeting', 'hello', 'world');
  });

  test('#listeners - can return all the listeners for an event', function (assert) {
    assert.expect(1);

    let greeting1 = function () {
      return 'Hello';
    };

    let greeting2 = function () {
      return 'Bon jour';
    };

    obj.on('greeting', greeting1);
    obj.on('greeting', greeting2);

    assert.deepEqual(
      obj.listeners('greeting'),
      [greeting1, greeting2],
      'listeners match'
    );
  });

  test('settleInSeries - can fulfill all promises returned by listeners to an event, in order, until all are settled', function (assert) {
    assert.expect(10);

    let order = 0;
    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    } as Listener;
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered second');
      return failedOperation();
    } as Listener;
    let listener3 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 3, 'listener3 triggered third');
      return successfulOperation();
    } as Listener;
    let listener4 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 4, 'listener4 triggered fourth');
      return failedOperation();
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    obj.on('greeting', listener3);
    obj.on('greeting', listener4);

    return settleInSeries(obj, 'greeting', 'hello').then((result) => {
      assert.deepEqual(
        result,
        [undefined, ':(', ':)', ':('],
        'results returned in order'
      );
      assert.equal(++order, 5, 'promise resolved last');
    });
  });

  test('settleInSeries - resolves regardless of errors thrown in handlers', function (assert) {
    assert.expect(4);

    obj.on('greeting', () => {
      return 'hi!';
    });
    obj.on('greeting', () => {
      throw new Error('go away!');
    });

    return settleInSeries(obj, 'greeting', 'hello')
      .then(function (result) {
        assert.equal(result.length, 2, '2 results returned');
        assert.equal(result[0], 'hi!', 'result returned');
        assert.ok(result[1] instanceof Error, 'error returned');
        assert.equal(
          (result[1] as Error).message,
          'go away!',
          'error returned'
        );
      })
      .catch(() => {
        assert.ok(false, 'error handler should not be reached');
      });
  });

  test('fulfillInSeries - it can fulfill all promises returned by listeners to an event, in order, until all are settled', function (assert) {
    assert.expect(7);

    let order = 0;
    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    } as Listener;
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered third');
      return successfulOperation();
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    return fulfillInSeries(obj, 'greeting', 'hello')
      .then(function (result) {
        assert.deepEqual(
          result,
          [undefined, ':)'],
          'results returned in order'
        );
        assert.equal(++order, 3, 'promise resolved last');
      })
      .then(function () {
        const listeners = obj.listeners('greeting');
        assert.equal(
          listeners.length,
          2,
          'listeners should not be unregistered'
        );
      });
  });

  test('fulfillInSeries - it will fail when any listener fails and return the error', function (assert) {
    assert.expect(8);

    let order = 0;
    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    } as Listener;
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered third');
      return successfulOperation();
    } as Listener;
    let listener3 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 3, 'listener3 triggered second');
      return failedOperation();
    } as Listener;
    let listener4 = function () {
      assert.ok(false, 'listener4 should not be triggered');
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    obj.on('greeting', listener3);
    obj.on('greeting', listener4);

    return fulfillInSeries(obj, 'greeting', 'hello')
      .then(() => {
        assert.ok(false, 'success handler should not be reached');
      })
      .catch((error) => {
        assert.equal(++order, 4, 'error handler triggered last');
        assert.equal(error, ':(', 'error result returned');
      });
  });

  test('fulfillAll - it can fulfill all promises returned by listeners to an event in parallel', async function (assert) {
    assert.expect(5);

    const DELAY = 10;

    let order = 0;
    let listener1 = async function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      await delay(DELAY);
      return undefined;
    } as Listener;
    let listener2 = async function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      await delay(DELAY);
      return successfulOperation();
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    const startTime = new Date().getTime();

    const result = await fulfillAll(obj, 'greeting', 'hello');

    const endTime = new Date().getTime();
    const elapsedTime = endTime - startTime;

    assert.ok(elapsedTime < 2 * DELAY, 'listeners performed in parallel');

    assert.deepEqual(result, [undefined, ':)'], 'results returned in order');

    const listeners = obj.listeners('greeting');
    assert.equal(listeners.length, 2, 'listeners should not be unregistered');
  });

  test('fulfillAll - it will fail when any listener fails and return the error', function (assert) {
    assert.expect(9);

    let order = 0;
    let listener1 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered');
      // doesn't return anything
    } as Listener;
    let listener2 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered');
      return successfulOperation();
    } as Listener;
    let listener3 = function (message: string) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 3, 'listener3 triggered');
      return failedOperation();
    } as Listener;
    let listener4 = function () {
      assert.equal(++order, 4, 'listener4 triggered');
      return successfulOperation();
    } as Listener;

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    obj.on('greeting', listener3);
    obj.on('greeting', listener4);

    return fulfillAll(obj, 'greeting', 'hello')
      .then(() => {
        assert.ok(false, 'success handler should not be reached');
      })
      .catch((error) => {
        assert.equal(++order, 5, 'error handler triggered last');
        assert.equal(error, ':(', 'error result returned');
      });
  });
});
