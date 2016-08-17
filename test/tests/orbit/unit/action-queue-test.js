import 'tests/test-helper';
import ActionQueue from 'orbit/action-queue';
import Evented from 'orbit/evented';
import { noop } from 'orbit/lib/stubs';
import { Promise } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

module('Orbit - ActionQueue', {});

test('can be instantiated', function() {
  const queue = new ActionQueue(noop);
  ok(queue);
});

test('#autoProcess is enabled by default', function() {
  const queue = new ActionQueue(noop);
  equal(queue.autoProcess, true, 'autoProcess === true');
});

test('auto-processes pushed actions sequentially by default', function(assert) {
  assert.expect(23);
  const done = assert.async();
  let order = 0;

  const queue = new ActionQueue();

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('beforeAction', function(action) {
    if (transformCount === 0) {
      assert.equal(order++, 0, 'op1 - order of beforeAction event');
      assert.strictEqual(action.data, op1, 'op1 - beforeAction - data correct');
      assert.strictEqual(queue.current, action, 'op1 - beforeAction - current action matches expectation');
      assert.equal(queue.length, 1, 'op1 - beforeAction - queue length');
    } else if (transformCount === 1) {
      assert.equal(order++, 3, 'op2 - order of beforeAction event');
      assert.strictEqual(action.data, op2, 'op2 - beforeAction - data correct');
      assert.strictEqual(queue.current, action, 'op2 - beforeAction - current action matches expectation');
      assert.equal(queue.length, 1, 'op2 - beforeAction - queue length');
    }
  });

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.equal(order++, 2, 'op1 - order of action event');
      assert.strictEqual(action.data, op1, 'op1 processed');
      assert.equal(queue.length, 1, 'op1 - after action - queue length');
      assert.strictEqual(queue.current.data, op2, 'after op1 - current action is op2');
      assert.equal(queue.processing, false, 'after op1 - queue.processing === false between actions');
    } else if (transformCount === 2) {
      assert.equal(order++, 5, 'op2 - order of action event');
      assert.strictEqual(action.data, op2, 'op2 processed');
      assert.equal(queue.length, 0, 'op2 - after action - queue length');
      assert.strictEqual(queue.current, undefined, 'after op2 - current action is empty');
      assert.equal(queue.processing, false, 'after op2 - queue.processing === false');
    }
  });

  queue.on('complete', function() {
    assert.equal(order++, 6, 'order of complete event');
    done();
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.equal(order++, 1, '_transform - op1 - order');
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      assert.equal(order++, 4, '_transform - op2 - order');
      assert.strictEqual(op, op2, '_transform - op2 passed as argument');
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

test('with `autoProcess` disabled, will process pushed functions sequentially when `process` is called', function(assert) {
  assert.expect(5);
  const done = assert.async();

  const queue = new ActionQueue();

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op1, 'op1 processed');
    } else if (transformCount === 2) {
      assert.strictEqual(action.data, op2, 'op2 processed');
    }
  });

  queue.on('complete', function() {
    assert.ok(true, 'queue completed');
    done();
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      assert.strictEqual(op, op2, '_transform - op2 passed as argument');
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

test('can enqueue actions while another action is being processed', function(assert) {
  expect(8);
  const done = assert.async();

  const queue = new ActionQueue();

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let order = 0;

  queue.on('action', function(action) {
    if (action.data === op1) {
      equal(++order, 3, 'op1 completed');
    } else if (action.data === op2) {
      equal(++order, 6, 'op2 completed');
    }
  });

  queue.on('complete', function() {
    equal(++order, 7, 'queue completed');
  });

  const trigger = {};
  Evented.extend(trigger);

  const _transform = function(op) {
    let promise;
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

  queue.process()
    .then(function() {
      equal(++order, 8, 'queue resolves last');
      done();
    });

  trigger.emit('start1');
});

test('will stop processing when an action errors', function(assert) {
  assert.expect(5);

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op1, 'action - op1 processed');
    } else if (transformCount === 2) {
      assert.ok(false, 'op2 could not be processed');
    }
  });

  queue.on('fail', function(action, err) {
    assert.strictEqual(action.data, op2, 'fail - op2 failed processing');
    assert.equal(err.message, ':(', 'fail - error matches expectation');
  });

  queue.on('complete', function() {
    assert.ok(false, 'queue should not complete');
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      assert.ok(false, '_transform should only be called once');
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

  return queue.process()
    .catch(err => {
      assert.equal(err.message, ':(', 'process rejection - error matches expectation');
    });
});

test('#retry resets the current action in an inactive queue and restarts processing', function(assert) {
  assert.expect(11);

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let op3 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op1, 'action - op1 processed');
    } else if (transformCount === 3) {
      assert.strictEqual(action.data, op2, 'action - op2 processed');
    } else if (transformCount === 4) {
      assert.strictEqual(action.data, op3, 'action - op3 processed');
    }
  });

  queue.on('fail', function(action, err) {
    assert.strictEqual(action.data, op2, 'fail - op2 failed processing');
    assert.equal(err.message, ':(', 'fail - error matches expectation');
  });

  queue.on('complete', function() {
    assert.ok(true, 'queue should complete after processing has restarted');
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      throw new Error(':(');
    } else if (transformCount === 3) {
      assert.strictEqual(op, op2, '_transform - op2 passed as argument');
    } else if (transformCount === 4) {
      assert.strictEqual(op, op3, '_transform - op3 passed as argument');
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

  queue.push({
    id: 3,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op3
  });

  return queue.process()
    .catch(err => {
      assert.equal(err.message, ':(', 'process rejection - error matches expectation');
      assert.strictEqual(queue.current.data, op2, 'op2 is current failed action');

      // skip current action and continue processing
      return queue.retry();
    });
});

