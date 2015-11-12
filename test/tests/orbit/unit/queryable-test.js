import Orbit from 'orbit/main';
import Queryable from 'orbit/queryable';
import { Class } from 'orbit/lib/objects';
import { QueryProcessorNotFoundException } from 'orbit/lib/exceptions';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

var Source, source;

module("Orbit - Queryable", {
  setup: function() {
    Orbit.Promise = Promise;
    Source = Class.extend(Queryable);
    source = new Source();
  },

  teardown: function() {
    Source = source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function(assert) {
  assert.ok(source);
});

test("it should mixin Evented", function(assert) {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    assert.ok(source[prop], 'should have Evented properties');
  });
});

test("it should resolve as a failure when _query fails", function() {
  expect(2);

  source._query = function(query) {
    return failedOperation();
  };

  stop();
  source.query({fetch: ''}).then(
    function() {
      start();
      ok(false, 'query should not be resolved successfully');
    },
    function(result) {
      start();
      ok(true, 'query promise resolved as a failure');
      equal(result, ':(', 'failure');
    }
  );
});

test("it should trigger `querySucceeded` event after a successful action in which `_query` resolves successfully", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, {fetch: ['abc', 'def']}, 'query object matches');
    return successfulOperation();
  };

  source.on('querySucceeded', function() {
    equal(++order, 2, 'querySucceeded triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{fetch: ['abc', 'def']}, ':)'], 'event handler args match original call args + return value');
  });

  stop();
  source.query({fetch: ['abc', 'def']})
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
});

test("it should trigger `querySucceeded` event after a successful action in which `_query` just returns (not a promise)", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, {fetch: ['abc', 'def']}, 'query object matches');
    return undefined;
  };

  source.on('querySucceeded', function() {
    equal(++order, 2, 'querySucceeded triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{fetch: ['abc', 'def']}, undefined], 'event handler args match original call args + return value');
  });

  stop();
  source.query({fetch: ['abc', 'def']})
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, undefined, 'undefined was returned');
    });
});

test("`querySucceeded` event should receive results as the last argument, even if they are an array", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, {fetch: ['abc', 'def']}, 'query object matches');
    return new Promise(function(resolve, reject) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('querySucceeded', function() {
    equal(++order, 2, 'querySucceeded triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{fetch: ['abc', 'def']}, ['a', 'b', 'c']], 'event handler args match original call args + return value');
  });

  stop();
  source.query({fetch: ['abc', 'def']})
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
});

test("it should trigger `queryFailed` event after an unsuccessful query", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, {fetch: ['abc', 'def']}, 'query object matches');
    return failedOperation();
  };

  source.on('querySucceeded', function() {
    ok(false, 'querySucceeded should not be triggered');
  });

  source.on('queryFailed', function() {
    equal(++order, 2, 'queryFailed triggered after an unsuccessful query');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{fetch: ['abc', 'def']}, ':('], 'event handler args match original call args + return value');
  });

  stop();
  source.query({fetch: ['abc', 'def']})
    .then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':(', 'failure');
    });
});

test("`queryFailed` event should receive errors as the last argument, even if they are an array", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, {fetch: ['abc', 'def']}, 'query object matches');
    return new Promise(function(resolve, reject) {
      reject(['O_o', ':(']);
    });
  };

  source.on('querySucceeded', function() {
    ok(false, 'querySucceeded should not be triggered');
  });

  source.on('queryFailed', function() {
    equal(++order, 2, 'queryFailed triggered after an unsuccessful query');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{fetch: ['abc', 'def']}, ['O_o', ':(']], 'event handler args match original call args + return value');
  });

  stop();
  source.query({fetch: ['abc', 'def']})
    .then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['O_o', ':('], 'failure');
    });
});

test("it should queue actions returned from `assistQuery` and try them in order until one succeeds", function() {
  expect(6);

  var order = 0;

  source.on('assistQuery', function() {
    equal(++order, 1, 'assistQuery triggered first');
    return failedOperation();
  });

  source.on('assistQuery', function() {
    equal(++order, 2, 'assistQuery triggered second');
    return undefined;
  });

  source.on('assistQuery', function() {
    equal(++order, 3, 'assistQuery triggered third');
    return successfulOperation();
  });

  source.on('assistQuery', function() {
    ok(false, 'assistQuery handler should not be called after success');
  });

  source._query = function(query) {
    ok(false, 'default action should not be reached');
  };

  source.on('querySucceeded', function() {
    equal(++order, 4, 'querySucceeded triggered after action performed successfully');
  });

  stop();
  source.query({fetch: ''})
    .then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
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

  source._query = function(query) {
    equal(++order, 3, 'default action performed after second failed action');
    return failedOperation();
  };

  source.on('querySucceeded', function() {
    ok(false, 'querySucceeded should not be triggered');
  });

  source.on('queryFailed', function() {
    equal(++order, 4, 'queryFailed triggered after action failed');
  });

  stop();
  source.query({fetch: ''})
    .then(
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

  source._query = function(query) {
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

  source.on('querySucceeded', function() {
    equal(++order, 4, 'querySucceeded triggered after action performed successfully');
  });

  source.on('queryFailed', function() {
    ok(false, 'queryFailed should not be triggered');
  });

  stop();
  source.query({fetch: ''})
    .then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
});

test("after an unsuccessful action, it should queue actions returned from `rescueQuery` and fail if they all fail", function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
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

  source.on('querySucceeded', function() {
    ok(false, 'querySucceeded should not be triggered');
  });

  source.on('queryFailed', function() {
    equal(++order, 4, 'queryFailed triggered because action failed');
  });

  stop();
  source.query({fetch: ''})
    .then(
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
