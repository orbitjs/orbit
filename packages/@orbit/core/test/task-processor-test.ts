import { Orbit } from '../src/main';
import { Task, Performer } from '../src/task';
import { TaskProcessor } from '../src/task-processor';
import { delay } from './support/timing';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('TaskProcessor', function () {
  test('can be instantiated', function (assert) {
    const target: Performer = {
      perform(task: Task): Promise<void> {
        return Promise.resolve();
      }
    };
    const processor = new TaskProcessor(target, { type: 'doSomething' });
    assert.ok(processor);
  });

  test('processes asynchronous tasks by calling `perform` on a target', async function (assert) {
    assert.expect(5);

    const target: Performer = {
      async perform(task: Task): Promise<string> {
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        await delay(1);
        return ':)';
      }
    };

    let processor = new TaskProcessor(target, { type: 'doSomething' });

    let response = await processor.process();

    assert.ok(processor.settled, 'processor settled');
    assert.equal(response, ':)', 'response is returned');
  });

  test('can be assigned an asynchronous function that rejects', async function (assert) {
    assert.expect(6);

    const target: Performer = {
      perform(task: Task): Promise<void> {
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return new Promise(function (resolve, reject) {
          Orbit.globals.setTimeout(reject(':('), 1);
        });
      }
    };

    let processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    try {
      await processor.process();
    } catch (e) {
      assert.ok(processor.settled, 'processor settled');
      assert.equal(e, ':(', 'process resolved');
    }
  });

  test("it creates a promise immediately that won't be resolved until process is called", async function (assert) {
    assert.expect(5);

    const target: Performer = {
      async perform(task: Task): Promise<void> {
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
      }
    };

    let processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    processor.settle().then(function () {
      assert.ok(true, 'process resolved');
    });

    await processor.process();
  });

  test('#reset returns to an unstarted, unsettled state', async function (assert) {
    assert.expect(8);

    const target: Performer = {
      async perform(task: Task): Promise<string> {
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return ':)';
      }
    };

    let processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    let response = await processor.process();

    assert.ok(processor.settled, 'task settled');
    assert.equal(response, ':)', 'response is returned');

    processor.reset();

    assert.ok(!processor.started, 'after reset, task has not started');
    assert.ok(!processor.settled, 'after reset, task has not settled');
  });

  test('#reject rejects the processor promise and marks the processor state as settled', async function (assert) {
    assert.expect(5);

    const target: Performer = {
      async perform(task: Task): Promise<string> {
        return ':)';
      }
    };

    let processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    processor.reject(new Error(':('));

    assert.ok(processor.settled, 'processor settled');
    assert.ok(!processor.started, 'processor not started');

    try {
      await processor.settle();
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'fail - error matches expectation'
      );
    }

    processor.reset();

    assert.ok(!processor.started, 'after reset, task has not started');
    assert.ok(!processor.settled, 'after reset, task has not settled');
  });

  test('#reject can reject processing that has started', async function (assert) {
    assert.expect(5);

    let processor: TaskProcessor;

    const target: Performer = {
      async perform(task: Task): Promise<string> {
        // reject before processing can be completed successfully
        processor.reject(new Error(':('));

        return ':)';
      }
    };

    processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    try {
      await processor.process();
    } catch (e) {
      assert.equal(
        (e as Error).message,
        ':(',
        'fail - error matches expectation'
      );
    }

    assert.ok(processor.started, 'processor started');
    assert.ok(processor.settled, 'processor settled');

    processor.reset();

    assert.ok(!processor.started, 'after reset, task has not started');
    assert.ok(!processor.settled, 'after reset, task has not settled');
  });

  test('#reject will fail when processing has already settled', async function (assert) {
    assert.expect(5);

    let processor: TaskProcessor;

    const target: Performer = {
      async perform(task: Task): Promise<string> {
        return ':)';
      }
    };

    processor = new TaskProcessor(target, {
      type: 'doSomething',
      data: '1'
    });

    await processor.process();

    try {
      processor.reject(new Error(':('));
    } catch (e) {
      assert.equal(
        (e as Error).message,
        'TaskProcessor#reject can not be invoked when processing has already settled.',
        'error matches expectation'
      );
    }

    assert.ok(processor.started, 'processor started');
    assert.ok(processor.settled, 'processor settled');

    processor.reset();

    assert.ok(!processor.started, 'after reset, task has not started');
    assert.ok(!processor.settled, 'after reset, task has not settled');
  });
});