test('#skip removes the current action from an inactive queue and restarts processing', function(assert) {
  assert.expect(8);

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let op3 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op1, 'action - op1 processed');
    } else if (transformCount === 2) {
      assert.strictEqual(action.data, op3, 'action - op3 processed');
    }
  });

  queue.on('fail', function(action, err) {
    assert.strictEqual(action.data, op2, 'fail - op2 failed processing');
    assert.equal(err.message, ':(', 'fail - error matches expectation');
  });

  queue.on('complete', function() {
    assert.ok(true, 'queue should complete after processing has restarted');
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      assert.strictEqual(op, op3, '_transform - op3 passed as argument');
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

  queue.push({
    id: 3,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op3
  });

  return queue.process()
    .catch(err => {
      assert.equal(err.message, ':(', 'process rejection - error matches expectation');

      // skip current action and continue processing
      return queue.skip();
    });
});

test('#shift can remove failed actions from an inactive queue, allowing processing to be restarted', function(assert) {
  assert.expect(9);

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let op3 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op1, 'action - op1 processed');
    } else if (transformCount === 2) {
      assert.strictEqual(action.data, op3, 'action - op3 processed');
    }
  });

  queue.on('fail', function(action, err) {
    assert.strictEqual(action.data, op2, 'fail - op2 failed processing');
    assert.equal(err.message, ':(', 'fail - error matches expectation');
  });

  queue.on('complete', function() {
    assert.ok(true, 'queue should complete after processing has restarted');
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    } else if (transformCount === 2) {
      assert.strictEqual(op, op3, '_transform - op3 passed as argument');
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

  queue.push({
    id: 3,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op3
  });

  return queue.process()
    .catch(err => {
      assert.equal(err.message, ':(', 'process rejection - error matches expectation');

      let failedAction = queue.shift();
      assert.strictEqual(failedAction.data, op2, 'op2, which failed, is returned from `shift`');

      // continue processing
      return queue.process();
    });
});

test('#unshift can add a new action to the beginning of an inactive queue', function(assert) {
  assert.expect(5);
  const done = assert.async();

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
  let transformCount = 0;

  queue.on('action', function(action) {
    if (transformCount === 1) {
      assert.strictEqual(action.data, op2, 'op2 processed');
    } else if (transformCount === 2) {
      assert.strictEqual(action.data, op1, 'op1 processed');
    }
  });

  queue.on('complete', function() {
    assert.ok(true, 'queue completed');
    done();
  });

  const _transform = function(op) {
    transformCount++;
    if (transformCount === 1) {
      assert.strictEqual(op, op2, '_transform - op2 passed as argument');
    } else if (transformCount === 2) {
      assert.strictEqual(op, op1, '_transform - op1 passed as argument');
    }
  };

  queue.push({
    id: 1,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op1
  });

  queue.unshift({
    id: 2,
    process: function() {
      _transform.call(this, this.data);
    },
    data: op2
  });

  queue.process();
});

test('#clear removes all actions from an inactive queue', function(assert) {
  assert.expect(2);
  const done = assert.async();

  const queue = new ActionQueue({ autoProcess: false });

  let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
  let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

  queue.on('action', function() {
    assert.ok(false, 'no actions should be processed');
  });

  const _transform = function() {
    assert.ok(false, '_transform should not be called');
  };

  queue.on('complete', function() {
    assert.ok(true, 'queue completed after clear');
  });

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

  queue.clear()
    .then(() => {
      assert.ok(true, 'queue was cleared');
      done();
    });
});
