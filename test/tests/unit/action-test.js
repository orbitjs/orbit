import 'tests/test-helper';
import Action from 'orbit/action';
import { Promise } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Action', {});

test('can be instantiated', function(assert) {
  var action = new Action({});
  assert.ok(action);
});

test('can be assigned optional data and meta', function(assert) {
  const target = {
    doSomething() {}
  };
  const action = new Action(target, 'doSomething', { data: 'abc', meta: { label: '123' } });
  assert.deepEqual(action.data, 'abc', 'data has been set');
  assert.deepEqual(action.meta, { label: '123' }, 'meta has been set');
});

test('can be serialized', function(assert) {
  const target = {
    doSomething() {}
  };
  const action = new Action(target, 'doSomething', { data: 'abc', meta: { label: '123' } });
  assert.deepEqual(
    action.serialize(),
    {
      method: 'doSomething',
      data: 'abc',
      meta: { label: '123' }
    }
  );
});

test('can be deserialized', function(assert) {
  const target = {
    doSomething() {}
  };
  const action = Action.deserialize(target, {
    method: 'doSomething',
    data: 'abc',
    meta: { label: '123' }
  });
  assert.deepEqual(action.data, 'abc', 'data has been set');
  assert.deepEqual(action.meta, { label: '123' }, 'meta has been set');
});

test('can be assigned a synchronous function to process', function(assert) {
  assert.expect(5);

  let action;

  const target = {
    doSomething() {
      assert.ok(true, 'process invoked');
      assert.ok(action.started, 'action started');
      assert.ok(!action.settled, 'action not settled');
      return ':)';
    }
  };

  action = new Action(target, 'doSomething');

  return action.process()
    .then(function(response) {
      assert.ok(action.settled, 'action settled');
      assert.equal(response, ':)', 'response is returned');
    });
});

test('can be assigned an asynchronous function to process', function(assert) {
  assert.expect(5);

  let action;

  const target = {
    doSomething() {
      assert.ok(true, 'process invoked');
      assert.ok(action.started, 'action started');
      assert.ok(!action.settled, 'action not settled');
      return new Promise(function(resolve) {
        function respond() {
          resolve(':)');
        }
        setTimeout(respond, 1);
      });
    }
  };

  action = new Action(target, 'doSomething');

  return action.process()
    .then(function(response) {
      assert.ok(action.settled, 'action settled');
      assert.equal(response, ':)', 'response is returned');
    });
});

test('can be assigned a synchronous function that throws an exception', function(assert) {
  assert.expect(2);

  let action;

  const target = {
    doSomething() {
      assert.ok(true, 'process invoked');
      throw new Error(':(');
    }
  };

  action = new Action(target, 'doSomething');

  return action.process()
    .catch((e) => {
      assert.equal(e.message, ':(', 'process resolved');
    });
});

test('can be assigned an asynchronous function that rejects', function(assert) {
  assert.expect(6);

  let action;

  const target = {
    doSomething(data) {
      assert.ok(true, 'process invoked');
      assert.equal(data, '1', 'argument matches');
      assert.ok(action.started, 'action started');
      assert.ok(!action.settled, 'action not settled');
      return new Promise(function(resolve, reject) {
        setTimeout(reject(':('), 1);
      });
    }
  };

  action = new Action(target, 'doSomething', { data: '1' });

  return action.process()
    .catch((e) => {
      assert.ok(action.settled, 'action settled');
      assert.equal(e, ':(', 'process resolved');
    });
});

test('it creates a promise immediately that won\'t be resolved until process is called', function(assert) {
  assert.expect(3);

  let action;

  const target = {
    doSomething(data) {
      assert.ok(true, 'process invoked');
      assert.equal(data, '1', 'argument matches');
      return;
    }
  };

  action = new Action(target, 'doSomething', { data: '1' });

  action.settle()
    .then(function() {
      assert.ok(true, 'process resolved');
    });

  return action.process();
});

test('#reset returns to an unstarted, unsettled state', function(assert) {
  assert.expect(7);

  let action;

  const target = {
    doSomething() {
      assert.ok(true, 'process invoked');
      assert.ok(action.started, 'action started');
      assert.ok(!action.settled, 'action not settled');
      return ':)';
    }
  };

  action = new Action(target, 'doSomething');

  return action.process()
    .then(function(response) {
      assert.ok(action.settled, 'action settled');
      assert.equal(response, ':)', 'response is returned');

      action.reset();

      assert.ok(!action.started, 'after reset, action has not started');
      assert.ok(!action.settled, 'after reset, action has not settled');
    });
});
