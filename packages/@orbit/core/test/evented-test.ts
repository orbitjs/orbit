import Orbit from '../src/main';
import evented, { isEvented, fulfillInSeries, settleInSeries } from '../src/evented';
import './test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

function successfulOperation() {
  return new Promise(function(resolve) {
    resolve(':)');
  });
}

function failedOperation() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
}

module('Evented', function(hooks) {
  let obj;

  hooks.beforeEach(function() {
    @evented
    class Foo {}

    obj = new Foo();
  });

  hooks.afterEach(function() {
    obj = null;
  });

  test('isEvented - tests for the application of the @evented decorator', function(assert) {
    assert.ok(isEvented(obj));
  });

  test('#emit - notifies listeners when emitting a simple message', function(assert) {
    assert.expect(2);

    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    obj.emit('greeting', 'hello');
  });

  test('#emit - notifies listeners registered with `one` only once each', function(assert) {
    assert.expect(2);

    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };

    obj.one('greeting', listener1);
    obj.one('greeting', listener2);

    obj.emit('greeting', 'hello');
    obj.emit('greeting', 'hello');
    obj.emit('greeting', 'hello');
  });

  test('#off can unregister individual listeners from an event', function(assert) {
    assert.expect(1);

    let listener1 = function() {
      assert.ok(false, 'this listener should not be triggered');
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);
    obj.off('greeting', listener1);

    obj.emit('greeting', 'hello');
  });

  test('#off - can unregister all listeners from an event', function(assert) {
    assert.expect(6);

    let listener1 = function() {};
    let listener2 = function() {};

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

  test('#emit - allows listeners to be registered for multiple events', function(assert) {
    assert.expect(3);

    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
    };

    obj.on('greeting', listener1);
    obj.on('salutation', listener1);
    obj.on('salutation', listener2);

    obj.emit('greeting', 'hello');
    obj.emit('salutation', 'hello');
  });

  test('#emit - notifies listeners using custom bindings, if specified', function(assert) {
    assert.expect(4);

    let binding1 = {};
    let binding2 = {};
    let listener1 = function(message) {
      assert.equal(this, binding1, 'custom binding should match');
      assert.equal(message, 'hello', 'notification message should match');
    };
    let listener2 = function(message) {
      assert.equal(this, binding2, 'custom binding should match');
      assert.equal(message, 'hello', 'notification message should match');
    };

    obj.on('greeting', listener1, binding1);
    obj.on('greeting', listener2, binding2);

    obj.emit('greeting', 'hello');
  });

  test('#emit - notifies listeners when emitting events with any number of arguments', function(assert) {
    assert.expect(4);

    let listener1 = function() {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };
    let listener2 = function() {
      assert.equal(arguments[0], 'hello', 'notification message should match');
      assert.equal(arguments[1], 'world', 'notification message should match');
    };

    obj.on('greeting', listener1);
    obj.on('greeting', listener2);

    obj.emit('greeting', 'hello', 'world');
  });

  test('#listeners - can return all the listeners (and bindings) for an event', function(assert) {
    assert.expect(1);

    let binding1 = {};
    let binding2 = {};
    let greeting1 = function() {
      return 'Hello';
    };
    let greeting2 = function() {
      return 'Bon jour';
    };

    obj.on('greeting', greeting1, binding1);
    obj.on('greeting', greeting2, binding2);

    assert.deepEqual(obj.listeners('greeting'), [[greeting1, binding1], [greeting2, binding2]], 'listeners include nested arrays of functions and bindings');
  });

  test('settleInSeries - can fulfill all promises returned by listeners to an event, in order, until all are settled', function(assert) {
    assert.expect(10);

    let order = 0;
    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered second');
      return failedOperation();
    };
    let listener3 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 3, 'listener3 triggered third');
      return successfulOperation();
    };
    let listener4 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 4, 'listener4 triggered fourth');
      return failedOperation();
    };

    obj.on('greeting', listener1, this);
    obj.on('greeting', listener2, this);
    obj.on('greeting', listener3, this);
    obj.on('greeting', listener4, this);

    return settleInSeries(obj, 'greeting', 'hello')
      .then(result => {
        assert.equal(result, undefined, 'no result returned');
        assert.equal(++order, 5, 'promise resolved last');
      });
  });

  test('settleInSeries - resolves regardless of errors thrown in handlers', function(assert) {
    assert.expect(1);

    obj.on('greeting', () => { throw new Error(); });

    return settleInSeries(obj, 'greeting', 'hello')
      .then(function(result) {
        assert.equal(result, undefined, 'Completed');
      })
      .catch(() => {
        assert.ok(false, 'error handler should not be reached');
      });
  });

  test('fulfillInSeries - it can fulfill all promises returned by listeners to an event, in order, until all are settled', function(assert) {
    assert.expect(7);

    let order = 0;
    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered third');
      return successfulOperation();
    };

    obj.on('greeting', listener1, this);
    obj.on('greeting', listener2, this);

    return fulfillInSeries(obj, 'greeting', 'hello').then(
      function(result) {
        assert.equal(result, undefined, 'no result returned');
        assert.equal(++order, 3, 'promise resolved last');
      }).then(function() {
        const listeners = obj.listeners('greeting');
        assert.equal(listeners.length, 2, 'listeners should not be unregistered');
      });
  });

  test('fulfillInSeries - it will fail when any listener fails and return the error', function(assert) {
    assert.expect(8);

    let order = 0;
    let listener1 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 1, 'listener1 triggered first');
      // doesn't return anything
    };
    let listener2 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 2, 'listener2 triggered third');
      return successfulOperation();
    };
    let listener3 = function(message) {
      assert.equal(message, 'hello', 'notification message should match');
      assert.equal(++order, 3, 'listener3 triggered second');
      return failedOperation();
    };
    let listener4 = function() {
      assert.ok(false, 'listener4 should not be triggered');
    };

    obj.on('greeting', listener1, this);
    obj.on('greeting', listener2, this);
    obj.on('greeting', listener3, this);
    obj.on('greeting', listener4, this);

    return fulfillInSeries(obj, 'greeting', 'hello')
      .then(() => {
        assert.ok(false, 'success handler should not be reached');
      })
      .catch(error => {
        assert.equal(++order, 4, 'error handler triggered last');
        assert.equal(error, ':(', 'error result returned');
      }
    );
  });
});
