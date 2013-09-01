import Notifier from 'orbit/notifier';

var notifier;

module("Unit - Notifier", {
  setup: function() {
    notifier = new Notifier;
  },

  teardown: function() {
    notifier = null;
  }
});

test("it exists", function() {
  ok(notifier);
});

test("it maintains a list of listeners", function() {
  var listener1 = function() {},
      listener2 = function() {};

  equal(notifier.listeners.length, 0);

  notifier.addListener(listener1);
  notifier.addListener(listener2);
  equal(notifier.listeners.length, 2);

  notifier.removeListener(listener1);
  equal(notifier.listeners.length, 1);

  notifier.removeListener(listener2);
  equal(notifier.listeners.length, 0);
});

test("it notifies listeners when sending a simple message", function() {
  expect(2);

  var listener1 = function(message) {
        equal(message, 'hello');
      },
      listener2 = function(message) {
        equal(message, 'hello');
      };

  notifier.addListener(listener1);
  notifier.addListener(listener2);

  notifier.send('hello');
});

test("it notifies listeners when publishing any number of arguments", function() {
  expect(4);

  var listener1 = function() {
        equal(arguments[0], 'hello');
        equal(arguments[1], 'world');
      },
      listener2 = function() {
        equal(arguments[0], 'hello');
        equal(arguments[1], 'world');
      };

  notifier.addListener(listener1);
  notifier.addListener(listener2);

  notifier.send('hello', 'world');
});