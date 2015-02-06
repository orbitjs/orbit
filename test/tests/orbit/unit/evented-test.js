import Orbit from 'orbit/main';
import Evented from 'orbit/evented';
import { Promise } from 'rsvp';

var evented;

var successfulOperation = function() {
  return new Promise(function(resolve, reject) {
    resolve(':)');
  });
};

var failedOperation = function() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
};

module("Orbit - Evented", {
  setup: function() {
    Orbit.Promise = Promise;

    evented = {};
    Evented.extend(evented);
  },

  teardown: function() {
    evented = null;
  }
});

test("it exists", function() {
  ok(evented);
});

test("it notifies listeners when emitting a simple message", function() {
  expect(2);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
      };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);

  evented.emit('greeting', 'hello');
});

test("it notifies listeners registered with `one` only once each", function() {
  expect(2);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
      };

  evented.one('greeting', listener1);
  evented.one('greeting', listener2);

  evented.emit('greeting', 'hello');
  evented.emit('greeting', 'hello');
  evented.emit('greeting', 'hello');
});

test("it can unregister individual listeners from an event", function() {
  expect(1);

  var listener1 = function(message) {
        ok(false, 'this listener should not be triggered');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
      };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);
  evented.off('greeting', listener1);

  evented.emit('greeting', 'hello');
});

test("it can unregister all listeners from an event", function() {
  expect(6);

  var listener1 = function() {},
      listener2 = function() {};

  evented.on('greeting salutation', listener1);
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

test("it can unregister all listeners from multiple events", function() {
  expect(4);

  var listener1 = function() {},
      listener2 = function() {};

  evented.on('greeting salutation', listener1);
  evented.on('salutation', listener2);

  equal(evented.listeners('greeting').length, 1);
  equal(evented.listeners('salutation').length, 2);

  evented.off('salutation greeting');

  equal(evented.listeners('greeting').length, 0);
  equal(evented.listeners('salutation').length, 0);
});

test("it allows listeners to be registered for multiple events", function() {
  expect(3);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
      };

  evented.on('greeting salutation', listener1);
  evented.on('salutation', listener2);

  evented.emit('greeting', 'hello');
  evented.emit('salutation', 'hello');
});

test("it notifies listeners using custom bindings, if specified", function() {
  expect(4);

  var binding1 = {},
      binding2 = {},
      listener1 = function(message) {
        equal(this, binding1, 'custom binding should match');
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(this, binding2, 'custom binding should match');
        equal(message, 'hello', 'notification message should match');
      };

  evented.on('greeting', listener1, binding1);
  evented.on('greeting', listener2, binding2);

  evented.emit('greeting', 'hello');
});

test("it notifies listeners when emitting events with any number of arguments", function() {
  expect(4);

  var listener1 = function() {
        equal(arguments[0], 'hello', 'notification message should match');
        equal(arguments[1], 'world', 'notification message should match');
      },
      listener2 = function() {
        equal(arguments[0], 'hello', 'notification message should match');
        equal(arguments[1], 'world', 'notification message should match');
      };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);

  evented.emit('greeting', 'hello', 'world');
});

test("it can emit multiple events with the same arguments sequentially", function() {
  expect(3);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
      };

  evented.on('greeting salutation', listener1);
  evented.on('salutation', listener2);

  evented.emit('greeting salutation', 'hello');
});

test("it can poll listeners with an event and return all the responses in an array", function() {
  expect(4);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
        // note: no return value
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
        return 'bonjour';
      },
      listener3 = function(message) {
        equal(message, 'hello', 'notification message should match');
        return 'sup';
      };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);
  evented.on('greeting', listener3);

  deepEqual(evented.poll('greeting', 'hello'), ['bonjour', 'sup'], 'poll response should include the responses of all listeners');
});

