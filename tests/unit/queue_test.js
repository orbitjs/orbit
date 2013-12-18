import Orbit from 'orbit/core';
import Queue from 'orbit/queue';
import RSVP from 'rsvp';

var queue;

var failedOperation = function() {
  return new RSVP.Promise(function(resolve, reject) {
    reject(':(');
  });
};

///////////////////////////////////////////////////////////////////////////////

module("Unit - Queue", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    queue = new Queue();
  },

  teardown: function() {
    queue = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(queue);
});

test("will auto-process pushed functions by default", function() {
  expect(3);

  var op1 = function() {
    ok(true, 'function called');
    return new RSVP.Promise(function(resolve) {
      ok(true, 'promise resolved');
      resolve(':)');
    });
  };

  stop();
  queue.push(op1).then(function() {
    start();
    ok(true, 'queue resolved');
  });
});

