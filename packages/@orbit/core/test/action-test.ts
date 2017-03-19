import Orbit from '../src/main';
import { Action, ActionProcessor } from '../src/action';
import './test-helper';

const { Promise } = Orbit;
const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('ActionProcessor', function() {
  test('can be instantiated', function(assert) {
    const target = {
      doSomething() {}
    };
    const processor = new ActionProcessor(target, { method: 'doSomething' });
    assert.ok(processor);
  });

  test('can be assigned a synchronous function to process', function(assert) {
    assert.expect(5);

    const target = {
      doSomething() {
        assert.ok(true, 'process invoked');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return ':)';
      }
    };

    let processor = new ActionProcessor(target, { method: 'doSomething' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(response, ':)', 'response is returned');
      });
  });

  test('can be assigned an asynchronous function to process', function(assert) {
    assert.expect(5);

    const target = {
      doSomething() {
        assert.ok(true, 'process invoked');
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

    let processor = new ActionProcessor(target, { method: 'doSomething' });

    return processor.process()
      .then(function(response) {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(response, ':)', 'response is returned');
      });
  });

  test('can be assigned a synchronous function that throws an exception', function(assert) {
    assert.expect(2);

    const target = {
      doSomething() {
        assert.ok(true, 'process invoked');
        throw new Error(':(');
      }
    };

    let processor = new ActionProcessor(target, { method: 'doSomething' });

    return processor.process()
      .catch((e) => {
        assert.equal(e.message, ':(', 'process resolved');
      });
  });

  test('can be assigned an asynchronous function that rejects', function(assert) {
    assert.expect(6);

    const target = {
      doSomething(data) {
        assert.ok(true, 'process invoked');
        assert.equal(data, '1', 'argument matches');
        assert.ok(processor.started, 'processor started');
        assert.ok(!processor.settled, 'processor not settled');
        return new Promise(function(resolve, reject) {
          setTimeout(reject(':('), 1);
        });
      }
    };

    let processor = new ActionProcessor(target, { method: 'doSomething', data: '1' });

    return processor.process()
      .catch((e) => {
        assert.ok(processor.settled, 'processor settled');
        assert.equal(e, ':(', 'process resolved');
      });
  });

  test('it creates a promise immediately that won\'t be resolved until process is called', function(assert) {
    assert.expect(3);

    const target = {
      doSomething(data, options) {
        assert.ok(true, 'process invoked');
        assert.equal(data, '1', 'data is passed');
        return;
      }
    };

    let processor = new ActionProcessor(target, { method: 'doSomething', data: '1' });

    processor.settle()
      .then(function() {
        assert.ok(true, 'process resolved');
      });

    return processor.process();
  });

  test('#reset returns to an unstarted, unsettled state', function(assert) {
    assert.expect(7);

    const target = {
      doSomething() {
        assert.ok(true, 'process invoked');
        assert.ok(processor.started, 'action started');
        assert.ok(!processor.settled, 'action not settled');
        return ':)';
      }
    };

    let processor = new ActionProcessor(target, { method: 'doSomething' });

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