test("it can poll listeners with multiple events and return all the responses in a single array", function() {
  expect(2);

  var greeting1 = function() {
        return 'Hello';
      },
      greeting2 = function() {
        return 'Bon jour';
      },
      parting1 = function() {
        return 'Goodbye';
      },
      parting2 = function() {
        return 'Au revoir';
      };

  evented.on('greeting', greeting1);
  evented.on('greeting', greeting2);
  evented.on('parting', parting1);
  evented.on('parting', parting2);

  deepEqual(evented.poll('greeting parting'), ['Hello', 'Bon jour', 'Goodbye', 'Au revoir'], 'poll response should include the responses of all listeners in order');
  deepEqual(evented.poll('parting greeting'), ['Goodbye', 'Au revoir', 'Hello', 'Bon jour'], 'poll response should include the responses of all listeners in order');
});

test("it can return all the listeners (and bindings) for an event", function() {
  expect(1);

  var binding1 = {},
      binding2 = {},
      greeting1 = function() {
        return 'Hello';
      },
      greeting2 = function() {
        return 'Bon jour';
      };

  evented.on('greeting', greeting1, binding1);
  evented.on('greeting', greeting2, binding2);

  deepEqual(evented.listeners('greeting'), [[greeting1, binding1], [greeting2, binding2]], 'listeners include nested arrays of functions and bindings');
});

test("it can return all the listeners (and bindings) for multiple events", function() {
  expect(1);

  var binding1 = {},
      binding2 = {},
      greeting1 = function() {
        return 'Hello';
      },
      greeting2 = function() {
        return 'Bon jour';
      },
      parting1 = function() {
        return 'Goodbye';
      },
      parting2 = function() {
        return 'Au revoir';
      };

  evented.on('greeting', greeting1, binding1);
  evented.on('greeting', greeting2, binding2);
  evented.on('parting', parting1, binding1);
  evented.on('parting', parting2, binding2);

  deepEqual(evented.listeners('greeting parting'), [[greeting1, binding1], [greeting2, binding2], [parting1, binding1], [parting2, binding2]], 'listeners include nested arrays of functions and bindings');
});

test("it can fulfill promises returned by listeners to an event, in order, until one resolves", function() {
  expect(8);

  var order = 0,
      listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 1, 'listener1 triggered first');
        // doesn't return anything
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 2, 'listener2 triggered second');
        return failedOperation();
      },
      listener3 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 3, 'listener3 triggered third');
        return successfulOperation();
      },
      listener4 = function(message) {
        ok(false, "listener should not be reached");
      };

  evented.on('greeting', listener1, this);
  evented.on('greeting', listener2, this);
  evented.on('greeting', listener3, this);
  evented.on('greeting', listener4, this);

  stop();
  evented.resolve('greeting', 'hello').then(
    function(result) {
      start();
      equal(result, ':)', 'success!');
      equal(++order, 4, 'promise resolved last');
    },
    function(error) {
      ok(false, "error handler should not be reached");
    }
  );
});

test("it can fulfill all promises returned by listeners to an event, in order, until all are settled", function() {
  expect(10);

  var order = 0,
      listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 1, 'listener1 triggered first');
        // doesn't return anything
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 2, 'listener2 triggered second');
        return failedOperation();
      },
      listener3 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 3, 'listener3 triggered third');
        return successfulOperation();
      },
      listener4 = function(message) {
        equal(message, 'hello', 'notification message should match');
        equal(++order, 4, 'listener4 triggered fourth');
        return failedOperation();
      };

  evented.on('greeting', listener1, this);
  evented.on('greeting', listener2, this);
  evented.on('greeting', listener3, this);
  evented.on('greeting', listener4, this);

  stop();
  evented.settle('greeting', 'hello').then(
    function(result) {
      start();
      equal(result, undefined, 'no result returned');
      equal(++order, 5, 'promise resolved last');
    },
    function(error) {
      ok(false, "error handler should not be reached");
    }
  );
});

test('it handles thrown errors in handlers', function() {
  expect(1);

  var error = new Error();

  function throwError() {
    throw error;
  }

  evented.on('greeting', throwError);
  stop();
  return evented.settle('greeting', 'hello')
    .then(function(result) {
      start();
      equal(result, undefined, 'Completed');
    }, function() {
      ok(false, 'error handler should not be reached');
    });

});
