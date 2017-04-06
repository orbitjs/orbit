import Orbit from '../src/main';
import { Task, Performer } from '../src/task';
import TaskProcessor from '../src/task-processor';
import './test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

declare const setTimeout: any;

///////////////////////////////////////////////////////////////////////////////

module('TaskProcessor', function() {
  test('can be instantiated', function(assert) {
    const target: Performer = {
      perform(task: Task): Promise<void> { return Promise.resolve(); }
    };
    const processor = new TaskProcessor(target, { type: 'doSomething' });
    assert.ok(processor);
  });

  test('processes asynchronous tasks by calling `perform` on a target', function(assert) {
    assert.expect(5);

    const target: Performer = {
      perform(task: Task): Promise<void> { 
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return new Promise(function(resolve) {
          function respond() {
            resolve(':)');
          }
          setTimeout(respond, 1);
        });
      }
    };

    let processor = new TaskProcessor(target, { type: 'doSomething' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(response, ':)', 'response is returned');
      });
  });

  test('can be assigned an asynchronous function that rejects', function(assert) {
    assert.expect(6);

    const target: Performer = {
      perform(task: Task): Promise<void> { 
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return new Promise(function(resolve, reject) {
          setTimeout(reject(':('), 1);
        });
      }
    };

    let processor = new TaskProcessor(target, { type: 'doSomething', data: '1' });

    return processor.process()
      .catch((e) => {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(e, ':(', 'process resolved');
      });
  });

  test('it creates a promise immediately that won\'t be resolved until process is called', function(assert) {
    assert.expect(5);

    const target: Performer = {
      perform(task: Task): Promise<void> { 
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return Promise.resolve();
      }
    };

    let processor = new TaskProcessor(target, { type: 'doSomething', data: '1' });

    processor.settle()
      .then(function() {
        assert.ok(true, 'process resolved');
      });

    return processor.process();
  });

  test('#reset returns to an unstarted, unsettled state', function(assert) {
    assert.expect(8);

    const target: Performer = {
      perform(task: Task): Promise<void> { 
        assert.equal(task.type, 'doSomething', 'perform invoked with task');
        assert.equal(task.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return Promise.resolve(':)');
      }
    };

    let processor = new TaskProcessor(target, { type: 'doSomething', data: '1' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'task settled');
        assert.equal(response, ':)', 'response is returned');

        processor.reset();

        assert.ok(!processor.started, 'after reset, task has not started');
        assert.ok(!processor.settled, 'after reset, task has not settled');
      });
  });
});
