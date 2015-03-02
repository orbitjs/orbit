import Orbit from 'orbit/main';
import Action from 'orbit/action';
import ActionQueue from 'orbit/action-queue';
import Evented from 'orbit/evented';
import { noop } from 'orbit/lib/stubs';
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
  var queue = new ActionQueue(noop);
  ok(queue);
});

test("it is set to `autoProcess` by default", function() {
  var queue = new ActionQueue(noop);
  equal(queue.autoProcess, true, 'autoProcess === true');
});

test("will auto-process pushed actions sequentially by default", function() {
  expect(5);
  stop();

  var queue = new ActionQueue();

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      transformCount = 0;

  queue.on('didProcessAction', function(action) {
    if (transformCount === 1) {
      deepEqual(action.data, op1, 'op1 processed');
    } else if (transformCount === 2) {
      deepEqual(action.data, op2, 'op2 processed');
    }
  });

  queue.on('didProcess', function() {
    start();
    ok(true, 'queue completed');
  });

  var _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      deepEqual(op, op1, 'op1 passed as argument');
    } else if (transformCount === 2) {
      deepEqual(op, op2, 'op2 passed as argument');
    }
  };

  queue.push({
    id: 1,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op1
  });

  queue.push({
    id: 2,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op2
  });
});

test("with `autoProcess` disabled, will process pushed functions sequentially when `process` is called", function() {
  expect(5);
  stop();

  var queue = new ActionQueue();

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      transformCount = 0;

  queue.on('didProcessAction', function(action) {
    if (transformCount === 1) {
      deepEqual(action.data, op1, 'op1 processed');
    } else if (transformCount === 2) {
      deepEqual(action.data, op2, 'op2 processed');
    }
  });

  queue.on('didProcess', function() {
    start();
    ok(true, 'queue completed');
  });

  var _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      deepEqual(op, op1, 'op1 passed as argument');
    } else if (transformCount === 2) {
      deepEqual(op, op2, 'op2 passed as argument');
    }
  };

  queue.push({
    id: 1,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op1
  });

  queue.push({
    id: 2,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op2
  });

  queue.process();
});

test("will auto-process pushed async functions sequentially by default", function() {
  expect(8);
  stop();

  var queue = new ActionQueue();

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      order = 0;

  queue.on('didProcessAction', function(action) {
    if (action.data === op1) {
      equal(++order, 3, 'op1 completed');

    } else if (action.data === op2) {
      equal(++order, 6, 'op2 completed');
    }
  });

  queue.on('didProcess', function() {
    equal(++order, 7, 'queue completed');
  });

  var trigger = {};
  Evented.extend(trigger);

  var _transform = function(op) {
    var promise;
    if (op === op1) {
      equal(++order, 1, '_transform with op1');
      promise = new Promise(function(resolve) {
        trigger.on('start1', function() {
          equal(++order, 2, '_transform with op1 resolved');
          resolve();
        });
      });

    } else if (op === op2) {
      equal(++order, 4, '_transform with op1');
      promise = new Promise(function(resolve) {
        equal(++order, 5, '_transform with op1 resolved');
        resolve();
      });
    }
    return promise;
  };

  queue.push({
    id: 1,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op1
  });

  queue.push({
    id: 2,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op2
  });

  queue.process().then(function() {
    start();
    equal(++order, 8, 'queue resolves last');
  });

  trigger.emit('start1');
});

test("will stop processing when an action errors", function() {
  expect(8);
  stop();

  var queue = new ActionQueue({autoProcess: false});

  var op1 = {op: 'add', path: ['planets', '123'], value: 'Mercury'},
      op2 = {op: 'add', path: ['planets', '234'], value: 'Venus'},
      transformCount = 0;

  queue.on('didProcessAction', function(action) {
    if (transformCount === 1) {
      deepEqual(action.data, op1, 'didProcessAction - op1 processed');
    } else if (transformCount === 2) {
      ok(false, 'op2 could not be processed');
    }
  });

  queue.on('didNotProcessAction', function(action, err) {
    deepEqual(action.data, op2, 'didNotProcessAction - op2 failed processing');
    equal(err.message, ':(', 'didNotProcessAction - error matches expectation');
  });

  queue.on('didProcess', function() {
    ok(false, 'queue should not complete');
  });

  queue.on('didNotProcess', function(errData, err) {
    ok(true, 'didNotProcess - queue could not process');
    deepEqual(errData.action.data, op2, 'didNotProcess - op2 failed processing');
    equal(err.message, ':(', 'didNotProcess - error matches expectation');
  });

  var _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      deepEqual(op, op1, 'op1 passed as argument');
    } else if (transformCount === 2) {
      deepEqual(op, op2, 'op2 passed as argument');
    }
  };

  queue.push({
    id: 1,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op1
  });

  queue.push({
    id: 2,
    process: function() {
      throw new Error(':(');
    },
    data: op2
  });

  queue.process().then(function() {
    ok(false, 'process should not resolve successfully');
  }, function(err) {
    start();
    equal(err.message, ':(', 'process rejection - error matches expectation');
  });
});
