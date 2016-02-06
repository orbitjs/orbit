import { successfulOperation, failedOperation } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Queryable from 'orbit/queryable';
import { Class } from 'orbit/lib/objects';
import { QueryProcessorNotFoundException } from 'orbit/lib/exceptions';
import { Promise } from 'rsvp';

var Source, source;

module('Orbit - Queryable', {
  setup: function() {
    Source = Class.extend(Queryable);
    source = new Source();
  },

  teardown: function() {
    Source = source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it should mixin Evented', function(assert) {
  ['on', 'off', 'emit', 'poll'].forEach(function(prop) {
    assert.ok(source[prop], 'should have Evented properties');
  });
});

test('it should resolve as a failure when _query fails', function() {
  expect(2);

  source._query = function(query) {
    return failedOperation();
  };

  stop();
  source.query({ fetch: '' }).then(
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

test('it should trigger `query` event after a successful action in which `_query` resolves successfully', function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return successfulOperation();
  };

  source.on('query', function() {
    equal(++order, 2, 'query triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{ fetch: ['abc', 'def'] }, ':)'], 'event handler args match original call args + return value');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
});

test('it should trigger `query` event after a successful action in which `_query` just returns (not a promise)', function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return undefined;
  };

  source.on('query', function() {
    equal(++order, 2, 'query triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{ fetch: ['abc', 'def'] }, undefined], 'event handler args match original call args + return value');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, undefined, 'undefined was returned');
    });
});

test('`query` event should receive results as the last argument, even if they are an array', function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return new Promise(function(resolve, reject) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('query', function() {
    equal(++order, 2, 'query triggered after action performed successfully');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{ fetch: ['abc', 'def'] }, ['a', 'b', 'c']], 'event handler args match original call args + return value');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
});

test('it should trigger `queryFail` event after an unsuccessful query', function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return failedOperation();
  };

  source.on('query', function() {
    ok(false, 'query should not be triggered');
  });

  source.on('queryFail', function() {
    equal(++order, 2, 'queryFail triggered after an unsuccessful query');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{ fetch: ['abc', 'def'] }, ':('], 'event handler args match original call args + return value');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':(', 'failure');
    });
});

test('`queryFail` event should receive errors as the last argument, even if they are an array', function() {
  expect(6);

  var order = 0;

  source._query = function(query) {
    equal(++order, 1, 'action performed after willQuery');
    deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return new Promise(function(resolve, reject) {
      reject(['O_o', ':(']);
    });
  };

  source.on('query', function() {
    ok(false, 'query should not be triggered');
  });

  source.on('queryFail', function() {
    equal(++order, 2, 'queryFail triggered after an unsuccessful query');
    deepEqual(Array.prototype.slice.call(arguments, 0), [{ fetch: ['abc', 'def'] }, ['O_o', ':(']], 'event handler args match original call args + return value');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(undefined, function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      deepEqual(result, ['O_o', ':('], 'failure');
    });
});

test('it should resolve all promises returned from `beforeQuery` before calling `_query`', function() {
  expect(7);

  let order = 0;

  source.on('beforeQuery', function() {
    equal(++order, 1, 'beforeQuery triggered first');
    return successfulOperation();
  });

  source.on('beforeQuery', function() {
    equal(++order, 2, 'beforeQuery triggered second');
    return undefined;
  });

  source.on('beforeQuery', function() {
    equal(++order, 3, 'beforeQuery triggered third');
    return successfulOperation();
  });

  source._query = function(query) {
    equal(++order, 4, '_query invoked after all `beforeQuery` handlers');
    return successfulOperation();
  };

  source.on('query', function() {
    equal(++order, 5, 'query triggered after action performed successfully');
  });

  stop();
  source.query({ fetch: '' })
    .then(function(result) {
      start();
      equal(++order, 6, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
});

test('it should resolve all promises returned from `beforeQuery` and fail if any fail', function() {
  expect(5);

  let order = 0;

  source.on('beforeQuery', function() {
    equal(++order, 1, 'beforeQuery triggered first');
    return successfulOperation();
  });

  source.on('beforeQuery', function() {
    equal(++order, 2, 'beforeQuery triggered again');
    return failedOperation();
  });

  source._query = function(query) {
    ok(false, '_query should not be invoked');
  };

  source.on('query', function() {
    ok(false, 'query should not be triggered');
  });

  source.on('queryFail', function() {
    equal(++order, 3, 'queryFail triggered after action failed');
  });

  stop();
  source.query({ fetch: '' })
    .then(
      function() {
        start();
        ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        equal(++order, 4, 'promise failed because no actions succeeded');
        equal(result, ':(', 'failure');
      }
    );
});
