import Orbit from 'orbit/main';
import ActionQueue from 'orbit/action_queue';
import Evented from 'orbit/evented';
import { Promise } from 'rsvp';

var failedOperation = function() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
};

///////////////////////////////////////////////////////////////////////////////

module("Orbit - ActionQueue", {
  setup: function() {
    Orbit.Promise = Promise;
  },

  teardown: function() {
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  var queue = new ActionQueue(Orbit.K);
  ok(queue);
});

test("it is set to `autoProcess` by default", function() {
  var queue = new ActionQueue(Orbit.K);
  equal(queue.autoProcess, true, 'autoProcess === true');
});

test("will auto-process pushed functions sequentially by default", function() {
  expect(4);

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      transformCount = 0;

  var _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      deepEqual(op, op1, 'op1 passed as argument');
    } else if (transformCount === 2) {
      deepEqual(op, op2, 'op2 passed as argument');
    }
  };

  var queue = new ActionQueue(_transform);

  queue.on('didComplete', function() {
    if (transformCount === 1) {
      ok(true, 'queue completed after op1');
    } else if (transformCount === 2) {
      ok(true, 'queue completed after op2');
    }
  });

  queue.push(op1);
  queue.push(op2);
});

test("with `autoProcess` disabled, will process pushed functions sequentially when `process` is called", function() {
  expect(3);

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      transformCount = 0;

  var _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      deepEqual(op, op1, 'op1 passed as argument');
    } else if (transformCount === 2) {
      deepEqual(op, op2, 'op2 passed as argument');
    }
  };

  var queue = new ActionQueue(_transform, this, {autoProcess: false});

  queue.on('didComplete', function() {
    if (transformCount === 1) {
      ok(false, 'queue SHOULD NOT be completed after op1');
    } else if (transformCount === 2) {
      ok(true, 'queue completed after op2');
    }
  });

  queue.push(op1);
  queue.push(op2);
  queue.process();
});

test("will auto-process pushed async functions sequentially by default", function() {
  expect(4);

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'};

  var trigger = {};
  Evented.extend(trigger);

  var _transform = function(op) {
    var promise;
    if (op === op1) {
      promise = new Promise(function(resolve) {
        trigger.on('start1', function() {
          ok(true, '_transform with op1 resolved');
          resolve();
        });
      });

    } else if (op === op2) {
      promise = new Promise(function(resolve) {
        ok(true, '_transform with op2 resolved');
        resolve();
      });
    }
    return promise;
  };

  var queue = new ActionQueue(_transform);

  queue.on('didComplete', function() {
    start();
    ok(!queue.processing, 'queue is done processing');
  });

  stop();
  queue.push(op1);
  queue.push(op2);
  ok(queue.processing, 'queue is processing');
  trigger.emit('start1');
});

