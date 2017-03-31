import Orbit from '../src/main';
import { Action, Actionable } from '../src/action';
import ActionProcessor from '../src/action-processor';
import './test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('ActionProcessor', function() {
  test('can be instantiated', function(assert) {
    const target: Actionable = {
      perform(action: Action): Promise<void> { return Promise.resolve(); }
    };
    const processor = new ActionProcessor(target, { type: 'doSomething' });
    assert.ok(processor);
  });

  test('processes asynchronous actions by calling `perform` on a target', function(assert) {
    assert.expect(5);

    const target: Actionable = {
      perform(action: Action): Promise<void> { 
        assert.equal(action.type, 'doSomething', 'perform invoked with action');
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

    let processor = new ActionProcessor(target, { type: 'doSomething' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(response, ':)', 'response is returned');
      });
  });

  test('can be assigned an asynchronous function that rejects', function(assert) {
    assert.expect(6);

    const target: Actionable = {
      perform(action: Action): Promise<void> { 
        assert.equal(action.type, 'doSomething', 'perform invoked with action');
        assert.equal(action.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return new Promise(function(resolve, reject) {
          setTimeout(reject(':('), 1);
        });
      }
    };

    let processor = new ActionProcessor(target, { type: 'doSomething', data: '1' });

    return processor.process()
      .catch((e) => {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(e, ':(', 'process resolved');
      });
  });

  test('it creates a promise immediately that won\'t be resolved until process is called', function(assert) {
    assert.expect(5);

    const target: Actionable = {
      perform(action: Action): Promise<void> { 
        assert.equal(action.type, 'doSomething', 'perform invoked with action');
        assert.equal(action.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return Promise.resolve();
      }
    };

    let processor = new ActionProcessor(target, { type: 'doSomething', data: '1' });

    processor.settle()
      .then(function() {
        assert.ok(true, 'process resolved');
      });

    return processor.process();
  });

  test('#reset returns to an unstarted, unsettled state', function(assert) {
    assert.expect(8);

    const target: Actionable = {
      perform(action: Action): Promise<void> { 
        assert.equal(action.type, 'doSomething', 'perform invoked with action');
        assert.equal(action.data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return Promise.resolve(':)');
      }
    };

    let processor = new ActionProcessor(target, { type: 'doSomething', data: '1' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'action settled');
        assert.equal(response, ':)', 'response is returned');

        processor.reset();

        assert.ok(!processor.started, 'after reset, action has not started');
        assert.ok(!processor.settled, 'after reset, action has not settled');
      });
  });
});
