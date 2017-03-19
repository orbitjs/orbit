import Orbit from '../src/main';
import ActionQueue from '../src/action-queue';
import { Action } from '../src/action';
import evented, { Evented } from '../src/evented';
import { FakeBucket } from './test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('ActionQueue', function() {
  test('can be instantiated', function(assert) {
    const target = {};
    const queue = new ActionQueue(target);
    assert.ok(queue);
  });

  test('#autoProcess is enabled by default', function(assert) {
    const target = {};
    const queue = new ActionQueue(target);
    assert.equal(queue.autoProcess, true, 'autoProcess === true');
  });

  test('auto-processes pushed actions sequentially by default', function(assert) {
    assert.expect(21);
    const done = assert.async();
    let order = 0;

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.equal(order++, 1, '_transform - op1 - order');
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        } else if (transformCount === 2) {
          assert.equal(order++, 4, '_transform - op2 - order');
          assert.strictEqual(op, op2, '_transform - op2 passed as argument');
        }
      }
    };

    const queue = new ActionQueue(target);

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    queue.on('beforeAction', function(action) {
      if (transformCount === 0) {
        assert.equal(order++, 0, 'op1 - order of beforeAction event');
        assert.strictEqual(action.data, op1, 'op1 - beforeAction - data correct');
        assert.strictEqual(queue.current, action, 'op1 - beforeAction - current action matches expectation');
      } else if (transformCount === 1) {
        assert.equal(order++, 3, 'op2 - order of beforeAction event');
        assert.strictEqual(action.data, op2, 'op2 - beforeAction - data correct');
        assert.strictEqual(queue.current, action, 'op2 - beforeAction - current action matches expectation');
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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });
  });

  test('with `autoProcess` disabled, will process pushed functions sequentially when `process` is called', function(assert) {
    assert.expect(5);
    const done = assert.async();

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        } else if (transformCount === 2) {
          assert.strictEqual(op, op2, '_transform - op2 passed as argument');
        }
      }
    };

    const queue = new ActionQueue(target);

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.process();
  });

  test('can enqueue actions while another action is being processed', function(assert) {
    assert.expect(9);
    const done = assert.async();

    @evented
    class Trigger implements Evented {
      // Evented interface stubs
      on: (event: string, callback: any, binding?: any) => void;
      off: (event: string, callback: any, binding?: any) => void;
      one: (event: string, callback: any, binding?: any) => void;
      emit: (event: string, ...args) => void;
      listeners: (event: string) => any[];
    }

    let trigger = new Trigger;

    const target = {
      _transform(op) {
        let promise;
        if (op === op1) {
          assert.equal(++order, 1, '_transform with op1');
          promise = new Promise(function(resolve) {
            trigger.on('start1', function() {
              assert.equal(++order, 2, '_transform with op1 resolved');
              resolve();
            });
          });
        } else if (op === op2) {
          assert.equal(++order, 4, '_transform with op2');
          promise = new Promise(function(resolve) {
            assert.equal(++order, 5, '_transform with op2 resolved');
            resolve();
          });
        }
        return promise;
      }
    };

    const queue = new ActionQueue(target);

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let order = 0;

    queue.on('action', function(action) {
      if (action.data === op1) {
        assert.equal(++order, 3, 'op1 completed');
      } else if (action.data === op2) {
        assert.equal(++order, 6, 'op2 completed');
      }
    });

    queue.on('complete', function() {
      assert.equal(++order, 7, 'queue completed');
    });

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.process()
      .then(function() {
        assert.equal(queue.complete, true, 'queue processing complete');
        assert.equal(++order, 8, 'queue resolves last');
        done();
      });

    queue.reified
      .then(function() {
        trigger.emit('start1');
      });
  });

  test('will stop processing when an action errors', function(assert) {
    assert.expect(7);

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        }
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    return queue.process()
      .catch((e) => {
        assert.equal(queue.complete, false, 'queue processing encountered a problem');
        assert.equal(queue.error.message, ':(', 'process error matches expectation');
        assert.strictEqual(queue.error, e, 'process error matches expectation');
      });
  });

  test('#retry resets the current action in an inactive queue and restarts processing', function(assert) {
    assert.expect(13);

    const target = {
      _transform(op) {
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
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.push({
      method: '_transform',
      data: op3
    });

    return queue.process()
      .catch((e) => {
        assert.equal(queue.complete, false, 'queue processing encountered a problem');
        assert.equal(queue.error.message, ':(', 'process error matches expectation');
        assert.strictEqual(queue.error, e, 'process error matches expectation');
        assert.strictEqual(queue.current.data, op2, 'op2 is current failed action');

        // skip current action and continue processing
        return queue.retry();
      });
  });

  test('#skip removes the current action from an inactive queue and restarts processing', function(assert) {
    assert.expect(9);

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        } else if (transformCount === 3) {
          assert.strictEqual(op, op3, '_transform - op3 passed as argument');
        }
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.push({
      method: '_transform',
      data: op3
    });

    return queue.process()
      .catch((e) => {
        assert.equal(queue.complete, false, 'queue processing encountered a problem');
        assert.equal(queue.error.message, ':(', 'process error matches expectation');
        assert.strictEqual(queue.error, e, 'process error matches expectation');

        // skip current action and continue processing
        return queue.skip();
      });
  });

  test('#shift can remove failed actions from an inactive queue, allowing processing to be restarted', function(assert) {
    assert.expect(10);

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        } else if (transformCount === 3) {
          assert.strictEqual(op, op3, '_transform - op3 passed as argument');
        }
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.push({
      method: '_transform',
      data: op3
    });

    return queue.process()
      .catch((e) => {
        assert.equal(queue.complete, false, 'queue processing encountered a problem');
        assert.equal(queue.error.message, ':(', 'process error matches expectation');
        assert.strictEqual(queue.error, e, 'process error matches expectation');

        return queue.shift()
          .then(failedAction => {
            assert.strictEqual(failedAction.data, op2, 'op2, which failed, is returned from `shift`');
          })
          .then(function() {
            // continue processing
            return queue.process();
          });
      });
  });

  test('#unshift can add a new action to the beginning of an inactive queue', function(assert) {
    assert.expect(9);
    const done = assert.async();

    const target = {
      _transform(op) {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(op, op2, '_transform - op2 passed as argument');
        } else if (transformCount === 2) {
          assert.strictEqual(op, op1, '_transform - op1 passed as argument');
        }
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    let changeCount = 0;
    queue.on('change', function() {
      changeCount++;
      if (changeCount === 1) {
        assert.equal(queue.entries.length, 1);
      } else if (changeCount === 2) {
        assert.equal(queue.entries.length, 2);
      } else if (changeCount === 3) {
        assert.equal(queue.entries.length, 1);
      } else if (changeCount === 4) {
        assert.equal(queue.entries.length, 0);
      } else {
        assert.ok(false, 'should not get here');
      }
    });

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

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.unshift({
      method: '_transform',
      data: op2
    });

    queue.process();
  });

  test('#clear removes all actions from an inactive queue', function(assert) {
    assert.expect(2);
    const done = assert.async();

    const target = {
      _transform() {
        assert.ok(false, '_transform should not be called');
      }
    };

    const queue = new ActionQueue(target, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('action', function() {
      assert.ok(false, 'no actions should be processed');
    });

    queue.on('complete', function() {
      assert.ok(true, 'queue completed after clear');
    });

    queue.push({
      method: '_transform',
      data: op1
    });

    queue.push({
      method: '_transform',
      data: op2
    });

    queue.clear()
      .then(() => {
        assert.ok(true, 'queue was cleared');
        done();
      });
  });

  module('assigned a bucket', function(hooks) {
    const op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    const op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    let bucket;

    hooks.beforeEach(function() {
      bucket = new FakeBucket({ name: 'fake-bucket' });
    });

    hooks.afterEach(function() {
      bucket = null;
    });

    test('requires a name for lookups in the bucket', function(assert) {
      assert.throws(
        function() {
          const target = {};
          let queue = new ActionQueue(target, { bucket });
        },
        Error('Assertion failed: ActionQueue requires a name if it has a bucket'),
        'assertion raised');
    });

    test('will be reified with the actions serialized in its bucket and immediately process them', function(assert) {
      const done = assert.async();
      assert.expect(3);

      const target = {
        _transform() {}
      };

      const serialized: Action[] = [
        {
          method: '_transform',
          data: op1
        },
        {
          method: '_transform',
          data: op2
        }
      ];

      let queue;
      bucket.setItem('queue', serialized)
        .then(() => {
          queue = new ActionQueue(target, { name: 'queue', bucket });
          return queue.reified;
        })
        .then(() => {
          assert.equal(queue.length, 2, 'queue has two actions');

          queue.on('complete', function() {
            assert.ok(true, 'queue completed');

            bucket.getItem('queue')
              .then(serialized => {
                assert.deepEqual(serialized, [], 'no serialized ops remain');
                done();
              });
          });
        });
    });

    test('#push - actions pushed to a queue are persisted to its bucket', function(assert) {
      const done = assert.async();
      assert.expect(9);

      const target = {
        _transform() {}
      };

      const queue = new ActionQueue(target, { name: 'queue', bucket });

      let transformCount = 0;

      queue.on('beforeAction', function(action) {
        transformCount++;

        if (transformCount === 1) {
          assert.strictEqual(action.data, op1, 'op1 processed');
          bucket.getItem('queue')
            .then(serialized => {
              assert.equal(serialized.length, 2);
              assert.deepEqual(serialized[0].data, op1)
              assert.deepEqual(serialized[1].data, op2)
            });
        } else if (transformCount === 2) {
          assert.strictEqual(action.data, op2, 'op2 processed');
          bucket.getItem('queue')
            .then(serialized => {
              assert.equal(serialized.length, 1);
              assert.deepEqual(serialized[0].data, op2)
            });
        }
      });

      queue.on('complete', function() {
        assert.ok(true, 'queue completed');

        bucket.getItem('queue')
          .then(serialized => {
            assert.deepEqual(serialized, [], 'no serialized ops remain');
            done();
          });
      });

      queue.push({
        method: '_transform',
        data: op1
      });

      queue.push({
        method: '_transform',
        data: op2
      });
    });
  });
});
