import Notifier from 'orbit/notifier';

var notifier;

module('Orbit - Notifier', {
  setup: function() {
    notifier = new Notifier();
  },

  teardown: function() {
    notifier = null;
  }
});

test('it exists', function() {
  ok(notifier);
});

test('it maintains a list of listeners', function() {
  let listener1 = function() {};
  let listener2 = function() {};

  equal(notifier.listeners.length, 0);

  notifier.addListener(listener1);
  notifier.addListener(listener2);
  equal(notifier.listeners.length, 2);

  notifier.removeListener(listener1);
  equal(notifier.listeners.length, 1);

  notifier.removeListener(listener2);
  equal(notifier.listeners.length, 0);
});

test('it notifies listeners when emitting a simple message', function() {
  expect(2);

  let listener1 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
  };

  notifier.addListener(listener1);
  notifier.addListener(listener2);

  notifier.emit('hello');
});

test('it notifies listeners using custom bindings, if specified', function() {
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

  notifier.addListener(listener1, binding1);
  notifier.addListener(listener2, binding2);

  notifier.emit('hello');
});

test('it notifies listeners when publishing any number of arguments', function() {
  expect(4);

  let listener1 = function() {
    equal(arguments[0], 'hello', 'notification message should match');
    equal(arguments[1], 'world', 'notification message should match');
  };
  let listener2 = function() {
    equal(arguments[0], 'hello', 'notification message should match');
    equal(arguments[1], 'world', 'notification message should match');
  };

  notifier.addListener(listener1);
  notifier.addListener(listener2);

  notifier.emit('hello', 'world');
});

test('it notifies listeners when polling with a simple message and returns any responses', function() {
  expect(4);

  let listener1 = function(message) {
    equal(message, 'hello', 'notification message should match');
    // note: no return value
  };
  let listener2 = function(message) {
    equal(message, 'hello', 'notification message should match');
    return 'bonjour';
  };
  let listener3 = function(message) {
    equal(message, 'hello', 'notification message should match');
    return 'sup';
  };

  notifier.addListener(listener1);
  notifier.addListener(listener2);
  notifier.addListener(listener3);

  deepEqual(notifier.poll('hello'), ['bonjour', 'sup'], 'poll response should include the responses of all listeners');
});
