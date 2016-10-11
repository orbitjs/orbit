import 'tests/test-helper';
import Evented from 'orbit/evented';
import { Promise } from 'rsvp';

var evented;

var successfulOperation = function() {
  return new Promise(function(resolve) {
    resolve(':)');
  });
};

var failedOperation = function() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
};

module('Orbit - Evented', {
  setup: function() {
    evented = {};
    Evented.extend(evented);
  },

  teardown: function() {
    evented = null;
  }
});

test('it exists', function() {
  ok(evented);
});

test('#emit - notifies listeners when emitting a simple message', function() {
  expect(2);

  let listener1 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);

  evented.emit('greeting', 'hello');
});

test('#emit - notifies listeners registered with `one` only once each', function() {
  expect(2);

  let listener1 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };

  evented.one('greeting', listener1);
  evented.one('greeting', listener2);

  evented.emit('greeting', 'hello');
  evented.emit('greeting', 'hello');
  evented.emit('greeting', 'hello');
});

test('#off can unregister individual listeners from an event', function() {
  expect(1);

  let listener1 = function() {
    ok(false, 'this listener should not be triggered');
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);
  evented.off('greeting', listener1);

  evented.emit('greeting', 'hello');
});

test('#off - can unregister all listeners from an event', function() {
  expect(6);

  let listener1 = function() {};
  let listener2 = function() {};

  evented.on('greeting', listener1);
  evented.on('salutation', listener1);
  evented.on('salutation', listener2);

  equal(evented.listeners('greeting').length, 1);
  equal(evented.listeners('salutation').length, 2);

  evented.off('salutation');

  equal(evented.listeners('greeting').length, 1);
  equal(evented.listeners('salutation').length, 0);

  evented.off('greeting');

  equal(evented.listeners('greeting').length, 0);
  equal(evented.listeners('salutation').length, 0);
});

test('#emit - allows listeners to be registered for multiple events', function() {
  expect(3);

  let listener1 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };

  evented.on('greeting', listener1);
  evented.on('salutation', listener1);
  evented.on('salutation', listener2);

  evented.emit('greeting', 'hello');
  evented.emit('salutation', 'hello');
});

test('#emit - notifies listeners using custom bindings, if specified', function() {
  expect(4);

  let binding1 = {};
  let binding2 = {};
  let listener1 = function(message) {
    equal(this, binding1, 'custom binding should match');
    equal(message, 'hello', 'notification message should match');
  };
  let listener2 = function(message) {
    equal(this, binding2, 'custom binding should match');
    equal(message, 'hello', 'notification message should match');
  };

  evented.on('greeting', listener1, binding1);
  evented.on('greeting', listener2, binding2);

  evented.emit('greeting', 'hello');
});

test('#emit - notifies listeners when emitting events with any number of arguments', function() {
  expect(4);

  let listener1 = function() {
    equal(arguments[0], 'hello', 'notification message should match');
    equal(arguments[1], 'world', 'notification message should match');
  };
  let listener2 = function() {
    equal(arguments[0], 'hello', 'notification message should match');
    equal(arguments[1], 'world', 'notification message should match');
  };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);

  evented.emit('greeting', 'hello', 'world');
});

test('#listeners - can return all the listeners (and bindings) for an event', function() {
  expect(1);

  let binding1 = {};
  let binding2 = {};
  let greeting1 = function() {
    return 'Hello';
  };
  let greeting2 = function() {
    return 'Bon jour';
  };

  evented.on('greeting', greeting1, binding1);
  evented.on('greeting', greeting2, binding2);

  deepEqual(evented.listeners('greeting'), [[greeting1, binding1], [greeting2, binding2]], 'listeners include nested arrays of functions and bindings');
});

test('#settleInSeries - can fulfill all promises returned by listeners to an event, in order, until all are settled', function(assert) {
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

  evented.on('greeting', listener1, this);
  evented.on('greeting', listener2, this);
  evented.on('greeting', listener3, this);
  evented.on('greeting', listener4, this);

  return evented.settleInSeries('greeting', 'hello')
    .then(result => {
      equal(result, undefined, 'no result returned');
      equal(++order, 5, 'promise resolved last');
    });
});

test('#settleInSeries - resolves regardless of errors thrown in handlers', function(assert) {
  assert.expect(1);

  evented.on('greeting', () => { throw new Error(); });

  return evented.settleInSeries('greeting', 'hello')
    .then(function(result) {
      assert.equal(result, undefined, 'Completed');
    })
    .catch(() => {
      assert.ok(false, 'error handler should not be reached');
    });
});

test('#fulfillInSeries - it can fulfill all promises returned by listeners to an event, in order, until all are settled', function(assert) {
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

  evented.on('greeting', listener1, this);
  evented.on('greeting', listener2, this);

  return evented.fulfillInSeries('greeting', 'hello').then(
    function(result) {
      assert.equal(result, undefined, 'no result returned');
      assert.equal(++order, 3, 'promise resolved last');
    }).then(function() {
      const listeners = evented.listeners('greeting');
      assert.equal(listeners.length, 2, 'listeners should not be unregistered');
    });
});

test('#fulfillInSeries - it will fail when any listener fails and return the error', function(assert) {
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

  evented.on('greeting', listener1, this);
  evented.on('greeting', listener2, this);
  evented.on('greeting', listener3, this);
  evented.on('greeting', listener4, this);

  return evented.fulfillInSeries('greeting', 'hello')
    .then(() => {
      assert.ok(false, 'success handler should not be reached');
    })
    .catch(error => {
      assert.equal(++order, 4, 'error handler triggered last');
      assert.equal(error, ':(', 'error result returned');
    }
  );
});
