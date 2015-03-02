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
  expect(2);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return;
    }
  });

  stop();
  action.process().then(function() {
    start();
    ok(true, 'process resolved');
  });
});

test("it can be assigned an asynchronous function to process", function() {
  expect(2);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return new Promise(function(resolve) {
        setTimeout(resolve, 1);
      });
    }
  });

  stop();
  action.process().then(function() {
    start();
    ok(true, 'process resolved');
  });
});

test("it can be assigned a synchronous function that throws an exception", function() {
  expect(2);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      throw new Error(':(');
    }
  });

  stop();
  action.process().then(function() {
    ok(false, 'action should not be successful');

  }, function(e) {
    start();
    equal(e.message, ':(', 'process resolved');
  });
});

test("it can be assigned an asynchronous function that rejects", function() {
  expect(2);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return new Promise(function(resolve, reject) {
        setTimeout(reject(':('), 1);
      });
    }
  });

  stop();
  action.process().then(function() {
    ok(false, 'action should not be successful');

  }, function(e) {
    start();
    equal(e, ':(', 'process resolved');
  });
});

test("it created a promise immediately that won't be resolved until process is called", function() {
  expect(2);

  var action = new Action({
    process: function() {
      ok(true, 'process invoked');
      return;
    }
  });

  stop();
  action.complete.then(function() {
    start();
    ok(true, 'process resolved');
  });

  action.process();
});


