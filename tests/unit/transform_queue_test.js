import Orbit from 'orbit/core';
import TransformQueue from 'orbit/transform_queue';
import RSVP from 'rsvp';

var queue,
    target;

var failedOperation = function() {
  return new RSVP.Promise(function(resolve, reject) {
    reject(':(');
  });
};

///////////////////////////////////////////////////////////////////////////////

module("Unit - TransformQueue", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    target = {
      id: 'test'
    };
    queue = new TransformQueue(target);
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

