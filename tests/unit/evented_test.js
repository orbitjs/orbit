import Evented from 'orbit/evented';

var evented;

module("Unit - Evented", {
  setup: function() {
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

test("it allows listeners to be unregistered", function() {
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

test("it notifies listeners when polling with a message and returns the first response", function() {
  expect(3);

  var listener1 = function(message) {
        equal(message, 'hello', 'notification message should match');
      },
      listener2 = function(message) {
        equal(message, 'hello', 'notification message should match');
        return 'bonjour';
      },
      listener3 = function(message) {
        ok(false, 'this listener should not be reached');
        return 'bonjour';
      };

  evented.on('greeting', listener1);
  evented.on('greeting', listener2);
  evented.on('greeting', listener3);

  equal(evented.poll('greeting', 'hello'), 'bonjour', 'poll response should match the response of the first listener to respond');
});

