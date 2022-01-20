import { Bucket } from '../src/bucket';
import { Task, Performer } from '../src/task';
import { TaskQueue } from '../src/task-queue';
import { StringBucket, TaskBucket } from './support/buckets';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('TaskQueue', function () {
  test('can be instantiated', function (assert) {
    const performer: Performer = {
      perform(task: Task): Promise<void> {
        return Promise.resolve();
      }
    };
    const queue = new TaskQueue(performer);
    assert.ok(queue);
  });

  test('#autoProcess is enabled by default', function (assert) {
    const performer: Performer = {
      perform(task: Task): Promise<void> {
        return Promise.resolve();
      }
    };
    const queue = new TaskQueue(performer);
    assert.equal(queue.autoProcess, true, 'autoProcess === true');
  });

  test('auto-processes pushed tasks sequentially by default', function (assert) {
    assert.expect(23);
    const done = assert.async();
    let order = 0;

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        if (transformCount === 1) {
          assert.equal(order++, 1, 'transform - op1 - order');
          assert.strictEqual(
            task.data,
            op1,
            'transform - op1 passed as argument'
          );
        } else if (transformCount === 2) {
          assert.equal(order++, 5, 'transform - op2 - order');
          assert.strictEqual(
            task.data,
            op2,
            'transform - op2 passed as argument'
          );
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer);

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    queue.on('beforeTask', function (task: Task) {
      if (transformCount === 0) {
        assert.equal(order++, 0, 'op1 - order of beforeTask event');
        assert.strictEqual(task.data, op1, 'op1 - beforeTask - data correct');
        assert.strictEqual(
          queue.current,
          task,
          'op1 - beforeTask - current task matches expectation'
        );
      } else if (transformCount === 1) {
        assert.equal(order++, 4, 'op2 - order of beforeTask event');
        assert.strictEqual(task.data, op2, 'op2 - beforeTask - data correct');
        assert.strictEqual(
          queue.current,
          task,
          'op2 - beforeTask - current task matches expectation'
        );
      }
    });

    queue.on('task', function (task: Task) {
      if (transformCount === 1) {
        assert.equal(order++, 3, 'op1 - order of task event');
        assert.strictEqual(task.data, op1, 'op1 processed');
        assert.equal(queue.length, 1, 'op1 - after task - queue length');
        assert.strictEqual(
          queue.current.data,
          op2,
          'after op1 - current task is op2'
        );
        assert.equal(
          queue.processing,
          false,
          'after op1 - queue.processing === false between tasks'
        );
      } else if (transformCount === 2) {
        assert.equal(order++, 7, 'op2 - order of task event');
        assert.strictEqual(task.data, op2, 'op2 processed');
        assert.equal(queue.length, 0, 'op2 - after task - queue length');
        assert.strictEqual(
          queue.current,
          undefined,
          'after op2 - current task is empty'
        );
        assert.equal(
          queue.processing,
          false,
          'after op2 - queue.processing === false'
        );
      }
    });

    queue.on('complete', function () {
      assert.equal(order++, 8, 'order of complete event');
      done();
    });

    queue
      .push({
        type: 'transform',
        data: op1
      })
      .then(() => {
        assert.equal(order++, 2, 'push 1 resolved');
      });

    queue
      .push({
        type: 'transform',
        data: op2
      })
      .then(() => {
        assert.equal(order++, 6, 'push 2 resolved');
      });
  });

  test('with `autoProcess` disabled, will process pushed functions sequentially when `process` is called', function (assert) {
    assert.expect(8);
    const done = assert.async();
    let order = 0;

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(
            task.data,
            op1,
            'transform - op1 passed as argument'
          );
        } else if (transformCount === 2) {
          assert.strictEqual(
            task.data,
            op2,
            'transform - op2 passed as argument'
          );
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer);

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'op1 processed');
      } else if (transformCount === 2) {
        assert.strictEqual(task.data, op2, 'op2 processed');
      }
    });

    queue.on('complete', function () {
      assert.equal(order++, 3, 'queue completed');
      done();
    });

    queue
      .push({
        type: 'transform',
        data: op1
      })
      .then(() => {
        assert.equal(order++, 1, 'push 1 resolved');
      });

    queue
      .push({
        type: 'transform',
        data: op2
      })
      .then(() => {
        assert.equal(order++, 2, 'push 2 resolved');
      });

    assert.equal(order++, 0, 'before process invoked');
    return queue.process();
  });

  test('can enqueue tasks while another task is being processed', function (assert) {
    assert.expect(7);
    const done = assert.async();

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        let op = task.data;
        if (op === op1) {
          assert.equal(++order, 1, 'transform with op1');
          return Promise.resolve();
        } else if (op === op2) {
          assert.equal(++order, 3, 'transform with op2');
          return Promise.resolve();
        }
        throw new Error('Unexpected perform called');
      }
    };

    const queue = new TaskQueue(performer);

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let order = 0;

    queue.on('task', function (task) {
      if (task.data === op1) {
        assert.equal(++order, 2, 'op1 completed');
      } else if (task.data === op2) {
        assert.equal(++order, 4, 'op2 completed');
      }
    });

    queue.on('complete', function () {
      assert.equal(++order, 5, 'queue completed');
      done();
    });

    queue.push({
      type: 'transform',
      data: op1
    });

    queue.push({
      type: 'transform',
      data: op2
    });

    return queue.process().then(function () {
      assert.equal(queue.empty, true, 'queue processing complete');
      assert.equal(++order, 6, 'queue resolves last');
    });
  });

  test('will stop processing when a task errors', function (assert) {
    assert.expect(9);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(
            task.data,
            op1,
            'transform - op1 passed as argument'
          );
        } else if (transformCount === 2) {
          return Promise.reject(new Error(':('));
        } else {
          assert.ok(false, 'additional transforms should not be performed');
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '345'], value: 'Mars' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else {
        assert.ok(false, 'task - ops after op1 could not be processed');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.ok(false, 'queue should not complete');
    });

    queue
      .push({
        type: 'transform',
        data: op1
      })
      .catch((e) => {
        assert.ok(false, 'successful transform should not error');
      });

    queue
      .push({
        type: 'transform',
        data: op2
      })
      .catch((e) => {
        assert.equal(
          (e as Error).message,
          ':(',
          'error can be caught from `push`'
        );
      });

    queue
      .push({
        type: 'transform',
        data: op3
      })
      .catch((e) => {
        assert.ok(false, 'additional transforms should not be performed');
      });

    return queue.process().catch((e) => {
      assert.equal(
        (e as Error).message,
        ':(',
        'error can be caught from `process`'
      );
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
    });
  });

  test('when autoprocessing, will stop processing when a task errors', function (assert) {
    assert.expect(9);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        if (transformCount === 1) {
          assert.strictEqual(
            task.data,
            op1,
            'transform - op1 passed as argument'
          );
        } else if (transformCount === 2) {
          return Promise.reject(new Error(':('));
        } else {
          assert.ok(false, 'additional transforms should not be performed');
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: true });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '345'], value: 'Mars' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else {
        assert.ok(false, 'task - ops after op1 could not be processed');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.ok(false, 'queue should not complete');
    });

    queue
      .push({
        type: 'transform',
        data: op1
      })
      .catch((e) => {
        assert.ok(false, 'successful transform should not error');
      });

    queue
      .push({
        type: 'transform',
        data: op2
      })
      .catch((e) => {
        assert.equal(
          (e as Error).message,
          ':(',
          'error can be caught from `push`'
        );
      });

    queue
      .push({
        type: 'transform',
        data: op3
      })
      .catch((e) => {
        assert.ok(false, 'additional transforms should not be performed');
      });

    return queue.process().catch((e) => {
      assert.equal(
        (e as Error).message,
        ':(',
        'error can be caught from `process`'
      );
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
    });
  });

  test('#retry resets the current task in an inactive queue and restarts processing', async function (assert) {
    assert.expect(15);
    let order = 0;

    const performer: Performer = {
      perform(task: Task): Promise<string> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        } else if (transformCount === 2) {
          return Promise.reject(new Error(':('));
        } else if (transformCount === 3) {
          assert.strictEqual(op, op2, 'transform - op2 passed as argument');
        } else if (transformCount === 4) {
          assert.strictEqual(op, op3, 'transform - op3 passed as argument');
        }
        return Promise.resolve(`${transformCount}`);
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else if (transformCount === 3) {
        assert.strictEqual(task.data, op2, 'task - op2 processed');
      } else if (transformCount === 4) {
        assert.strictEqual(task.data, op3, 'task - op3 processed');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.equal(
        order++,
        1,
        'queue should complete after processing has restarted'
      );
    });

    queue.push({
      type: 'transform',
      data: op1
    });

    const failedPush = queue.push({
      type: 'transform',
      data: op2
    });

    queue.push({
      type: 'transform',
      data: op3
    });

    try {
      await queue.process();
    } catch (e) {
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
      assert.strictEqual(queue.current.data, op2, 'op2 is current failed task');
    }

    // retry current task and continue processing
    let result = await queue.retry();
    assert.equal(
      result,
      '3',
      'the result of the retried task should be returned'
    );
    assert.equal(
      order++,
      0,
      'queue should not be completed immediately after retry resolves'
    );

    // prevent failed promise from leaking into test harness
    try {
      await failedPush;
    } catch (e) {}
  });

  test('#skip removes the current task from an inactive queue', async function (assert) {
    assert.expect(9);

    const performer: Performer = {
      async perform(task: Task): Promise<void> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        } else if (transformCount === 3) {
          assert.ok(false, 'processing should not be restarted');
        }
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '345'], value: 'Earth' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else if (transformCount === 2) {
        assert.ok(false, 'processing should not be restarted');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.ok(false, 'queue should not restart and thus not complete');
    });

    queue
      .push({
        type: 'transform',
        data: op1
      })
      .then(() => {
        assert.ok(true, 'op1 should be processed');
      });

    const failedPush = queue
      .push({
        type: 'transform',
        data: op2
      })
      .then(() => {
        assert.ok(false, 'op2 should fail');
      })
      .catch((e) => {
        assert.ok(true, 'op2 should fail');
      });

    queue
      .push({
        type: 'transform',
        data: op3
      })
      .then(() => {
        assert.ok(
          false,
          'op3 should not be processed because processing should not be restarted'
        );
      });

    try {
      await queue.process();
    } catch (e) {
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error message matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
    }

    // skip current task and continue processing
    await queue.skip();

    // prevent failed promise from leaking into test harness
    try {
      await failedPush;
    } catch (e) {}
  });

  test('#skip removes the current task from an inactive queue and restarts processing if autoProcess=true', async function (assert) {
    assert.expect(11);
    let order = 0;

    const performer: Performer = {
      async perform(task: Task): Promise<void> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        } else if (transformCount === 3) {
          assert.strictEqual(op, op3, 'transform - op3 passed as argument');
        }
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: true });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '345'], value: 'Earth' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else if (transformCount === 2) {
        assert.strictEqual(task.data, op3, 'task - op3 processed');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.equal(
        order++,
        1,
        'queue should complete after processing has restarted'
      );
    });

    queue.push({
      type: 'transform',
      data: op1
    });

    const failedPush = queue.push({
      type: 'transform',
      data: op2
    });

    queue.push({
      type: 'transform',
      data: op3
    });

    try {
      await queue.process();
    } catch (e) {
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
    }

    // skip current task and continue processing
    await queue.skip();

    assert.equal(
      order++,
      0,
      'queue should not be completed immediately after skip resolves'
    );

    try {
      await failedPush;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'failure message matches the processing error'
      );
    }
  });

  test('#skip will cancel tasks with a default error message', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    queue.push({
      type: 'transform',
      data: op2
    });

    await queue.skip();

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        'Processing cancelled via `TaskQueue#skip`',
        'processing cancelled error raised'
      );
    }

    assert.equal(queue.length, 1, 'queue now has one member');
  });

  test('#skip can cancel tasks with a custom error message', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    queue.push({
      type: 'transform',
      data: op2
    });

    await queue.skip(new Error(':('));

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'processing cancelled error raised'
      );
    }

    assert.equal(queue.length, 1, 'queue now has one member');
  });

  test('#skip just restarts processing if there are no tasks in the queue', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      async perform(task: Task): Promise<void> {}
    };

    const queue = new TaskQueue(performer, { autoProcess: true });

    await queue.skip();

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };

    queue.on('complete', function () {
      assert.ok(true, 'queue completed');
    });

    queue.on('task', function (task) {
      assert.strictEqual(task.data, op1, 'op1 processed');
    });

    await queue.push({
      type: 'transform',
      data: op1
    });
  });

  test('#shift can remove failed tasks from an inactive queue, allowing processing to be restarted', async function (assert) {
    assert.expect(11);

    const performer: Performer = {
      async perform(task: Task): Promise<void> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        } else if (transformCount === 2) {
          throw new Error(':(');
        } else if (transformCount === 3) {
          assert.strictEqual(op, op3, 'transform - op3 passed as argument');
        }
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let op3 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op1, 'task - op1 processed');
      } else if (transformCount === 2) {
        assert.strictEqual(task.data, op3, 'task - op3 processed');
      }
    });

    queue.on('fail', function (task, err) {
      assert.strictEqual(task.data, op2, 'fail - op2 failed processing');
      assert.equal(err.message, ':(', 'fail - error matches expectation');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue should complete after processing has restarted');
    });

    queue.push({
      type: 'transform',
      data: op1
    });

    const failedPush = queue.push({
      type: 'transform',
      data: op2
    });

    queue.push({
      type: 'transform',
      data: op3
    });

    try {
      await queue.process();
    } catch (e) {
      assert.equal(
        queue.empty,
        false,
        'queue processing encountered a problem'
      );
      assert.equal(
        queue.error?.message,
        ':(',
        'process error matches expectation'
      );
      assert.strictEqual(queue.error, e, 'process error matches expectation');
    }

    const failedTask = await queue.shift();
    assert.strictEqual(
      failedTask?.data,
      op2,
      'op2, which failed, is returned from `shift`'
    );

    // continue processing
    await queue.process();

    try {
      await failedPush;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'failure message matches the processing error'
      );
    }
  });

  test('#shift will cancel the current task with a default error message', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    queue.push({
      type: 'transform',
      data: op2
    });

    await queue.shift();

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        'Processing cancelled via `TaskQueue#shift`',
        'processing cancelled error raised'
      );
    }

    assert.equal(queue.length, 1, 'queue now has one member');
  });

  test('#shift can cancel the current task with a custom error message', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    queue.push({
      type: 'transform',
      data: op2
    });

    await queue.shift(new Error(':('));

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'processing cancelled error raised'
      );
    }

    assert.equal(queue.length, 1, 'queue now has one member');
  });

  test('#shift just restarts processing if there are no tasks in the queue', async function (assert) {
    assert.expect(2);

    const performer: Performer = {
      async perform(task: Task): Promise<void> {}
    };

    const queue = new TaskQueue(performer, { autoProcess: true });

    await queue.shift();

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };

    queue.on('complete', function () {
      assert.ok(true, 'queue completed');
    });

    queue.on('task', function (task) {
      assert.strictEqual(task.data, op1, 'op1 processed');
    });

    await queue.push({
      type: 'transform',
      data: op1
    });
  });

  test('#unshift can add a new task to the beginning of an inactive queue', function (assert) {
    assert.expect(11);
    let order = 0;

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op2, 'transform - op2 passed as argument');
        } else if (transformCount === 2) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    let changeCount = 0;
    queue.on('change', function () {
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

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op2, 'op2 processed');
      } else if (transformCount === 2) {
        assert.strictEqual(task.data, op1, 'op1 processed');
      }
    });

    queue.on('complete', function () {
      assert.equal(
        order++,
        2,
        'queue should complete after processing has restarted'
      );
    });

    queue.push({ type: 'transform', data: op1 }).then(() => {
      assert.equal(order++, 1, 'op1 should be processed after op2');
    });

    queue.unshift({ type: 'transform', data: op2 }).then(() => {
      assert.equal(order++, 0, 'op2 should be processed first');
    });

    return queue.process();
  });

  test('#unshift adds a new task to the beginning of a queue and restarts processing if autoProcess=true', async function (assert) {
    assert.expect(11);
    let order = 0;

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        transformCount++;
        let op = task.data;
        if (transformCount === 1) {
          assert.strictEqual(op, op2, 'transform - op2 passed as argument');
        } else if (transformCount === 2) {
          assert.strictEqual(op, op1, 'transform - op1 passed as argument');
        }
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: true });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };
    let transformCount = 0;

    let changeCount = 0;
    queue.on('change', function () {
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

    queue.on('task', function (task) {
      if (transformCount === 1) {
        assert.strictEqual(task.data, op2, 'op2 processed');
      } else if (transformCount === 2) {
        assert.strictEqual(task.data, op1, 'op1 processed');
      }
    });

    queue.on('complete', function () {
      assert.equal(
        order++,
        2,
        'queue should complete after processing has restarted'
      );
    });

    queue.push({ type: 'transform', data: op1 }).then(() => {
      assert.equal(order++, 1, 'op1 should be processed after op2');
    });

    await queue.unshift({ type: 'transform', data: op2 }).then(() => {
      assert.equal(order++, 0, 'op2 should be processed first');
    });
  });

  test('#clear removes all tasks from an inactive queue', async function (assert) {
    assert.expect(4);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    let t2 = queue.push({
      type: 'transform',
      data: op2
    });

    await queue.clear();

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        'Processing cancelled via `TaskQueue#clear`',
        'processing cancelled error raised'
      );
    }

    try {
      await t2;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        'Processing cancelled via `TaskQueue#clear`',
        'processing cancelled error raised'
      );
    }

    assert.ok(true, 'queue was cleared');
  });

  test('#clear can cancel tasks with a custom error message', async function (assert) {
    assert.expect(4);

    const performer: Performer = {
      perform(task: Task): Promise<void> {
        assert.ok(false, 'transform should not be called');
        return Promise.resolve();
      }
    };

    const queue = new TaskQueue(performer, { autoProcess: false });

    let op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    let op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    queue.on('task', function () {
      assert.ok(false, 'no tasks should be processed');
    });

    queue.on('complete', function () {
      assert.ok(true, 'queue completed after clear');
    });

    let t1 = queue.push({
      type: 'transform',
      data: op1
    });

    let t2 = queue.push({
      type: 'transform',
      data: op2
    });

    await queue.clear(new Error(':('));

    try {
      await t1;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'processing cancelled error raised'
      );
    }

    try {
      await t2;
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'processing cancelled error raised'
      );
    }

    assert.ok(true, 'queue was cleared');
  });

  module('assigned a bucket', function (hooks) {
    const op1 = { op: 'add', path: ['planets', '123'], value: 'Mercury' };
    const op2 = { op: 'add', path: ['planets', '234'], value: 'Venus' };

    let bucket: TaskBucket;

    hooks.beforeEach(function () {
      bucket = new TaskBucket({ name: 'fake-bucket' });
    });

    test('requires a name for lookups in the bucket', function (assert) {
      assert.throws(
        function () {
          const performer: Performer = {
            perform(task: Task): Promise<void> {
              return Promise.resolve();
            }
          };
          let queue = new TaskQueue(performer, { bucket });
        },
        Error('Assertion failed: TaskQueue requires a name if it has a bucket'),
        'assertion raised'
      );
    });

    test('will be reified with the tasks serialized in its bucket and immediately process them', async function (assert) {
      assert.expect(3);

      const performer: Performer = {
        perform(task: Task): Promise<void> {
          return Promise.resolve();
        }
      };

      const serialized: Task[] = [
        {
          type: 'transform',
          data: op1
        },
        {
          type: 'transform',
          data: op2
        }
      ];

      let queue: TaskQueue;

      await bucket.setItem('queue', serialized);

      queue = new TaskQueue(performer, { name: 'queue', bucket });
      await queue.reified;

      assert.equal(queue.length, 2, 'queue has two tasks');

      queue.on('complete', async function () {
        assert.ok(true, 'queue completed');

        let serialized = await bucket.getItem('queue');

        assert.deepEqual(serialized, [], 'no serialized ops remain');
      });
    });

    test('if `autoActivate = false`, will wait for `activate` to begin processing', async function (assert) {
      assert.expect(3);

      const performer: Performer = {
        perform(task: Task): Promise<void> {
          return Promise.resolve();
        }
      };

      const serialized: Task[] = [
        {
          type: 'transform',
          data: op1
        },
        {
          type: 'transform',
          data: op2
        }
      ];

      let queue: TaskQueue;

      await bucket.setItem('queue', serialized);

      queue = new TaskQueue(performer, {
        name: 'queue',
        bucket,
        autoActivate: false
      });

      await queue.reified;

      assert.equal(queue.length, 2, 'queue has two tasks');

      await queue.activate();

      queue.on('complete', async function () {
        assert.ok(true, 'queue completed');

        let serialized = await bucket.getItem('queue');

        assert.deepEqual(serialized, [], 'no serialized ops remain');
      });
    });

    test('#push - tasks pushed to a queue are persisted to its bucket', function (assert) {
      const done = assert.async();
      assert.expect(9);

      const performer: Performer = {
        perform(task: Task): Promise<void> {
          return Promise.resolve();
        }
      };

      const queue = new TaskQueue(performer, { name: 'queue', bucket });

      let transformCount = 0;

      queue.on('beforeTask', function (task) {
        transformCount++;

        if (transformCount === 1) {
          assert.strictEqual(task.data, op1, 'op1 processed');
          bucket.getItem('queue').then((data) => {
            let serialized = data as { data: any }[];
            assert.equal(serialized?.length, 2);
            assert.deepEqual(serialized[0].data, op1);
            assert.deepEqual(serialized[1].data, op2);
          });
        } else if (transformCount === 2) {
          assert.strictEqual(task.data, op2, 'op2 processed');
          bucket.getItem('queue').then((data) => {
            let serialized = data as { data: any }[];
            assert.equal(serialized.length, 1);
            assert.deepEqual(serialized[0].data, op2);
          });
        }
      });

      queue.on('complete', function () {
        assert.ok(true, 'queue completed');

        bucket.getItem('queue').then((serialized) => {
          assert.deepEqual(serialized, [], 'no serialized ops remain');
          done();
        });
      });

      queue.push({
        type: 'transform',
        data: op1
      });

      queue.push({
        type: 'transform',
        data: op2
      });
    });
  });
});
