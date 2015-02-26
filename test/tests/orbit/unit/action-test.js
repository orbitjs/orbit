import Orbit from 'orbit/main';
import Action from 'orbit/action';
import { Promise } from 'rsvp';

var failedOperation = function() {
  return new Promise(function(resolve, reject) {
    reject(':(');
  });
};

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Action", {
  setup: function() {
    Orbit.Promise = Promise;
  },

  teardown: function() {
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  var action = new Action({});
  ok(action);
});

test("it can be assigned an optional id and data", function() {
  var action = new Action({id: 'abc', data: '123'});
  equal(action.id, 'abc', 'id has been set');
  equal(action.data, '123', 'data has been set');
});

test("it can be assigned a synchronous function to process", function() {
  expect(3);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return;
    }
  });

  action.on('complete', function() {
    ok(true, 'action complete event triggered');
  });

  stop();
  action.process().then(function() {
    start();
    ok(true, 'process resolved');
  });
});

test("it can be assigned an asynchronous function to process", function() {
  expect(3);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return new Promise(function(resolve) {
        setTimeout(resolve, 1);
      });
    }
  });

  action.on('complete', function() {
    ok(true, 'action complete event triggered');
  });

  stop();
  action.process().then(function() {
    start();
    ok(true, 'process resolved');
  });
});
