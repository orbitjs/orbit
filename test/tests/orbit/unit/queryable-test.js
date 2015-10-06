import Orbit from 'orbit/main';
import Queryable from 'orbit/queryable';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

var source;

module("Orbit - Queryable", {
  setup: function() {
    Orbit.Promise = Promise;
    source = {};
    Queryable.extend(source);
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it should mixin Evented", function() {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    ok(source[prop], 'should have Evented properties');
  });
});

test("it defines `query` as an action by default", function() {
  ok(source.query, 'action exists');
});

test("it should require the definition of _query", function() {
  throws(source.query, "presence of _query should be verified");
});

test("it should require that _query returns a promise", function() {
  expect(2);

  source._query = successfulOperation;

  stop();
  source.query().then(function(result) {
    start();
    ok(true, '_query promise resolved');
    equal(result, ':)', 'success!');
  });
});

test("it should resolve as a failure when _query fails", function() {
  source._query = failedOperation;

  stop();
  source.query().then(
    function() {
      start();
      ok(false, '_query should not be resolved successfully');
    },
    function(result) {
      start();
      ok(true, '_query promise resolved as a failure');
      equal(result, ':(', 'failure');
    }
  );
});

test("it should trigger `didQuery` event after a successful action", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
    return successfulOperation();
  };

  source.on('didQuery', function() {
    equal(++order, 2, 'didQuery triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ':)'], 'event handler args match original call args + return value');
  });

  stop();
  source.query('abc', 'def').then(function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("`didQuery` event should receive results as the last argument, even if they are an array", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
    return new Promise(function(resolve, reject) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('didQuery', function() {
    equal(++order, 2, 'didQuery triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ['a', 'b', 'c']], 'event handler args match original call args + return value');
  });

  stop();
  source.query('abc', 'def').then(function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    deepEqual(result, ['a', 'b', 'c'], 'success!');
  });
});

test("it should trigger `didNotQuery` event after an unsuccessful action", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
    return failedOperation();
  };

  source.on('didQuery', function() {
    ok(false, 'didQuery should not be triggered');
  });

  source.on('didNotQuery', function() {
    equal(++order, 2, 'didNotQuery triggered after an unsuccessful action');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ':('], 'event handler args match original call args + return value');
  });

  stop();
  source.query('abc', 'def').then(undefined, function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    equal(result, ':(', 'failure');
  });
});

test("`didNotQuery` event should receive errors as the last argument, even if they are an array", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def'], '_handler args match original call args');
    return new Promise(function(resolve, reject) {
      reject(['O_o', ':(']);
    });
  };

  source.on('didQuery', function() {
    ok(false, 'didQuery should not be triggered');
  });

  source.on('didNotQuery', function() {
    equal(++order, 2, 'didNotQuery triggered after an unsuccessful action');
    deepEqual(Array.prototype.slice.call(arguments, 0), ['abc', 'def', ['O_o', ':(']], 'event handler args match original call args + return value');
  });

  stop();
  source.query('abc', 'def').then(undefined, function(result) {
    start();
    equal(++order, 3, 'promise resolved last');
    deepEqual(result, ['O_o', ':('], 'failure');
  });
});

test("it should queue actions returned from `assistQuery` and try them in order until one succeeds", function() {
  expect(5);

  var order = 0;

  source.on('assistQuery', function() {
    equal(++order, 1, 'assistQuery triggered first');
    return failedOperation();
  });

  source.on('assistQuery', function() {
    equal(++order, 2, 'assistQuery triggered next');
    return successfulOperation();
  });

  source.on('assistQuery', function() {
    ok(false, 'assistQuery handler should not be called after success');
  });

  source._query = function() {
    ok(false, 'default action should not be reached');
  };

  source.on('didQuery', function() {
    equal(++order, 3, 'didQuery triggered after action performed successfully');
  });

  stop();
  source.query().then(function(result) {
    start();
    equal(++order, 4, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("it should queue actions returned from `assistQuery` and fail if they all fail", function() {
  expect(6);

  var order = 0;

  source.on('assistQuery', function() {
    equal(++order, 1, 'assistQuery triggered first');
    return failedOperation();
  });

  source.on('assistQuery', function() {
    equal(++order, 2, 'assistQuery triggered again');
    return failedOperation();
  });

  source._query = function() {
    equal(++order, 3, 'default action performed after second failed action');
    return failedOperation();
  };

  source.on('didQuery', function() {
    ok(false, 'didQuery should not be triggered');
  });

  source.on('didNotQuery', function() {
    equal(++order, 4, 'didNotQuery triggered after action failed');
  });

  stop();
  source.query().then(
    function() {
      start();
      ok(false, 'promise should not succeed');
    },
    function(result) {
      start();
      equal(++order, 5, 'promise failed because no actions succeeded');
      equal(result, ':(', 'failure');
    }
  );
});

test("after an unsuccessful action, it should queue actions returned from `rescueQuery` and try them in order until one succeeds", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, '_query triggered first');
    return failedOperation();
  };

  source.on('rescueQuery', function() {
    equal(++order, 2, 'rescueQuery listener triggered after failed action');
    return failedOperation();
  });

  source.on('rescueQuery', function() {
    equal(++order, 3, 'rescueQuery listener triggered after second failed action');
    return successfulOperation();
  });

  source.on('didQuery', function() {
    equal(++order, 4, 'didQuery triggered after action performed successfully');
  });

  source.on('didNotQuery', function() {
    ok(false, 'didNotQuery should not be triggered');
  });

  stop();
  source.query().then(function(result) {
    start();
    equal(++order, 5, 'promise resolved last');
    equal(result, ':)', 'success!');
  });
});

test("after an unsuccessful action, it should queue actions returned from `rescueQuery` and fail if they all fail", function() {
  expect(6);

  var order = 0;

  source._query = function() {
    equal(++order, 1, '_query triggered first');
    return failedOperation();
  };

  source.on('rescueQuery', function() {
    equal(++order, 2, 'rescueQuery listener triggered after failed action');
    return failedOperation();
  });

  source.on('rescueQuery', function() {
    equal(++order, 3, 'rescueQuery listener triggered after second failed action');
    return failedOperation();
  });

  source.on('didQuery', function() {
    ok(false, 'didQuery should not be triggered');
  });

  source.on('didNotQuery', function() {
    equal(++order, 4, 'didNotQuery triggered because action failed');
  });

  stop();
  source.query().then(
    function() {
      start();
      ok(false, 'promise should not succeed');
    },
    function(result) {
      start();
      equal(++order, 5, 'promise failed because no actions succeeded');
      equal(result, ':(', 'failure');
    }
  );
});
