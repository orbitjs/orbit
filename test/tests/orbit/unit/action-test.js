import 'tests/test-helper';
import Action from 'orbit/action';
import { Promise } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

module('Orbit - Action', {});

test('it exists', function(assert) {
  var action = new Action({});
  assert.ok(action);
});

test('it can be assigned an optional id and data', function(assert) {
  const action = new Action({ id: 'abc', data: '123' });
  assert.equal(action.id, 'abc', 'id has been set');
  assert.equal(action.data, '123', 'data has been set');
});

test('it can be assigned a synchronous function to process', function(assert) {
  assert.expect(3);

  const action = new Action({
    process: function() {
      assert.ok(true, 'process invoked');
      return ':)';
    }
  });

  return action.process()
    .then(function(response) {
      assert.ok(true, 'process resolved');
      assert.equal(response, ':)', 'response is returned');
    });
});

test('it can be assigned an asynchronous function to process', function(assert) {
  assert.expect(3);

  const action = new Action({
    process: function() {
      assert.ok(true, 'process invoked');
      return new Promise(function(resolve) {
        function respond() {
          resolve(':)');
        }
        setTimeout(respond, 1);
      });
    }
  });

  return action.process()
    .then(function(response) {
      assert.ok(true, 'process resolved');
      assert.equal(response, ':)', 'response is returned');
    });
});

test('it can be assigned a synchronous function that throws an exception', function(assert) {
  assert.expect(2);

  const action = new Action({
    process: function() {
      assert.ok(true, 'process invoked');
      throw new Error(':(');
    }
  });

  return action.process()
    .catch((e) => {
      assert.equal(e.message, ':(', 'process resolved');
    });
});

test('it can be assigned an asynchronous function that rejects', function(assert) {
  assert.expect(2);

  const action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return new Promise(function(resolve, reject) {
        setTimeout(reject(':('), 1);
      });
    }
  });

  return action.process()
    .catch((e) => {
      equal(e, ':(', 'process resolved');
    });
});

test('it created a promise immediately that won\'t be resolved until process is called', function(assert) {
  assert.expect(2);

  var action = new Action({
    process() {
      assert.ok(true, 'process invoked');
      return;
    }
  });

  action.settle()
    .then(function() {
      assert.ok(true, 'process resolved');
    });

  return action.process();
});

test('Action.from will return an action instance passed into it', function(assert) {
  let action = new Action({process: function() {}});
  assert.strictEqual(Action.from(action), action);
});

test('Action.from will create an action from options passed into it', function(assert) {
  let action = Action.from({process: function() {}});
  assert.ok(action instanceof Action);
});
